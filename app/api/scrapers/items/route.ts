import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const platform = searchParams.get("platform"); // "SHOPEE" | "MERCADO_LIVRE"
    const status = searchParams.get("status");
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.max(1, Math.min(100, Number(searchParams.get("limit") || 10)));
    const skip = (page - 1) * limit;

    const shopeeWhere: any = {};
    const mlWhere: any = {};

    if (status) {
      shopeeWhere.status = status;
      mlWhere.status = status;
    }

    let items: any[] = [];
    let total = 0;

    if (platform === "SHOPEE") {
      const [shopeeItems, shopeeCount] = await Promise.all([
        prisma.shopeeAffiliatePick.findMany({
          where: shopeeWhere,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.shopeeAffiliatePick.count({ where: shopeeWhere }),
      ]);
      items = shopeeItems.map((item) => ({ ...item, platform: "SHOPEE" }));
      total = shopeeCount;
    } else if (platform === "MERCADO_LIVRE") {
      const [mlItems, mlCount] = await Promise.all([
        prisma.mercadoLivreAffiliatePick.findMany({
          where: mlWhere,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.mercadoLivreAffiliatePick.count({ where: mlWhere }),
      ]);
      items = mlItems.map((item) => ({ ...item, platform: "MERCADO_LIVRE" }));
      total = mlCount;
    } else {
      // Fetch both and combine them
      // To paginate correctly when both are requested, we fetch limits from both and sort/slice, or we fetch a page of each.
      // Since it's simpler, let's fetch a list from both and sort, or slice.
      const [shopeeItems, mlItems] = await Promise.all([
        prisma.shopeeAffiliatePick.findMany({
          where: shopeeWhere,
          orderBy: { createdAt: "desc" },
          take: skip + limit,
        }),
        prisma.mercadoLivreAffiliatePick.findMany({
          where: mlWhere,
          orderBy: { createdAt: "desc" },
          take: skip + limit,
        }),
      ]);

      const combined = [
        ...shopeeItems.map((item) => ({ ...item, platform: "SHOPEE" })),
        ...mlItems.map((item) => ({ ...item, platform: "MERCADO_LIVRE" })),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      items = combined.slice(skip, skip + limit);
      const [shopeeCount, mlCount] = await Promise.all([
        prisma.shopeeAffiliatePick.count({ where: shopeeWhere }),
        prisma.mercadoLivreAffiliatePick.count({ where: mlWhere }),
      ]);
      total = shopeeCount + mlCount;
    }

    return NextResponse.json({
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("[api/scrapers/items GET]", error);
    return NextResponse.json({ error: error.message || "Failed to fetch scraper items" }, { status: 500 });
  }
}
