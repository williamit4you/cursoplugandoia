import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateModalAudio } from "@/lib/shopee-pipeline/modalClient";
import { resolveCreatorVideoDefaults } from "@/lib/creator-video/defaults";
import { defaultCreatorVideoAudioSettings } from "@/lib/creator-video/manualConfig";

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

  const defaults = await resolveCreatorVideoDefaults(item.creatorImageUrl);
  const audioDefaults = defaultCreatorVideoAudioSettings();
  const voiceRefUrl = String(item.voiceRefUrl || defaults.voiceRefUrl || "").trim();
  if (!voiceRefUrl) return NextResponse.json({ error: "Config faltando: userVoiceRefUrl" }, { status: 400 });

  try {
    await prisma.simpleCreatorVideo.update({
      where: { id },
      data: { status: "GENERATING_AUDIO", errorMessage: null, voiceRefUrl, audioStartedAt: now(), updatedAt: now() },
    });

    const seed = Math.floor(Math.random() * 1_000_000_000);
    const generated = await generateModalAudio({
      voiceRefUrl,
      targetText: item.narrationText,
      seed,
      language: item.audioLanguage || audioDefaults.language,
      speechRate: item.speechRate ?? audioDefaults.speechRate,
      maxNewTokens: audioDefaults.maxNewTokens,
      topP: audioDefaults.topP,
      topK: audioDefaults.topK,
      temperature: audioDefaults.temperature,
      repetitionPenalty: audioDefaults.repetitionPenalty,
      quality: audioDefaults.quality,
    });

    await prisma.simpleCreatorVideo.update({
      where: { id },
      data: {
        audioUrl: generated.audio_url,
        audioPromptId: generated.prompt_id,
        status: "AUDIO_READY",
        audioCompletedAt: now(),
        errorMessage: null,
        updatedAt: now(),
      },
    });

    return NextResponse.json({ ok: true, audioUrl: generated.audio_url });
  } catch (error: any) {
    const message = error?.message || "Falha ao gerar audio";
    await prisma.simpleCreatorVideo.update({
      where: { id },
      data: { status: "FAILED", errorMessage: message, updatedAt: now() },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
