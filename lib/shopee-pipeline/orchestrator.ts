import "server-only";

import { prisma } from "@/lib/prisma";
import { logPipelineEvent, upsertPipelineStep } from "@/lib/shopee-pipeline/logger";
import { scrapeShopeeAndPersist } from "@/lib/shopee-pipeline/scrape";
import { runpodOnline, runpodPowerOn } from "@/lib/shopee-pipeline/runpodClient";
import { generateVoiceCloneAudio } from "@/lib/shopee-pipeline/comfyui/generateAudio";
import { generateVideoFromTemplate } from "@/lib/shopee-pipeline/comfyui/generateVideoFromTemplate";
import { uploadBufferToMinio } from "@/lib/shopee-pipeline/minioUpload";
import { mergeProductAndCopyVideos } from "@/lib/shopee-pipeline/merge";
import { generateShopeeAffiliateShortLink } from "@/lib/shopee/openApi";
import defaultInfiniteTalkTemplate from "@/lib/shopee-pipeline/comfyui/templates/infinite-talk-video.json";
import { v4 as uuidv4 } from "uuid";

const LOCK_TTL_MS = 30 * 60 * 1000;
const EXCLUDED_STATUSES = ["PAUSED", "PUBLISHED"] as const;

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

  const candidate = await prisma.coletaDadosShoppe.findFirst({
    where: {
      active: true,
      pipelineStatus: { notIn: EXCLUDED_STATUSES as any },
      AND: [
        { OR: [{ nextRunAt: null }, { nextRunAt: { lte: current } }] },
        { OR: [{ lockedAt: null }, { lockedAt: { lt: lockExpiry } }] },
      ],
    },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    select: { id: true, lockedAt: true },
  });

  if (!candidate) return null;

  const res = await prisma.coletaDadosShoppe.updateMany({
    where: {
      id: candidate.id,
      OR: [{ lockedAt: null }, { lockedAt: { lt: lockExpiry } }],
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
      prisma.coletaDadosShoppe.count({ where: { ...(baseWhere as any), lockedAt: { gte: lockExpiry } } }),
      prisma.coletaDadosShoppe.count({
        where: {
          ...(baseWhere as any),
          AND: [
            { OR: [{ nextRunAt: null }, { nextRunAt: { lte: current } }] },
            { OR: [{ lockedAt: null }, { lockedAt: { lt: lockExpiry } }] },
          ],
        },
      }),
      prisma.coletaDadosShoppe.findFirst({
        where: { ...(baseWhere as any), nextRunAt: { gt: current } },
        orderBy: { nextRunAt: "asc" },
        select: { id: true, nextRunAt: true, pipelineStatus: true, priority: true },
      }),
      prisma.coletaDadosShoppe.findFirst({
        where: { ...(baseWhere as any), lockedAt: { gte: lockExpiry } },
        orderBy: { lockedAt: "desc" },
        select: { id: true, lockedAt: true, lockedBy: true, pipelineStatus: true, priority: true },
      }),
    ]);

  return {
    now: current.toISOString(),
    lockTtlMinutes: Math.round(LOCK_TTL_MS / 60000),
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

  const item = await acquireNextItemLock({ runnerId, current });
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

    if (item.pipelineStatus === "COPY_READY" && !item.audioUrl) {
      const stepName = "ENSURE_POD_ONLINE";
      const startedAt = now();
      const attempt = await nextAttemptForStep(item.id, stepName);

      try {
        await prisma.coletaDadosShoppe.update({
          where: { id: item.id },
          data: { pipelineStatus: "WAITING_POD" as any, lastError: null },
        });

        await upsertPipelineStep({
          coletaId: item.id,
          stepName,
          status: "RUNNING",
          attempt,
          startedAt,
        });

        const online = await runpodOnline(8000);
        const isOnline =
          online.ok && (online.data?.online === true || online.data?.ok === true || online.data?.status === "online");

        if (!isOnline) {
          const power = await runpodPowerOn({ esperarOnline: true, maxEsperaSegundos: 10 }, 20000);
          const powerData: any = (power as any)?.data;
          const started = Boolean(power.ok || powerData?.currentPodId);
          const isRunningNow = Boolean(power.ok && powerData?.status === "RUNNING");
          const nextRetryAt = started ? addMinutes(now(), 1) : addMinutes(now(), 30);

          const lastSession = await prisma.podSession.findFirst({ orderBy: { updatedAt: "desc" } });
          if (lastSession) {
            await prisma.podSession.update({
              where: { id: lastSession.id },
              data: { status: started ? ("STARTING" as any) : ("OFFLINE" as any), lastOnlineCheckAt: now(), lastActivityAt: now() },
            });
          } else {
            await prisma.podSession.create({
              data: { status: started ? ("STARTING" as any) : ("OFFLINE" as any), lastOnlineCheckAt: now(), lastActivityAt: now() },
            });
          }

          const finishedAt = now();
          await upsertPipelineStep({
            coletaId: item.id,
            stepName,
            status: "RETRY_SCHEDULED",
            attempt,
            startedAt,
            finishedAt,
            durationMs: finishedAt.getTime() - startedAt.getTime(),
            nextRetryAt,
            responsePayload: { online, power },
            errorMessage: isRunningNow ? "POD RUNNING (validar health)" : started ? "POD ligando (aguardando online)" : "POD offline; reagendado",
          });

          await prisma.coletaDadosShoppe.update({
            where: { id: item.id },
            data: {
              pipelineStatus: "WAITING_POD" as any,
              nextRunAt: nextRetryAt,
              lastError: isRunningNow ? "POD RUNNING (validar health)" : started ? "Aguardando POD ficar online" : "POD offline; reagendado",
            },
          });

          await logPipelineEvent({
            coletaId: item.id,
            level: "WARN",
            stepName,
            message: "POD offline. Reagendando para tentar novamente.",
            metadata: { nextRetryAt, online, power },
          });

          return { ok: true, itemId: item.id, ran: stepName, scheduled: nextRetryAt };
        }

        const finishedAt = now();
        const lastSession = await prisma.podSession.findFirst({ orderBy: { updatedAt: "desc" } });
        if (lastSession) {
          await prisma.podSession.update({
            where: { id: lastSession.id },
            data: { status: "ONLINE" as any, lastOnlineCheckAt: finishedAt, lastActivityAt: finishedAt },
          });
        } else {
          await prisma.podSession.create({ data: { status: "ONLINE" as any, lastOnlineCheckAt: finishedAt, lastActivityAt: finishedAt } });
        }

        await upsertPipelineStep({
          coletaId: item.id,
          stepName,
          status: "SUCCESS",
          attempt,
          startedAt,
          finishedAt,
          durationMs: finishedAt.getTime() - startedAt.getTime(),
          responsePayload: { online },
        });

        await prisma.coletaDadosShoppe.update({
          where: { id: item.id },
          data: { pipelineStatus: "GENERATING_AUDIO" as any, nextRunAt: null, lastError: null },
        });

        await logPipelineEvent({ coletaId: item.id, stepName, message: "POD online. Proxima etapa: gerar audio." });
        return { ok: true, itemId: item.id, ran: stepName };
      } catch (error: any) {
        const message = error?.message || "Falha ao verificar/ligar POD";
        const nextRetryAt = addMinutes(now(), 30);
        const finishedAt = now();

        await upsertPipelineStep({
          coletaId: item.id,
          stepName,
          status: "RETRY_SCHEDULED",
          attempt,
          startedAt,
          finishedAt,
          durationMs: finishedAt.getTime() - startedAt.getTime(),
          nextRetryAt,
          errorMessage: message,
        });

        await prisma.coletaDadosShoppe.update({
          where: { id: item.id },
          data: { pipelineStatus: "WAITING_POD" as any, nextRunAt: nextRetryAt, lastError: message },
        });

        await logPipelineEvent({ coletaId: item.id, level: "WARN", stepName, message: "Erro no ensurePodOnline. Reagendado.", metadata: { error: message, nextRetryAt } });
        return { ok: false, itemId: item.id, error: message, retry: true, nextRetryAt };
      }
    }

    if (item.pipelineStatus === "GENERATING_AUDIO" && !item.audioUrl) {
      const stepName = "GENERATE_AUDIO";
      const startedAt = now();
      const attempt = await nextAttemptForStep(item.id, stepName);

      try {
        const config = await prisma.shopeePipelineConfig.findFirst({ orderBy: { createdAt: "desc" } });
        const voiceRefUrl = config?.userVoiceRefUrl || null;
        if (!voiceRefUrl) throw new Error("Pipeline config missing userVoiceRefUrl");

        const copy = String(item.aiPromptVendas || "").trim();
        if (!copy) throw new Error("Copy de vendas (aiPromptVendas) ausente");

        await upsertPipelineStep({ coletaId: item.id, stepName, status: "RUNNING", attempt, startedAt });
        await logPipelineEvent({ coletaId: item.id, stepName, message: "Gerando audio via ComfyUI (voice clone)" });

        const voiceRes = await fetch(voiceRefUrl, { method: "GET", cache: "no-store", signal: AbortSignal.timeout(30000) });
        if (!voiceRes.ok) throw new Error(`Falha ao baixar voiceRefUrl (HTTP ${voiceRes.status})`);
        const voiceBuf = Buffer.from(await voiceRes.arrayBuffer());
        const voiceContentType = voiceRes.headers.get("content-type") || "audio/mpeg";

        const uid = uuidv4().slice(0, 8);
        const outputPrefix = `audio/shopee_${item.id}_${uid}`;
        const seed = Math.floor(Math.random() * 1_000_000_000);

        const generated = await generateVoiceCloneAudio({
          targetText: copy,
          voiceRefBuffer: voiceBuf,
          voiceRefFilename: `voice_ref_${item.id}.mp3`,
          voiceRefContentType: voiceContentType,
          outputPrefix,
          seed,
          timeoutMs: 25 * 60 * 1000,
          promptTemplateOverride: config?.comfyAudioPromptTemplate || undefined,
        });

        const minioKey = `shopee/audio/audio_${item.id}_${Date.now()}.mp3`;
        const audioUrl = await uploadBufferToMinio({ buffer: generated.buffer, key: minioKey, contentType: "audio/mpeg" });

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
            outputPrefix,
            promptId: generated.promptId,
            prompt: safeTruncateJson(generated.prompt, 20000),
          },
          responsePayload: {
            promptId: generated.promptId,
            outputFiles: generated.files,
            outputFile: generated.file,
            history: safeTruncateJson(generated.history, 50000),
          },
        });

        await prisma.coletaDadosShoppe.update({
          where: { id: item.id },
          data: { audioUrl, pipelineStatus: "AUDIO_READY" as any, nextRunAt: null, lastError: null },
        });

        const lastSession = await prisma.podSession.findFirst({ orderBy: { updatedAt: "desc" } });
        if (lastSession) {
          await prisma.podSession.update({ where: { id: lastSession.id }, data: { status: "IDLE" as any, lastActivityAt: finishedAt } });
        }

        await logPipelineEvent({ coletaId: item.id, stepName, message: "Audio gerado e salvo no MinIO.", metadata: { audioUrl } });
        return { ok: true, itemId: item.id, ran: stepName, audioUrl };
      } catch (error: any) {
        const message = error?.message || "Falha ao gerar audio";
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
          metadata: { error: message, nextRetryAt: retryDecision.nextRetryAt },
        });

        return { ok: false, itemId: item.id, error: message, retry: retryDecision.retry, nextRetryAt: retryDecision.nextRetryAt };
      }
    }

    if ((item.pipelineStatus === "AUDIO_READY" || item.pipelineStatus === "GENERATING_COPY_VIDEO") && !item.copyVideoUrl) {
      const stepName = "GENERATE_COPY_VIDEO";
      const startedAt = now();
      const attempt = await nextAttemptForStep(item.id, stepName);

      try {
        const config = await prisma.shopeePipelineConfig.findFirst({ orderBy: { createdAt: "desc" } });

        // Se o POD/ComfyUI estiver offline, tenta ligar e reagenda.
        const online = await runpodOnline(8000);
        const isOnline =
          online.ok && (online.data?.online === true || online.data?.ok === true || online.data?.status === "online");
        if (!isOnline) {
          const power = await runpodPowerOn({ esperarOnline: true, maxEsperaSegundos: 10 }, 20000);
          const nextRetryAt = power.ok ? addMinutes(now(), 1) : addMinutes(now(), 30);

          const finishedAt = now();
          await upsertPipelineStep({
            coletaId: item.id,
            stepName,
            status: "RETRY_SCHEDULED",
            attempt,
            startedAt,
            finishedAt,
            durationMs: finishedAt.getTime() - startedAt.getTime(),
            nextRetryAt,
            responsePayload: { online, power },
            errorMessage: "POD offline; reagendado",
          });

          await prisma.coletaDadosShoppe.update({
            where: { id: item.id },
            data: { pipelineStatus: "WAITING_POD" as any, nextRunAt: nextRetryAt, lastError: "Aguardando POD ficar online" },
          });

          await logPipelineEvent({
            coletaId: item.id,
            level: "WARN",
            stepName,
            message: "POD offline durante geracao do video. Reagendado.",
            metadata: { nextRetryAt, online, power },
          });

          return { ok: true, itemId: item.id, ran: stepName, scheduled: nextRetryAt };
        }

        const imageUrl = config?.userBaseImageUrl || null;
        if (!imageUrl) throw new Error("Pipeline config missing userBaseImageUrl");
        const template = config?.comfyVideoPromptTemplate || (defaultInfiniteTalkTemplate as any) || null;
        if (!template) throw new Error("Missing Infinite Talk template (config.comfyVideoPromptTemplate or default template file).");

        if (!item.audioUrl) throw new Error("audioUrl ausente");

        await prisma.coletaDadosShoppe.update({
          where: { id: item.id },
          data: { pipelineStatus: "GENERATING_COPY_VIDEO" as any, lastError: null },
        });

        await upsertPipelineStep({ coletaId: item.id, stepName, status: "RUNNING", attempt, startedAt });
        await logPipelineEvent({ coletaId: item.id, stepName, message: "Gerando video da copy via ComfyUI (Infinite Talk)" });

        const imgRes = await fetch(imageUrl, { method: "GET", cache: "no-store", signal: AbortSignal.timeout(30000) });
        if (!imgRes.ok) throw new Error(`Falha ao baixar userBaseImageUrl (HTTP ${imgRes.status})`);
        const imgBuf = Buffer.from(await imgRes.arrayBuffer());
        const imgType = imgRes.headers.get("content-type") || "image/png";

        const audRes = await fetch(item.audioUrl, { method: "GET", cache: "no-store", signal: AbortSignal.timeout(30000) });
        if (!audRes.ok) throw new Error(`Falha ao baixar audioUrl (HTTP ${audRes.status})`);
        const audBuf = Buffer.from(await audRes.arrayBuffer());
        const audType = audRes.headers.get("content-type") || "audio/mpeg";

        const uid = uuidv4().slice(0, 8);
        const outputPrefix = `video/shopee_copy_${item.id}_${uid}`;
        const seed = Math.floor(Math.random() * 1_000_000_000);

        // Placeholders esperados no template:
        // __IMG_FILENAME__  -> nome do arquivo de imagem no input do ComfyUI
        // __AUDIO_FILENAME__ -> nome do arquivo de audio no input do ComfyUI
        // __OUTPUT_PREFIX__ -> prefixo para salvar output no ComfyUI
        // __SEED__ -> seed do sampler (se aplicavel)
        const generated = await generateVideoFromTemplate({
          template,
          replacements: { "__OUTPUT_PREFIX__": outputPrefix, "__SEED__": seed },
          inputFiles: [
            { buffer: imgBuf, filename: `base_${item.id}.png`, contentType: imgType, placeholderKey: "__IMG_FILENAME__" },
            { buffer: audBuf, filename: `audio_${item.id}.mp3`, contentType: audType, placeholderKey: "__AUDIO_FILENAME__" },
          ],
          timeoutMs: 45 * 60 * 1000,
        });

        const minioKey = `shopee/videos-copy/copy_${item.id}_${Date.now()}.mp4`;
        const copyVideoUrl = await uploadBufferToMinio({ buffer: generated.buffer, key: minioKey, contentType: "video/mp4" });

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
            outputPrefix,
            promptId: generated.promptId,
            prompt: safeTruncateJson(generated.prompt, 20000),
            uploadMeta: generated.uploadMeta,
          },
          responsePayload: {
            promptId: generated.promptId,
            outputFiles: generated.files,
            outputFile: generated.file,
            history: safeTruncateJson(generated.history, 50000),
            uploadMeta: generated.uploadMeta,
          },
        });

        await prisma.coletaDadosShoppe.update({
          where: { id: item.id },
          data: { copyVideoUrl, pipelineStatus: "COPY_VIDEO_READY" as any, nextRunAt: null, lastError: null },
        });

        const lastSession = await prisma.podSession.findFirst({ orderBy: { updatedAt: "desc" } });
        if (lastSession) {
          await prisma.podSession.update({ where: { id: lastSession.id }, data: { status: "IDLE" as any, lastActivityAt: finishedAt } });
        }

        await logPipelineEvent({ coletaId: item.id, stepName, message: "Video da copy gerado e salvo no MinIO.", metadata: { copyVideoUrl } });
        return { ok: true, itemId: item.id, ran: stepName, copyVideoUrl };
      } catch (error: any) {
        const message = error?.message || "Falha ao gerar video da copy";
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
          metadata: { error: message, nextRetryAt: retryDecision.nextRetryAt },
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
          requestPayload: { originalVideoUrl: item.mediaVideoUrls?.[0] || null, copyVideoUrl: item.copyVideoUrl || null },
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
