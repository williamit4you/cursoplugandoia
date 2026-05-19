import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateModalAudio } from "@/lib/shopee-pipeline/modalClient";
import { resolveCreatorVideoDefaults } from "@/lib/creator-video/defaults";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 900;

function now() {
  return new Date();
}

function normalize(value: unknown) {
  return String(value || "").trim();
}

export async function POST(_: Request, ctx: { params: { id: string } }) {
  const id = normalize(ctx?.params?.id);
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const item = await prisma.engagementIdea.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });

  const defaults = await resolveCreatorVideoDefaults(item.creatorImageUrl);
  const voiceRefUrl = String(defaults.voiceRefUrl || "").trim();
  if (!voiceRefUrl) return NextResponse.json({ error: "Config faltando: userVoiceRefUrl" }, { status: 400 });

  const targetText = String(item.script || "").trim();
  if (!targetText) return NextResponse.json({ error: "script vazio" }, { status: 400 });

  try {
    await prisma.engagementIdea.update({
      where: { id },
      data: { status: "GENERATING_AUDIO", errorMessage: null, updatedAt: now() },
    });

    const seed = Math.floor(Math.random() * 1_000_000_000);
    const generated = await generateModalAudio({ voiceRefUrl, targetText, seed });

    await prisma.engagementIdea.update({
      where: { id },
      data: { audioUrl: generated.audio_url, status: "AUDIO_READY", errorMessage: null, updatedAt: now() },
    });

    return NextResponse.json({ ok: true, audioUrl: generated.audio_url });
  } catch (error: any) {
    const message = error?.message || "Falha ao gerar áudio";
    await prisma.engagementIdea.update({ where: { id }, data: { status: "FAILED", errorMessage: message, updatedAt: now() } });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
