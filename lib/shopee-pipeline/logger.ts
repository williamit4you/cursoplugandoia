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

export async function logPipelineEvent(params: {
  coletaId: string;
  level?: PipelineLogLevel;
  stepName?: string | null;
  message: string;
  metadata?: unknown;
}) {
  const { coletaId, level, stepName, message, metadata } = params;
  await prisma.shopeePipelineEvent.create({
    data: {
      coletaId,
      level: level || "INFO",
      stepName: stepName || null,
      message,
      metadata: safeJson(metadata),
    },
  });
}

export async function upsertPipelineStep(params: {
  coletaId: string;
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
    coletaId,
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

  const existing = await prisma.shopeePipelineStep.findFirst({
    where: { coletaId, stepName },
    orderBy: { updatedAt: "desc" },
  });

  const data = {
    coletaId,
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

  if (!existing) {
    return prisma.shopeePipelineStep.create({ data });
  }

  return prisma.shopeePipelineStep.create({ data });
}

