import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function normalize(value: unknown) {
  return String(value || "").trim();
}

function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

export async function GET(req: NextRequest) {
  try {
    const q = normalize(req.nextUrl.searchParams.get("q"));
    const active = normalize(req.nextUrl.searchParams.get("active") || "true").toLowerCase();

    const where: any = {};
    if (active === "true") where.active = true;
    if (active === "false") where.active = false;
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
      ];
    }

    const [products, totalClicks, clicks7d, clicks30d] = await Promise.all([
      prisma.bioProduct.findMany({
        where,
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        take: 500,
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          imageUrl: true,
          videoUrl: true,
          affiliateUrl: true,
          active: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.bioClick.groupBy({
        by: ["bioProductId"],
        _count: { _all: true },
      }),
      prisma.bioClick.groupBy({
        by: ["bioProductId"],
        where: { createdAt: { gte: daysAgo(7) } },
        _count: { _all: true },
      }),
      prisma.bioClick.groupBy({
        by: ["bioProductId"],
        where: { createdAt: { gte: daysAgo(30) } },
        _count: { _all: true },
      }),
    ]);

    const totalById = new Map(totalClicks.map((row) => [row.bioProductId, row._count._all]));
    const c7ById = new Map(clicks7d.map((row) => [row.bioProductId, row._count._all]));
    const c30ById = new Map(clicks30d.map((row) => [row.bioProductId, row._count._all]));

    const items = products.map((p) => ({
      ...p,
      clicksTotal: totalById.get(p.id) || 0,
      clicks7d: c7ById.get(p.id) || 0,
      clicks30d: c30ById.get(p.id) || 0,
    }));

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("[api/bio/admin/analytics GET]", error);
    return NextResponse.json({ error: error?.message || "Falha ao carregar analytics da bio" }, { status: 500 });
  }
}

