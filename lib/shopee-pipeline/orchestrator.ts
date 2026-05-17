import "server-only";

import { prisma } from "@/lib/prisma";
import { logPipelineEvent, upsertPipelineStep } from "@/lib/shopee-pipeline/logger";
import { scrapeShopeeAndPersist } from "@/lib/shopee-pipeline/scrape";
import { generateModalAudio, generateModalVideo } from "@/lib/shopee-pipeline/modalClient";
import { uploadBufferToMinio } from "@/lib/shopee-pipeline/minioUpload";
import { mergeProductAndCopyVideos } from "@/lib/shopee-pipeline/merge";
import { generateShopeeAffiliateShortLink } from "@/lib/shopee/openApi";
import { v4 as uuidv4 } from "uuid";

const LOCK_TTL_MS = 30 * 60 * 1000;
const ASYNC_LOCK_TTL_MS = LOCK_TTL_MS;
const ASYNC_RESUMABLE_STATUSES = [] as const;
const EXCLUDED_STATUSES = ["PAUSED", "PUBLISHED"] as const;
const STICKY_EXCLUDED_STATUSES = ["PENDING", "FAILED", ...EXCLUDED_STATUSES] as const;

function now() {
  return new Date();
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function isLockExpired(lockedAt: Date | null, current: Date) {
  if (!lockedAt) return true;
  return current.getTime() - lockedAt.getTime() > LOCK_TTL_MS;
}


async function acquireNextItemLock(params: { runnerId: string; current: Date }) {
  const { runnerId, current } = params;
  const lockExpiry = new Date(current.getTime() - LOCK_TTL_MS);
  const asyncLockExpiry = new Date(current.getTime() - ASYNC_LOCK_TTL_MS);

  const candidate = await prisma.coletaDadosShoppe.findFirst({
    where: {
      active: true,
      pipelineStatus: { notIn: EXCLUDED_STATUSES as any },
      AND: [
        { OR: [{ nextRunAt: null }, { nextRunAt: { lte: current } }] },
        {
          OR: [
            { lockedAt: null },
            { lockedAt: { lt: lockExpiry } },
            { pipelineStatus: { in: ASYNC_RESUMABLE_STATUSES as any }, lockedAt: { lt: asyncLockExpiry } },
          ],
        },
      ],
    },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    select: { id: true, lockedAt: true },
  });

  if (!candidate) return null;

  const res = await prisma.coletaDadosShoppe.updateMany({
    where: {
      id: candidate.id,
      OR: [
        { lockedAt: null },
        { lockedAt: { lt: lockExpiry } },
        { pipelineStatus: { in: ASYNC_RESUMABLE_STATUSES as any }, lockedAt: { lt: asyncLockExpiry } },
      ],
    },
    data: { lockedAt: current, lockedBy: runnerId },
  });

  if (res.count === 0) return null;
  return prisma.coletaDadosShoppe.findUnique({ where: { id: candidate.id } });
}

async function acquireInProgressItemLock(params: { runnerId: string; current: Date }) {
  const { runnerId, current } = params;
  const lockExpiry = new Date(current.getTime() - LOCK_TTL_MS);
  const asyncLockExpiry = new Date(current.getTime() - ASYNC_LOCK_TTL_MS);

  const candidate = await prisma.coletaDadosShoppe.findFirst({
    where: {
      active: true,
      pipelineStatus: { notIn: STICKY_EXCLUDED_STATUSES as any },
      AND: [
        { OR: [{ nextRunAt: null }, { nextRunAt: { lte: current } }] },
        {
          OR: [
            { lockedAt: null },
            { lockedAt: { lt: lockExpiry } },
            { pipelineStatus: { in: ASYNC_RESUMABLE_STATUSES as any }, lockedAt: { lt: asyncLockExpiry } },
          ],
        },
      ],
    },
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
    select: { id: true, lockedAt: true },
  });

  if (!candidate) return null;

  const res = await prisma.coletaDadosShoppe.updateMany({
    where: {
      id: candidate.id,
      OR: [
        { lockedAt: null },
        { lockedAt: { lt: lockExpiry } },
        { pipelineStatus: { in: ASYNC_RESUMABLE_STATUSES as any }, lockedAt: { lt: asyncLockExpiry } },
      ],
    },
    data: { lockedAt: current, lockedBy: runnerId },
  });

  if (res.count === 0) return null;
  return prisma.coletaDadosShoppe.findUnique({ where: { id: candidate.id } });
}

function buildEligibilityRuleText(params: { current: Date }) {
  const { current } = params;
  return (
    "O botão “Rodar agora” executa 1 ciclo do orquestrador e escolhe 1 item elegível (por prioridade desc, depois criação asc). " +
    `Item elegível = active=true, status NÃO está em ${EXCLUDED_STATUSES.join("/")}, nextRunAt é vazio ou <= agora (${current.toISOString()}), ` +
    `e não está travado (lockedAt vazio ou mais antigo que ${Math.round(LOCK_TTL_MS / 60000)} min).`
  );
}

async function getEligibilityDiagnostics(params: { current: Date }) {
  const { current } = params;
  const lockExpiry = new Date(current.getTime() - LOCK_TTL_MS);
  const asyncLockExpiry = new Date(current.getTime() - ASYNC_LOCK_TTL_MS);

  const baseWhere = {
    active: true,
    pipelineStatus: { notIn: EXCLUDED_STATUSES as any },
  } as const;

  const [totalActive, excludedByStatus, baseCount, futureCount, lockedCount, eligibleCount, earliestFuture, lockedSample] =
    await Promise.all([
      prisma.coletaDadosShoppe.count({ where: { active: true } }),
      prisma.coletaDadosShoppe.count({ where: { active: true, pipelineStatus: { in: EXCLUDED_STATUSES as any } } }),
      prisma.coletaDadosShoppe.count({ where: baseWhere as any }),
      prisma.coletaDadosShoppe.count({ where: { ...(baseWhere as any), nextRunAt: { gt: current } } }),
      prisma.coletaDadosShoppe.count({
        where: {
          ...(baseWhere as any),
          OR: [
            { pipelineStatus: { notIn: ASYNC_RESUMABLE_STATUSES as any }, lockedAt: { gte: lockExpiry } },
            { pipelineStatus: { in: ASYNC_RESUMABLE_STATUSES as any }, lockedAt: { gte: asyncLockExpiry } },
          ],
        },
      }),
      prisma.coletaDadosShoppe.count({
        where: {
          ...(baseWhere as any),
          AND: [
            { OR: [{ nextRunAt: null }, { nextRunAt: { lte: current } }] },
            {
              OR: [
                { lockedAt: null },
                { lockedAt: { lt: lockExpiry } },
                { pipelineStatus: { in: ASYNC_RESUMABLE_STATUSES as any }, lockedAt: { lt: asyncLockExpiry } },
              ],
            },
          ],
        },
      }),
      prisma.coletaDadosShoppe.findFirst({
        where: { ...(baseWhere as any), nextRunAt: { gt: current } },
        orderBy: { nextRunAt: "asc" },
        select: { id: true, nextRunAt: true, pipelineStatus: true, priority: true },
      }),
      prisma.coletaDadosShoppe.findFirst({
        where: {
          ...(baseWhere as any),
          OR: [
            { pipelineStatus: { notIn: ASYNC_RESUMABLE_STATUSES as any }, lockedAt: { gte: lockExpiry } },
            { pipelineStatus: { in: ASYNC_RESUMABLE_STATUSES as any }, lockedAt: { gte: asyncLockExpiry } },
          ],
        },
        orderBy: { lockedAt: "desc" },
        select: { id: true, lockedAt: true, lockedBy: true, pipelineStatus: true, priority: true },
      }),
    ]);

  return {
    now: current.toISOString(),
    lockTtlMinutes: Math.round(LOCK_TTL_MS / 60000),
    asyncLockTtlMinutes: Math.round(ASYNC_LOCK_TTL_MS / 60000),
    lockExpiry: lockExpiry.toISOString(),
    counts: {
      totalActive,
      excludedByStatus,
      considered: baseCount,
      blockedByNextRunAt: futureCount,
      blockedByLock: lockedCount,
      eligible: eligibleCount,
    },
    samples: {
      earliestFuture: earliestFuture
        ? { id: earliestFuture.id, status: (earliestFuture as any).pipelineStatus, priority: (earliestFuture as any).priority, nextRunAt: (earliestFuture as any).nextRunAt?.toISOString?.() || null }
        : null,
      locked: lockedSample
        ? {
            id: lockedSample.id,
            status: (lockedSample as any).pipelineStatus,
            priority: (lockedSample as any).priority,
            lockedAt: (lockedSample as any).lockedAt?.toISOString?.() || null,
            lockedBy: (lockedSample as any).lockedBy || null,
          }
        : null,
    },
  };
}

export async function getShopeePipelineEligibilityDiagnostics() {
  const current = now();
  const config = await prisma.shopeePipelineConfig.findFirst({ orderBy: { createdAt: "desc" } });
  const details = await getEligibilityDiagnostics({ current });
  return {
    current: current.toISOString(),
    config: config
      ? {
          enabled: Boolean(config.enabled),
          processOneAtATime: config.processOneAtATime !== false,
          runEveryMinutes: Number(config.runEveryMinutes || 0) || null,
          maxItemsPerRun: Number(config.maxItemsPerRun || 0) || null,
          lastCronRunAt: config.lastCronRunAt || null,
          nextCronRunAt: config.nextCronRunAt || null,
        }
      : null,
    rule: buildEligibilityRuleText({ current }),
    details,
  };
}

async function releaseLock(coletaId: string) {
  await prisma.coletaDadosShoppe.update({
    where: { id: coletaId },
    data: { lockedAt: null, lockedBy: null },
  });
}

function decideRetry(params: { attempt: number; maxAttempts: number; baseDelayMinutes: number }) {
  const { attempt, maxAttempts, baseDelayMinutes } = params;
  if (attempt >= maxAttempts) return { retry: false, nextRetryAt: null };
  return { retry: true, nextRetryAt: addMinutes(now(), baseDelayMinutes) };
}

function slugify(value: string) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function safeTruncateJson(value: unknown, maxChars = 20000) {
  if (value == null) return null;
  try {
    const text = JSON.stringify(value);
    if (text.length <= maxChars) return value;
    return { _truncated: true, length: text.length, preview: text.slice(0, maxChars) };
  } catch {
    return { _unserializable: true };
  }
}

async function nextAttemptForStep(coletaId: string, stepName: string) {
  const last = await prisma.shopeePipelineStep.findFirst({
    where: { coletaId, stepName },
    orderBy: { createdAt: "desc" },
    select: { attempt: true },
  });
  return (last?.attempt || 0) + 1;
}

export async function runShopeePipelineOnce(params?: { origin?: string }) {
  const runnerId = `shopee-pipeline:${uuidv4()}`;
  const current = now();

  const config = await prisma.shopeePipelineConfig.findFirst({ orderBy: { createdAt: "desc" } });
  if (!config || !config.enabled) {
    return {
      ok: true,
      skipped: true,
      reason: "Pipeline desativado na configuração",
      rule: buildEligibilityRuleText({ current }),
      howToFix: "Abra Configuração do Pipeline e ative o switch “Pipeline ativo”, depois clique novamente em “Rodar agora”.",
    };
  }

  const stickyEnabled = config.processOneAtATime !== false;
  const item = stickyEnabled
    ? (await acquireInProgressItemLock({ runnerId, current })) || (await acquireNextItemLock({ runnerId, current }))
    : await acquireNextItemLock({ runnerId, current });
  if (!item) {
    const details = await getEligibilityDiagnostics({ current });
    return {
      ok: true,
      skipped: true,
      reason: "Nenhum item elegível encontrado agora",
      rule: buildEligibilityRuleText({ current }),
      howToFix:
        "Para algum item rodar: deixe `active=true`, `status` diferente de PAUSED/PUBLISHED, e garanta `nextRunAt` vazio ou <= agora e `lockedAt` vazio (ou aguarde o lock expirar).",
      details,
    };
  }

  try {
    if (!item.url) {
      await prisma.coletaDadosShoppe.update({
        where: { id: item.id },
        data: { pipelineStatus: "FAILED" as any, lastError: "URL ausente", nextRunAt: null },
      });
      await logPipelineEvent({ coletaId: item.id, level: "ERROR", stepName: "VALIDATE", message: "URL ausente" });
      return { ok: false, itemId: item.id, error: "URL ausente" };
    }

    // Decide proxima etapa (1 por execucao)
    if (item.pipelineStatus === "PENDING" || item.pipelineStatus === "FAILED") {
      const stepName = "SCRAPE_MEDIA";
      const startedAt = now();
      const attempt = await nextAttemptForStep(item.id, stepName);

      try {
        await prisma.coletaDadosShoppe.update({
          where: { id: item.id },
          data: { pipelineStatus: "SCRAPING_MEDIA" as any, lastError: null },
        });

        await upsertPipelineStep({
          coletaId: item.id,
          stepName,
          status: "RUNNING",
          attempt,
          startedAt,
          requestPayload: { url: item.url },
        });
        await logPipelineEvent({ coletaId: item.id, stepName, message: "Iniciando scraping via render-service" });

        const result = await scrapeShopeeAndPersist({ coletaId: item.id, productUrl: item.url });

        const finishedAt = now();
        await upsertPipelineStep({
          coletaId: item.id,
          stepName,
          status: "SUCCESS",
          attempt,
          startedAt,
          finishedAt,
          durationMs: finishedAt.getTime() - startedAt.getTime(),
          responsePayload: { targetUrl: result.targetUrl, raw: result.raw },
        });

        await prisma.coletaDadosShoppe.update({
          where: { id: item.id },
          data: {
            pipelineStatus: "COPY_READY" as any,
            nextRunAt: null,
            lastError: null,
          },
        });

        await logPipelineEvent({
          coletaId: item.id,
          stepName,
          message: "Scraping concluido. Copy pronta/armazenada quando disponivel.",
        });

        return { ok: true, itemId: item.id, ran: stepName };
      } catch (error: any) {
        const message = error?.message || "Falha no scraping";
        const retryDecision = decideRetry({ attempt, maxAttempts: 3, baseDelayMinutes: 10 });
        const finishedAt = now();

        await upsertPipelineStep({
          coletaId: item.id,
          stepName,
          status: retryDecision.retry ? "RETRY_SCHEDULED" : "FAILED",
          attempt,
          startedAt,
          finishedAt,
          durationMs: finishedAt.getTime() - startedAt.getTime(),
          nextRetryAt: retryDecision.nextRetryAt,
          errorMessage: message,
        });

        await prisma.coletaDadosShoppe.update({
          where: { id: item.id },
          data: {
            pipelineStatus: retryDecision.retry ? ("PENDING" as any) : ("FAILED" as any),
            lastError: message,
            nextRunAt: retryDecision.nextRetryAt,
          },
        });

        await logPipelineEvent({
          coletaId: item.id,
          level: retryDecision.retry ? "WARN" : "ERROR",
          stepName,
          message: retryDecision.retry ? "Scraping falhou. Reagendado." : "Scraping falhou. Marcado como FAILED.",
          metadata: { error: message, nextRetryAt: retryDecision.nextRetryAt },
        });

        return { ok: false, itemId: item.id, error: message, retry: retryDecision.retry, nextRetryAt: retryDecision.nextRetryAt };
      }
    }

    if ((item.pipelineStatus === "COPY_READY" || item.pipelineStatus === "WAITING_POD" || item.pipelineStatus === "GENERATING_AUDIO") && !item.audioUrl) {
      const stepName = "GENERATE_AUDIO";
      const startedAt = now();
      const attempt = await nextAttemptForStep(item.id, stepName);

      try {
        const lastSuccessfulAudioStep = await prisma.shopeePipelineStep.findFirst({
          where: { coletaId: item.id, stepName, status: "SUCCESS" as any },
          orderBy: { updatedAt: "desc" },
        });
        const recoveredAudioUrl = String(((lastSuccessfulAudioStep?.responsePayload || {}) as any)?.audioUrl || "").trim();
        if (recoveredAudioUrl) {
          await prisma.coletaDadosShoppe.update({
            where: { id: item.id },
            data: { audioUrl: recoveredAudioUrl, pipelineStatus: "AUDIO_READY" as any, nextRunAt: null, lastError: null },
          });
          await logPipelineEvent({
            coletaId: item.id,
            stepName,
            message: "Audio ja existia em step anterior; URL restaurada sem gerar novamente.",
            metadata: { audioUrl: recoveredAudioUrl },
          });
          return { ok: true, itemId: item.id, ran: stepName, reusedAudioUrl: recoveredAudioUrl };
        }

        const config = await prisma.shopeePipelineConfig.findFirst({ orderBy: { createdAt: "desc" } });
        const voiceRefUrl = config?.userVoiceRefUrl || null;
        if (!voiceRefUrl) throw new Error("Pipeline config missing userVoiceRefUrl");

        const copy = String(item.aiPromptVendas || "").trim();
        if (!copy) throw new Error("Copy de vendas (aiPromptVendas) ausente");

        await upsertPipelineStep({ coletaId: item.id, stepName, status: "RUNNING", attempt, startedAt });
        await logPipelineEvent({ coletaId: item.id, stepName, message: "Gerando audio via Modal (voice clone)" });

        // Persist what will be fetched/called so the UI shows "envio" even if it fails early.
        await upsertPipelineStep({
          coletaId: item.id,
          stepName,
          status: "RUNNING",
          attempt,
          startedAt,
          requestPayload: {
            voiceRefUrl,
            requests: [
              { method: "POST", url: process.env.MODAL_AUDIO_ENDPOINT || null, purpose: "Gerar audio pelo worker Modal" },
            ],
            targetTextPreview: copy.slice(0, 220),
            targetTextLength: copy.length,
            note:
              "Este step usa `aiPromptVendas` SALVO no banco no momento da execução (não rascunho na tela). Se você editou o script na tela Coleta Shopee, clique em 'Salvar Alterações' antes de rodar o pipeline.",
          },
        });

        const seed = Math.floor(Math.random() * 1_000_000_000);
        const generated = await generateModalAudio({
          voiceRefUrl,
          targetText: copy,
          seed,
        });
        const audioUrl = generated.audio_url;

        const finishedAt = now();
        await upsertPipelineStep({
          coletaId: item.id,
          stepName,
          status: "SUCCESS",
          attempt,
          startedAt,
          finishedAt,
          durationMs: finishedAt.getTime() - startedAt.getTime(),
          requestPayload: {
            seed,
            targetTextPreview: copy.slice(0, 220),
            targetTextLength: copy.length,
          },
          responsePayload: {
            promptId: generated.prompt_id,
            audioUrl,
          },
        });

        await prisma.coletaDadosShoppe.update({
          where: { id: item.id },
          data: { audioUrl, pipelineStatus: "AUDIO_READY" as any, nextRunAt: null, lastError: null },
        });

        await logPipelineEvent({ coletaId: item.id, stepName, message: "Audio gerado pela Modal e salvo no MinIO.", metadata: { audioUrl } });
        return { ok: true, itemId: item.id, ran: stepName, audioUrl };
      } catch (error: any) {
        const message = error?.message || "Falha ao gerar audio";
        const retryDecision = decideRetry({ attempt, maxAttempts: 3, baseDelayMinutes: 3 });
        const finishedAt = now();

        await upsertPipelineStep({
          coletaId: item.id,
          stepName,
          status: retryDecision.retry ? "RETRY_SCHEDULED" : "FAILED",
          attempt,
          startedAt,
          finishedAt,
          durationMs: finishedAt.getTime() - startedAt.getTime(),
          nextRetryAt: retryDecision.nextRetryAt,
          errorMessage: message,
          responsePayload: { error: message, details: error?.details || null },
        });

        await prisma.coletaDadosShoppe.update({
          where: { id: item.id },
          data: {
            pipelineStatus: retryDecision.retry ? ("GENERATING_AUDIO" as any) : ("FAILED" as any),
            lastError: message,
            nextRunAt: retryDecision.nextRetryAt,
          },
        });

        await logPipelineEvent({
          coletaId: item.id,
          level: retryDecision.retry ? "WARN" : "ERROR",
          stepName,
          message: retryDecision.retry ? "Geracao de audio falhou. Reagendado." : "Geracao de audio falhou. Marcado como FAILED.",
          metadata: { error: message, details: error?.details || null, stack: error?.stack || null, nextRetryAt: retryDecision.nextRetryAt },
        });

        return { ok: false, itemId: item.id, error: message, retry: retryDecision.retry, nextRetryAt: retryDecision.nextRetryAt };
      }
    }

    if (
      (item.pipelineStatus === "AUDIO_READY" ||
        item.pipelineStatus === "GENERATING_COPY_VIDEO" ||
        item.pipelineStatus === "WAITING_POD") &&
      item.audioUrl &&
      !item.copyVideoUrl
    ) {
      const stepName = "GENERATE_COPY_VIDEO";
      const startedAt = now();
      const attempt = await nextAttemptForStep(item.id, stepName);

      try {
        const config = await prisma.shopeePipelineConfig.findFirst({ orderBy: { createdAt: "desc" } });

        const imageUrl = config?.userBaseImageUrl || null;
        if (!imageUrl) throw new Error("Pipeline config missing userBaseImageUrl");
        if (!item.audioUrl) throw new Error("audioUrl ausente");

        await prisma.coletaDadosShoppe.update({
          where: { id: item.id },
          data: { pipelineStatus: "GENERATING_COPY_VIDEO" as any, lastError: null },
        });

        await upsertPipelineStep({
          coletaId: item.id,
          stepName,
          status: "RUNNING",
          attempt,
          startedAt,
          requestPayload: {
            userBaseImageUrl: imageUrl,
            audioUrl: item.audioUrl,
            requests: [
              { method: "POST", url: process.env.MODAL_VIDEO_ENDPOINT || null, purpose: "Gerar video pelo worker Modal" },
            ],
            note: "O worker Modal recebe as URLs da imagem e do audio, executa o workflow e devolve a URL publica do MP4.",
          },
        });
        await logPipelineEvent({ coletaId: item.id, stepName, message: "Gerando video da copy via Modal (Infinite Talk)" });
        const seed = Math.floor(Math.random() * 1_000_000_000);
        const generated = await generateModalVideo({ imageUrl, audioUrl: item.audioUrl, seed });
        const copyVideoUrl = generated.video_url;
        const finishedAt = now();
        await upsertPipelineStep({
          coletaId: item.id,
          stepName,
          status: "SUCCESS",
          attempt,
          startedAt,
          finishedAt,
          durationMs: finishedAt.getTime() - startedAt.getTime(),
          requestPayload: {
            seed,
            userBaseImageUrl: imageUrl,
            audioUrl: item.audioUrl,
          },
          responsePayload: {
            promptId: generated.prompt_id,
            copyVideoUrl,
          },
        });

        await prisma.coletaDadosShoppe.update({
          where: { id: item.id },
          data: { copyVideoUrl, pipelineStatus: "COPY_VIDEO_READY" as any, nextRunAt: null, lastError: null },
        });
        await logPipelineEvent({
          coletaId: item.id,
          stepName,
          message: "Video da copy gerado pela Modal e salvo no MinIO.",
          metadata: { promptId: generated.prompt_id, copyVideoUrl },
        });
        return { ok: true, itemId: item.id, ran: stepName, copyVideoUrl };
      } catch (error: any) {
        const message = error?.message || "Falha ao gerar video da copy";
        const retryDecision = decideRetry({ attempt, maxAttempts: 3, baseDelayMinutes: 3 });
        const finishedAt = now();

        await upsertPipelineStep({
          coletaId: item.id,
          stepName,
          status: retryDecision.retry ? "RETRY_SCHEDULED" : "FAILED",
          attempt,
          startedAt,
          finishedAt,
          durationMs: finishedAt.getTime() - startedAt.getTime(),
          nextRetryAt: retryDecision.nextRetryAt,
          errorMessage: message,
          responsePayload: { error: message, details: error?.details || null },
        });

        await prisma.coletaDadosShoppe.update({
          where: { id: item.id },
          data: {
            pipelineStatus: retryDecision.retry ? ("GENERATING_COPY_VIDEO" as any) : ("FAILED" as any),
            lastError: message,
            nextRunAt: retryDecision.nextRetryAt,
          },
        });

        await logPipelineEvent({
          coletaId: item.id,
          level: retryDecision.retry ? "WARN" : "ERROR",
          stepName,
          message: retryDecision.retry ? "Geracao do video da copy falhou. Reagendado." : "Geracao do video da copy falhou. Marcado como FAILED.",
          metadata: { error: message, details: error?.details || null, stack: error?.stack || null, nextRetryAt: retryDecision.nextRetryAt },
        });

        return { ok: false, itemId: item.id, error: message, retry: retryDecision.retry, nextRetryAt: retryDecision.nextRetryAt };
      }
    }

    if ((item.pipelineStatus === "COPY_VIDEO_READY" || item.pipelineStatus === "MERGING_VIDEOS") && !item.videoFinalUrl) {
      const stepName = "MERGE_VIDEOS";
      const startedAt = now();
      const attempt = await nextAttemptForStep(item.id, stepName);

      try {
        await prisma.coletaDadosShoppe.update({
          where: { id: item.id },
          data: { pipelineStatus: "MERGING_VIDEOS" as any, lastError: null },
        });

        await upsertPipelineStep({
          coletaId: item.id,
          stepName,
          status: "RUNNING",
          attempt,
          startedAt,
          requestPayload: {
            originalVideoUrl: item.mediaVideoUrls?.[0] || null,
            copyVideoUrl: item.copyVideoUrl || null,
            requests: [
              {
                method: "POST",
                url: `${String(process.env.WORKER_FASTAPI_BASE_URL || process.env.FASTAPI_URL || "http://127.0.0.1:8000").trim().replace(/\/+$/, "")}/merge-videos`,
                purpose: "Pedir ao worker para unir o video original com o video da copy",
              },
            ],
            note: "O worker baixa os dois videos pelas URLs recebidas, faz o merge e devolve o MP4 final para o Next salvar no MinIO.",
          },
        });

        const originalVideoUrl = String(item.mediaVideoUrls?.[0] || "").trim();
        const copyVideoUrl = String(item.copyVideoUrl || "").trim();
        if (!copyVideoUrl) throw new Error("copyVideoUrl ausente para merge.");
        if (!originalVideoUrl) {
          throw new Error("Nenhum video original encontrado em mediaVideoUrls[0]. Necessario fallback/manual.");
        }

        await logPipelineEvent({ coletaId: item.id, stepName, message: "Iniciando merge do video original + copy video." });

        const merged = await mergeProductAndCopyVideos({
          coletaId: item.id,
          originalVideoUrl,
          copyVideoUrl,
          timeoutMs: 45 * 60 * 1000,
        });

        const minioKey = `shopee/videos-final/final_${item.id}_${Date.now()}.mp4`;
        const videoFinalUrl = await uploadBufferToMinio({ buffer: merged.buffer, key: minioKey, contentType: "video/mp4" });

        const finishedAt = now();
        await upsertPipelineStep({
          coletaId: item.id,
          stepName,
          status: "SUCCESS",
          attempt,
          startedAt,
          finishedAt,
          durationMs: finishedAt.getTime() - startedAt.getTime(),
          responsePayload: {
            originalVideoUrl,
            copyVideoUrl,
            minioKey,
            videoFinalUrl,
            contentType: merged.contentType,
            bytes: merged.buffer.length,
          },
        });

        await prisma.coletaDadosShoppe.update({
          where: { id: item.id },
          data: { videoFinalUrl, pipelineStatus: "FINAL_VIDEO_READY" as any, nextRunAt: null, lastError: null },
        });

        await logPipelineEvent({ coletaId: item.id, stepName, message: "Merge concluido e video final salvo no MinIO.", metadata: { videoFinalUrl } });
        return { ok: true, itemId: item.id, ran: stepName, videoFinalUrl };
      } catch (error: any) {
        const message = error?.message || "Falha ao fazer merge dos videos";
        const retryDecision = decideRetry({ attempt, maxAttempts: 3, baseDelayMinutes: 30 });
        const finishedAt = now();

        await upsertPipelineStep({
          coletaId: item.id,
          stepName,
          status: retryDecision.retry ? "RETRY_SCHEDULED" : "FAILED",
          attempt,
          startedAt,
          finishedAt,
          durationMs: finishedAt.getTime() - startedAt.getTime(),
          nextRetryAt: retryDecision.nextRetryAt,
          errorMessage: message,
        });

        await prisma.coletaDadosShoppe.update({
          where: { id: item.id },
          data: {
            pipelineStatus: retryDecision.retry ? ("MERGING_VIDEOS" as any) : ("FAILED" as any),
            lastError: message,
            nextRunAt: retryDecision.nextRetryAt,
          },
        });

        await logPipelineEvent({
          coletaId: item.id,
          level: retryDecision.retry ? "WARN" : "ERROR",
          stepName,
          message: retryDecision.retry ? "Merge falhou. Reagendado." : "Merge falhou. Marcado como FAILED.",
          metadata: { error: message, nextRetryAt: retryDecision.nextRetryAt },
        });

        return { ok: false, itemId: item.id, error: message, retry: retryDecision.retry, nextRetryAt: retryDecision.nextRetryAt };
      }
    }

    if ((item.pipelineStatus === "FINAL_VIDEO_READY" || item.pipelineStatus === "GENERATING_AFFILIATE_LINK") && !item.affiliateUrl) {
      const stepName = "GENERATE_AFFILIATE_LINK";
      const startedAt = now();
      const attempt = await nextAttemptForStep(item.id, stepName);

      try {
        await prisma.coletaDadosShoppe.update({
          where: { id: item.id },
          data: { pipelineStatus: "GENERATING_AFFILIATE_LINK" as any, lastError: null },
        });

        await upsertPipelineStep({
          coletaId: item.id,
          stepName,
          status: "RUNNING",
          attempt,
          startedAt,
          requestPayload: { originUrl: item.url },
        });

        const config = await prisma.shopeeAffiliateConfig.findFirst();
        if (!config) throw new Error("Shopee affiliate config not found (shopeeAffiliateConfig).");

        const affiliateUrl = await generateShopeeAffiliateShortLink({ config, originUrl: item.url, timeoutMs: 15000 });

        const finishedAt = now();
        await upsertPipelineStep({
          coletaId: item.id,
          stepName,
          status: "SUCCESS",
          attempt,
          startedAt,
          finishedAt,
          durationMs: finishedAt.getTime() - startedAt.getTime(),
          responsePayload: { affiliateUrl },
        });

        await prisma.coletaDadosShoppe.update({
          where: { id: item.id },
          data: { affiliateUrl, pipelineStatus: "AFFILIATE_LINK_READY" as any, nextRunAt: null, lastError: null },
        });

        await logPipelineEvent({ coletaId: item.id, stepName, message: "Link afiliado gerado com sucesso.", metadata: { affiliateUrl } });
        return { ok: true, itemId: item.id, ran: stepName, affiliateUrl };
      } catch (error: any) {
        const message = error?.message || "Falha ao gerar link afiliado";
        const retryDecision = decideRetry({ attempt, maxAttempts: 3, baseDelayMinutes: 30 });
        const finishedAt = now();

        await upsertPipelineStep({
          coletaId: item.id,
          stepName,
          status: retryDecision.retry ? "RETRY_SCHEDULED" : "FAILED",
          attempt,
          startedAt,
          finishedAt,
          durationMs: finishedAt.getTime() - startedAt.getTime(),
          nextRetryAt: retryDecision.nextRetryAt,
          errorMessage: message,
        });

        await prisma.coletaDadosShoppe.update({
          where: { id: item.id },
          data: {
            pipelineStatus: retryDecision.retry ? ("GENERATING_AFFILIATE_LINK" as any) : ("FAILED" as any),
            lastError: message,
            nextRunAt: retryDecision.nextRetryAt,
          },
        });

        await logPipelineEvent({
          coletaId: item.id,
          level: retryDecision.retry ? "WARN" : "ERROR",
          stepName,
          message: retryDecision.retry ? "Affiliate link falhou. Reagendado." : "Affiliate link falhou. Marcado como FAILED.",
          metadata: { error: message, nextRetryAt: retryDecision.nextRetryAt },
        });

        return { ok: false, itemId: item.id, error: message, retry: retryDecision.retry, nextRetryAt: retryDecision.nextRetryAt };
      }
    }

    if (item.pipelineStatus === "AFFILIATE_LINK_READY") {
      const stepName = "CREATE_BIO_PRODUCT";
      const startedAt = now();
      const attempt = await nextAttemptForStep(item.id, stepName);

      try {
        const existing = await prisma.bioProduct.findUnique({ where: { coletaId: item.id }, select: { id: true } }).catch(() => null);
        if (existing?.id) {
          await prisma.coletaDadosShoppe.update({
            where: { id: item.id },
            data: { pipelineStatus: "READY_FOR_STORY" as any, nextRunAt: null, lastError: null },
          });
          await logPipelineEvent({ coletaId: item.id, stepName, message: "BioProduct ja existe. Prosseguindo." });
          return { ok: true, itemId: item.id, skipped: true, reason: "BioProduct already exists" };
        }

        const title = String(item.titulo || "Produto Shopee").trim() || "Produto Shopee";
        const description = String(item.descricao || item.aiPromptVendas || "").trim().slice(0, 2000) || title;
        const affiliateUrl = String(item.affiliateUrl || "").trim();
        const videoUrl = String(item.videoFinalUrl || "").trim();
        const imageUrl = item.mediaImageUrls?.[0] ? String(item.mediaImageUrls[0]).trim() : null;
        if (!affiliateUrl) throw new Error("affiliateUrl ausente para criar BioProduct.");

        const slugBase = slugify(title) || "produto";
        const slug = `${slugBase}-${item.id.slice(-6)}`;

        await upsertPipelineStep({
          coletaId: item.id,
          stepName,
          status: "RUNNING",
          attempt,
          startedAt,
          requestPayload: { slug, title },
        });

        const bio = await prisma.bioProduct.create({
          data: {
            coletaId: item.id,
            slug,
            title,
            description,
            imageUrl,
            videoUrl: videoUrl || null,
            affiliateUrl,
            active: true,
            publishedAt: now(),
          },
        });

        const finishedAt = now();
        await upsertPipelineStep({
          coletaId: item.id,
          stepName,
          status: "SUCCESS",
          attempt,
          startedAt,
          finishedAt,
          durationMs: finishedAt.getTime() - startedAt.getTime(),
          responsePayload: { bioProductId: bio.id, slug },
        });

        await prisma.coletaDadosShoppe.update({
          where: { id: item.id },
          data: { pipelineStatus: "READY_FOR_STORY" as any, nextRunAt: null, lastError: null },
        });

        await logPipelineEvent({ coletaId: item.id, stepName, message: "BioProduct criado com sucesso.", metadata: { slug } });
        return { ok: true, itemId: item.id, ran: stepName, slug };
      } catch (error: any) {
        const message = error?.message || "Falha ao criar BioProduct";
        const retryDecision = decideRetry({ attempt, maxAttempts: 3, baseDelayMinutes: 30 });
        const finishedAt = now();

        await upsertPipelineStep({
          coletaId: item.id,
          stepName,
          status: retryDecision.retry ? "RETRY_SCHEDULED" : "FAILED",
          attempt,
          startedAt,
          finishedAt,
          durationMs: finishedAt.getTime() - startedAt.getTime(),
          nextRetryAt: retryDecision.nextRetryAt,
          errorMessage: message,
        });

        await prisma.coletaDadosShoppe.update({
          where: { id: item.id },
          data: {
            pipelineStatus: retryDecision.retry ? ("AFFILIATE_LINK_READY" as any) : ("FAILED" as any),
            lastError: message,
            nextRunAt: retryDecision.nextRetryAt,
          },
        });

        await logPipelineEvent({
          coletaId: item.id,
          level: retryDecision.retry ? "WARN" : "ERROR",
          stepName,
          message: retryDecision.retry ? "BioProduct falhou. Reagendado." : "BioProduct falhou. Marcado como FAILED.",
          metadata: { error: message, nextRetryAt: retryDecision.nextRetryAt },
        });

        return { ok: false, itemId: item.id, error: message, retry: retryDecision.retry, nextRetryAt: retryDecision.nextRetryAt };
      }
    }

    if (item.pipelineStatus === "READY_FOR_STORY") {
      const stepName = "CREATE_STORY_AD";
      const startedAt = now();
      const attempt = await nextAttemptForStep(item.id, stepName);

      try {
        const existing = await prisma.storyAd.findUnique({ where: { coletaId: item.id }, include: { publications: true } });
        if (existing?.id) {
          await prisma.coletaDadosShoppe.update({
            where: { id: item.id },
            data: { pipelineStatus: existing.scheduledAt ? ("SCHEDULED" as any) : ("READY_FOR_STORY" as any), nextRunAt: existing.scheduledAt || null, lastError: null },
          });
          await logPipelineEvent({ coletaId: item.id, stepName, message: "StoryAd ja existe. Nenhuma acao necessaria." });
          return { ok: true, itemId: item.id, skipped: true, reason: "StoryAd already exists" };
        }

        const title = String(item.titulo || "Produto Shopee").trim() || "Produto Shopee";
        const description = String(item.descricao || item.aiPromptVendas || "").trim().slice(0, 1000);
        const videoUrl = String(item.videoFinalUrl || "").trim();
        const affiliateUrl = String(item.affiliateUrl || "").trim();
        if (!videoUrl) throw new Error("videoFinalUrl ausente para criar StoryAd.");
        if (!affiliateUrl) throw new Error("affiliateUrl ausente para criar StoryAd.");

        const scheduledAt = addMinutes(now(), 30);

        await upsertPipelineStep({
          coletaId: item.id,
          stepName,
          status: "RUNNING",
          attempt,
          startedAt,
          requestPayload: { title, scheduledAt, videoUrl, affiliateUrl },
        });

        const storyAd = await prisma.storyAd.create({
          data: {
            coletaId: item.id,
            title,
            description,
            videoUrl,
            affiliateUrl,
            scheduledAt,
            status: "SCHEDULED" as any,
            publications: {
              create: [{ platform: "TIKTOK" as any }, { platform: "YOUTUBE" as any }, { platform: "INSTAGRAM" as any }],
            },
          },
        });

        const finishedAt = now();
        await upsertPipelineStep({
          coletaId: item.id,
          stepName,
          status: "SUCCESS",
          attempt,
          startedAt,
          finishedAt,
          durationMs: finishedAt.getTime() - startedAt.getTime(),
          responsePayload: { storyAdId: storyAd.id },
        });

        await prisma.coletaDadosShoppe.update({
          where: { id: item.id },
          data: { pipelineStatus: "SCHEDULED" as any, nextRunAt: scheduledAt, lastError: null },
        });

        await logPipelineEvent({ coletaId: item.id, stepName, message: "StoryAd criado e publicacoes agendadas.", metadata: { storyAdId: storyAd.id, scheduledAt } });
        return { ok: true, itemId: item.id, ran: stepName, storyAdId: storyAd.id, scheduledAt };
      } catch (error: any) {
        const message = error?.message || "Falha ao criar StoryAd";
        const retryDecision = decideRetry({ attempt, maxAttempts: 3, baseDelayMinutes: 30 });
        const finishedAt = now();

        await upsertPipelineStep({
          coletaId: item.id,
          stepName,
          status: retryDecision.retry ? "RETRY_SCHEDULED" : "FAILED",
          attempt,
          startedAt,
          finishedAt,
          durationMs: finishedAt.getTime() - startedAt.getTime(),
          nextRetryAt: retryDecision.nextRetryAt,
          errorMessage: message,
        });

        await prisma.coletaDadosShoppe.update({
          where: { id: item.id },
          data: {
            pipelineStatus: retryDecision.retry ? ("READY_FOR_STORY" as any) : ("FAILED" as any),
            lastError: message,
            nextRunAt: retryDecision.nextRetryAt,
          },
        });

        await logPipelineEvent({
          coletaId: item.id,
          level: retryDecision.retry ? "WARN" : "ERROR",
          stepName,
          message: retryDecision.retry ? "StoryAd falhou. Reagendado." : "StoryAd falhou. Marcado como FAILED.",
          metadata: { error: message, nextRetryAt: retryDecision.nextRetryAt },
        });

        return { ok: false, itemId: item.id, error: message, retry: retryDecision.retry, nextRetryAt: retryDecision.nextRetryAt };
      }
    }

    return { ok: true, skipped: true, reason: `No step implemented for status=${item.pipelineStatus}` };
  } catch (error: any) {
    const message = error?.message || "Falha desconhecida";
    await prisma.coletaDadosShoppe
      .update({
        where: { id: item.id },
        data: { pipelineStatus: "FAILED" as any, lastError: message, nextRunAt: addMinutes(now(), 30) },
      })
      .catch(() => null);
    await logPipelineEvent({ coletaId: item.id, level: "ERROR", stepName: "UNHANDLED", message, metadata: { stack: error?.stack || null } }).catch(
      () => null
    );
    return { ok: false, itemId: item.id, error: message };
  } finally {
    await releaseLock(item.id).catch(() => null);
  }
}
