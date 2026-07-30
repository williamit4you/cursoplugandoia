import { runCommerceEditorialOnce } from "@/lib/commerce-editorial/pipeline";

type SchedulerState = {
  startedAt: string;
  tickMs: number;
  running: boolean;
  lastTickAt: string | null;
  lastResult: unknown;
};

const globalState = globalThis as typeof globalThis & {
  __commerceEditorialScheduler?: SchedulerState;
  __commerceEditorialTimer?: NodeJS.Timeout;
};

function enabled() {
  return ["1", "true", "yes", "on"].includes(String(process.env.INTERNAL_CRON_ENABLED || "").trim().toLowerCase());
}

export function startInternalCronSchedulerCommerceEditorial() {
  if (!enabled() || globalState.__commerceEditorialTimer) return;
  const tickMs = Math.max(60_000, Number(process.env.COMMERCE_EDITORIAL_CRON_TICK_MS || 300_000));
  const state: SchedulerState = { startedAt: new Date().toISOString(), tickMs, running: false, lastTickAt: null, lastResult: null };
  globalState.__commerceEditorialScheduler = state;
  const tick = async () => {
    if (state.running) return;
    state.running = true;
    state.lastTickAt = new Date().toISOString();
    try {
      state.lastResult = await runCommerceEditorialOnce();
    } catch (error: any) {
      state.lastResult = { ok: false, error: error?.message || String(error) };
      console.error("[internal-cron] Falha na automação editorial", error);
    } finally {
      state.running = false;
    }
  };
  globalState.__commerceEditorialTimer = setInterval(tick, tickMs);
  globalState.__commerceEditorialTimer.unref?.();
  void tick();
  console.log(`[internal-cron] Automação editorial ativa; verificação a cada ${Math.round(tickMs / 1000)}s.`);
}
