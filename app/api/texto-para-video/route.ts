import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalize(value: unknown) {
  return String(value || "").trim();
}

export async function GET() {
  const items = await prisma.simpleCreatorVideo.findMany({
    orderBy: { createdAt: "desc" },
    take: 40,
  });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const narrationText = normalize(body?.narrationText);
    const creatorImageUrl = normalize(body?.creatorImageUrl);
    if (!narrationText) return NextResponse.json({ error: "narrationText is required" }, { status: 400 });
    if (!creatorImageUrl) return NextResponse.json({ error: "creatorImageUrl is required" }, { status: 400 });

    if (narrationText.length > 5000) {
      return NextResponse.json({ error: "Texto muito longo (máx 5000 caracteres no MVP)." }, { status: 400 });
    }

    const created = await prisma.simpleCreatorVideo.create({
      data: {
        narrationText,
        creatorImageUrl,
        status: "DRAFT",
      },
    });

    return NextResponse.json({ ok: true, item: created });
  } catch (error: any) {
    console.error("[api/texto-para-video POST]", error);
    return NextResponse.json({ error: error?.message || "Falha ao criar" }, { status: 500 });
  }
}

