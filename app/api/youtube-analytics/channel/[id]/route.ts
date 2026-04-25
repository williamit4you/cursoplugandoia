import { NextRequest, NextResponse } from "next/server";
import { getChannelById } from "@/lib/youtubeAnalyticsRepo";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const result = await getChannelById(id);

    if (!result) {
      return NextResponse.json(
        { error: "Canal não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Channel detail error:", error);
    return NextResponse.json(
      { error: "Falha ao buscar detalhe do canal" },
      { status: 500 }
    );
  }
}
