import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enqueueComparisonRun, runComparisonPipeline } from "@/lib/comparisons/orchestrator";
import { requireServerSession } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const comparison = await prisma.affiliateComparison.findUnique({ where: { id: params.id } });
    if (!comparison) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await enqueueComparisonRun(comparison.id);
    await runComparisonPipeline(comparison.id);

    const refreshed = await prisma.affiliateComparison.findUnique({
      where: { id: comparison.id },
      include: {
        items: { orderBy: { sortOrder: "asc" } },
        steps: { orderBy: { updatedAt: "desc" } },
        events: { orderBy: { createdAt: "desc" }, take: 200 },
      },
    });

    return NextResponse.json({ ok: true, item: refreshed });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to enqueue comparison" }, { status: 500 });
  }
}
