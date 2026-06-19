import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { POST as runVideoCodeProjectPost } from "@/app/api/video-code/projects/[id]/run/route";
import { ensureNewsSocialPostsForProject } from "@/lib/newsSocialQueue";

function cronEnabled() {
  const raw = String(process.env.VIDEO_ENGAGEMENT_CRON_ENABLED || "").trim().toLowerCase();
  if (!raw) return true;
  return !["0", "false", "no", "off"].includes(raw);
}

function staleMinutes() {
  const value = Number(process.env.VIDEO_ENGAGEMENT_STALE_MINUTES || 20);
  return Math.max(5, Number.isFinite(value) ? value : 20);
}

function maxItemsPerRun() {
  const value = Number(process.env.VIDEO_ENGAGEMENT_CRON_MAX_ITEMS || 1);
  return Math.max(1, Math.min(5, Number.isFinite(value) ? value : 1));
}

function makeRunRequest(projectId: string) {
  return new NextRequest(new URL(`/api/video-code/projects/${projectId}/run`, "http://internal.local"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trigger: "video_engagement_cron" }),
  });
}

async function pickEligibleProject() {
  const staleBefore = new Date(Date.now() - staleMinutes() * 60_000);

  return prisma.codeVideoProject.findFirst({
    where: {
      videoUrl: null,
      OR: [
        { metadataJson: { contains: "\"newsAutomation\"" } },
        { metadataJson: { contains: "\"postId\":\"" } },
      ],
      OR: [
        { status: "DRAFT" },
        { status: "FAILED" },
        { status: "READY" },
        { status: "GENERATING", updatedAt: { lt: staleBefore } },
        { status: "RENDERING", updatedAt: { lt: staleBefore } },
      ],
    },
    orderBy: [{ updatedAt: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      status: true,
      updatedAt: true,
    },
  });
}

export async function runVideoEngagementOnce() {
  const project = await pickEligibleProject();
  if (!project) {
    return { ok: true, skipped: true, reason: "Nenhum projeto elegivel encontrado agora" };
  }

  const res = await runVideoCodeProjectPost(makeRunRequest(project.id), { params: { id: project.id } });
  const data = await res.json().catch(() => ({}));

  return {
    ok: res.ok,
    projectId: project.id,
    previousStatus: project.status,
    data,
    ...(res.ok ? {} : { error: (data as any)?.error || `HTTP ${res.status}` }),
  };
}

export async function runVideoEngagementCron() {
  if (!cronEnabled()) {
    return { ok: true, skipped: true, reason: "Video engagement cron disabled" };
  }

  const runs: any[] = [];
  const limit = maxItemsPerRun();

  for (let index = 0; index < limit; index += 1) {
    const result = await runVideoEngagementOnce();
    runs.push(result);
    if (result?.skipped || result?.error) break;
  }

  const first = runs[0];
  const completedProjects = await prisma.codeVideoProject.findMany({
    where: {
      videoUrl: { not: null },
      OR: [
        { metadataJson: { contains: "\"newsAutomation\"" } },
        { metadataJson: { contains: "\"postId\":\"" } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: 10,
    select: {
      id: true,
      title: true,
      description: true,
      metadataJson: true,
      videoUrl: true,
    },
  });

  const reconciledSocial = [];
  for (const project of completedProjects) {
    const result = await ensureNewsSocialPostsForProject(project);
    if (result.createdCount > 0) {
      reconciledSocial.push({
        projectId: project.id,
        createdCount: result.createdCount,
        createdPlatforms: result.createdPlatforms,
      });
    }
  }

  return {
    ok: true,
    enabled: true,
    staleMinutes: staleMinutes(),
    maxItemsPerRun: limit,
    runs,
    reconciledSocial,
    ...(first?.skipped ? { skipped: true, reason: first.reason } : {}),
  };
}
