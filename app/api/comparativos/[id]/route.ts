import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildComparisonTitle, normalizeComparisonProductUrl, normalizeTheme } from "@/lib/comparisons/utils";
import { requireServerSession } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
      const productUrl = normalizeComparisonProductUrl(String((entry as any).productUrl || "").trim());
      const fallback = affiliateUrl || productUrl;
      if (!fallback) return null;
      return {
        affiliateUrl: affiliateUrl || fallback,
        productUrl: normalizeComparisonProductUrl(productUrl || fallback),
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

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const item = await prisma.affiliateComparison.findUnique({
      where: { id: params.id },
      include: {
        items: { orderBy: { sortOrder: "asc" } },
        steps: { orderBy: { updatedAt: "desc" } },
        events: { orderBy: { createdAt: "desc" }, take: 200 },
      },
    });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(item);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to load comparison" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const current = await prisma.affiliateComparison.findUnique({
      where: { id: params.id },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });
    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const theme = normalizeTheme(body.theme || current.theme);
    const targetYear = Number.parseInt(String(body.targetYear || current.targetYear || new Date().getFullYear()), 10);
    const nextStatus = String(body.status || current.status).trim().toUpperCase();
    const links = Array.isArray(body.links) ? normalizeIncomingLinks(body.links) : null;

    await prisma.$transaction(async (tx) => {
      await tx.affiliateComparison.update({
        where: { id: current.id },
        data: {
          theme,
          targetYear,
          title: buildComparisonTitle(theme, links?.length || current.sourceCount, targetYear),
          status: nextStatus as any,
          sourceCount: links?.length || current.sourceCount,
          validSourceCount: links ? 0 : current.validSourceCount,
          errorMessage: null,
          lastError: null,
        },
      });

      if (links) {
        await tx.affiliateComparisonItem.deleteMany({
          where: { comparisonId: current.id },
        });

        await tx.affiliateComparisonStep.deleteMany({
          where: { comparisonId: current.id },
        });

        await tx.affiliateComparisonEvent.deleteMany({
          where: { comparisonId: current.id },
        });

        if (links.length > 0) {
          await tx.affiliateComparisonItem.createMany({
            data: links.map((link, index) => ({
              comparisonId: current.id,
              sortOrder: index + 1,
              sourceUrl: link.productUrl,
              affiliateUrl: link.affiliateUrl,
              sourceDomain: new URL(link.productUrl).hostname.replace(/^www\./, ""),
            })),
          });
        }
      }
    });

    const updated = await prisma.affiliateComparison.findUnique({
      where: { id: current.id },
      include: {
        items: { orderBy: { sortOrder: "asc" } },
        steps: { orderBy: { updatedAt: "desc" } },
        events: { orderBy: { createdAt: "desc" }, take: 200 },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update comparison" }, { status: 500 });
  }
}
