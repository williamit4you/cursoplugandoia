import { NextRequest, NextResponse } from "next/server";

import { createManualScrapeTestRun } from "@/lib/manualScrapeTest";

export async function POST(_req: NextRequest) {
  try {
    const run = await createManualScrapeTestRun();
    return NextResponse.json({
      success: true,
      message: "Manual scrape test queued",
      runId: run.id,
      status: run.status,
      summary: run.summary,
      steps: run.steps,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to trigger" }, { status: 500 });
  }
}
