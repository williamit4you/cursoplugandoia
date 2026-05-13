import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runShopeePipelineOnce } from "@/lib/shopee-pipeline/orchestrator";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 900;

export async function GET(req: NextRequest) {
  try {
    const secret = req.nextUrl.searchParams.get("secret");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && secret !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const config = await prisma.shopeePipelineConfig.findFirst({ orderBy: { createdAt: "desc" } });
    if (!config || !config.enabled) {
      return NextResponse.json({ ok: true, skipped: true, reason: "Shopee pipeline disabled" });
    }

    const runs: any[] = [];
    const maxItems = Math.max(1, Math.min(10, Number(config.maxItemsPerRun || 1)));

    for (let i = 0; i < maxItems; i++) {
      const res = await runShopeePipelineOnce();
      runs.push(res);
      if (res?.skipped) break;
    }

    return NextResponse.json({ ok: true, runs });
  } catch (error: any) {
    console.error("[api/shopee-pipeline/cron GET]", error);
    return NextResponse.json({ error: error?.message || "Falha no cron Shopee pipeline" }, { status: 500 });
  }
}

