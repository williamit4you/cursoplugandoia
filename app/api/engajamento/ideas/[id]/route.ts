import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalize(value: unknown) {
  return String(value || "").trim();
}

export async function GET(_: NextRequest, ctx: { params: { id: string } }) {
  const id = normalize(ctx?.params?.id);
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const item = await prisma.engagementIdea.findUnique({
    where: { id },
    include: { coleta: { select: { id: true, titulo: true } } },
  });
  if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const id = normalize(ctx?.params?.id);
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    const body = await req.json().catch(() => ({}));

    const data: any = {};
    if (body?.hook != null) data.hook = normalize(body.hook);
    if (body?.script != null) data.script = normalize(body.script);
    if (body?.ctaComment != null) data.ctaComment = body.ctaComment ? normalize(body.ctaComment) : null;
    if (body?.creatorImageUrl != null) data.creatorImageUrl = body.creatorImageUrl ? normalize(body.creatorImageUrl) : null;
    if (body?.status != null) data.status = normalize(body.status);
    if (body?.onScreenText != null) data.onScreenText = Array.isArray(body.onScreenText) ? (body.onScreenText as any) : [];

    const updated = await prisma.engagementIdea.update({ where: { id }, data });
    return NextResponse.json({ ok: true, item: updated });
  } catch (error: any) {
    console.error("[api/engajamento/ideas/[id] PATCH]", error);
    return NextResponse.json({ error: error?.message || "Falha ao atualizar" }, { status: 500 });
  }
}

