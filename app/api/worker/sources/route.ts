import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { consumeManualScrapeTrigger } from "@/lib/manualScrapeTest";

export async function GET(_req: NextRequest) {
  try {
    const sources = await prisma.scrapingSource.findMany({
      where: { isActive: true },
      select: { id: true, url: true, name: true, lastScraped: true },
    });

    const orderedSources = [...sources].sort((a, b) => {
      const aTime = a.lastScraped ? new Date(a.lastScraped).getTime() : 0;
      const bTime = b.lastScraped ? new Date(b.lastScraped).getTime() : 0;

      if (aTime !== bTime) return aTime - bTime;
      return a.id.localeCompare(b.id);
    });

    const nextSource = orderedSources[0] ?? null;

    if (nextSource) {
      await prisma.scrapingSource.update({
        where: { id: nextSource.id },
        data: { lastScraped: new Date() },
      });
    }

    const trigger = await consumeManualScrapeTrigger();

    return NextResponse.json({
      sources: orderedSources.map(({ id, url, name }) => ({ id, url, name })),
      preferred_source_id: nextSource?.id ?? null,
      preferred_source_name: nextSource?.name ?? null,
      trigger_now: trigger.trigger_now,
      trigger_run_id: trigger.runId,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to supply sources" }, { status: 500 });
  }
}
