import { NextRequest, NextResponse } from "next/server";
import { getPageKeyFromRequest, getRangeFromRequest } from "@/lib/salesAnalyticsServer";
import { getSalesAnalyticsRecentEvents } from "@/lib/salesAnalyticsQueries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const pageKey = getPageKeyFromRequest(req);
    const range = getRangeFromRequest(req);
    const items = await getSalesAnalyticsRecentEvents({ pageKey, range });
    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("[api/admin/sales-analytics/events GET]", error);
    return NextResponse.json({ error: error?.message || "Falha ao carregar eventos recentes da landing" }, { status: 500 });
  }
}
