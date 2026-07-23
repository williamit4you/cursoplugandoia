import { registerSocialCronError, runSocialCron } from "@/lib/socialCronRunner";
import { finishOperationRun, startOperationRun } from "@/lib/operationObservability";

declare global {
  // eslint-disable-next-line no-var
  var __plugandoSocialInternalCronStarted: boolean | undefined;
  // eslint-disable-next-line no-var
  var __plugandoSocialInternalCronRunning: boolean | undefined;
  // eslint-disable-next-line no-var
  var __plugandoSocialInternalCronLastTickAt: string | undefined;
  // eslint-disable-next-line no-var
  var __plugandoSocialInternalCronLastResult: any;
  // eslint-disable-next-line no-var
  var __plugandoSocialInternalCronLastError: string | undefined;
}

function shouldStartInternalCron() {
  const value = String(process.env.INTERNAL_CRON_ENABLED || "").trim().toLowerCase();
  if (["0", "false", "no", "off"].includes(value)) return false;
  if (["1", "true", "yes", "on"].includes(value)) return true;
  return true;
}

function tickMs() {
  const configured = Number(process.env.INTERNAL_SOCIAL_CRON_TICK_MS || process.env.INTERNAL_CRON_TICK_MS || 60_000);
  return Math.max(15_000, Number.isFinite(configured) ? configured : 60_000);
}

function resolveInternalBaseUrl() {
  const explicit =
    process.env.INTERNAL_BASE_URL ||
    process.env.APP_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.SITE_URL;

  if (explicit) return String(explicit).trim().replace(/\/+$/, "");

  const port = String(process.env.PORT || "3000").trim() || "3000";
  return `http://127.0.0.1:${port}`;
}

async function runInternalCronTick() {
  if (globalThis.__plugandoSocialInternalCronRunning) return;
  globalThis.__plugandoSocialInternalCronRunning = true;

  const operation = await startOperationRun("SOCIAL_PUBLISHER", { trigger: "internal_scheduler" });
  try {
    globalThis.__plugandoSocialInternalCronLastTickAt = new Date().toISOString();
    const result = await runSocialCron({ baseUrl: resolveInternalBaseUrl() });
    globalThis.__plugandoSocialInternalCronLastResult = result;
    globalThis.__plugandoSocialInternalCronLastError = undefined;
    if (result.checked > 0) {
      console.log("[internal-cron] Social queue executada", {
        checked: result.checked,
        results: result.results?.length || 0,
      });
    }
    const failed = Array.isArray(result.results) ? result.results.filter((item: any) => item?.ok === false).length : 0;
    await finishOperationRun(operation?.runId, {
      status: failed > 0 ? "PARTIAL" : "SUCCESS",
      itemsFound: result.checked,
      itemsProcessed: result.checked,
      itemsSucceeded: Math.max(0, result.checked - failed),
      itemsFailed: failed,
      metadata: { trigger: "internal_scheduler" },
    });
  } catch (error: any) {
    globalThis.__plugandoSocialInternalCronLastError = registerSocialCronError(error);
    console.error("[internal-cron] Falha no social cron", error?.message || error);
    await finishOperationRun(operation?.runId, { status: "FAILED", errorMessage: error?.message || String(error) });
  } finally {
    globalThis.__plugandoSocialInternalCronRunning = false;
  }
}

export function startInternalSocialCronScheduler() {
  if (!shouldStartInternalCron()) return;
  if (globalThis.__plugandoSocialInternalCronStarted) return;
  globalThis.__plugandoSocialInternalCronStarted = true;

  const intervalMs = tickMs();
  console.log(`[internal-cron] Social queue ativa. Verificando publicacoes a cada ${Math.round(intervalMs / 1000)}s.`);

  setTimeout(() => {
    void runInternalCronTick();
  }, 15_000);

  setInterval(() => {
    void runInternalCronTick();
  }, intervalMs);
}

export function getInternalSocialCronSchedulerStatus() {
  return {
    enabled: shouldStartInternalCron(),
    started: Boolean(globalThis.__plugandoSocialInternalCronStarted),
    running: Boolean(globalThis.__plugandoSocialInternalCronRunning),
    tickMs: tickMs(),
    baseUrl: resolveInternalBaseUrl(),
    lastTickAt: globalThis.__plugandoSocialInternalCronLastTickAt || null,
    lastResult: globalThis.__plugandoSocialInternalCronLastResult || null,
    lastError: globalThis.__plugandoSocialInternalCronLastError || null,
  };
}
