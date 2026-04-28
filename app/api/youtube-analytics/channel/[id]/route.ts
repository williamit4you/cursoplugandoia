import { NextRequest, NextResponse } from "next/server";
import { getChannelById } from "@/lib/youtubeAnalyticsRepo";
import { prisma } from "@/lib/prisma";

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

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json().catch(() => ({}));

    const data: any = {};
    if (typeof body.isActive === "boolean") data.isActive = body.isActive;
    if (typeof body.categoryId === "string" && body.categoryId.trim()) {
      data.categoryId = body.categoryId.trim();
    }
    if (typeof body.country === "string") {
      const c = body.country.trim().toUpperCase();
      data.country = c || null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const updated = await prisma.ytChannel.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, channel: updated });
  } catch (error: any) {
    console.error("Channel patch error:", error);
    return NextResponse.json(
      { error: "Falha ao atualizar canal" },
      { status: 500 }
    );
  }
}
