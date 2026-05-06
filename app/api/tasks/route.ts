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

export async function GET(req: NextRequest) {
  try {
    const q = String(req.nextUrl.searchParams.get("q") || "").trim();
    const type = String(req.nextUrl.searchParams.get("type") || "").trim().toUpperCase();
    const status = String(req.nextUrl.searchParams.get("status") || "").trim().toUpperCase();

    const where: any = {};
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
      ];
    }
    if (type) where.type = type;
    if (status) where.status = status;

    const items = await prisma.automationTask.findMany({
      where,
      orderBy: [{ priority: "asc" }, { updatedAt: "desc" }],
      include: {
        runs: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { id: true, status: true, createdAt: true, finishedAt: true, errorMessage: true },
        },
      },
    });

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("[api/tasks GET]", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const type = normalizeTaskType(body.type);
    const defaults = DEFAULT_TASK_CONFIGS[type];
    const name = String(body.name || "").trim();

    if (!name) {
      return NextResponse.json({ error: "Task name is required" }, { status: 400 });
    }

    const slug = slugifyTaskName(body.slug || name);
    if (!slug) {
      return NextResponse.json({ error: "Task slug is required" }, { status: 400 });
    }

    const created = await prisma.automationTask.create({
      data: {
        name,
        slug,
        type,
        status: normalizeTaskStatus(body.status),
        isEnabled: Boolean(body.isEnabled ?? true),
        timezone: String(body.timezone || "America/Sao_Paulo").trim() || "America/Sao_Paulo",
        cronExpression: body.cronExpression ? String(body.cronExpression).trim() : null,
        runIntervalMinutes: intOrNull(body.runIntervalMinutes),
        maxRunsPerDay: intOrNull(body.maxRunsPerDay),
        priority: intOrNull(body.priority) ?? 100,
        creativeTemplateId: body.creativeTemplateId ? String(body.creativeTemplateId).trim() : null,
        sourceConfigJson: safeJsonStringify(body.sourceConfig ?? defaults.sourceConfig),
        creativeConfigJson: safeJsonStringify(body.creativeConfig ?? defaults.creativeConfig),
        publishConfigJson: safeJsonStringify(body.publishConfig ?? defaults.publishConfig),
        executionConfigJson: safeJsonStringify(body.executionConfig ?? defaults.executionConfig),
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("[api/tasks POST]", error);
    return NextResponse.json({ error: error?.message || "Failed to create task" }, { status: 500 });
  }
}
