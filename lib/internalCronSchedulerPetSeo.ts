import { runPetSeoOnce } from "@/lib/pet-seo/pipeline";

type State = { startedAt: string; tickMs: number; running: boolean; lastTickAt: string | null; lastResult: unknown };
const globalState = globalThis as typeof globalThis & { __petSeoScheduler?: State; __petSeoTimer?: NodeJS.Timeout };

function enabled() {
  return ["1", "true", "yes", "on"].includes(String(process.env.INTERNAL_CRON_ENABLED || "").trim().toLowerCase());
}

export function startInternalCronSchedulerPetSeo() {
  if (!enabled() || globalState.__petSeoTimer) return;
  const tickMs = Math.max(60_000, Number(process.env.PET_SEO_CRON_TICK_MS || 60_000));
  const state: State = { startedAt: new Date().toISOString(), tickMs, running: false, lastTickAt: null, lastResult: null };
  globalState.__petSeoScheduler = state;
  const tick = async () => {
    if (state.running) return;
    state.running = true;
    state.lastTickAt = new Date().toISOString();
    try { state.lastResult = await runPetSeoOnce(); }
    catch (error: any) { state.lastResult = { ok: false, error: error?.message || String(error) }; console.error("[pet-seo-cron]", error); }
    finally { state.running = false; }
  };
  globalState.__petSeoTimer = setInterval(tick, tickMs);
  globalState.__petSeoTimer.unref?.();
  void tick();
}

