import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireLimpezaVideoSession } from "@/lib/limpezavideo/auth";
import { enqueueVideoCleanupProcessing } from "@/lib/limpezavideo/orchestrator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 900;

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireLimpezaVideoSession();
  if (!auth.ok) return auth.response;

  const job = await prisma.videoCleanupJob.findFirst({
    where: { id: params.id, ownerUserId: auth.userId },
  });
  if (!job) {
    return NextResponse.json({ error: "Job não encontrado." }, { status: 404 });
  }

  await prisma.videoCleanupJob.update({
    where: { id: job.id },
    data: {
      status: "QUEUED",
      progressPercent: 10,
      currentStep: "UPLOAD_ORIGINAL",
      processingStartedAt: null,
      processingFinishedAt: null,
      errorMessage: null,
      estimatedSecondsLeft: null,
      outputUrl: null,
      outputBucketKey: null,
    },
  });

  await enqueueVideoCleanupProcessing(job.id);
  return NextResponse.json({ ok: true, queued: true }, { status: 202 });
}
