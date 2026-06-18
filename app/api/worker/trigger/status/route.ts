import { NextRequest, NextResponse } from "next/server";

import { listManualScrapeRuns } from "@/lib/manualScrapeTest";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const limit = Math.min(10, Math.max(1, Number(req.nextUrl.searchParams.get("limit") || 5)));
    const runs = await listManualScrapeRuns(limit);
    return NextResponse.json({ items: runs });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch trigger status" }, { status: 500 });
  }
}
