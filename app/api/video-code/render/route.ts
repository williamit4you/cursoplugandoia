import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { logCodeVideoPipelineEvent, upsertCodeVideoPipelineStep } from "@/lib/video-code/logger";
import { computeNextSocialQueueTime } from "@/lib/socialQueueSchedule";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function normalizeSocialPlatforms(value: unknown) {
  const allowed = new Set(["YOUTUBE", "INSTAGRAM", "TIKTOK", "LINKEDIN"]);
  const raw = Array.isArray(value) ? value : [];
  const platforms = raw
    .map((item) => String(item || "").toUpperCase())
    .filter((item) => allowed.has(item));
  return platforms.length > 0 ? Array.from(new Set(platforms)) : [];
}

function buildProductAdSocialSummary(project: any, metadata: any) {
  const productName = String(metadata?.productName || project.title || "Produto recomendado").trim();
  const description = String(project.description || metadata?.productDescription || "").trim();
  const cta = String(metadata?.ctaText || "Confira pelo link na descricao.").trim();
  const link = String(metadata?.productUrl || metadata?.mercadoLivre?.affiliateUrl || "").trim();
  return [productName, description, cta, link ? `Link: ${link}` : ""]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 4500);
}

function resolveSocialScheduleTime(rawScheduledTo: Date | null, now = new Date()) {
  const bufferMinutes = Math.min(
    6 * 60,
    Math.max(0, Number(process.env.SOCIAL_SCHEDULE_BUFFER_MINUTES || 45))
  );
  const minTime = new Date(now.getTime() + bufferMinutes * 60 * 1000);
  if (!rawScheduledTo || !Number.isFinite(rawScheduledTo.getTime())) return minTime;
  return rawScheduledTo > minTime ? rawScheduledTo : minTime;
}

async function enqueueProductAdSocialPosts(project: any, videoUrl: string) {
  if (project.projectType !== "PRODUCT_AD") return;

  const metadata = safeJsonParse(project.metadataJson || "{}") || {};
  const scheduleConfig = metadata?.mercadoLivre || metadata?.shopee;
  if (!scheduleConfig || scheduleConfig.autoScheduleSocial !== true) return;

  const platforms = normalizeSocialPlatforms(scheduleConfig.platforms);
  if (platforms.length === 0) return;

  const rawScheduledTo = scheduleConfig.scheduledTo ? new Date(scheduleConfig.scheduledTo) : null;
  const scheduledTo = resolveSocialScheduleTime(rawScheduledTo);
  const hasValidSchedule = Boolean(scheduledTo && Number.isFinite(scheduledTo.getTime()));
  const summary = buildProductAdSocialSummary(project, metadata);

  for (const platform of platforms) {
    const socialPlatform = platform === "INSTAGRAM" ? "META" : platform;
    const postType = "REEL";

    const existing = await prisma.socialPost.findFirst({
      where: {
        codeVideoProjectId: project.id,
        platform: socialPlatform,
        postType,
        status: { not: "FAILED" },
      },
    });
    if (existing) continue;

    await prisma.socialPost.create({
      data: {
        postId: null,
        codeVideoProjectId: project.id,
        summary,
        videoUrl,
        status: hasValidSchedule ? "SCHEDULED" : "DRAFT",
        scheduledTo: hasValidSchedule ? scheduledTo : null,
        platform: socialPlatform,
        postType,
        log: `[${new Date().toLocaleTimeString("pt-BR")}] Enfileirado pela rotina ${metadata?.mercadoLivre ? "Mercado Livre" : "Shopee"}`,
      },
    });
  }

  if (metadata?.mercadoLivre) {
    await prisma.mercadoLivreAffiliatePick.updateMany({
      where: { codeVideoProjectId: project.id },
      data: { status: "SCHEDULED", errorMessage: null },
    });
  }

  if (metadata?.shopee) {
    await prisma.shopeeAffiliatePick.updateMany({
      where: { codeVideoProjectId: project.id },
      data: { status: "SCHEDULED", errorMessage: null },
    });
  }
}

function buildNewsSocialSummary(project: any, metadata: any) {
  const title = String(project.title || "Resumo da noticia").trim();
  const description = String(project.description || "").trim();
  const articleUrl = String(metadata?.articleUrl || "").trim();
  return [title, description, articleUrl ? `Leia a materia completa: ${articleUrl}` : ""]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 4500);
}

async function enqueueNewsSocialPosts(project: any, videoUrl: string) {
  const metadata = safeJsonParse(project.metadataJson || "{}") || {};
  const newsAutomation = metadata?.newsAutomation;
  if (!newsAutomation || newsAutomation.autoScheduleSocial !== true) return;

  const platforms = normalizeSocialPlatforms(newsAutomation.platforms);
  if (platforms.length === 0) return;

  const summary = buildNewsSocialSummary(project, metadata);
  const postId = metadata?.postId ? String(metadata.postId) : null;
  let createdCount = 0;

  for (const platform of platforms) {
    const socialPlatform = platform === "INSTAGRAM" ? "META" : platform;
    const postType = "REEL";

    const existing = await prisma.socialPost.findFirst({
      where: {
        codeVideoProjectId: project.id,
        platform: socialPlatform,
        postType,
        status: { not: "FAILED" },
      },
    });
    if (existing) continue;

    const scheduledTo = await computeNextSocialQueueTime({
      platform: socialPlatform,
      desiredAt: new Date(),
    });

    await prisma.socialPost.create({
      data: {
        postId,
        codeVideoProjectId: project.id,
        summary,
        videoUrl,
        status: "SCHEDULED",
        scheduledTo,
        platform: socialPlatform,
        postType,
        log: `[${new Date().toLocaleTimeString("pt-BR")}] Enfileirado automaticamente a partir de artigo criado`,
      },
    });
    createdCount += 1;
  }

  await upsertCodeVideoPipelineStep({
    projectId: project.id,
    stepName: "ENQUEUE_SOCIAL",
    status: "SUCCESS",
    attempt: 1,
    startedAt: new Date(),
    finishedAt: new Date(),
    responsePayload: {
      createdCount,
      platforms,
      postId,
    },
  }).catch(() => null);

  await logCodeVideoPipelineEvent({
    projectId: project.id,
    stepName: "ENQUEUE_SOCIAL",
    message:
      createdCount > 0
        ? `Video pronto e enfileirado automaticamente para ${createdCount} plataforma(s).`
        : "Video pronto, mas nenhuma nova fila social precisou ser criada.",
    metadata: { platforms, createdCount, postId },
  }).catch(() => null);
}

function externalRenderServiceUrl() {
  const value = String(process.env.VIDEO_RENDER_SERVICE_URL || "").trim();
  return value ? value.replace(/\/+$/, "") : "";
}

async function renderWithExternalService(params: {
  projectId: string;
  project: any;
  videoSpec: any;
}) {
  const baseUrl = externalRenderServiceUrl();
  if (!baseUrl) {
    throw new Error("VIDEO_RENDER_SERVICE_URL not configured");
  }

  const res = await fetch(`${baseUrl}/render`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(1000 * 60 * 20),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `Render service failed (HTTP ${res.status})`);
  }
  return data;
}

export async function POST(req: NextRequest) {
  let activeProjectId: string | null = null;
  try {
    const body = await req.json();
    const projectId = String(body?.projectId ?? "").trim();
    if (!projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    activeProjectId = projectId;

    const project = await prisma.codeVideoProject.findUnique({ where: { id: projectId } });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const videoSpec = safeJsonParse(project.videoSpecJson || "");
    if (!videoSpec) return NextResponse.json({ error: "videoSpecJson is invalid JSON" }, { status: 400 });

    await prisma.codeVideoProject.update({
      where: { id: projectId },
      data: { status: "RENDERING", errorMessage: null },
    });

    await upsertCodeVideoPipelineStep({
      projectId,
      stepName: "RENDER_VIDEO",
      status: "RUNNING",
      attempt: 1,
      startedAt: new Date(),
    });
    await logCodeVideoPipelineEvent({
      projectId,
      stepName: "RENDER_VIDEO",
      message: "Iniciando síntese de áudio TTS e renderização Remotion no serviço de vídeo...",
    });

    const externalResult = await renderWithExternalService({
      projectId,
      project: {
        aspectRatio: project.aspectRatio,
        fps: project.fps,
        narrationText: project.narrationText,
        audioUrl: project.audioUrl,
        ttsVoice: project.ttsVoice,
        ttsSpeed: project.ttsSpeed,
      },
      videoSpec,
    });

    const updated = await prisma.codeVideoProject.update({
      where: { id: projectId },
      data: {
        status: "DONE",
        videoUrl: externalResult.videoUrl,
        audioUrl: externalResult.audioUrl || project.audioUrl,
        renderProgress: 100,
        errorMessage: null,
      },
    });

    await upsertCodeVideoPipelineStep({
      projectId,
      stepName: "RENDER_VIDEO",
      status: "SUCCESS",
      attempt: 1,
      finishedAt: new Date(),
    });
    await logCodeVideoPipelineEvent({
      projectId,
      level: "INFO",
      stepName: "RENDER_VIDEO",
      message: "Vídeo compilado e renderizado com sucesso!",
      metadata: { videoUrl: externalResult.videoUrl, audioUrl: externalResult.audioUrl },
    });

    await enqueueProductAdSocialPosts(updated, externalResult.videoUrl);
    await enqueueNewsSocialPosts(updated, externalResult.videoUrl);

    return NextResponse.json(updated);
  } catch (error: any) {
    const msg = error?.message || "Failed to render";
    console.error("[RENDER_ERROR]", error);

    if (activeProjectId) {
      try {
        await prisma.codeVideoProject.update({
          where: { id: activeProjectId },
          data: { status: "FAILED", errorMessage: msg, renderProgress: 0 },
        });

        await upsertCodeVideoPipelineStep({
          projectId: activeProjectId,
          stepName: "RENDER_VIDEO",
          status: "FAILED",
          attempt: 1,
          finishedAt: new Date(),
          errorMessage: msg,
        });
        await logCodeVideoPipelineEvent({
          projectId: activeProjectId,
          level: "ERROR",
          stepName: "RENDER_VIDEO",
          message: `Falha na renderização do vídeo: ${msg}`,
        });
      } catch (dbErr) {
        console.error("Failed to write failure log to DB", dbErr);
      }
    }

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
