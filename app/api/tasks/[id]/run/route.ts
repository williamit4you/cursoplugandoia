import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_STEPS = [
  "COLLECT_SOURCE",
  "NORMALIZE_SOURCE",
  "GENERATE_COPY",
  "PREPARE_ASSETS",
  "RENDER_VIDEO",
  "CREATE_PUBLISH_SCHEDULES",
];

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const task = await prisma.automationTask.findUnique({ where: { id: params.id } });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const run = await prisma.automationTaskRun.create({
      data: {
        taskId: task.id,
        triggerType: "MANUAL",
        status: "PENDING",
        inputSnapshotJson: JSON.stringify({
          taskType: task.type,
          sourceConfigJson: task.sourceConfigJson,
          creativeConfigJson: task.creativeConfigJson,
          publishConfigJson: task.publishConfigJson,
          createdBy: "admin-ui",
        }),
        steps: {
          create: DEFAULT_STEPS.map((stepKey, index) => ({
            stepKey,
            stepOrder: index + 1,
            status: "PENDING",
          })),
        },
      },
      include: { steps: { orderBy: { stepOrder: "asc" } } },
    });

    await prisma.automationTask.update({
      where: { id: task.id },
      data: {
        lastRunAt: new Date(),
      },
    });

    return NextResponse.json(run, { status: 201 });
  } catch (error: any) {
    console.error("[api/tasks/[id]/run POST]", error);
    return NextResponse.json({ error: error?.message || "Failed to create task run" }, { status: 500 });
  }
}
