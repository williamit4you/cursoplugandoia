import { NextRequest, NextResponse } from "next/server";
import { getAllChannelsForExport } from "@/lib/youtubeAnalyticsRepo";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId") || undefined;
    const format = searchParams.get("format") || "csv";

    const channels = await getAllChannelsForExport(categoryId);

    // Cabeçalho CSV
    const headers = [
      "Ranking",
      "Canal",
      "Nicho",
      "Inscritos",
      "Views Totais",
      "Views Shorts",
      "Views Longos",
      "Crescimento Semanal %",
      "Crescimento Mensal %",
      "Uploads/Semana",
      "Uploads/Mês",
      "Lives/Mês",
      "Última Postagem",
      "URL",
    ];

    const rows = channels.map((ch) => [
      ch.rankPosition,
      `"${ch.name.replace(/"/g, '""')}"`,
      `"${ch.category.name}"`,
      ch.subscribers.toString(),
      ch.totalViews.toString(),
      ch.viewsShorts.toString(),
      ch.viewsLongs.toString(),
      ch.weeklyGrowth,
      ch.monthlyGrowth,
      ch.uploadsThisWeek,
      ch.uploadsThisMonth,
      ch.livesPerMonth,
      ch.lastVideoAt ? ch.lastVideoAt.toISOString().split("T")[0] : "N/A",
      ch.customUrl || `https://youtube.com/channel/${ch.youtubeChannelId}`,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join(
      "\n"
    );

    // BOM for Excel UTF-8 compatibility
    const bom = "\uFEFF";
    const csvContent = bom + csv;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=youtube-analytics-${new Date().toISOString().split("T")[0]}.csv`,
      },
    });
  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Falha ao exportar dados" },
      { status: 500 }
    );
  }
}
