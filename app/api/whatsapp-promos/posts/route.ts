import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateCrmSettings } from "@/lib/crmSettings";
import { requireServerSession } from "@/lib/serverAuth";
import {
  buildPromoBody,
  buildPromoHeadline,
  normalizeText,
} from "@/lib/whatsappPromos";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await requireServerSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = normalizeText(req.nextUrl.searchParams.get("status") || "ALL");
  const catalogItemId = normalizeText(req.nextUrl.searchParams.get("catalogItemId"));
  const where: any = {};
  if (status !== "ALL") where.status = status;
  if (catalogItemId) where.catalogItemId = catalogItemId;

  const items = await prisma.whatsappPromoPost.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { scheduledTo: "asc" }],
    take: catalogItemId ? 50 : 300,
    include: {
      catalogItem: {
        select: {
          id: true,
          title: true,
          slug: true,
          imageUrl: true,
          affiliateUrl: true,
          oldPrice: true,
          currentPrice: true,
          discountPercent: true,
          savingsAmount: true,
        },
      },
    },
  });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await requireServerSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const settings = await getOrCreateCrmSettings();
    const body = await req.json().catch(() => ({}));
    const catalogItemId = normalizeText(body.catalogItemId);
    if (!catalogItemId) return NextResponse.json({ error: "Item do catalogo nao informado." }, { status: 400 });

    const catalogItem = await prisma.whatsappPromoCatalogItem.findUnique({ where: { id: catalogItemId } });
    if (!catalogItem) return NextResponse.json({ error: "Item do catalogo nao encontrado." }, { status: 404 });

    const linkUrl = normalizeText(body.linkUrl) || catalogItem.affiliateUrl;
    const headline = normalizeText(body.headline) || buildPromoHeadline(catalogItem.title, catalogItem.discountPercent);
    const bodyText =
      normalizeText(body.bodyText) ||
      buildPromoBody({
        title: catalogItem.title,
        shortPhrase: catalogItem.description,
        oldPrice: catalogItem.oldPrice,
        currentPrice: catalogItem.currentPrice,
        discountPercent: catalogItem.discountPercent,
        savingsAmount: catalogItem.savingsAmount,
        linkUrl,
      });

    const status = body.sendNow ? "APPROVED" : (body.status || (settings.offersRequireApproval ? "DRAFT" : "APPROVED"));
    const post = await prisma.whatsappPromoPost.create({
      data: {
        catalogItemId,
        status,
        headline,
        bodyText,
        linkUrl,
        mediaUrl: catalogItem.imageUrl || null,
        scheduledTo: body.scheduledTo ? new Date(String(body.scheduledTo)) : null,
        targetId: normalizeText(body.targetId) || settings.offersGroupTargetId || null,
      },
      include: { catalogItem: true },
    });
    return NextResponse.json({ post });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Falha ao criar postagem" }, { status: 500 });
  }
}
