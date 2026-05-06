import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_TASK_CONFIGS,
  normalizeTaskStatus,
  normalizeTaskType,
  safeJsonStringify,
  slugifyTaskName,
} from "@/lib/tasks/catalog";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function intOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const item = await prisma.automationTask.findUnique({
      where: { id: params.id },
      include: {
        runs: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            steps: {
              orderBy: { stepOrder: "asc" },
            },
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error: any) {
    console.error("[api/tasks/[id] GET]", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch task" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const current = await prisma.automationTask.findUnique({ where: { id: params.id } });
    if (!current) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const body = await req.json();
    const type = normalizeTaskType(body.type || current.type);
    const defaults = DEFAULT_TASK_CONFIGS[type];
    const name = String(body.name || current.name || "").trim();
    const slug = slugifyTaskName(body.slug || current.slug || name);

    const updated = await prisma.automationTask.update({
      where: { id: params.id },
      data: {
        name,
        slug,
        type,
        status: normalizeTaskStatus(body.status || current.status),
        isEnabled: body.isEnabled == null ? current.isEnabled : Boolean(body.isEnabled),
        timezone: String(body.timezone || current.timezone || "America/Sao_Paulo").trim() || "America/Sao_Paulo",
        cronExpression:
          body.cronExpression === null ? null : body.cronExpression ? String(body.cronExpression).trim() : current.cronExpression,
        runIntervalMinutes:
          body.runIntervalMinutes === undefined ? current.runIntervalMinutes : intOrNull(body.runIntervalMinutes),
        maxRunsPerDay: body.maxRunsPerDay === undefined ? current.maxRunsPerDay : intOrNull(body.maxRunsPerDay),
        priority: body.priority === undefined ? current.priority : intOrNull(body.priority) ?? current.priority,
        creativeTemplateId:
          body.creativeTemplateId === undefined
            ? current.creativeTemplateId
            : body.creativeTemplateId
              ? String(body.creativeTemplateId).trim()
              : null,
        sourceConfigJson: safeJsonStringify(body.sourceConfig ?? defaults.sourceConfig),
        creativeConfigJson: safeJsonStringify(body.creativeConfig ?? defaults.creativeConfig),
        publishConfigJson: safeJsonStringify(body.publishConfig ?? defaults.publishConfig),
        executionConfigJson: safeJsonStringify(body.executionConfig ?? defaults.executionConfig),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[api/tasks/[id] PATCH]", error);
    return NextResponse.json({ error: error?.message || "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.automationTask.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[api/tasks/[id] DELETE]", error);
    return NextResponse.json({ error: error?.message || "Failed to delete task" }, { status: 500 });
  }
}
