import "server-only";

import { prisma } from "@/lib/prisma";

export type PipelineLogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

function safeJson(value: unknown) {
  if (value === undefined) return null;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return { _unserializable: true };
  }
}

export async function logCodeVideoPipelineEvent(params: {
  projectId: string;
  level?: PipelineLogLevel;
  stepName?: string | null;
  message: string;
  metadata?: unknown;
}) {
  const { projectId, level, stepName, message, metadata } = params;
  await prisma.codeVideoPipelineEvent.create({
    data: {
      projectId,
      level: level || "INFO",
      stepName: stepName || null,
      message,
      metadata: safeJson(metadata),
    },
  });
}

export async function upsertCodeVideoPipelineStep(params: {
  projectId: string;
  stepName: string;
  status: "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" | "RETRY_SCHEDULED" | "SKIPPED";
  attempt: number;
  startedAt?: Date | null;
  finishedAt?: Date | null;
  durationMs?: number | null;
  nextRetryAt?: Date | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  requestPayload?: unknown;
  responsePayload?: unknown;
}) {
  const {
    projectId,
    stepName,
    status,
    attempt,
    startedAt,
    finishedAt,
    durationMs,
    nextRetryAt,
    errorCode,
    errorMessage,
    requestPayload,
    responsePayload,
  } = params;

  const existing = await prisma.codeVideoPipelineStep.findFirst({
    where: { projectId, stepName },
    orderBy: { updatedAt: "desc" },
  });

  const data = {
    projectId,
    stepName,
    status: status as any,
    attempt,
    startedAt: startedAt ?? undefined,
    finishedAt: finishedAt ?? undefined,
    durationMs: durationMs ?? undefined,
    nextRetryAt: nextRetryAt ?? undefined,
    errorCode: errorCode ?? undefined,
    errorMessage: errorMessage ?? undefined,
    requestPayload: safeJson(requestPayload),
    responsePayload: safeJson(responsePayload),
  };

  const sameAttempt = await prisma.codeVideoPipelineStep.findFirst({
    where: { projectId, stepName, attempt },
    orderBy: { updatedAt: "desc" },
  });

  if (sameAttempt) {
    return prisma.codeVideoPipelineStep.update({
      where: { id: sameAttempt.id },
      data,
    });
  }

  if (!existing) return prisma.codeVideoPipelineStep.create({ data });
  return prisma.codeVideoPipelineStep.create({ data });
}
