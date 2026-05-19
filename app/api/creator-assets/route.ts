import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalize(value: unknown) {
  return String(value || "").trim();
}

export async function GET(req: NextRequest) {
  const active = normalize(req.nextUrl.searchParams.get("active") || "true").toLowerCase();
  const where: any = {};
  if (active === "true") where.active = true;
  if (active === "false") where.active = false;

  const items = await prisma.creatorAsset.findMany({
    where,
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
    take: 200,
  });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const url = normalize(body?.url);
    const label = body?.label ? normalize(body.label) : null;
    if (!url) return NextResponse.json({ error: "url is required" }, { status: 400 });

    const created = await prisma.creatorAsset.upsert({
      where: { url },
      update: { label: label || undefined, active: true },
      create: { url, label: label || null, kind: "IMAGE", active: true },
    });

    return NextResponse.json({ ok: true, item: created });
  } catch (error: any) {
    console.error("[api/creator-assets POST]", error);
    return NextResponse.json({ error: error?.message || "Falha ao salvar" }, { status: 500 });
  }
}

