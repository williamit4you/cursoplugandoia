import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateModalVideo } from "@/lib/shopee-pipeline/modalClient";
import { generateApproxVtt } from "@/lib/captions/vtt";
import { uploadBufferToMinio } from "@/lib/shopee-pipeline/minioUpload";
import { resolveCreatorVideoDefaults } from "@/lib/creator-video/defaults";
import { defaultCreatorVideoRenderSettings } from "@/lib/creator-video/manualConfig";

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
  if (!item.audioUrl) return NextResponse.json({ error: "Gere o audio primeiro" }, { status: 400 });

  const defaults = await resolveCreatorVideoDefaults(item.creatorImageUrl);
  const renderDefaults = defaultCreatorVideoRenderSettings();
  const imageUrl = String(item.creatorImageUrl || defaults.creatorImageUrl || "").trim();
  if (!imageUrl) {
    return NextResponse.json(
      { error: "Configure uma imagem padrao em userBaseImageUrl ou adicione uma imagem ativa em creator-assets." },
      { status: 400 }
    );
  }

  try {
    await prisma.simpleCreatorVideo.update({
      where: { id },
      data: { status: "GENERATING_VIDEO", errorMessage: null, creatorImageUrl: imageUrl, videoStartedAt: now(), updatedAt: now() },
    });

    const seed = Math.floor(Math.random() * 1_000_000_000);
    const generated = await generateModalVideo({
      imageUrl,
      audioUrl: item.audioUrl,
      seed,
      width: item.videoWidth || renderDefaults.width,
      height: item.videoHeight || renderDefaults.height,
      fps: item.videoFps || renderDefaults.fps,
      steps: renderDefaults.steps,
      cfg: renderDefaults.cfg,
      shift: renderDefaults.shift,
      crf: renderDefaults.crf,
    });

    const vtt = generateApproxVtt({ text: item.narrationText });
    const keyBase = `creator-videos/${id}`;
    const captionsUrl = await uploadBufferToMinio({
      buffer: Buffer.from(vtt, "utf8"),
      key: `${keyBase}.vtt`,
      contentType: "text/vtt; charset=utf-8",
    }).catch(() => null);

    await prisma.simpleCreatorVideo.update({
      where: { id },
      data: {
        videoUrl: generated.video_url,
        videoPromptId: generated.prompt_id,
        captionsUrl: captionsUrl || null,
        status: "READY",
        completedAt: now(),
        errorMessage: null,
        updatedAt: now(),
      },
    });

    return NextResponse.json({ ok: true, videoUrl: generated.video_url, captionsUrl: captionsUrl || null });
  } catch (error: any) {
    const message = error?.message || "Falha ao gerar video";
    await prisma.simpleCreatorVideo.update({
      where: { id },
      data: { status: "FAILED", errorMessage: message, updatedAt: now() },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
