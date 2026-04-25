import { NextRequest, NextResponse } from "next/server";
import { getDashboardKPIs, getCategories } from "@/lib/youtubeAnalyticsRepo";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId") || undefined;

    const [kpis, categories] = await Promise.all([
      getDashboardKPIs(categoryId),
      getCategories(),
    ]);

    return NextResponse.json({ ...kpis, categories });
  } catch (error: any) {
    console.error("Dashboard KPIs error:", error);
    return NextResponse.json(
      { error: "Falha ao buscar KPIs do dashboard" },
      { status: 500 }
    );
  }
}
