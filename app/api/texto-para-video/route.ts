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
import { searchPexelsMedia } from "@/lib/pexels";

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

function normalizeMixedAssetKind(value: unknown, url: string) {
  const raw = normalize(value).toUpperCase();
  if (raw === "VIDEO" || /\.(mp4|webm|mov)(\?|$)/i.test(url)) return "VIDEO";
  return "IMAGE";
}

function buildPexelsSearchQuery(narrationText: string) {
  const firstSentence = narrationText.split(/[.!?\n]/).map((item) => item.trim()).find(Boolean) || narrationText;
  return firstSentence.slice(0, 120).trim();
}

export async function GET(req: NextRequest) {
  const view = String(req.nextUrl.searchParams.get("view") || "").trim().toLowerCase();
  const mode = String(req.nextUrl.searchParams.get("mode") || "simple").trim().toLowerCase();

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

  if (mode === "mixed") {
    const items = await prisma.mixedCreatorVideo.findMany({
      include: { assets: { orderBy: { sortOrder: "asc" } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    return NextResponse.json({ items });
  }

  const items = await prisma.simpleCreatorVideo.findMany({
    orderBy: { createdAt: "desc" },
    take: 40,
  });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const mode = String(body?.mode || "simple").trim().toLowerCase();

  if (mode === "mixed") {
    const narrationText = normalize(body?.narrationText);
    const requestedVoiceRefUrl = normalize(body?.voiceRefUrl);
    const assets = Array.isArray(body?.assets) ? body.assets : [];
    const useExternalMedia = body?.useExternalMedia === false ? false : true;
    const aspectRatio = normalize(body?.aspectRatio || "PORTRAIT_9_16") === "LANDSCAPE_16_9" ? "LANDSCAPE_16_9" : "PORTRAIT_9_16";
    const audioLanguage = normalizeLanguage(body?.audioLanguage);
    const speechRate = Math.min(2, Math.max(0.5, toFloat(body?.speechRate, 1)));

    if (!narrationText) return NextResponse.json({ error: "narrationText is required" }, { status: 400 });

    const defaults = await resolveCreatorVideoDefaults();
    const voiceRefUrl = requestedVoiceRefUrl || String(defaults.voiceRefUrl || "");
    if (!voiceRefUrl) {
      return NextResponse.json({ error: "Config faltando: userVoiceRefUrl" }, { status: 400 });
    }

    let normalizedAssets = assets
      .map((asset: any, index: number) => {
        const url = normalize(asset?.url);
        if (!url) return null;
        return {
          url,
          kind: normalizeMixedAssetKind(asset?.kind, url),
          source: "UPLOAD" as const,
          originalName: normalize(asset?.originalName) || null,
          userLabel: normalize(asset?.userLabel) || null,
          sortOrder: index,
        };
      })
      .filter(Boolean) as Array<{
        url: string;
        kind: "IMAGE" | "VIDEO";
        source: "UPLOAD" | "PEXELS";
        originalName: string | null;
        userLabel: string | null;
        sortOrder: number;
      }>;

    if (normalizedAssets.length === 0 && useExternalMedia) {
      const query = buildPexelsSearchQuery(narrationText);
      const pexelsAssets = await searchPexelsMedia(
        query || "business marketing",
        6,
        aspectRatio === "LANDSCAPE_16_9" ? "landscape" : "portrait"
      );

      normalizedAssets = pexelsAssets.flatMap((asset, index) => {
        const items: Array<{
          url: string;
          kind: "IMAGE" | "VIDEO";
          source: "UPLOAD" | "PEXELS";
          originalName: string | null;
          userLabel: string | null;
          sortOrder: number;
        }> = [];

        if (asset.url) {
          items.push({
            url: asset.url,
            kind: "VIDEO",
            source: "PEXELS",
            originalName: `pexels-video-${asset.id}.mp4`,
            userLabel: `Video automatico ${index + 1}`,
            sortOrder: index * 2,
          });
        }

        if (asset.thumbnail) {
          items.push({
            url: asset.thumbnail,
            kind: "IMAGE",
            source: "PEXELS",
            originalName: `pexels-thumb-${asset.id}.jpg`,
            userLabel: `Imagem automatica ${index + 1}`,
            sortOrder: index * 2 + 1,
          });
        }

        return items;
      });
    }

    if (normalizedAssets.length === 0) {
      return NextResponse.json(
        { error: useExternalMedia ? "Nenhum upload enviado e nao foi possivel buscar midias gratuitas no momento." : "Envie ao menos uma imagem ou video de apoio." },
        { status: 400 }
      );
    }

    const created = await prisma.mixedCreatorVideo.create({
      data: {
        narrationText,
        creatorImageUrl: "",
        voiceRefUrl,
        aspectRatio,
        audioLanguage,
        speechRate,
        status: "DRAFT",
        startedAt: now(),
        assets: {
          create: normalizedAssets.map((asset) => {
            return {
              url: asset.url,
              kind: asset.kind,
              source: asset.source,
              originalName: asset.originalName,
              userLabel: asset.userLabel,
              sortOrder: asset.sortOrder,
            };
          }),
        },
      },
      include: { assets: { orderBy: { sortOrder: "asc" } } },
    });

    return NextResponse.json({ ok: true, item: created });
  }

  let createdId = "";
  try {
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
