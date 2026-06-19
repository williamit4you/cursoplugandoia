import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enqueueComparisonRun, runComparisonPipeline } from "@/lib/comparisons/orchestrator";
import { buildComparisonTitle, comparisonSlugify, currentComparisonYear, normalizeTheme, uniqueStrings } from "@/lib/comparisons/utils";
import { isSupportedComparisonUrl } from "@/lib/comparisons/constants";
import { requireServerSession } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function parsePageParam(value: string | null, fallback: number) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

type InputComparisonLink = {
  affiliateUrl: string;
  productUrl: string;
};

function normalizeIncomingLinks(input: unknown): InputComparisonLink[] {
  if (!Array.isArray(input)) return [];
  const normalized = input
    .map((entry) => {
      if (typeof entry === "string") {
        const value = String(entry || "").trim();
        return value ? { affiliateUrl: value, productUrl: value } : null;
      }
      if (!entry || typeof entry !== "object") return null;
      const affiliateUrl = String((entry as any).affiliateUrl || "").trim();
      const productUrl = String((entry as any).productUrl || "").trim();
      const fallback = affiliateUrl || productUrl;
      if (!fallback) return null;
      return {
        affiliateUrl: affiliateUrl || fallback,
        productUrl: productUrl || fallback,
      };
    })
    .filter(Boolean) as InputComparisonLink[];

  const deduped = new Map<string, InputComparisonLink>();
  for (const item of normalized) {
    const key = `${item.affiliateUrl}__${item.productUrl}`;
    if (!deduped.has(key)) deduped.set(key, item);
  }
  return Array.from(deduped.values());
}

export async function GET(req: NextRequest) {
  const session = await requireServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const q = String(req.nextUrl.searchParams.get("q") || "").trim();
    const status = String(req.nextUrl.searchParams.get("status") || "").trim().toUpperCase();
    const page = parsePageParam(req.nextUrl.searchParams.get("page"), 1);
    const pageSize = parsePageParam(req.nextUrl.searchParams.get("pageSize"), 20);
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { theme: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
      ];
    }
    if (status && status !== "ALL") where.status = status;

    const [items, total] = await Promise.all([
      prisma.affiliateComparison.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          items: {
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              productTitle: true,
              storeName: true,
              status: true,
              sourceUrl: true,
            },
          },
          steps: {
            orderBy: { updatedAt: "desc" },
            take: 5,
          },
        },
      }),
      prisma.affiliateComparison.count({ where }),
    ]);

    return NextResponse.json({ items, total, page, pageSize });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to load comparisons" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const theme = normalizeTheme(body.theme || "");
    const targetYear = Number.parseInt(String(body.targetYear || currentComparisonYear()), 10) || currentComparisonYear();
    const links = normalizeIncomingLinks(body.links);

    if (!theme) {
      return NextResponse.json({ error: "Tema e obrigatorio" }, { status: 400 });
    }
    if (links.length < 2) {
      return NextResponse.json({ error: "Informe pelo menos 2 links para montar um comparativo" }, { status: 400 });
    }

    const baseTitle = buildComparisonTitle(theme, links.length, targetYear);
    const baseSlug = comparisonSlugify(`${theme}-${targetYear}`) || `comparativo-${Date.now()}`;
    let slug = baseSlug;
    for (let i = 0; i < 50; i++) {
      const exists = await prisma.affiliateComparison.findUnique({ where: { slug } });
      if (!exists) break;
      slug = `${baseSlug}-${i + 2}`;
    }

    const created = await prisma.affiliateComparison.create({
      data: {
        title: baseTitle,
        slug,
        theme,
        targetYear,
        status: "QUEUED",
        sourceCount: links.length,
        createdByUserId: String((session.user as any).id || ""),
        items: {
          create: links.map((link, index) => {
            const url = new URL(link.productUrl);
            return {
              sortOrder: index + 1,
              sourceUrl: link.productUrl,
              affiliateUrl: link.affiliateUrl,
              sourceDomain: url.hostname.replace(/^www\./, ""),
              storeName: isSupportedComparisonUrl(link.productUrl) ? undefined : "Nao suportado",
            };
          }),
        },
      },
      include: {
        items: { orderBy: { sortOrder: "asc" } },
      },
    });

    await enqueueComparisonRun(created.id);
    await runComparisonPipeline(created.id);

    const refreshed = await prisma.affiliateComparison.findUnique({
      where: { id: created.id },
      include: {
        items: { orderBy: { sortOrder: "asc" } },
        steps: { orderBy: { updatedAt: "desc" }, take: 5 },
      },
    });

    return NextResponse.json(refreshed || created, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to create comparison" }, { status: 500 });
  }
}
