import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveCreatorVideoDefaults } from "@/lib/creator-video/defaults";
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

export async function GET() {
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
    const autoGenerate = body?.autoGenerate === false ? false : true;
    if (!narrationText) return NextResponse.json({ error: "narrationText is required" }, { status: 400 });

    if (narrationText.length > 5000) {
      return NextResponse.json({ error: "Texto muito longo (máx 5000 caracteres no MVP)." }, { status: 400 });
    }

    const defaults = await resolveCreatorVideoDefaults(requestedImageUrl || null);
    if (!defaults.creatorImageUrl) {
      return NextResponse.json(
        { error: "Configure uma imagem padrão em userBaseImageUrl ou adicione uma imagem ativa em creator-assets." },
        { status: 400 }
      );
    }
    if (autoGenerate && !defaults.voiceRefUrl) {
      return NextResponse.json({ error: "Config faltando: userVoiceRefUrl" }, { status: 400 });
    }
    const creatorImageUrl = String(defaults.creatorImageUrl || "");
    const voiceRefUrl = String(defaults.voiceRefUrl || "");

    const created = await prisma.simpleCreatorVideo.create({
      data: {
        narrationText,
        creatorImageUrl,
        status: "DRAFT",
      },
    });
    createdId = created.id;

    if (!autoGenerate) {
      return NextResponse.json({ ok: true, item: created });
    }

    await prisma.simpleCreatorVideo.update({
      where: { id: created.id },
      data: { status: "GENERATING_AUDIO", errorMessage: null, updatedAt: now() },
    });

    const audioSeed = Math.floor(Math.random() * 1_000_000_000);
    const generatedAudio = await generateModalAudio({
      voiceRefUrl,
      targetText: narrationText,
      seed: audioSeed,
    });

    await prisma.simpleCreatorVideo.update({
      where: { id: created.id },
      data: {
        audioUrl: generatedAudio.audio_url,
        status: "GENERATING_VIDEO",
        errorMessage: null,
        updatedAt: now(),
      },
    });

    const videoSeed = Math.floor(Math.random() * 1_000_000_000);
    const generatedVideo = await generateModalVideo({
      imageUrl: creatorImageUrl,
      audioUrl: generatedAudio.audio_url,
      seed: videoSeed,
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
