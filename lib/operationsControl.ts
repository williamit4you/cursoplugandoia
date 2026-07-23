import "server-only";

import { prisma } from "@/lib/prisma";

function safeJson(value: unknown) {
  try { return value == null ? null : JSON.stringify(value); } catch { return null; }
}

export async function auditManualAction(input: { action: string; entityType: string; entityId?: string | null; summary: string; actor?: string | null; metadata?: unknown }) {
  return prisma.manualActionAudit.create({
    data: { action: input.action, entityType: input.entityType, entityId: input.entityId || null, actor: input.actor || null, summary: input.summary, metadataJson: safeJson(input.metadata) },
  });
}

export async function upsertOperationAlert(input: { fingerprint: string; operationKey?: string; severity?: "INFO" | "WARNING" | "CRITICAL"; title: string; message: string; actionUrl?: string; metadata?: unknown }) {
  return prisma.operationAlert.upsert({
    where: { fingerprint: input.fingerprint },
    update: { operationKey: input.operationKey, severity: input.severity || "WARNING", status: "OPEN", title: input.title, message: input.message, actionUrl: input.actionUrl, metadataJson: safeJson(input.metadata), lastSeenAt: new Date(), resolvedAt: null },
    create: { fingerprint: input.fingerprint, operationKey: input.operationKey, severity: input.severity || "WARNING", title: input.title, message: input.message, actionUrl: input.actionUrl, metadataJson: safeJson(input.metadata) },
  });
}

export async function resolveOperationAlert(fingerprint: string) {
  return prisma.operationAlert.updateMany({ where: { fingerprint, status: { not: "RESOLVED" } }, data: { status: "RESOLVED", resolvedAt: new Date() } });
}

export async function recordContentMetric(input: { eventType: string; postId?: string | null; socialPostId?: string | null; productId?: string | null; sessionId?: string | null; source?: string | null; medium?: string | null; campaign?: string | null; referrer?: string | null; metadata?: unknown }) {
  return prisma.contentMetricEvent.create({
    data: { ...input, postId: input.postId || null, socialPostId: input.socialPostId || null, productId: input.productId || null, sessionId: input.sessionId || null, source: input.source || null, medium: input.medium || null, campaign: input.campaign || null, referrer: input.referrer || null, metadataJson: safeJson(input.metadata) },
  });
}

export async function recordCost(input: { operationKey?: string | null; provider: string; assetType: string; assetId?: string | null; quantity?: number; unit?: string; costUsd?: number; metadata?: unknown }) {
  return prisma.costLedger.create({
    data: { operationKey: input.operationKey || null, provider: input.provider, assetType: input.assetType, assetId: input.assetId || null, quantity: input.quantity ?? 1, unit: input.unit || "unit", costUsd: input.costUsd ?? 0, metadataJson: safeJson(input.metadata) },
  });
}

export async function canCallProvider(provider: string) {
  const breaker = await prisma.providerCircuitBreaker.findUnique({ where: { provider } });
  return !breaker || breaker.state !== "OPEN" || !breaker.retryAfter || breaker.retryAfter <= new Date();
}

export async function recordProviderFailure(provider: string, error: string, threshold = 3, coolDownMinutes = 15) {
  const current = await prisma.providerCircuitBreaker.upsert({ where: { provider }, update: { failureCount: { increment: 1 }, lastError: error }, create: { provider, failureCount: 1, lastError: error } });
  if (current.failureCount >= threshold) {
    const retryAfter = new Date(Date.now() + coolDownMinutes * 60_000);
    await prisma.providerCircuitBreaker.update({ where: { provider }, data: { state: "OPEN", openedAt: new Date(), retryAfter } });
    await upsertOperationAlert({ fingerprint: `provider:${provider}`, severity: "CRITICAL", title: `${provider} pausado temporariamente`, message: `Falhas consecutivas detectadas. Nova tentativa após ${retryAfter.toLocaleTimeString("pt-BR")}.`, actionUrl: "/admin/dashboard" });
  }
}

export async function recordProviderSuccess(provider: string) {
  await prisma.providerCircuitBreaker.upsert({ where: { provider }, update: { state: "CLOSED", failureCount: 0, openedAt: null, retryAfter: null, lastError: null }, create: { provider } });
  await resolveOperationAlert(`provider:${provider}`);
}
