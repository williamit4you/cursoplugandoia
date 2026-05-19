import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateModalVideo } from "@/lib/shopee-pipeline/modalClient";
import { generateApproxVtt } from "@/lib/captions/vtt";
import { uploadBufferToMinio } from "@/lib/shopee-pipeline/minioUpload";

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
  if (!item.audioUrl) return NextResponse.json({ error: "Gere o áudio primeiro" }, { status: 400 });

  try {
    await prisma.simpleCreatorVideo.update({
      where: { id },
      data: { status: "GENERATING_VIDEO", errorMessage: null, updatedAt: now() },
    });

    const seed = Math.floor(Math.random() * 1_000_000_000);
    const generated = await generateModalVideo({
      imageUrl: item.creatorImageUrl,
      audioUrl: item.audioUrl,
      seed,
    });

    // Captions (VTT) — approximated for MVP.
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
        captionsUrl: captionsUrl || null,
        status: "READY",
        errorMessage: null,
        updatedAt: now(),
      },
    });

    return NextResponse.json({ ok: true, videoUrl: generated.video_url, captionsUrl: captionsUrl || null });
  } catch (error: any) {
    const message = error?.message || "Falha ao gerar vídeo";
    await prisma.simpleCreatorVideo.update({
      where: { id },
      data: { status: "FAILED", errorMessage: message, updatedAt: now() },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

