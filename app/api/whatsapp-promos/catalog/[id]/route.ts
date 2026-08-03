import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireServerSession } from "@/lib/serverAuth";
import {
  computePromoFields,
  ensureUniqueWhatsappPromoSlug,
  isCatalogItemReady,
  normalizeText,
  parsePrice,
} from "@/lib/whatsappPromos";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireServerSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const id = normalizeText(params.id);
    const body = await req.json().catch(() => ({}));
    const existing = await prisma.whatsappPromoCatalogItem.findUnique({
      where: { id },
      include: { productCatalog: true },
    });
    if (!existing) return NextResponse.json({ error: "Item nao encontrado." }, { status: 404 });

    const title = body.title !== undefined ? normalizeText(body.title) : existing.title;
    const affiliateUrl = body.affiliateUrl !== undefined ? normalizeText(body.affiliateUrl) : existing.affiliateUrl;
    const description = body.description !== undefined ? normalizeText(body.description) || null : existing.description;
    const imageUrl = body.imageUrl !== undefined ? normalizeText(body.imageUrl) || null : existing.imageUrl;
    const category = body.category !== undefined ? normalizeText(body.category) || null : existing.category;
    const productUrl = body.productUrl !== undefined ? normalizeText(body.productUrl) || null : existing.productUrl;
    const oldPrice = body.oldPrice !== undefined ? parsePrice(body.oldPrice) : existing.oldPrice;
    const currentPrice = body.currentPrice !== undefined ? parsePrice(body.currentPrice) : existing.currentPrice;
    const active = typeof body.active === "boolean" ? body.active : existing.active;
    const slug = body.slug !== undefined ? await ensureUniqueWhatsappPromoSlug(body.slug || title, existing.id) : existing.slug;
    const { discountPercent, savingsAmount } = computePromoFields(oldPrice, currentPrice);
    const readyForPublish = isCatalogItemReady({ imageUrl, category, affiliateUrl, currentPrice, active });

    const productCatalog = existing.productCatalogId
      ? await prisma.productCatalog.update({
          where: { id: existing.productCatalogId },
          data: {
            name: title,
            description,
            productUrl,
            affiliateUrl,
            imageUrl,
            price: currentPrice,
            category,
            status: active ? "ACTIVE" : "PAUSED",
          },
        })
      : await prisma.productCatalog.create({
          data: {
            name: title,
            slug: `${slug}-catalog`,
            description,
            productUrl,
            affiliateUrl,
            imageUrl,
            price: currentPrice,
            category,
            status: active ? "ACTIVE" : "PAUSED",
          },
        });

    const item = await prisma.whatsappPromoCatalogItem.update({
      where: { id },
      data: {
        productCatalogId: productCatalog.id,
        title,
        slug,
        description,
        imageUrl,
        category,
        affiliateUrl,
        productUrl,
        oldPrice,
        currentPrice,
        discountPercent,
        savingsAmount,
        active,
        readyForPublish,
      },
      include: { productCatalog: { select: { id: true, name: true, slug: true } }, _count: { select: { posts: true } } },
    });

    return NextResponse.json({ item });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Falha ao atualizar item" }, { status: 500 });
  }
}
