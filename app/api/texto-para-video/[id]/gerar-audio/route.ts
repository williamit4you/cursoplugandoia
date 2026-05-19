import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateModalAudio } from "@/lib/shopee-pipeline/modalClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 900;

function now() {
  return new Date();
}

export async function POST(_: Request, ctx: { params: { id: string } }) {
  const id = String(ctx?.params?.id || "").trim();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const item = await prisma.simpleCreatorVideo.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });

  const config = await prisma.shopeePipelineConfig.findFirst({ orderBy: { createdAt: "desc" } });
  const voiceRefUrl = String(config?.userVoiceRefUrl || "").trim();
  if (!voiceRefUrl) return NextResponse.json({ error: "Config faltando: userVoiceRefUrl" }, { status: 400 });

  try {
    await prisma.simpleCreatorVideo.update({
      where: { id },
      data: { status: "GENERATING_AUDIO", errorMessage: null, updatedAt: now() },
    });

    const seed = Math.floor(Math.random() * 1_000_000_000);
    const generated = await generateModalAudio({
      voiceRefUrl,
      targetText: item.narrationText,
      seed,
    });

    await prisma.simpleCreatorVideo.update({
      where: { id },
      data: {
        audioUrl: generated.audio_url,
        status: "AUDIO_READY",
        errorMessage: null,
        updatedAt: now(),
      },
    });

    return NextResponse.json({ ok: true, audioUrl: generated.audio_url });
  } catch (error: any) {
    const message = error?.message || "Falha ao gerar áudio";
    await prisma.simpleCreatorVideo.update({
      where: { id },
      data: { status: "FAILED", errorMessage: message, updatedAt: now() },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

