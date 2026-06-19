import { prisma } from "@/lib/prisma";

export async function logComparisonEvent(input: {
  comparisonId: string;
  itemId?: string | null;
  stepName?: string | null;
  level?: string;
  message: string;
  metadata?: any;
}) {
  return prisma.affiliateComparisonEvent.create({
    data: {
      comparisonId: input.comparisonId,
      itemId: input.itemId || null,
      stepName: input.stepName || null,
      level: input.level || "INFO",
      message: input.message,
      metadata: input.metadata ?? undefined,
    },
  });
}

export async function upsertComparisonStep(input: {
  comparisonId: string;
  stepName: string;
  status: "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" | "RETRY_SCHEDULED" | "SKIPPED";
  attempt?: number;
  startedAt?: Date | null;
  finishedAt?: Date | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  requestPayload?: any;
  responsePayload?: any;
}) {
  const existing = await prisma.affiliateComparisonStep.findFirst({
    where: { comparisonId: input.comparisonId, stepName: input.stepName },
    orderBy: { createdAt: "desc" },
  });

  const durationMs =
    input.startedAt && input.finishedAt ? Math.max(0, input.finishedAt.getTime() - input.startedAt.getTime()) : undefined;

  if (existing) {
    return prisma.affiliateComparisonStep.update({
      where: { id: existing.id },
      data: {
        status: input.status,
        attempt: input.attempt ?? existing.attempt,
        startedAt: input.startedAt ?? existing.startedAt,
        finishedAt: input.finishedAt ?? existing.finishedAt,
        durationMs: durationMs ?? existing.durationMs,
        errorCode: input.errorCode ?? null,
        errorMessage: input.errorMessage ?? null,
        requestPayload: input.requestPayload ?? undefined,
        responsePayload: input.responsePayload ?? undefined,
      },
    });
  }

  return prisma.affiliateComparisonStep.create({
    data: {
      comparisonId: input.comparisonId,
      stepName: input.stepName,
      status: input.status,
      attempt: input.attempt ?? 1,
      startedAt: input.startedAt ?? null,
      finishedAt: input.finishedAt ?? null,
      durationMs,
      errorCode: input.errorCode ?? null,
      errorMessage: input.errorMessage ?? null,
      requestPayload: input.requestPayload ?? undefined,
      responsePayload: input.responsePayload ?? undefined,
    },
  });
}
