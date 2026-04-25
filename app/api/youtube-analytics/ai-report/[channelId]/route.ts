import { NextRequest, NextResponse } from "next/server";
import { getChannelById, saveAiReport, getLatestAiReport } from "@/lib/youtubeAnalyticsRepo";
import { generateChannelReport } from "@/lib/youtubeAiService";

export const dynamic = "force-dynamic";

// GET — Buscar último relatório existente
export async function GET(
  req: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    const report = await getLatestAiReport(params.channelId);
    if (!report) {
      return NextResponse.json(
        { error: "Nenhum relatório encontrado para este canal" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...report,
      insights: JSON.parse(report.insights),
      recommendations: JSON.parse(report.recommendations),
    });
  } catch (error: any) {
    console.error("AI Report GET error:", error);
    return NextResponse.json(
      { error: "Falha ao buscar relatório" },
      { status: 500 }
    );
  }
}

// POST — Gerar novo relatório com IA
export async function POST(
  req: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    const channelResult = await getChannelById(params.channelId);
    if (!channelResult) {
      return NextResponse.json(
        { error: "Canal não encontrado" },
        { status: 404 }
      );
    }

    const { channel } = channelResult;

    const reportData = await generateChannelReport({
      name: channel.name,
      category: channel.category?.name || "N/A",
      subscribers: channel.subscribers,
      totalViews: channel.totalViews,
      totalVideos: channel.totalVideos,
      viewsShorts: channel.viewsShorts,
      viewsLongs: channel.viewsLongs,
      weeklyGrowth: channel.weeklyGrowth,
      monthlyGrowth: channel.monthlyGrowth,
      uploadsThisWeek: channel.uploadsThisWeek,
      uploadsThisMonth: channel.uploadsThisMonth,
      livesPerMonth: channel.livesPerMonth,
      lastVideoAt: channel.lastVideoAt?.toISOString() || null,
      recentVideos: channel.videos.map((v: any) => ({
        title: v.title,
        videoType: v.videoType,
        views: v.views,
        likes: v.likes,
        publishedAt: v.publishedAt.toISOString(),
      })),
    });

    const saved = await saveAiReport(params.channelId, reportData);

    return NextResponse.json({
      ...saved,
      insights: JSON.parse(saved.insights),
      recommendations: JSON.parse(saved.recommendations),
    });
  } catch (error: any) {
    console.error("AI Report POST error:", error);
    return NextResponse.json(
      { error: "Falha ao gerar relatório IA", details: error.message },
      { status: 500 }
    );
  }
}
