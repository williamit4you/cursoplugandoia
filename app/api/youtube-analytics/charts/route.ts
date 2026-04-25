import { NextRequest, NextResponse } from "next/server";
import { getChartData } from "@/lib/youtubeAnalyticsRepo";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const chartType = searchParams.get("type") || "evolution";
    const period = searchParams.get("period") || "30d";
    const categoryId = searchParams.get("categoryId") || undefined;
    const channelIds = searchParams.get("channelIds")?.split(",") || undefined;

    const data = await getChartData(chartType, {
      period,
      categoryId,
      channelIds,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Charts data error:", error);
    return NextResponse.json(
      { error: "Falha ao buscar dados de gráficos" },
      { status: 500 }
    );
  }
}
