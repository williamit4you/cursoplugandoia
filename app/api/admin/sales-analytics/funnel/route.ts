import { NextRequest, NextResponse } from "next/server";
import { getPageKeyFromRequest, getRangeFromRequest } from "@/lib/salesAnalyticsServer";
import { getSalesAnalyticsFunnel } from "@/lib/salesAnalyticsQueries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const pageKey = getPageKeyFromRequest(req);
    const range = getRangeFromRequest(req);
    const funnel = await getSalesAnalyticsFunnel({ pageKey, range });
    return NextResponse.json({ items: funnel });
  } catch (error: any) {
    console.error("[api/admin/sales-analytics/funnel GET]", error);
    return NextResponse.json({ error: error?.message || "Falha ao carregar funil da landing" }, { status: 500 });
  }
}
