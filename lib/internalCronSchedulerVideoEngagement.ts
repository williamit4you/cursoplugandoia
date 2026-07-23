import { runVideoEngagementCron } from "@/lib/video-engagement/cronRunner";
import { finishOperationRun, startOperationRun } from "@/lib/operationObservability";

declare global {
  // eslint-disable-next-line no-var
  var __plugandoVideoEngagementInternalCronStarted: boolean | undefined;
  // eslint-disable-next-line no-var
  var __plugandoVideoEngagementInternalCronRunning: boolean | undefined;
  // eslint-disable-next-line no-var
  var __plugandoVideoEngagementInternalCronLastTickAt: string | undefined;
  // eslint-disable-next-line no-var
  var __plugandoVideoEngagementInternalCronLastResult: any;
  // eslint-disable-next-line no-var
  var __plugandoVideoEngagementInternalCronLastError: string | undefined;
}

function shouldStartInternalCron() {
  const value = String(process.env.INTERNAL_CRON_ENABLED || "").trim().toLowerCase();
  if (["0", "false", "no", "off"].includes(value)) return false;
  if (["1", "true", "yes", "on"].includes(value)) return true;
  return true;
}

function tickMs() {
  const configured = Number(process.env.VIDEO_ENGAGEMENT_INTERNAL_CRON_TICK_MS || process.env.INTERNAL_CRON_TICK_MS || 60_000);
  return Math.max(15_000, Number.isFinite(configured) ? configured : 60_000);
}

async function runInternalCronTick() {
  if (globalThis.__plugandoVideoEngagementInternalCronRunning) return;
  globalThis.__plugandoVideoEngagementInternalCronRunning = true;
  const operation = await startOperationRun("VIDEO_ENGAGEMENT", { trigger: "internal_scheduler" });

  try {
    globalThis.__plugandoVideoEngagementInternalCronLastTickAt = new Date().toISOString();
    const result = await runVideoEngagementCron();
    globalThis.__plugandoVideoEngagementInternalCronLastResult = result;
    globalThis.__plugandoVideoEngagementInternalCronLastError = undefined;
    if (!result?.skipped) {
      console.log("[internal-cron] Video engagement executado", {
        runs: (result as any)?.runs?.length || 0,
      });
    }
    await finishOperationRun(operation?.runId, { status: "SUCCESS", itemsProcessed: Number((result as any)?.runs?.length || 0), metadata: { trigger: "internal_scheduler" } });
  } catch (error: any) {
    globalThis.__plugandoVideoEngagementInternalCronLastError = error?.message || String(error);
    console.error("[internal-cron] Falha no Video engagement", error?.message || error);
    await finishOperationRun(operation?.runId, { status: "FAILED", errorMessage: error?.message || String(error) });
  } finally {
    globalThis.__plugandoVideoEngagementInternalCronRunning = false;
  }
}

export function startInternalCronSchedulerVideoEngagement() {
  if (!shouldStartInternalCron()) {
    console.log("[internal-cron] Desativado. Use INTERNAL_CRON_ENABLED=true para ligar.");
    return;
  }

  if (globalThis.__plugandoVideoEngagementInternalCronStarted) return;
  globalThis.__plugandoVideoEngagementInternalCronStarted = true;

  const intervalMs = tickMs();
  console.log(`[internal-cron] Ativo. Verificando Video Engagement a cada ${Math.round(intervalMs / 1000)}s.`);

  setTimeout(() => {
    void runInternalCronTick();
  }, 10_000);

  setInterval(() => {
    void runInternalCronTick();
  }, intervalMs);
}

export function getInternalCronSchedulerStatusVideoEngagement() {
  return {
    enabled: shouldStartInternalCron(),
    started: Boolean(globalThis.__plugandoVideoEngagementInternalCronStarted),
    running: Boolean(globalThis.__plugandoVideoEngagementInternalCronRunning),
    tickMs: tickMs(),
    lastTickAt: globalThis.__plugandoVideoEngagementInternalCronLastTickAt || null,
    lastResult: globalThis.__plugandoVideoEngagementInternalCronLastResult || null,
    lastError: globalThis.__plugandoVideoEngagementInternalCronLastError || null,
    env: {
      NODE_ENV: process.env.NODE_ENV || null,
      NEXT_RUNTIME: process.env.NEXT_RUNTIME || null,
      INTERNAL_CRON_ENABLED: process.env.INTERNAL_CRON_ENABLED || null,
      VIDEO_ENGAGEMENT_INTERNAL_CRON_TICK_MS: process.env.VIDEO_ENGAGEMENT_INTERNAL_CRON_TICK_MS || null,
      VIDEO_ENGAGEMENT_CRON_ENABLED: process.env.VIDEO_ENGAGEMENT_CRON_ENABLED || null,
    },
  };
}
