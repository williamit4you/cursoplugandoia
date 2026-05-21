import { runEngagementPipelineCron } from "@/lib/engagement-pipeline/cronRunner";

declare global {
  // eslint-disable-next-line no-var
  var __plugandoEngagementInternalCronStarted: boolean | undefined;
  // eslint-disable-next-line no-var
  var __plugandoEngagementInternalCronRunning: boolean | undefined;
  // eslint-disable-next-line no-var
  var __plugandoEngagementInternalCronLastTickAt: string | undefined;
  // eslint-disable-next-line no-var
  var __plugandoEngagementInternalCronLastResult: any;
  // eslint-disable-next-line no-var
  var __plugandoEngagementInternalCronLastError: string | undefined;
}

function shouldStartInternalCron() {
  const value = String(process.env.INTERNAL_CRON_ENABLED || "").trim().toLowerCase();
  if (["0", "false", "no", "off"].includes(value)) return false;
  if (["1", "true", "yes", "on"].includes(value)) return true;
  return true;
}

function tickMs() {
  const configured = Number(process.env.INTERNAL_CRON_TICK_MS || 60_000);
  return Math.max(15_000, Number.isFinite(configured) ? configured : 60_000);
}

async function runInternalCronTick() {
  if (globalThis.__plugandoEngagementInternalCronRunning) return;
  globalThis.__plugandoEngagementInternalCronRunning = true;

  try {
    globalThis.__plugandoEngagementInternalCronLastTickAt = new Date().toISOString();
    const result = await runEngagementPipelineCron();
    globalThis.__plugandoEngagementInternalCronLastResult = result;
    globalThis.__plugandoEngagementInternalCronLastError = undefined;
    if (!result?.skipped) {
      console.log("[internal-cron] Engagement pipeline executado", {
        nextCronRunAt: result?.nextCronRunAt,
        runs: (result as any)?.runs?.length || 0,
      });
    }
  } catch (error: any) {
    globalThis.__plugandoEngagementInternalCronLastError = error?.message || String(error);
    console.error("[internal-cron] Falha no Engagement pipeline", error?.message || error);
  } finally {
    globalThis.__plugandoEngagementInternalCronRunning = false;
  }
}

export function startInternalCronSchedulerEngagement() {
  if (!shouldStartInternalCron()) {
    console.log("[internal-cron] Desativado. Use INTERNAL_CRON_ENABLED=true para ligar.");
    return;
  }

  if (globalThis.__plugandoEngagementInternalCronStarted) return;
  globalThis.__plugandoEngagementInternalCronStarted = true;

  const intervalMs = tickMs();
  console.log(`[internal-cron] Ativo. Verificando Engagement pipeline a cada ${Math.round(intervalMs / 1000)}s.`);

  setTimeout(() => {
    void runInternalCronTick();
  }, 10_000);

  setInterval(() => {
    void runInternalCronTick();
  }, intervalMs);
}

export function getInternalCronSchedulerStatusEngagement() {
  return {
    enabled: shouldStartInternalCron(),
    started: Boolean(globalThis.__plugandoEngagementInternalCronStarted),
    running: Boolean(globalThis.__plugandoEngagementInternalCronRunning),
    tickMs: tickMs(),
    lastTickAt: globalThis.__plugandoEngagementInternalCronLastTickAt || null,
    lastResult: globalThis.__plugandoEngagementInternalCronLastResult || null,
    lastError: globalThis.__plugandoEngagementInternalCronLastError || null,
    env: {
      NODE_ENV: process.env.NODE_ENV || null,
      NEXT_RUNTIME: process.env.NEXT_RUNTIME || null,
      INTERNAL_CRON_ENABLED: process.env.INTERNAL_CRON_ENABLED || null,
      INTERNAL_CRON_TICK_MS: process.env.INTERNAL_CRON_TICK_MS || null,
    },
  };
}
