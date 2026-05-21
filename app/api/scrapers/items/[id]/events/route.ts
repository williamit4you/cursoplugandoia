import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const id = ctx.params.id;

    // 1. Try to find pick
    let pick: any = await prisma.shopeeAffiliatePick.findUnique({
      where: { id },
      select: { codeVideoProjectId: true },
    });

    if (!pick) {
      pick = await prisma.mercadoLivreAffiliatePick.findUnique({
        where: { id },
        select: { codeVideoProjectId: true },
      });
    }

    if (!pick) {
      return NextResponse.json({ error: "Scraped item not found" }, { status: 404 });
    }

    const projectId = pick.codeVideoProjectId;
    if (!projectId) {
      return NextResponse.json([]); // No project associated yet, return empty list
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(req.url);
    const stepName = searchParams.get("stepName");
    const take = Math.max(1, Math.min(250, Number(searchParams.get("take") || 50)));

    // 3. Query events
    const whereClause: any = { projectId };
    if (stepName) {
      whereClause.stepName = stepName;
    }

    const events = await prisma.codeVideoPipelineEvent.findMany({
      where: whereClause,
      orderBy: { createdAt: "asc" },
      take,
    });

    return NextResponse.json(events);
  } catch (error: any) {
    console.error("[api/scrapers/items/[id]/events GET]", error);
    return NextResponse.json({ error: error.message || "Failed to fetch events" }, { status: 500 });
  }
}
