import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireLimpezaVideoSession } from "@/lib/limpezavideo/auth";
import { clampNumber, estimateSecondsLeft } from "@/lib/limpezavideo/utils";
import { uploadLimpezaVideoBuffer } from "@/lib/limpezavideo/storage";
import { toPlainJson } from "@/lib/limpezavideo/serialize";
import {
  LIMPEZA_VIDEO_ALLOWED_AUDIO_MODES,
  LIMPEZA_VIDEO_DEFAULT_ENDCARD_SEC,
  LIMPEZA_VIDEO_DEFAULT_INSTAGRAM,
} from "@/lib/limpezavideo/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 900;

function normalize(input: FormDataEntryValue | null) {
  return String(input || "").trim();
}

export async function GET(req: NextRequest) {
  const auth = await requireLimpezaVideoSession();
  if (!auth.ok) return auth.response;

  const status = String(req.nextUrl.searchParams.get("status") || "").trim();
  const jobs = await prisma.videoCleanupJob.findMany({
    where: {
      ownerUserId: auth.userId,
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      steps: {
        orderBy: { createdAt: "asc" },
      },
      events: {
        orderBy: { createdAt: "desc" },
        take: 8,
      },
    },
  });

  return NextResponse.json({ items: toPlainJson(jobs) });
}

export async function POST(req: NextRequest) {
  const auth = await requireLimpezaVideoSession();
  if (!auth.ok) return auth.response;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const logo = formData.get("logo") as File | null;
  const instagramHandle = normalize(formData.get("instagramHandle")) || LIMPEZA_VIDEO_DEFAULT_INSTAGRAM;
  const audioMode = normalize(formData.get("audioMode")).toUpperCase() || "PRESERVE";
  const requestedVolume = Number(normalize(formData.get("audioVolumePercent")) || "100");
  const endCardDurationSec = Number(normalize(formData.get("endCardDurationSec")) || String(LIMPEZA_VIDEO_DEFAULT_ENDCARD_SEC));

  if (!file) {
    return NextResponse.json({ error: "Arquivo de vídeo é obrigatório." }, { status: 400 });
  }

  if (!LIMPEZA_VIDEO_ALLOWED_AUDIO_MODES.includes(audioMode as any)) {
    return NextResponse.json({ error: "audioMode inválido." }, { status: 400 });
  }

  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const createdAt = Date.now();
  const extension = (file.name.split(".").pop() || "mp4").toLowerCase();
  const tempJob = await prisma.videoCleanupJob.create({
    data: {
      ownerUserId: auth.userId,
      status: "UPLOADING",
      sourceType: "UPLOAD",
      originalFilename: file.name,
      mimeType: file.type || "video/mp4",
      fileSizeBytes: BigInt(file.size || fileBuffer.length),
      instagramHandle,
      audioMode,
      audioVolumePercent: clampNumber(Number.isFinite(requestedVolume) ? requestedVolume : 100, 0, 100),
      endCardDurationSec: clampNumber(Number.isFinite(endCardDurationSec) ? endCardDurationSec : LIMPEZA_VIDEO_DEFAULT_ENDCARD_SEC, 1, 5),
    },
  });

  const inputKey = `limpezavideo/input/${tempJob.id}/original.${extension}`;
  const inputUrl = await uploadLimpezaVideoBuffer({
    buffer: fileBuffer,
    key: inputKey,
    contentType: file.type || "video/mp4",
  });

  let logoKey: string | null = null;
  let logoUrl: string | null = null;
  if (logo && logo.size > 0) {
    const logoBuffer = Buffer.from(await logo.arrayBuffer());
    const logoExtension = (logo.name.split(".").pop() || "png").toLowerCase();
    logoKey = `limpezavideo/logo/${tempJob.id}/logo.${logoExtension}`;
    logoUrl = await uploadLimpezaVideoBuffer({
      buffer: logoBuffer,
      key: logoKey,
      contentType: logo.type || "image/png",
    });
  }

  const job = await prisma.videoCleanupJob.update({
    where: { id: tempJob.id },
    data: {
      status: "QUEUED",
      progressPercent: 10,
      currentStep: "UPLOAD_ORIGINAL",
      inputBucketKey: inputKey,
      inputUrl,
      logoBucketKey: logoKey,
      logoUrl,
      estimatedSecondsLeft: estimateSecondsLeft({ durationSec: null, progressPercent: 10 }),
      metadataJson: JSON.stringify({
        uploadedAt: new Date(createdAt).toISOString(),
      }),
    },
    include: {
      steps: true,
      events: {
        orderBy: { createdAt: "desc" },
        take: 8,
      },
    },
  });

  await prisma.videoCleanupStep.create({
    data: {
      jobId: job.id,
      stepName: "UPLOAD_ORIGINAL",
      status: "SUCCESS",
      startedAt: new Date(createdAt),
      finishedAt: new Date(),
      durationMs: 0,
      responsePayload: {
        inputUrl,
        logoUrl,
      },
    },
  });

  await prisma.videoCleanupEvent.create({
    data: {
      jobId: job.id,
      level: "INFO",
      stepName: "UPLOAD_ORIGINAL",
      message: "Upload do vídeo concluído e job criado.",
      metadata: { inputUrl, logoUrl },
    },
  });

  return NextResponse.json({ ok: true, job: toPlainJson(job) }, { status: 201 });
}
