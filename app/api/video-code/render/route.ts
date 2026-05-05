import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import path from "path";
import fs from "fs/promises";
import { PutObjectCommand, HeadBucketCommand, CreateBucketCommand, PutBucketPolicyCommand } from "@aws-sdk/client-s3";
import s3Client from "@/lib/s3";

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
  const allowed = new Set(["YOUTUBE", "INSTAGRAM", "TIKTOK"]);
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
  const mercadoLivre = metadata?.mercadoLivre;
  if (!mercadoLivre || mercadoLivre.autoScheduleSocial !== true) return;

  const platforms = normalizeSocialPlatforms(mercadoLivre.platforms);
  if (platforms.length === 0) return;

  const rawScheduledTo = mercadoLivre.scheduledTo ? new Date(mercadoLivre.scheduledTo) : null;
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
        log: `[${new Date().toLocaleTimeString("pt-BR")}] Enfileirado pela rotina Mercado Livre`,
      },
    });
  }

  await prisma.mercadoLivreAffiliatePick.updateMany({
    where: { codeVideoProjectId: project.id },
    data: { status: "SCHEDULED", errorMessage: null },
  });
}

function totalDurationInSeconds(videoSpec: any) {
  const scenes = Array.isArray(videoSpec?.scenes) ? videoSpec.scenes : [];
  const sum = scenes.reduce((acc: number, s: any) => acc + (Number(s?.durationSec) || 0), 0);
  return Math.max(1, Math.round(sum));
}

function totalDurationInFramesFromSpec(videoSpec: any, fps: number) {
  const scenes = Array.isArray(videoSpec?.scenes) ? videoSpec.scenes : [];
  let frames = 0;
  for (const s of scenes) {
    const sec = s?.durationSec;
    const n = sec === undefined || sec === null ? 1 : Number(sec);
    const sceneFrames = Math.max(1, Math.round((Number.isFinite(n) ? n : 1) * fps));
    frames += sceneFrames;
  }
  return Math.max(1, frames);
}

function dynamicRequire(moduleName: string) {
  // NEW: Dummy imports to trick Next.js standalone tracer
  if (process.env.NODE_ENV === "production" && false) {
    require("@remotion/bundler");
    require("@remotion/renderer");
    require("remotion");
  }

  // Avoid bundling native deps (Remotion bundler/renderer) into Next.js build.
  // eslint-disable-next-line no-eval
  const req = eval("require") as (name: string) => any;
  return req(moduleName);
}

async function generateNarrationMp3(params: { text: string; voice: string; speed: string }) {
  // On Windows, `localhost` can resolve to IPv6 (::1). If Uvicorn is bound only to IPv4 (0.0.0.0),
  // Node may fail connecting. Default to 127.0.0.1 for reliability.
  const baseUrl = (process.env.WORKER_FASTAPI_BASE_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
  const url = `${baseUrl}/gerar-audio`;
  const form = new FormData();
  form.set("text", params.text);
  form.set("voice", params.voice);
  form.set("speed", params.speed);

  const res = await fetch(url, { method: "POST", body: form as any });
  if (!res.ok) {
    let msg = `Worker audio failed (HTTP ${res.status})`;
    try {
      const json = await res.json();
      msg = json?.error || json?.detail || msg;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }

  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

async function ensureBucket(bucketName: string) {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
  } catch (headErr: any) {
    if (headErr.name === "NotFound" || headErr.$metadata?.httpStatusCode === 404) {
      await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
    } else {
      throw headErr;
    }
  }

  try {
    const publicPolicy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: "*",
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${bucketName}/*`],
        },
      ],
    };
    await s3Client.send(
      new PutBucketPolicyCommand({
        Bucket: bucketName,
        Policy: JSON.stringify(publicPolicy),
      })
    );
  } catch {
    // ignore
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const projectId = String(body?.projectId ?? "").trim();
    if (!projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });

    const project = await prisma.codeVideoProject.findUnique({ where: { id: projectId } });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const videoSpec = safeJsonParse(project.videoSpecJson || "");
    if (!videoSpec) return NextResponse.json({ error: "videoSpecJson is invalid JSON" }, { status: 400 });

    let audioUrl: string | null = project.audioUrl;

    await prisma.codeVideoProject.update({
      where: { id: projectId },
      data: { status: "RENDERING", errorMessage: null },
    });

    const bucketName = process.env.MINIO_BUCKET_NAME || "uploads";
    const publicBase = process.env.MINIO_PUBLIC_URL;
    if (!publicBase) {
      await prisma.codeVideoProject.update({
        where: { id: projectId },
        data: { status: "FAILED", errorMessage: "MINIO_PUBLIC_URL not configured" },
      });
      return NextResponse.json({ error: "MINIO_PUBLIC_URL not configured" }, { status: 500 });
    }

    await ensureBucket(bucketName);

    // Generate narration audio using the existing Python worker (edge-tts) if needed.
    if (!audioUrl && project.narrationText && project.narrationText.trim().length > 0) {
      const mp3 = await generateNarrationMp3({
        text: project.narrationText,
        voice: project.ttsVoice || "pt-BR-AntonioNeural",
        speed: project.ttsSpeed || "+5%",
      });

      const audioKey = `code-video-audio-${projectId}.mp3`;
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: audioKey,
          Body: mp3,
          ContentType: "audio/mpeg",
          ACL: "public-read",
        })
      );

      audioUrl = `${publicBase}/${audioKey}`;
      await prisma.codeVideoProject.update({
        where: { id: projectId },
        data: { audioUrl, renderProgress: 10 },
      });
    }

    // NEW: Get word-level transcription for Retention Editing
    let transcription = null;
    if (audioUrl) {
      try {
        const baseUrl = (process.env.WORKER_FASTAPI_BASE_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
        const url = `${baseUrl}/transcrever-palavras`;
        
        // Fetch audio from S3/MinIO first to send to worker
        const audioRes = await fetch(audioUrl);
        if (audioRes.ok) {
          const audioBlob = await audioRes.blob();
          const form = new FormData();
          form.append("file", audioBlob, "audio.mp3");
          
          const transRes = await fetch(url, { method: "POST", body: form });
          if (transRes.ok) {
            const data = await transRes.json();
            transcription = data.words;
            await prisma.codeVideoProject.update({
              where: { id: projectId },
              data: { renderProgress: 20 },
            });
          }
        }
      } catch (err) {
        console.error("[render/route.ts] Transcription failed:", err);
      }
    }

    const { bundle } = dynamicRequire("@remotion/bundler") as typeof import("@remotion/bundler");
    const { getCompositions, renderMedia } = dynamicRequire("@remotion/renderer") as typeof import("@remotion/renderer");

    const entryPoint = path.resolve(process.cwd(), "remotion", "index.ts");
    const bundleLocation = await bundle({ entryPoint, webpackOverride: (c) => c });

    // --- CORRIGIDO: Puxa o caminho do Chromium e passa direto nas funções
    const browserPath = process.env.REMOTION_CHROME_BIN || undefined;

    const compositions = await getCompositions(bundleLocation, {
      inputProps: { videoSpec, audioUrl, transcription },
      browserExecutable: browserPath, // <-- Passado direto na raiz
    });

    const compositionId = project.aspectRatio === "LANDSCAPE_16_9" ? "VideoLandscape" : "VideoPortrait";
    const comp = compositions.find((c) => c.id === compositionId);
    if (!comp) {
      await prisma.codeVideoProject.update({
        where: { id: projectId },
        data: { status: "FAILED", errorMessage: `Composition not found: ${compositionId}` },
      });
      return NextResponse.json({ error: `Composition not found: ${compositionId}` }, { status: 500 });
    }

    const fps = project.fps || 30;
    // Use per-scene rounded frames (same logic as remotion/video-from-spec.tsx) to avoid trailing blank frames.
    const durationInFrames = totalDurationInFramesFromSpec(videoSpec, fps);
    const composition = { ...comp, fps, durationInFrames };

    const outDir = path.resolve(process.cwd(), ".remotion-temp");
    await fs.mkdir(outDir, { recursive: true });
    const localMp4 = path.join(outDir, `code-video-${projectId}.mp4`);

    let lastProgressUpdate = 0;

    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: "h264",
      outputLocation: localMp4,
      inputProps: { videoSpec, audioUrl, transcription },
      browserExecutable: browserPath, // <-- Passado direto na raiz
      onProgress: async (p: any) => {
        const percent = 20 + (p * 75); // 20% to 95%
        if (percent - lastProgressUpdate > 5 || percent >= 95) {
          lastProgressUpdate = percent;
          await prisma.codeVideoProject.update({
            where: { id: projectId },
            data: { renderProgress: percent },
          });
        }
      },
    });

    const buffer = await fs.readFile(localMp4);
    const key = `code-video-${projectId}.mp4`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: "video/mp4",
        ACL: "public-read",
      })
    );

    const videoUrl = `${publicBase}/${key}`;

    const updated = await prisma.codeVideoProject.update({
      where: { id: projectId },
      data: { status: "DONE", videoUrl, errorMessage: null },
    });

    await enqueueProductAdSocialPosts(updated, videoUrl);

    return NextResponse.json(updated);
  } catch (error: any) {
    const msg = error?.message || "Failed to render";
    console.error("[RENDER_ERROR]", error);
    
    // Attempt to save error to DB
    try {
      const body = await req.clone().json();
      const pId = String(body?.projectId ?? "").trim();
      if (pId) {
        await prisma.codeVideoProject.update({
          where: { id: pId },
          data: { status: "FAILED", errorMessage: msg, renderProgress: 0 },
        });
      }
    } catch (e) {}

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
