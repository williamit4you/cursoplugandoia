import { runShopeePipelineCron } from "@/lib/shopee-pipeline/cronRunner";
import { finishOperationRun, startOperationRun } from "@/lib/operationObservability";

declare global {
  // eslint-disable-next-line no-var
  var __plugandoShopeeInternalCronStarted: boolean | undefined;
  // eslint-disable-next-line no-var
  var __plugandoShopeeInternalCronRunning: boolean | undefined;
  // eslint-disable-next-line no-var
  var __plugandoShopeeInternalCronLastTickAt: string | undefined;
  // eslint-disable-next-line no-var
  var __plugandoShopeeInternalCronLastResult: any;
  // eslint-disable-next-line no-var
  var __plugandoShopeeInternalCronLastError: string | undefined;
}

function shouldStartInternalCron() {
  const value = String(process.env.INTERNAL_CRON_ENABLED || "").trim().toLowerCase();
  if (["0", "false", "no", "off"].includes(value)) return false;
  if (["1", "true", "yes", "on"].includes(value)) return true;
  // A timer in a Next process is not durable in serverless environments. Use an
  // external cron by default and opt into this only on a persistent Node host.
  return false;
}

function tickMs() {
  const configured = Number(process.env.INTERNAL_CRON_TICK_MS || 60_000);
  return Math.max(15_000, Number.isFinite(configured) ? configured : 60_000);
}

async function runInternalCronTick() {
  if (globalThis.__plugandoShopeeInternalCronRunning) return;
  globalThis.__plugandoShopeeInternalCronRunning = true;

  const operation = await startOperationRun("SHOPEE_PIPELINE", { trigger: "internal_scheduler" });
  try {
    globalThis.__plugandoShopeeInternalCronLastTickAt = new Date().toISOString();
    const result = await runShopeePipelineCron();
    globalThis.__plugandoShopeeInternalCronLastResult = result;
    globalThis.__plugandoShopeeInternalCronLastError = undefined;
    if (!result?.skipped) {
      console.log("[internal-cron] Shopee pipeline executado", {
        nextCronRunAt: result?.nextCronRunAt,
        runs: (result as any)?.runs?.length || 0,
      });
    }
    await finishOperationRun(operation?.runId, {
      status: result?.skipped ? "SUCCESS" : "SUCCESS",
      itemsProcessed: Number((result as any)?.runs?.length || 0),
      metadata: { trigger: "internal_scheduler", skipped: Boolean(result?.skipped) },
    });
  } catch (error: any) {
    globalThis.__plugandoShopeeInternalCronLastError = error?.message || String(error);
    console.error("[internal-cron] Falha no Shopee pipeline", error?.message || error);
    await finishOperationRun(operation?.runId, { status: "FAILED", errorMessage: error?.message || String(error) });
  } finally {
    globalThis.__plugandoShopeeInternalCronRunning = false;
  }
}

export function startInternalCronScheduler() {
  if (!shouldStartInternalCron()) {
    console.log("[internal-cron] Desativado. Use INTERNAL_CRON_ENABLED=true para ligar.");
    return;
  }

  if (globalThis.__plugandoShopeeInternalCronStarted) return;
  globalThis.__plugandoShopeeInternalCronStarted = true;

  const intervalMs = tickMs();
  console.log(`[internal-cron] Ativo. Verificando Shopee pipeline a cada ${Math.round(intervalMs / 1000)}s.`);

  setTimeout(() => {
    void runInternalCronTick();
  }, 10_000);

  setInterval(() => {
    void runInternalCronTick();
  }, intervalMs);
}

export function getInternalCronSchedulerStatus() {
  return {
    enabled: shouldStartInternalCron(),
    started: Boolean(globalThis.__plugandoShopeeInternalCronStarted),
    running: Boolean(globalThis.__plugandoShopeeInternalCronRunning),
    tickMs: tickMs(),
    lastTickAt: globalThis.__plugandoShopeeInternalCronLastTickAt || null,
    lastResult: globalThis.__plugandoShopeeInternalCronLastResult || null,
    lastError: globalThis.__plugandoShopeeInternalCronLastError || null,
    env: {
      NODE_ENV: process.env.NODE_ENV || null,
      NEXT_RUNTIME: process.env.NEXT_RUNTIME || null,
      INTERNAL_CRON_ENABLED: process.env.INTERNAL_CRON_ENABLED || null,
      INTERNAL_CRON_TICK_MS: process.env.INTERNAL_CRON_TICK_MS || null,
    },
  };
}
