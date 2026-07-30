import { NextRequest, NextResponse } from "next/server";
import http from "node:http";
import https from "node:https";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { logCodeVideoPipelineEvent, upsertCodeVideoPipelineStep } from "@/lib/video-code/logger";
import { computeNextSocialQueueTime } from "@/lib/socialQueueSchedule";
import { generateModalAudio, generateModalVideo } from "@/lib/shopee-pipeline/modalClient";
import { uploadBufferToMinio } from "@/lib/shopee-pipeline/minioUpload";
import { resolveCreatorVideoDefaults } from "@/lib/creator-video/defaults";
import { generateApproxVtt } from "@/lib/captions/vtt";
import { isNewsPresenterProject, isNewsVideoProject, resolveNewsAutoPresenterVideoEnabled } from "@/lib/newsVideoProject";
import { ensureNewsSocialPostsForProject } from "@/lib/newsSocialQueue";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 2100;

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
  const bufferMinutes = Math.min(6 * 60, Math.max(0, Number(process.env.SOCIAL_SCHEDULE_BUFFER_MINUTES || 45)));
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

async function enqueueNewsSocialPosts(project: any, videoUrl: string) {
  const result = await ensureNewsSocialPostsForProject({
    id: project.id,
    title: project.title,
    description: project.description,
    metadataJson: project.metadataJson,
    videoUrl,
  });

  if (result.createdCount === 0) {
    await logCodeVideoPipelineEvent({
      projectId: project.id,
      stepName: "ENQUEUE_SOCIAL",
      message: "Video pronto, mas nenhuma nova fila social precisou ser criada.",
      metadata: result,
    }).catch(() => null);
    return;
  }

  await logCodeVideoPipelineEvent({
    projectId: project.id,
    stepName: "ENQUEUE_SOCIAL",
    message: `Video pronto e enfileirado automaticamente para ${result.createdCount} plataforma(s).`,
    metadata: result,
  }).catch(() => null);
}

function externalRenderServiceUrl() {
  const value = String(process.env.VIDEO_RENDER_SERVICE_URL || "").trim();
  return value ? value.replace(/\/+$/, "") : "";
}

function postLongRunningJson(
  urlValue: string,
  payload: unknown,
  timeoutMs: number,
): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlValue);
    const body = JSON.stringify(payload);
    const transport = url.protocol === "https:" ? https : http;
    const request = transport.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        response.on("end", () =>
          resolve({
            status: response.statusCode || 500,
            text: Buffer.concat(chunks).toString("utf8"),
          }),
        );
      },
    );

    request.setTimeout(timeoutMs, () => {
      request.destroy(
        new Error(
          `O servico de render nao respondeu em ${Math.round(timeoutMs / 60_000)} minutos.`,
        ),
      );
    });
    request.on("error", reject);
    request.end(body);
  });
}

async function downloadUrlToBuffer(url: string) {
  const res = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(10 * 60 * 1000),
  });
  if (!res.ok) {
    throw new Error(`Falha ao baixar arquivo temporario (${res.status})`);
  }
  return Buffer.from(await res.arrayBuffer());
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

  const response = await postLongRunningJson(
    `${baseUrl}/render`,
    params,
    1000 * 60 * 35,
  );
  let data: any = {};
  try {
    data = JSON.parse(response.text || "{}");
  } catch {
    data = {};
  }
  if (response.status < 200 || response.status >= 300) {
    throw new Error(
      data?.error ||
        `Render service failed (HTTP ${response.status}): ${response.text.slice(0, 500)}`,
    );
  }
  return data;
}

function fallbackVisualCopy(text: string) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  const sentences = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((item) => item.trim()) || [];
  const shorten = (value: string, max: number) => {
    if (value.length <= max) return value.replace(/[.!?]+$/, "");
    const clipped = value.slice(0, max + 1);
    const lastSpace = clipped.lastIndexOf(" ");
    return `${clipped.slice(0, lastSpace > max * 0.65 ? lastSpace : max).trim()}…`;
  };
  const title = shorten(sentences[0] || clean, 72);
  const items = sentences.map((item) => shorten(item, 96)).filter(Boolean).slice(0, 3);
  return { title, items: items.length >= 2 ? items : [shorten(clean, 96)] };
}

function buildLongFormSegments(videoSpec: any, narrationText: string) {
  const scenes = Array.isArray(videoSpec?.scenes) ? videoSpec.scenes : [];
  const palettes = [
    { backgroundColor: "#0f172a", accentColor: "#38bdf8", textColor: "#f8fafc" },
    { backgroundColor: "#312e81", accentColor: "#fbbf24", textColor: "#ffffff" },
    { backgroundColor: "#064e3b", accentColor: "#34d399", textColor: "#ecfdf5" },
    { backgroundColor: "#7f1d1d", accentColor: "#fb7185", textColor: "#fff7ed" },
    { backgroundColor: "#3b0764", accentColor: "#c084fc", textColor: "#faf5ff" },
    { backgroundColor: "#0c4a6e", accentColor: "#22d3ee", textColor: "#ecfeff" },
  ];
  const sceneGroups: any[][] = [];
  let currentScenes: any[] = [];
  let currentDuration = 0;

  for (const scene of scenes) {
    const duration = Math.max(1, Number(scene?.durationSec || 1));
    if (currentScenes.length && currentDuration + duration > 75) {
      sceneGroups.push(currentScenes);
      currentScenes = [];
      currentDuration = 0;
    }
    currentScenes.push(scene);
    currentDuration += duration;
    if (currentDuration >= 55) {
      sceneGroups.push(currentScenes);
      currentScenes = [];
      currentDuration = 0;
    }
  }
  if (currentScenes.length) sceneGroups.push(currentScenes);

  const words = narrationText.trim().split(/\s+/).filter(Boolean);
  const totalDuration = sceneGroups.reduce(
    (total, group) =>
      total +
      group.reduce(
        (groupTotal, scene) =>
          groupTotal + Math.max(1, Number(scene?.durationSec || 1)),
        0,
      ),
    0,
  );
  let wordCursor = 0;

  return sceneGroups.map((group, index) => {
    const durationSec = group.reduce(
      (total, scene) => total + Math.max(1, Number(scene?.durationSec || 1)),
      0,
    );
    const remainingWords = words.length - wordCursor;
    const wordAmount =
      index === sceneGroups.length - 1
        ? remainingWords
        : Math.max(
            1,
            Math.round((words.length * durationSec) / Math.max(1, totalDuration)),
          );
    const segmentNarration = words
      .slice(wordCursor, wordCursor + wordAmount)
      .join(" ");
    wordCursor += wordAmount;

    return {
      index,
      durationSec,
      narrationText: segmentNarration,
      videoSpec: {
        ...videoSpec,
        content: {
          ...(videoSpec?.content || {}),
          narrationText: segmentNarration,
          segmentIndex: index + 1,
          segmentCount: sceneGroups.length,
          totalDurationSec: durationSec,
        },
        scenes: group.map((scene, sceneIndex) => {
          const palette =
            palettes[(index * Math.max(1, group.length) + sceneIndex) % palettes.length];
          const sourceProps = scene?.props || {};
          const segmentWords = segmentNarration.split(/\s+/).filter(Boolean);
          const copyStart = Math.floor((sceneIndex * segmentWords.length) / Math.max(1, group.length));
          const copyEnd = Math.floor(((sceneIndex + 1) * segmentWords.length) / Math.max(1, group.length));
          const fallbackCopy = fallbackVisualCopy(segmentWords.slice(copyStart, copyEnd).join(" "));
          const title =
            String(
              sourceProps.title ||
                sourceProps.subtitle ||
                fallbackCopy.title,
            ).trim() || fallbackCopy.title;
          const props: any = {
            ...sourceProps,
            ...palette,
            title,
            chartColor: palette.accentColor,
            highlightColor: palette.accentColor,
            circleColor: palette.accentColor,
          };
          let sceneTemplate = scene?.sceneTemplate;
          if (
            scene?.sceneTemplate === "BulletListScene" &&
            !Array.isArray(props.items)
          ) {
            props.items = fallbackCopy.items;
          }
          if (
            scene?.sceneTemplate === "TimelineScene" &&
            !Array.isArray(props.items)
          ) {
            props.items = [
              { label: "Ideia", text: fallbackCopy.items[0] || title },
              { label: "Desdobramento", text: fallbackCopy.items[1] || fallbackCopy.title },
            ];
          }
          if (scene?.sceneTemplate === "CodeTypingScene" && !props.code) {
            props.code = [title, ...fallbackCopy.items].join("\n");
          }
          if (
            scene?.sceneTemplate === "ChartScene" &&
            !Array.isArray(props.dataPoints)
          ) {
            sceneTemplate = "BulletListScene";
            props.items = fallbackCopy.items;
          }
          if (scene?.sceneTemplate === "BigNumberScene") {
            const realNumber = segmentWords.join(" ").match(/\b(?:R\$\s*)?\d+(?:[.,]\d+)?(?:%|x| vezes)?\b/i)?.[0];
            if (props.number || realNumber) {
              props.number = props.number || realNumber;
              props.subtitle = props.subtitle || title;
            } else {
              sceneTemplate = "BulletListScene";
              props.items = fallbackCopy.items;
            }
          }
          if (scene?.sceneTemplate === "CircleHighlightScene") {
            props.centerText = props.centerText || title.slice(0, 24);
            props.surroundingTexts = Array.isArray(props.surroundingTexts)
              ? props.surroundingTexts
              : fallbackCopy.items.map((item) => item.slice(0, 28));
          }
          return {
            ...scene,
            id: `segment-${index + 1}-scene-${sceneIndex + 1}`,
            sceneTemplate,
            props,
          };
        }),
      },
    };
  });
}

function brazilianTtsText(text: string) {
  return text
    .replace(/\bShopee\b/gi, "Xópi")
    .replace(/\be-commerce\b/gi, "comércio eletrônico")
    .replace(/\bCNPJ\b/g, "C N P J")
    .replace(/\bCPF\b/g, "C P F")
    .replace(/\bSEO\b/g, "S E O")
    .replace(/\bapp\b/gi, "aplicativo");
}

async function renderLongFormInSegments(params: {
  projectId: string;
  project: any;
  videoSpec: any;
}) {
  const baseUrl = externalRenderServiceUrl();
  if (!baseUrl) {
    throw new Error("VIDEO_RENDER_SERVICE_URL not configured");
  }
  const segments = buildLongFormSegments(
    params.videoSpec,
    String(params.project.narrationText || ""),
  );
  if (!segments.length) {
    throw new Error("O plano visual nao possui cenas para renderizar.");
  }

  const originalMetadata = safeJsonParse(params.project.metadataJson || "") || {};
  const previousSegments =
    Number(originalMetadata.segmentPipelineVersion) === 3 &&
    Array.isArray(originalMetadata.renderSegments)
    ? originalMetadata.renderSegments
    : [];
  const segmentState = segments.map((segment) => {
    const previous = previousSegments.find(
      (item: any) => Number(item?.index) === segment.index,
    );
    return {
      index: segment.index,
      label: `Parte ${segment.index + 1}`,
      durationSec: segment.durationSec,
      status: previous?.videoUrl ? "SUCCESS" : "PENDING",
      videoUrl: previous?.videoUrl || null,
      audioUrl: previous?.audioUrl || null,
      audioStatus: previous?.audioUrl ? "SUCCESS" : "PENDING",
      videoStatus: previous?.videoUrl ? "SUCCESS" : "PENDING",
      currentStage: previous?.videoUrl
        ? "DONE"
        : previous?.audioUrl
          ? "VIDEO"
          : "AUDIO",
      errorMessage: null,
    };
  });
  const persist = async (mergeStatus = "PENDING") => {
    await prisma.codeVideoProject.update({
      where: { id: params.projectId },
      data: {
        metadataJson: JSON.stringify({
          ...originalMetadata,
          segmentPipelineVersion: 3,
          renderSegments: segmentState,
          mergeStatus,
        }),
        renderProgress:
          (segmentState.reduce(
            (total, item) =>
              total +
              (item.audioStatus === "SUCCESS" ? 0.25 : 0) +
              (item.videoStatus === "SUCCESS" ? 0.75 : 0),
            0,
          ) /
            segments.length) *
          90,
      },
    });
  };
  await persist();

  for (const segment of segments) {
    const state = segmentState[segment.index];
    if (state.videoUrl) {
      await logCodeVideoPipelineEvent({
        projectId: params.projectId,
        stepName: `RENDER_SEGMENT_${segment.index + 1}`,
        message: `${state.label} reutilizada: ${Math.round(segment.durationSec)}s.`,
      });
      continue;
    }

    state.status = "RUNNING";
    if (!state.audioUrl) {
      state.audioStatus = "RUNNING";
      state.currentStage = "AUDIO";
      await persist();
      await logCodeVideoPipelineEvent({
        projectId: params.projectId,
        stepName: `AUDIO_SEGMENT_${segment.index + 1}`,
        message: `Gerando audio em portugues do Brasil para ${state.label.toLowerCase()}.`,
      });
      try {
        const audioResponse = await postLongRunningJson(
          `${baseUrl}/audio`,
          {
            projectId: `${params.projectId}-part-${segment.index + 1}`,
            text: brazilianTtsText(segment.narrationText),
            voice: params.project.ttsVoice,
            speed: params.project.ttsSpeed,
          },
          1000 * 60 * 10,
        );
        let audioData: any = {};
        try {
          audioData = JSON.parse(audioResponse.text || "{}");
        } catch {
          audioData = {};
        }
        if (
          audioResponse.status < 200 ||
          audioResponse.status >= 300 ||
          !audioData.audioUrl
        ) {
          throw new Error(
            audioData?.error ||
              `Falha ao gerar audio (HTTP ${audioResponse.status}).`,
          );
        }
        state.audioUrl = audioData.audioUrl;
        state.audioStatus = "SUCCESS";
        state.currentStage = "VIDEO";
        await persist();
        await logCodeVideoPipelineEvent({
          projectId: params.projectId,
          stepName: `AUDIO_SEGMENT_${segment.index + 1}`,
          message: `Audio da ${state.label.toLowerCase()} concluido e disponivel.`,
          metadata: { audioUrl: audioData.audioUrl },
        });
      } catch (error: any) {
        state.status = "FAILED";
        state.audioStatus = "FAILED";
        state.errorMessage = error?.message || "Falha ao gerar audio.";
        await persist("FAILED");
        throw new Error(`${state.label} falhou no audio: ${state.errorMessage}`);
      }
    }

    state.videoStatus = "RUNNING";
    state.currentStage = "VIDEO";
    await persist();
    await logCodeVideoPipelineEvent({
      projectId: params.projectId,
      stepName: `RENDER_SEGMENT_${segment.index + 1}`,
      message: `Renderizando ${state.label.toLowerCase()} de ${segments.length} (${Math.round(segment.durationSec)}s).`,
    });
    try {
      const result = await renderWithExternalService({
        projectId: `${params.projectId}-part-${segment.index + 1}`,
        project: {
          ...params.project,
          projectType: "LONG_FORM_SEGMENT",
          videoDurationSec: segment.durationSec,
          narrationText: segment.narrationText,
          audioUrl: state.audioUrl,
          skipTranscription: true,
        },
        videoSpec: segment.videoSpec,
      });
      state.status = "SUCCESS";
      state.videoUrl = result.videoUrl;
      state.audioUrl = result.audioUrl || state.audioUrl;
      state.audioStatus = "SUCCESS";
      state.videoStatus = "SUCCESS";
      state.currentStage = "DONE";
      state.errorMessage = null;
      await persist();
      await logCodeVideoPipelineEvent({
        projectId: params.projectId,
        stepName: `RENDER_SEGMENT_${segment.index + 1}`,
        message: `${state.label} concluida e salva (${Math.round(Number(result.durationSec || segment.durationSec))}s).`,
        metadata: { videoUrl: result.videoUrl },
      });
    } catch (error: any) {
      state.status = "FAILED";
      state.videoStatus = "FAILED";
      state.errorMessage = error?.message || "Falha ao renderizar segmento.";
      await persist("FAILED");
      throw new Error(`${state.label} falhou: ${state.errorMessage}`);
    }
  }

  await persist("RUNNING");
  await logCodeVideoPipelineEvent({
    projectId: params.projectId,
    stepName: "MERGE_SEGMENTS",
    message: `Unindo ${segmentState.length} partes em um unico MP4.`,
  });
  const response = await postLongRunningJson(
    `${baseUrl}/concat`,
    {
      projectId: params.projectId,
      videoUrls: segmentState.map((segment) => segment.videoUrl),
    },
    1000 * 60 * 35,
  );
  let merged: any = {};
  try {
    merged = JSON.parse(response.text || "{}");
  } catch {
    merged = {};
  }
  if (response.status < 200 || response.status >= 300 || !merged.videoUrl) {
    await persist("FAILED");
    throw new Error(
      merged?.error ||
        `Falha ao unir os segmentos (HTTP ${response.status}).`,
    );
  }
  await persist("SUCCESS");
  await logCodeVideoPipelineEvent({
    projectId: params.projectId,
    stepName: "MERGE_SEGMENTS",
    message: "Partes unidas com sucesso. MP4 final disponivel.",
    metadata: { videoUrl: merged.videoUrl },
  });
  return {
    videoUrl: merged.videoUrl,
    durationSec: Number(merged.durationSec || 0),
  };
}

async function renderNewsAsTalkingHead(project: any) {
  const defaults = await resolveCreatorVideoDefaults(null, "ENGAGEMENT");
  const voiceRefUrl = String(defaults.voiceRefUrl || "").trim();
  const imageUrl = String(defaults.creatorImageUrl || "").trim();
  const narrationText = String(project.narrationText || "").trim();

  if (!voiceRefUrl) throw new Error("Config faltando: userVoiceRefUrl para gerar audio da noticia");
  if (!imageUrl) throw new Error("Config faltando: userBaseImageUrl/creator asset para gerar video da noticia");
  if (!narrationText) throw new Error("narrationText ausente para gerar audio da noticia");

  let stableAudioUrl = String(project.audioUrl || "").trim();
  if (!stableAudioUrl) {
    await logCodeVideoPipelineEvent({
      projectId: project.id,
      stepName: "RENDER_VIDEO",
      message: "Gerando audio do resumo via Modal...",
    }).catch(() => null);

    const audioResult = await generateModalAudio({
      voiceRefUrl,
      targetText: narrationText,
      seed: Math.floor(Math.random() * 1_000_000_000),
    });

    await logCodeVideoPipelineEvent({
      projectId: project.id,
      stepName: "RENDER_VIDEO",
      message: "Baixando audio temporario retornado pela Modal...",
      metadata: { modalAudioUrl: String(audioResult.audio_url || "").trim() || null },
    }).catch(() => null);

    const audioBuffer = await downloadUrlToBuffer(String(audioResult.audio_url || "").trim());
    stableAudioUrl = await uploadBufferToMinio({
      buffer: audioBuffer,
      key: `news-engagement/audio/${project.id}.mp3`,
      contentType: "audio/mpeg",
    });

    await logCodeVideoPipelineEvent({
      projectId: project.id,
      stepName: "RENDER_VIDEO",
      message: "Audio salvo no MinIO com URL estavel.",
      metadata: { audioUrl: stableAudioUrl },
    }).catch(() => null);
  }

  await logCodeVideoPipelineEvent({
    projectId: project.id,
    stepName: "RENDER_VIDEO",
    message: "Enviando imagem base + audio estavel para gerar o video falado...",
    metadata: { imageUrl, audioUrl: stableAudioUrl },
  }).catch(() => null);

  const videoResult = await generateModalVideo({
    imageUrl,
    audioUrl: stableAudioUrl,
    seed: Math.floor(Math.random() * 1_000_000_000),
  });

  const captionsUrl = await uploadBufferToMinio({
    buffer: Buffer.from(generateApproxVtt({ text: narrationText }), "utf8"),
    key: `news-engagement/${project.id}.vtt`,
    contentType: "text/vtt; charset=utf-8",
  }).catch(() => null);

  let finalVideoUrl = String(videoResult.video_url || "").trim();

  if (finalVideoUrl && project.title) {
    try {
      await logCodeVideoPipelineEvent({
        projectId: project.id,
        stepName: "RENDER_VIDEO",
        message: "Aplicando titulo overlay no video (Worker Python)...",
      }).catch(() => null);

      const workerBaseUrl = (process.env.WORKER_FASTAPI_BASE_URL || process.env.FASTAPI_URL || "http://127.0.0.1:8000").trim().replace(/\/+$/, "");
      const form = new URLSearchParams();
      form.set("video_url", finalVideoUrl);
      form.set("text", String(project.title).trim());
      form.set("duration", "3.0");
      form.set("upload_mode", "worker");

      const res = await fetch(`${workerBaseUrl}/add-text-overlay`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      });
      const data = await res.json();
      if (res.ok && data.videoUrl) {
        finalVideoUrl = data.videoUrl;
        await logCodeVideoPipelineEvent({
          projectId: project.id,
          stepName: "RENDER_VIDEO",
          message: "Overlay aplicado com sucesso!",
          metadata: { videoUrl: finalVideoUrl },
        }).catch(() => null);
      } else {
        console.error("Erro no overlay:", data);
      }
    } catch (e) {
      console.error("Erro na chamada de overlay:", e);
    }
  }

  return {
    audioUrl: stableAudioUrl,
    videoUrl: finalVideoUrl,
    captionsUrl,
  };
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

    const isNewsProject = isNewsVideoProject(project);
    const isNewsPresenter = isNewsPresenterProject(project);
    const videoSpec = safeJsonParse(project.videoSpecJson || "");
    const autoPresenterEnabled = await resolveNewsAutoPresenterVideoEnabled(prisma);

    if (isNewsPresenter && !autoPresenterEnabled) {
      await prisma.codeVideoProject.update({
        where: { id: projectId },
        data: {
          status: "SKIPPED",
          errorMessage: "Render automatico de video de noticia com apresentador desativado para economia de Modal.",
        },
      });
      await upsertCodeVideoPipelineStep({
        projectId,
        stepName: "RENDER_VIDEO",
        status: "SKIPPED",
        attempt: 1,
        startedAt: new Date(),
        finishedAt: new Date(),
        responsePayload: { env: "NEWS_ARTICLE_AUTO_PRESENTER_VIDEO_ENABLED", enabled: false },
      });
      await logCodeVideoPipelineEvent({
        projectId,
        stepName: "RENDER_VIDEO",
        message: "Render de noticia com apresentador ignorado: NEWS_ARTICLE_AUTO_PRESENTER_VIDEO_ENABLED esta desligado.",
      }).catch(() => null);
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "news_presenter_auto_disabled",
      });
    }

    if (!isNewsPresenter && !videoSpec) {
      return NextResponse.json({ error: "videoSpecJson is invalid JSON" }, { status: 400 });
    }

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
      message: isNewsPresenter
        ? "Iniciando geracao de audio e video falado da noticia via Modal..."
        : "Iniciando sintese de audio TTS e renderizacao no servico de video...",
    });

    const result = isNewsPresenter
      ? await renderNewsAsTalkingHead(project)
      : project.projectType === "LONG_FORM_MARKETING"
        ? await renderLongFormInSegments({
            projectId,
            project,
            videoSpec,
          })
        : await renderWithExternalService({
          projectId,
          project: {
            projectType: project.projectType,
            videoDurationSec: project.videoDurationSec,
            aspectRatio: project.aspectRatio,
            fps: project.fps,
            narrationText: project.narrationText,
            audioUrl: project.audioUrl,
            ttsVoice: project.ttsVoice,
            ttsSpeed: project.ttsSpeed,
          },
          videoSpec,
        });

    const actualDurationSec = Number((result as any).durationSec);
    const latestMetadataRow =
      project.projectType === "LONG_FORM_MARKETING"
        ? await prisma.codeVideoProject.findUnique({
            where: { id: projectId },
            select: { metadataJson: true },
          })
        : null;
    const metadata =
      safeJsonParse(latestMetadataRow?.metadataJson || project.metadataJson || "") ||
      {};
    const updated = await prisma.codeVideoProject.update({
      where: { id: projectId },
      data: {
        status: "DONE",
        videoUrl: result.videoUrl,
        audioUrl: result.audioUrl || project.audioUrl,
        captionsUrl: result.captionsUrl || project.captionsUrl,
        renderProgress: 100,
        errorMessage: null,
        ...(project.projectType === "LONG_FORM_MARKETING" && Number.isFinite(actualDurationSec)
          ? { metadataJson: JSON.stringify({ ...metadata, actualDurationSec }) }
          : {}),
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
      message: isNewsPresenter ? "Audio e video falado da noticia gerados com sucesso!" : "Video compilado e renderizado com sucesso!",
      metadata: {
        videoUrl: result.videoUrl,
        audioUrl: result.audioUrl || null,
        captionsUrl: result.captionsUrl || null,
      },
    });

    await enqueueProductAdSocialPosts(updated, result.videoUrl);
    await enqueueNewsSocialPosts(updated, result.videoUrl);

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
          message: `Falha na renderizacao do video: ${msg}`,
        });
      } catch (dbErr) {
        console.error("Failed to write failure log to DB", dbErr);
      }
    }

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
