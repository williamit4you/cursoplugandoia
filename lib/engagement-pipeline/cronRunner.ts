import { prisma } from "@/lib/prisma";
import { runEngagementPipelineOnce } from "@/lib/engagement-pipeline/orchestrator";

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function isUnreasonableFutureDate(params: { now: Date; dueAt: Date; intervalMinutes: number }) {
  const { now, dueAt, intervalMinutes } = params;
  const diffMs = dueAt.getTime() - now.getTime();
  if (diffMs <= 0) return false;

  const intervalMs = Math.max(1, intervalMinutes) * 60_000;
  const toleranceMs = Math.max(5 * 60_000, intervalMs * 2);
  return diffMs > toleranceMs;
}

export async function runEngagementPipelineCron() {
  const config = await prisma.shopeePipelineConfig.findFirst({
    where: { pipelineKind: "ENGAGEMENT" as any },
    orderBy: { createdAt: "desc" },
  });
  if (!config || !config.enabled) {
    return { ok: true, skipped: true, reason: "Engagement pipeline disabled" };
  }

  const current = new Date();
  const intervalMinutes = Math.max(1, Number(config.runEveryMinutes || 1));
  const dueAt = config.nextCronRunAt || (config.lastCronRunAt ? addMinutes(config.lastCronRunAt, intervalMinutes) : null);

  if (dueAt && dueAt.getTime() > current.getTime()) {
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
      reason: "Engagement pipeline cron ainda nao esta no horario",
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
    const res = await runEngagementPipelineOnce();
    runs.push(res);
    if (res?.skipped) break;
  }

  const first = runs[0];
  const skipped = Boolean(first?.skipped);
  const reason = skipped ? String(first?.reason || "Nenhum item elegível encontrado agora") : undefined;

  return {
    ok: true,
    runEveryMinutes: intervalMinutes,
    lastCronRunAt: current,
    nextCronRunAt,
    runs,
    ...(skipped ? { skipped, reason } : {}),
  };
}
