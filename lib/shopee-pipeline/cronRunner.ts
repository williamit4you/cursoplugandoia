import { prisma } from "@/lib/prisma";
import { runShopeePipelineOnce } from "@/lib/shopee-pipeline/orchestrator";

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function isUnreasonableFutureDate(params: { now: Date; dueAt: Date; intervalMinutes: number }) {
  const { now, dueAt, intervalMinutes } = params;
  const diffMs = dueAt.getTime() - now.getTime();
  if (diffMs <= 0) return false;

  // Normal: dueAt should be within ~1 interval. If it's much larger, assume clock skew or bad persisted schedule.
  const intervalMs = Math.max(1, intervalMinutes) * 60_000;
  const toleranceMs = Math.max(5 * 60_000, intervalMs * 2); // 5 minutes or 2x interval, whichever is larger
  return diffMs > toleranceMs;
}

export async function runShopeePipelineCron() {
  const config = await prisma.shopeePipelineConfig.findFirst({ orderBy: { createdAt: "desc" } });
  if (!config || !config.enabled) {
    return { ok: true, skipped: true, reason: "Shopee pipeline disabled" };
  }

  const current = new Date();
  const intervalMinutes = Math.max(1, Number(config.runEveryMinutes || 1));
  const dueAt = config.nextCronRunAt || (config.lastCronRunAt ? addMinutes(config.lastCronRunAt, intervalMinutes) : null);

  if (dueAt && dueAt.getTime() > current.getTime()) {
    // Auto-heal: if persisted nextCronRunAt/lastCronRunAt is far in the future (clock skew), reset schedule.
    if (isUnreasonableFutureDate({ now: current, dueAt, intervalMinutes })) {
      await prisma.shopeePipelineConfig.update({
        where: { id: config.id },
        data: { lastCronRunAt: null, nextCronRunAt: null },
      });
      return {
        ok: true,
        skipped: true,
        reason: "Cron schedule estava no futuro (clock skew). Resetado; tente novamente.",
        runEveryMinutes: intervalMinutes,
        lastCronRunAt: config.lastCronRunAt,
        nextCronRunAt: dueAt,
        scheduleReset: true,
      };
    }

    return {
      ok: true,
      skipped: true,
      reason: "Shopee pipeline cron ainda nao esta no horario",
      runEveryMinutes: intervalMinutes,
      lastCronRunAt: config.lastCronRunAt,
      nextCronRunAt: dueAt,
    };
  }

  const nextCronRunAt = addMinutes(current, intervalMinutes);
  await prisma.shopeePipelineConfig.update({
    where: { id: config.id },
    data: { lastCronRunAt: current, nextCronRunAt },
  });

  const runs: any[] = [];
  const maxItems = Math.max(1, Math.min(10, Number(config.maxItemsPerRun || 1)));

  for (let index = 0; index < maxItems; index++) {
    const res = await runShopeePipelineOnce();
    runs.push(res);
    if (res?.skipped) break;
  }

  return {
    ok: true,
    runEveryMinutes: intervalMinutes,
    lastCronRunAt: current,
    nextCronRunAt,
    runs,
  };
}
