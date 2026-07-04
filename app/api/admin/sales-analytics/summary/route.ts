import { NextRequest, NextResponse } from "next/server";
import { getPageKeyFromRequest, getRangeFromRequest } from "@/lib/salesAnalyticsServer";
import { getSalesAnalyticsSummary } from "@/lib/salesAnalyticsQueries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const pageKey = getPageKeyFromRequest(req);
    const range = getRangeFromRequest(req);
    const summary = await getSalesAnalyticsSummary({ pageKey, range });
    return NextResponse.json(summary);
  } catch (error: any) {
    console.error("[api/admin/sales-analytics/summary GET]", error);
    return NextResponse.json({ error: error?.message || "Falha ao carregar resumo da landing" }, { status: 500 });
  }
}
