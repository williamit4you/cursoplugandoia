import { prisma } from "@/lib/prisma";
import { runShopeePipelineOnce } from "@/lib/shopee-pipeline/orchestrator";

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
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
