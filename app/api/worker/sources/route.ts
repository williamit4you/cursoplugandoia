import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { consumeManualScrapeTrigger } from "@/lib/manualScrapeTest";

export async function GET(_req: NextRequest) {
  try {
    const urls = await prisma.scrapingSource.findMany({
      where: { isActive: true },
      select: { id: true, url: true, name: true },
    });

    const trigger = await consumeManualScrapeTrigger();

    return NextResponse.json({
      sources: urls,
      trigger_now: trigger.trigger_now,
      trigger_run_id: trigger.runId,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to supply sources" }, { status: 500 });
  }
}
