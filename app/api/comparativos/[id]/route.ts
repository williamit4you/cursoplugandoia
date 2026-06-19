import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildComparisonTitle, normalizeTheme, uniqueStrings } from "@/lib/comparisons/utils";
import { requireServerSession } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
    const links = Array.isArray(body.links) ? uniqueStrings(body.links.map((item: string) => String(item || ""))) : null;

    await prisma.$transaction(async (tx) => {
      await tx.affiliateComparison.update({
        where: { id: current.id },
        data: {
          theme,
          targetYear,
          title: buildComparisonTitle(theme, links?.length || current.sourceCount, targetYear),
          status: nextStatus as any,
          sourceCount: links?.length || current.sourceCount,
        },
      });

      if (links) {
        await tx.affiliateComparisonItem.deleteMany({
          where: {
            comparisonId: current.id,
            status: { in: ["PENDING", "FAILED", "SKIPPED"] as any },
          },
        });

        const existingSourceUrls = new Set(current.items.map((item) => item.sourceUrl));
        const newLinks = links.filter((link) => !existingSourceUrls.has(link));
        if (newLinks.length > 0) {
          await tx.affiliateComparisonItem.createMany({
            data: newLinks.map((link, index) => ({
              comparisonId: current.id,
              sortOrder: current.items.length + index + 1,
              sourceUrl: link,
              affiliateUrl: link,
              sourceDomain: new URL(link).hostname.replace(/^www\./, ""),
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
