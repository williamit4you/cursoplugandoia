import { runShopeePipelineCron } from "@/lib/shopee-pipeline/cronRunner";

declare global {
  // eslint-disable-next-line no-var
  var __plugandoShopeeInternalCronStarted: boolean | undefined;
  // eslint-disable-next-line no-var
  var __plugandoShopeeInternalCronRunning: boolean | undefined;
}

function shouldStartInternalCron() {
  const value = String(process.env.INTERNAL_CRON_ENABLED || "").trim().toLowerCase();
  if (["0", "false", "no", "off"].includes(value)) return false;
  if (["1", "true", "yes", "on"].includes(value)) return true;
  return process.env.NODE_ENV === "production";
}

function tickMs() {
  const configured = Number(process.env.INTERNAL_CRON_TICK_MS || 60_000);
  return Math.max(15_000, Number.isFinite(configured) ? configured : 60_000);
}

async function runInternalCronTick() {
  if (globalThis.__plugandoShopeeInternalCronRunning) return;
  globalThis.__plugandoShopeeInternalCronRunning = true;

  try {
    const result = await runShopeePipelineCron();
    if (!result?.skipped) {
      console.log("[internal-cron] Shopee pipeline executado", {
        nextCronRunAt: result?.nextCronRunAt,
        runs: result?.runs?.length || 0,
      });
    }
  } catch (error: any) {
    console.error("[internal-cron] Falha no Shopee pipeline", error?.message || error);
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
