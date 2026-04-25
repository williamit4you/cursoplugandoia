import { NextRequest, NextResponse } from "next/server";
import { getChannels } from "@/lib/youtubeAnalyticsRepo";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const filters = {
      search: searchParams.get("search") || undefined,
      categoryId: searchParams.get("categoryId") || undefined,
      sortBy: searchParams.get("sortBy") || "rankPosition",
      sortOrder: (searchParams.get("sortOrder") || "asc") as "asc" | "desc",
      page: parseInt(searchParams.get("page") || "1", 10),
      pageSize: parseInt(searchParams.get("pageSize") || "20", 10),
    };

    const result = await getChannels(filters);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Channels list error:", error);
    return NextResponse.json(
      { error: "Falha ao buscar canais" },
      { status: 500 }
    );
  }
}
