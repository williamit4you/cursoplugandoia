import { prisma } from "@/lib/prisma";
import { uploadLimpezaVideoBuffer } from "@/lib/limpezavideo/storage";
import { estimateSecondsLeft } from "@/lib/limpezavideo/utils";
import { postMultipartWithoutUndici, resolveWorkerBaseUrl } from "@/lib/limpezavideo/workerClient";
import { LIMPEZA_VIDEO_STEP_PROGRESS } from "@/lib/limpezavideo/constants";

function now() {
  return new Date();
}

async function logEvent(jobId: string, level: string, message: string, stepName?: string, metadata?: any) {
  await prisma.videoCleanupEvent.create({
    data: { jobId, level, message, stepName: stepName || null, metadata: metadata || undefined },
  });
}

async function upsertStep(jobId: string, stepName: string, data: Record<string, any>) {
  const existing = await prisma.videoCleanupStep.findFirst({ where: { jobId, stepName } });
  if (existing) {
    return prisma.videoCleanupStep.update({
      where: { id: existing.id },
      data,
    });
  }
  return prisma.videoCleanupStep.create({
    data: {
      jobId,
      stepName,
      ...data,
    },
  });
}

async function setStepRunning(jobId: string, stepName: string, progressPercent: number) {
  await upsertStep(jobId, stepName, { status: "RUNNING", startedAt: now(), errorMessage: null });
  await prisma.videoCleanupJob.update({
    where: { id: jobId },
    data: {
      status: "PROCESSING",
      currentStep: stepName,
      progressPercent,
      estimatedSecondsLeft: estimateSecondsLeft({ progressPercent }),
      processingStartedAt: now(),
      errorMessage: null,
    },
  });
}

async function setStepSuccess(jobId: string, stepName: string, progressPercent: number, responsePayload?: any) {
  const step = await prisma.videoCleanupStep.findFirst({ where: { jobId, stepName } });
  const startedAt = step?.startedAt ? step.startedAt.getTime() : Date.now();
  await upsertStep(jobId, stepName, {
    status: "SUCCESS",
    finishedAt: now(),
    durationMs: Math.max(Date.now() - startedAt, 0),
    responsePayload: responsePayload || undefined,
  });
  await prisma.videoCleanupJob.update({
    where: { id: jobId },
    data: {
      currentStep: stepName,
      progressPercent,
      estimatedSecondsLeft: estimateSecondsLeft({ progressPercent }),
    },
  });
}

async function setJobFailed(jobId: string, stepName: string, error: any) {
  const message = error?.message || "Falha ao processar vídeo";
  const step = await prisma.videoCleanupStep.findFirst({ where: { jobId, stepName } });
  const startedAt = step?.startedAt ? step.startedAt.getTime() : Date.now();
  await upsertStep(jobId, stepName, {
    status: "FAILED",
    finishedAt: now(),
    durationMs: Math.max(Date.now() - startedAt, 0),
    errorMessage: message,
  });
  await prisma.videoCleanupJob.update({
    where: { id: jobId },
    data: {
      status: "FAILED",
      currentStep: stepName,
      errorMessage: message,
      processingFinishedAt: now(),
    },
  });
  await logEvent(jobId, "ERROR", message, stepName);
}

export async function enqueueVideoCleanupProcessing(jobId: string) {
  void processVideoCleanupJob(jobId).catch(async (error) => {
    await setJobFailed(jobId, "PROCESS_VIDEO", error);
  });
}

export async function processVideoCleanupJob(jobId: string) {
  const job = await prisma.videoCleanupJob.findUnique({ where: { id: jobId } });
  if (!job) throw new Error("Job não encontrado.");
  if (!job.inputUrl) throw new Error("Job sem inputUrl.");
  if (job.status === "PROCESSING") return;

  await setStepRunning(jobId, "PROBE_INPUT", LIMPEZA_VIDEO_STEP_PROGRESS.PROBE_INPUT);
  await logEvent(jobId, "INFO", "Leitura técnica iniciada.", "PROBE_INPUT");

  const probeMeta = {
    width: job.width,
    height: job.height,
    fps: job.fps,
    durationSec: job.durationSec,
  };

  await setStepSuccess(jobId, "PROBE_INPUT", LIMPEZA_VIDEO_STEP_PROGRESS.PROBE_INPUT, probeMeta);

  await setStepRunning(jobId, "PROCESS_VIDEO", LIMPEZA_VIDEO_STEP_PROGRESS.PROCESS_VIDEO);
  await logEvent(jobId, "INFO", "Enviando vídeo para o worker de limpeza.", "PROCESS_VIDEO");

  const workerForm = new FormData();
  workerForm.append("job_id", job.id);
  workerForm.append("input_url", job.inputUrl);
  if (job.logoUrl) workerForm.append("logo_url", job.logoUrl);
  workerForm.append("instagram_handle", String(job.instagramHandle || "@compraesperta.promocoes"));
  workerForm.append("audio_mode", String(job.audioMode || "PRESERVE"));
  workerForm.append("audio_volume_percent", String(job.audioVolumePercent || 100));
  workerForm.append("endcard_duration_sec", String(job.endCardDurationSec || 2));
  workerForm.append("upload_mode", "external");

  const targetUrl = `${resolveWorkerBaseUrl()}/limpeza-video-process`;
  const workerRes = await postMultipartWithoutUndici(targetUrl, workerForm);
  if (!workerRes.ok) {
    throw new Error(`Worker retornou ${workerRes.status}: ${workerRes.body.toString("utf8")}`);
  }

  const responseContentType = String(workerRes.headers["content-type"] || "");
  let outputUrl = "";
  let outputKey = "";

  if (/video\/mp4/i.test(responseContentType)) {
    outputKey = `limpezavideo/output/${job.id}/final.mp4`;
    outputUrl = await uploadLimpezaVideoBuffer({
      buffer: workerRes.body,
      key: outputKey,
      contentType: "video/mp4",
    });
  } else {
    const parsed = JSON.parse(workerRes.body.toString("utf8") || "{}");
    outputUrl = String(parsed.videoUrl || "").trim();
    outputKey = String(parsed.outputKey || "").trim();
  }

  await setStepSuccess(jobId, "PROCESS_VIDEO", LIMPEZA_VIDEO_STEP_PROGRESS.PROCESS_VIDEO, { outputUrl, outputKey });
  await setStepRunning(jobId, "UPLOAD_OUTPUT", LIMPEZA_VIDEO_STEP_PROGRESS.UPLOAD_OUTPUT);
  await logEvent(jobId, "INFO", "Subindo arquivo final e concluindo job.", "UPLOAD_OUTPUT", { outputUrl });
  await setStepSuccess(jobId, "UPLOAD_OUTPUT", LIMPEZA_VIDEO_STEP_PROGRESS.UPLOAD_OUTPUT, { outputUrl, outputKey });

  await prisma.videoCleanupJob.update({
    where: { id: jobId },
    data: {
      status: "READY",
      currentStep: "COMPLETE",
      progressPercent: LIMPEZA_VIDEO_STEP_PROGRESS.COMPLETE,
      estimatedSecondsLeft: 0,
      outputUrl,
      outputBucketKey: outputKey || null,
      processingFinishedAt: now(),
      errorMessage: null,
    },
  });
  await logEvent(jobId, "INFO", "Vídeo final pronto.", "COMPLETE", { outputUrl });
}
