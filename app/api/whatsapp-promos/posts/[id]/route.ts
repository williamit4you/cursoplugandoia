import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireServerSession } from "@/lib/serverAuth";
import { normalizeText } from "@/lib/whatsappPromos";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireServerSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const id = normalizeText(params.id);
    const body = await req.json().catch(() => ({}));
    const post = await prisma.whatsappPromoPost.update({
      where: { id },
      data: {
        status: body.status ?? undefined,
        headline: body.headline ?? undefined,
        bodyText: body.bodyText ?? undefined,
        linkUrl: body.linkUrl ?? undefined,
        mediaUrl: null,
        targetId: body.targetId !== undefined ? normalizeText(body.targetId) || null : undefined,
        scheduledTo: body.scheduledTo !== undefined ? (body.scheduledTo ? new Date(String(body.scheduledTo)) : null) : undefined,
        errorMessage: body.errorMessage ?? undefined,
      },
      include: { catalogItem: true },
    });
    return NextResponse.json({ post });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Falha ao atualizar postagem" }, { status: 500 });
  }
}
