import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateModalAudio } from "@/lib/shopee-pipeline/modalClient";
import { resolveCreatorVideoDefaults } from "@/lib/creator-video/defaults";
import { buildMixedRenderSpec, planMixedVideo } from "@/lib/creator-video/mixed";
import { generateApproxVtt } from "@/lib/captions/vtt";
import { uploadBufferToMinio } from "@/lib/shopee-pipeline/minioUpload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 900;

function now() {
  return new Date();
}

function normalize(value: unknown) {
  return String(value || "").trim();
}

function externalRenderServiceUrl() {
  const value = String(process.env.VIDEO_RENDER_SERVICE_URL || "").trim();
  return value ? value.replace(/\/+$/, "") : "";
}

async function renderMixedVideo(payload: {
  aspectRatio: string;
  audioUrl: string;
  renderSpec: any;
}) {
  const baseUrl = externalRenderServiceUrl();
  if (!baseUrl) throw new Error("VIDEO_RENDER_SERVICE_URL not configured");

  const res = await fetch(`${baseUrl}/render`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projectId: `mixed-${Date.now()}`,
      project: {
        aspectRatio: payload.aspectRatio,
        fps: Number(payload.renderSpec?.meta?.fps || 30),
        audioUrl: payload.audioUrl,
      },
      videoSpec: payload.renderSpec,
    }),
    signal: AbortSignal.timeout(1000 * 60 * 20),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Render service failed (HTTP ${res.status})`);
  return data;
}

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  const id = String(ctx?.params?.id || "").trim();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const mode = String(req.nextUrl.searchParams.get("mode") || "simple").trim().toLowerCase();
  if (mode === "mixed") {
    const item = await prisma.mixedCreatorVideo.findUnique({
      where: { id },
      include: { assets: { orderBy: { sortOrder: "asc" } } },
    });
    if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ item });
  }

  const item = await prisma.simpleCreatorVideo.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ item });
}

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  const id = String(ctx?.params?.id || "").trim();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const mode = String(req.nextUrl.searchParams.get("mode") || "simple").trim().toLowerCase();
  if (mode !== "mixed") {
    return NextResponse.json({ error: "Unsupported action for this endpoint" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const action = normalize(body?.action).toLowerCase();
  const item = await prisma.mixedCreatorVideo.findUnique({
    where: { id },
    include: { assets: { orderBy: { sortOrder: "asc" } } },
  });
  if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });

  try {
    if (action === "plan") {
      await prisma.mixedCreatorVideo.update({
        where: { id },
        data: { status: "PLANNING_VISUALS", errorMessage: null, updatedAt: now() },
      });

      const planned = await planMixedVideo({
        narrationText: item.narrationText,
        speechRate: item.speechRate,
        aspectRatio: item.aspectRatio,
        assets: item.assets.map((asset) => ({
          id: asset.id,
          url: asset.url,
          kind: asset.kind as "IMAGE" | "VIDEO",
          originalName: asset.originalName,
          userLabel: asset.userLabel,
          autoLabel: asset.autoLabel,
        })),
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.VIDEO_CODE_AI_MODEL || "gpt-4o-mini",
      });

      await prisma.$transaction([
        prisma.mixedCreatorVideo.update({
          where: { id },
          data: { assetPlanJson: JSON.stringify({ segments: planned.segments }, null, 2), errorMessage: null, updatedAt: now() },
        }),
        ...planned.assets.map((asset) =>
          prisma.mixedCreatorVideoAsset.update({
            where: { id: asset.id },
            data: { autoLabel: asset.autoLabel || null, updatedAt: now() },
          })
        ),
      ]);

      const updated = await prisma.mixedCreatorVideo.findUnique({
        where: { id },
        include: { assets: { orderBy: { sortOrder: "asc" } } },
      });
      return NextResponse.json({ ok: true, item: updated });
    }

    if (action === "generate_audio") {
      const defaults = await resolveCreatorVideoDefaults();
      const voiceRefUrl = normalize(item.voiceRefUrl || defaults.voiceRefUrl || "");
      if (!voiceRefUrl) return NextResponse.json({ error: "Config faltando: userVoiceRefUrl" }, { status: 400 });

      await prisma.mixedCreatorVideo.update({
        where: { id },
        data: { status: "GENERATING_AUDIO", errorMessage: null, voiceRefUrl, updatedAt: now() },
      });

      const generated = await generateModalAudio({
        voiceRefUrl,
        targetText: item.narrationText,
        seed: Math.floor(Math.random() * 1_000_000_000),
        language: item.audioLanguage,
        speechRate: item.speechRate,
      });

      await prisma.mixedCreatorVideo.update({
        where: { id },
        data: { audioUrl: generated.audio_url, errorMessage: null, updatedAt: now() },
      });

      const updated = await prisma.mixedCreatorVideo.findUnique({
        where: { id },
        include: { assets: { orderBy: { sortOrder: "asc" } } },
      });
      return NextResponse.json({ ok: true, item: updated });
    }

    if (action === "compose") {
      if (!item.audioUrl) return NextResponse.json({ error: "Audio ainda nao gerado." }, { status: 400 });

      const plannedJson = JSON.parse(item.assetPlanJson || "{}");
      const renderSpec = buildMixedRenderSpec({
        narrationText: item.narrationText,
        aspectRatio: item.aspectRatio,
        fps: 30,
        audioUrl: item.audioUrl,
        segments: Array.isArray(plannedJson?.segments) ? plannedJson.segments : [],
        assets: item.assets.map((asset) => ({
          id: asset.id,
          url: asset.url,
          kind: asset.kind as "IMAGE" | "VIDEO",
          originalName: asset.originalName,
          userLabel: asset.userLabel,
          autoLabel: asset.autoLabel,
        })),
      });

      await prisma.mixedCreatorVideo.update({
        where: { id },
        data: {
          status: "COMPOSING_VIDEO",
          renderSpecJson: JSON.stringify(renderSpec, null, 2),
          errorMessage: null,
          updatedAt: now(),
        },
      });

      const result = await renderMixedVideo({
        aspectRatio: item.aspectRatio,
        audioUrl: item.audioUrl,
        renderSpec,
      });

      const captionsUrl = await uploadBufferToMinio({
        buffer: Buffer.from(generateApproxVtt({ text: item.narrationText }), "utf8"),
        key: `mixed-creator-videos/${id}.vtt`,
        contentType: "text/vtt; charset=utf-8",
      }).catch(() => null);

      const updated = await prisma.mixedCreatorVideo.update({
        where: { id },
        data: {
          finalVideoUrl: String(result?.videoUrl || "").trim() || null,
          captionsUrl: captionsUrl || null,
          status: "READY",
          completedAt: now(),
          errorMessage: null,
          updatedAt: now(),
        },
        include: { assets: { orderBy: { sortOrder: "asc" } } },
      });

      return NextResponse.json({ ok: true, item: updated });
    }

    return NextResponse.json({ error: "action is required" }, { status: 400 });
  } catch (error: any) {
    const message = error?.message || "Falha ao processar";
    await prisma.mixedCreatorVideo.update({
      where: { id },
      data: { status: "FAILED", errorMessage: message, updatedAt: now() },
    }).catch(() => null);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
