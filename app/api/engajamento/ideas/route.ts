import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalize(value: unknown) {
  return String(value || "").trim();
}

export async function GET(req: NextRequest) {
  const status = normalize(req.nextUrl.searchParams.get("status") || "");
  const coletaId = normalize(req.nextUrl.searchParams.get("coletaId") || "");
  const take = Math.min(200, Math.max(10, Number(req.nextUrl.searchParams.get("take") || 50)));

  const where: any = {};
  if (status) where.status = status;
  if (coletaId) where.coletaId = coletaId;

  const items = await prisma.engagementIdea.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take,
    include: { coleta: { select: { id: true, titulo: true } } },
  });

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const templateType = normalize(body?.templateType);
    const hook = normalize(body?.hook);
    const script = normalize(body?.script);
    const coletaId = body?.coletaId ? normalize(body.coletaId) : null;
    const personaName = body?.personaName ? normalize(body.personaName) : null;
    const creatorImageUrl = body?.creatorImageUrl ? normalize(body.creatorImageUrl) : null;
    const onScreenText = Array.isArray(body?.onScreenText) ? body.onScreenText : [];
    const ctaComment = body?.ctaComment ? normalize(body.ctaComment) : null;

    if (!templateType) return NextResponse.json({ error: "templateType is required" }, { status: 400 });
    if (!hook) return NextResponse.json({ error: "hook is required" }, { status: 400 });
    if (!script) return NextResponse.json({ error: "script is required" }, { status: 400 });

    const created = await prisma.engagementIdea.create({
      data: {
        coletaId: coletaId || null,
        templateType,
        personaName,
        hook,
        script,
        onScreenText: onScreenText as any,
        ctaComment,
        creatorImageUrl,
        status: "DRAFT",
      },
    });

    return NextResponse.json({ ok: true, item: created });
  } catch (error: any) {
    console.error("[api/engajamento/ideas POST]", error);
    return NextResponse.json({ error: error?.message || "Falha ao criar ideia" }, { status: 500 });
  }
}

