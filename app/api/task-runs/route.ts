import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const taskId = String(req.nextUrl.searchParams.get("taskId") || "").trim();
    const status = String(req.nextUrl.searchParams.get("status") || "").trim().toUpperCase();
    const limit = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get("limit") || 30)));

    const where: any = {};
    if (taskId) where.taskId = taskId;
    if (status) where.status = status;

    const items = await prisma.automationTaskRun.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        task: {
          select: { id: true, name: true, slug: true, type: true, status: true },
        },
        steps: {
          orderBy: { stepOrder: "asc" },
        },
      },
    });

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("[api/task-runs GET]", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch task runs" }, { status: 500 });
  }
}
