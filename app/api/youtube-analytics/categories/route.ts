import { NextRequest, NextResponse } from "next/server";
import { getCategories } from "@/lib/youtubeAnalyticsRepo";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const categories = await getCategories();
    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error("Categories error:", error);
    return NextResponse.json(
      { error: "Falha ao buscar categorias" },
      { status: 500 }
    );
  }
}

