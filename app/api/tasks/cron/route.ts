import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeJsonParse } from "@/lib/tasks/catalog";
import { computeTodaySlotInstants, parseTimeSlots } from "@/lib/tasks/schedule";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const DEFAULT_STEPS = [
  "COLLECT_SOURCE",
  "NORMALIZE_SOURCE",
  "GENERATE_COPY",
  "PREPARE_ASSETS",
  "RENDER_VIDEO",
  "CREATE_PUBLISH_SCHEDULES",
];

function minutes(n: number) {
  return n * 60_000;
}

function startOfDayInTimeZone(timeZone: string, now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const pick = (t: string) => Number(parts.find((p) => p.type === t)?.value || "0");
  const year = pick("year");
  const month = pick("month");
  const day = pick("day");
  // midnight wall clock in TZ -> UTC instant approximation (good enough for day window)
  const utcGuess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  return utcGuess;
}

export async function GET(req: NextRequest) {
  try {
    const secret = req.nextUrl.searchParams.get("secret");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && secret !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const windowMinutes = Math.min(60, Math.max(1, Number(req.nextUrl.searchParams.get("windowMinutes") || 10)));
    const limit = Math.min(50, Math.max(1, Number(req.nextUrl.searchParams.get("limit") || 20)));
    const now = new Date();

    const tasks = await prisma.automationTask.findMany({
      where: { isEnabled: true, status: "ACTIVE" },
      orderBy: [{ priority: "asc" }, { updatedAt: "desc" }],
      take: limit,
    });

    const created: Array<{ taskId: string; runId: string; slot: string; scheduledFor: string }> = [];
    const skipped: Array<{ taskId: string; reason: string }> = [];

    for (const task of tasks) {
      const publishConfig = safeJsonParse<Record<string, unknown>>(task.publishConfigJson, {});
      const timeZone = String(task.timezone || "America/Sao_Paulo").trim() || "America/Sao_Paulo";
      const slots = parseTimeSlots((publishConfig as any).timeSlots);
      if (slots.length === 0) {
        skipped.push({ taskId: task.id, reason: "No timeSlots" });
        continue;
      }

      const todaySlots = computeTodaySlotInstants({ timeZone, slots, now });
      const due = todaySlots.filter((s) => {
        const delta = now.getTime() - s.instant.getTime();
        return delta >= 0 && delta <= minutes(windowMinutes);
      });

      if (due.length === 0) {
        skipped.push({ taskId: task.id, reason: "Not in window" });
        continue;
      }

      const dayStart = startOfDayInTimeZone(timeZone, now);
      const dayEnd = new Date(dayStart.getTime() + minutes(24 * 60));
      const runsToday = await prisma.automationTaskRun.count({
        where: { taskId: task.id, createdAt: { gte: dayStart, lt: dayEnd } },
      });
      const maxRunsPerDay = task.maxRunsPerDay == null ? null : Number(task.maxRunsPerDay);
      if (maxRunsPerDay != null && runsToday >= maxRunsPerDay) {
        skipped.push({ taskId: task.id, reason: `maxRunsPerDay reached (${maxRunsPerDay})` });
        continue;
      }

      // create at most one run per cron call per task (the earliest due slot)
      const nextDue = due.sort((a, b) => a.instant.getTime() - b.instant.getTime())[0];
      const scheduledFor = nextDue.instant.toISOString();
      const slot = nextDue.slot.raw;

      const existing = await prisma.automationTaskRun.findFirst({
        where: {
          taskId: task.id,
          createdAt: { gte: new Date(nextDue.instant.getTime() - minutes(windowMinutes)), lte: now },
        },
        orderBy: { createdAt: "desc" },
      });
      if (existing) {
        skipped.push({ taskId: task.id, reason: "Run already created recently" });
        continue;
      }

      const run = await prisma.automationTaskRun.create({
        data: {
          taskId: task.id,
          triggerType: "SCHEDULED",
          status: "PENDING",
          inputSnapshotJson: JSON.stringify(
            {
              scheduledFor,
              slot,
              createdBy: "tasks-cron",
              taskType: task.type,
              publishConfigJson: task.publishConfigJson,
            },
            null,
            2
          ),
          steps: {
            create: DEFAULT_STEPS.map((stepKey, index) => ({
              stepKey,
              stepOrder: index + 1,
              status: "PENDING",
            })),
          },
        },
      });

      await prisma.automationTask.update({
        where: { id: task.id },
        data: { lastRunAt: now },
      });

      created.push({ taskId: task.id, runId: run.id, slot, scheduledFor });
    }

    return NextResponse.json({ now: now.toISOString(), created, skipped, windowMinutes });
  } catch (error: any) {
    console.error("[api/tasks/cron GET]", error);
    return NextResponse.json({ error: error?.message || "Failed tasks cron" }, { status: 500 });
  }
}

