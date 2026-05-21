import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const id = ctx.params.id;

    // 1. Verify project exists
    const project = await prisma.codeVideoProject.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Propaganda project not found" }, { status: 404 });
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(req.url);
    const stepName = searchParams.get("stepName");
    const take = Math.max(1, Math.min(250, Number(searchParams.get("take") || 50)));

    // 3. Query events
    const whereClause: any = { projectId: id };
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
    console.error("[api/propagandas/projects/[id]/events GET]", error);
    return NextResponse.json({ error: error.message || "Failed to fetch events" }, { status: 500 });
  }
}
