import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveCreatorVideoDefaults } from "@/lib/creator-video/defaults";
import {
  creatorVideoObservedComfyParams,
  creatorVideoFormatPresetOptions,
  defaultCreatorVideoAudioSettings,
  defaultCreatorVideoRenderSettings,
} from "@/lib/creator-video/manualConfig";
import { generateModalAudio, generateModalVideo } from "@/lib/shopee-pipeline/modalClient";
import { generateApproxVtt } from "@/lib/captions/vtt";
import { uploadBufferToMinio } from "@/lib/shopee-pipeline/minioUpload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 900;

function normalize(value: unknown) {
  return String(value || "").trim();
}

function now() {
  return new Date();
}

function toFloat(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toInt(value: unknown, fallback: number) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeLanguage(value: unknown) {
  return String(value || "").trim().toLowerCase() === "english" ? "English" : "Portuguese";
}

function resolveDimensions(formatPreset: string, width: number, height: number) {
  const preset = creatorVideoFormatPresetOptions().find((item) => item.value === formatPreset);
  if (preset) return { width: preset.width, height: preset.height };
  return { width, height };
}

export async function GET(req: NextRequest) {
  const view = String(req.nextUrl.searchParams.get("view") || "").trim().toLowerCase();
  if (view === "config") {
    const defaults = await resolveCreatorVideoDefaults();
    return NextResponse.json({
      defaults: {
        creatorImageUrl: defaults.creatorImageUrl,
        voiceRefUrl: defaults.voiceRefUrl,
      },
      audioSettings: defaultCreatorVideoAudioSettings(),
      renderSettings: defaultCreatorVideoRenderSettings(),
      formatPresets: creatorVideoFormatPresetOptions(),
      comfyObservedParams: creatorVideoObservedComfyParams(),
    });
  }

  const items = await prisma.simpleCreatorVideo.findMany({
    orderBy: { createdAt: "desc" },
    take: 40,
  });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  let createdId = "";
  try {
    const body = await req.json().catch(() => ({}));
    const narrationText = normalize(body?.narrationText);
    const requestedImageUrl = normalize(body?.creatorImageUrl);
    const requestedVoiceRefUrl = normalize(body?.voiceRefUrl);
    const autoGenerate = body?.autoGenerate === false ? false : true;

    if (!narrationText) return NextResponse.json({ error: "narrationText is required" }, { status: 400 });
    if (narrationText.length > 5000) {
      return NextResponse.json({ error: "Texto muito longo (max 5000 caracteres no MVP)." }, { status: 400 });
    }

    const audioDefaults = defaultCreatorVideoAudioSettings();
    const renderDefaults = defaultCreatorVideoRenderSettings();
    const defaults = await resolveCreatorVideoDefaults(requestedImageUrl || null);

    if (!defaults.creatorImageUrl) {
      return NextResponse.json(
        { error: "Configure uma imagem padrao em userBaseImageUrl ou adicione uma imagem ativa em creator-assets." },
        { status: 400 }
      );
    }

    const creatorImageUrl = String(defaults.creatorImageUrl || "");
    const voiceRefUrl = requestedVoiceRefUrl || String(defaults.voiceRefUrl || "");
    if (autoGenerate && !voiceRefUrl) {
      return NextResponse.json({ error: "Config faltando: userVoiceRefUrl" }, { status: 400 });
    }

    const audioLanguage = normalizeLanguage(body?.audioLanguage || audioDefaults.language);
    const speechRate = Math.min(2, Math.max(0.5, toFloat(body?.speechRate, audioDefaults.speechRate)));
    const formatPreset = String(body?.formatPreset || renderDefaults.formatPreset || "TIKTOK").trim().toUpperCase();
    const fps = Math.max(12, Math.min(30, toInt(body?.videoFps, renderDefaults.fps)));
    const requestedWidth = Math.max(256, Math.min(1080, toInt(body?.videoWidth, renderDefaults.width)));
    const requestedHeight = Math.max(256, Math.min(1920, toInt(body?.videoHeight, renderDefaults.height)));
    const steps = Math.max(1, Math.min(12, toInt(body?.steps, renderDefaults.steps)));
    const cfg = Math.max(0.1, Math.min(4, toFloat(body?.cfg, renderDefaults.cfg)));
    const shift = Math.max(1, Math.min(20, toFloat(body?.shift, renderDefaults.shift)));
    const crf = Math.max(10, Math.min(35, toInt(body?.crf, renderDefaults.crf)));
    const maxNewTokens = Math.max(64, Math.min(4096, toInt(body?.maxNewTokens, audioDefaults.maxNewTokens)));
    const topP = Math.max(0.1, Math.min(1, toFloat(body?.topP, audioDefaults.topP)));
    const topK = Math.max(1, Math.min(200, toInt(body?.topK, audioDefaults.topK)));
    const temperature = Math.max(0.1, Math.min(2, toFloat(body?.temperature, audioDefaults.temperature)));
    const repetitionPenalty = Math.max(0.5, Math.min(2, toFloat(body?.repetitionPenalty, audioDefaults.repetitionPenalty)));
    const quality = String(body?.quality || audioDefaults.quality).trim() || audioDefaults.quality;
    const dimensions = resolveDimensions(formatPreset, requestedWidth, requestedHeight);

    const created = await prisma.simpleCreatorVideo.create({
      data: {
        narrationText,
        creatorImageUrl,
        voiceRefUrl: voiceRefUrl || null,
        audioLanguage,
        speechRate,
        formatPreset,
        videoWidth: dimensions.width,
        videoHeight: dimensions.height,
        videoFps: fps,
        status: "DRAFT",
        startedAt: now(),
      },
    });
    createdId = created.id;

    if (!autoGenerate) {
      return NextResponse.json({ ok: true, item: created });
    }

    await prisma.simpleCreatorVideo.update({
      where: { id: created.id },
      data: { status: "GENERATING_AUDIO", errorMessage: null, audioStartedAt: now(), updatedAt: now() },
    });

    const audioSeed = Math.floor(Math.random() * 1_000_000_000);
    const generatedAudio = await generateModalAudio({
      voiceRefUrl,
      targetText: narrationText,
      seed: audioSeed,
      language: audioLanguage,
      speechRate,
      maxNewTokens,
      topP,
      topK,
      temperature,
      repetitionPenalty,
      quality,
    });

    await prisma.simpleCreatorVideo.update({
      where: { id: created.id },
      data: {
        audioUrl: generatedAudio.audio_url,
        audioPromptId: generatedAudio.prompt_id,
        status: "GENERATING_VIDEO",
        audioCompletedAt: now(),
        videoStartedAt: now(),
        errorMessage: null,
        updatedAt: now(),
      },
    });

    const videoSeed = Math.floor(Math.random() * 1_000_000_000);
    const generatedVideo = await generateModalVideo({
      imageUrl: creatorImageUrl,
      audioUrl: generatedAudio.audio_url,
      seed: videoSeed,
      width: dimensions.width,
      height: dimensions.height,
      fps,
      steps,
      cfg,
      shift,
      crf,
    });

    const vtt = generateApproxVtt({ text: narrationText });
    const captionsUrl = await uploadBufferToMinio({
      buffer: Buffer.from(vtt, "utf8"),
      key: `creator-videos/${created.id}.vtt`,
      contentType: "text/vtt; charset=utf-8",
    }).catch(() => null);

    const ready = await prisma.simpleCreatorVideo.update({
      where: { id: created.id },
      data: {
        audioUrl: generatedAudio.audio_url,
        videoUrl: generatedVideo.video_url,
        captionsUrl: captionsUrl || null,
        status: "READY",
        videoPromptId: generatedVideo.prompt_id,
        completedAt: now(),
        errorMessage: null,
        updatedAt: now(),
      },
    });

    return NextResponse.json({ ok: true, item: ready });
  } catch (error: any) {
    if (createdId) {
      await prisma.simpleCreatorVideo.update({
        where: { id: createdId },
        data: {
          status: "FAILED",
          errorMessage: error?.message || "Falha ao criar",
          updatedAt: now(),
        },
      }).catch(() => null);
    }
    console.error("[api/texto-para-video POST]", error);
    return NextResponse.json({ error: error?.message || "Falha ao criar" }, { status: 500 });
  }
}
