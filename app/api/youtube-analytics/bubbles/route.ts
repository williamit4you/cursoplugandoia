import { NextRequest, NextResponse } from "next/server";
import { getBubbleData } from "@/lib/youtubeAnalyticsRepo";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sizeBy = searchParams.get("sizeBy") || "views";
    const categoryId = searchParams.get("categoryId") || undefined;

    const data = await getBubbleData(sizeBy, categoryId);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Bubble data error:", error);
    return NextResponse.json(
      { error: "Falha ao buscar dados de bolhas" },
      { status: 500 }
    );
  }
}
