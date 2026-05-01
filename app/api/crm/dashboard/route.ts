import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireServerSession } from "@/lib/serverAuth";

export async function GET() {
  const session = await requireServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [totalLeads, wonLeads, lostLeads, stageCounts, recentActivities, openTasks] = await Promise.all([
      prisma.crmContact.count(),
      prisma.crmContact.count({ where: { stage: "WON" } }),
      prisma.crmContact.count({ where: { stage: "LOST" } }),
      prisma.crmContact.groupBy({
        by: ["stage"],
        _count: { stage: true },
      }),
      prisma.crmActivity.findMany({
        orderBy: { happenedAt: "desc" },
        take: 10,
        include: {
          contact: { select: { id: true, name: true, phone: true, stage: true } },
        },
      }),
      prisma.crmTask.count({ where: { status: "OPEN" } }),
    ]);

    const activePipelineBase = totalLeads - lostLeads;
    const conversionRate = activePipelineBase > 0 ? (wonLeads / activePipelineBase) * 100 : 0;

    return NextResponse.json({
      totals: {
        totalLeads,
        wonLeads,
        lostLeads,
        openTasks,
        conversionRate: Number(conversionRate.toFixed(2)),
      },
      stageCounts,
      recentActivities,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load CRM dashboard" }, { status: 500 });
  }
}
