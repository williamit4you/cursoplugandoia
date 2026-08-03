import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireServerSession } from "@/lib/serverAuth";
import {
  computePromoFields,
  ensureUniqueWhatsappPromoSlug,
  inferOldPrice,
  isCatalogItemReady,
  normalizeText,
  parsePrice,
} from "@/lib/whatsappPromos";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await requireServerSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = normalizeText(req.nextUrl.searchParams.get("q"));
  const status = normalizeText(req.nextUrl.searchParams.get("status") || "ALL");
  const workflow = normalizeText(req.nextUrl.searchParams.get("workflow") || "ALL");

  const where: any = {};
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
      { category: { contains: q, mode: "insensitive" } },
      { sourceOfferName: { contains: q, mode: "insensitive" } },
    ];
  }
  if (status === "READY") where.readyForPublish = true;
  if (status === "PENDING") where.readyForPublish = false;
  if (status === "ACTIVE") where.active = true;
  if (status === "INACTIVE") where.active = false;
  if (workflow === "NEEDS_SCHEDULE") {
    where.readyForPublish = true;
    where.posts = { none: { status: { in: ["SCHEDULED", "SENT"] } } };
  }
  if (workflow === "SCHEDULED") where.posts = { some: { status: "SCHEDULED" } };
  if (workflow === "SENT") where.posts = { some: { status: "SENT" } };
  if (workflow === "FAILED") where.posts = { some: { status: "FAILED" } };

  const items = await prisma.whatsappPromoCatalogItem.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }],
    take: 1000,
    include: {
      productCatalog: {
        select: { id: true, name: true, slug: true },
      },
      posts: {
        select: { id: true, status: true, scheduledTo: true, sentAt: true, createdAt: true },
        orderBy: [{ createdAt: "desc" }],
        take: 10,
      },
      _count: {
        select: { posts: true },
      },
    },
  });

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await requireServerSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    const title = normalizeText(body.title);
    const affiliateUrl = normalizeText(body.affiliateUrl);
    if (!title || !affiliateUrl) {
      return NextResponse.json({ error: "Titulo e link afiliado sao obrigatorios." }, { status: 400 });
    }

    const description = normalizeText(body.description) || null;
    const imageUrl = normalizeText(body.imageUrl) || null;
    const category = normalizeText(body.category) || null;
    const productUrl = normalizeText(body.productUrl) || null;
    const rawOldPrice = parsePrice(body.oldPrice);
    const currentPrice = parsePrice(body.currentPrice);
    const oldPrice = inferOldPrice(currentPrice, rawOldPrice);
    const slug = await ensureUniqueWhatsappPromoSlug(body.slug || title);
    const { discountPercent, savingsAmount } = computePromoFields(oldPrice, currentPrice);

    const productCatalog = await prisma.productCatalog.create({
      data: {
        name: title,
        slug: `${slug}-catalog`,
        description,
        productUrl,
        affiliateUrl,
        imageUrl,
        price: currentPrice,
        category,
        status: "ACTIVE",
      },
    });

    const item = await prisma.whatsappPromoCatalogItem.create({
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
        sourceType: "MANUAL",
        active: true,
        readyForPublish: isCatalogItemReady({ category, affiliateUrl, currentPrice, active: true }),
      },
      include: { productCatalog: { select: { id: true, name: true, slug: true } }, _count: { select: { posts: true } } },
    });

    return NextResponse.json({ item });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Falha ao criar item promocional" }, { status: 500 });
  }
}
