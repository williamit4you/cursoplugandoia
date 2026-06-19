import "server-only";

import { prisma } from "@/lib/prisma";
import { computeNextSocialQueueTime } from "@/lib/socialQueueSchedule";
import { parseProjectMetadata } from "@/lib/newsVideoProject";
import { logCodeVideoPipelineEvent, upsertCodeVideoPipelineStep } from "@/lib/video-code/logger";

function normalizeSocialPlatforms(value: unknown) {
  const allowed = new Set(["YOUTUBE", "INSTAGRAM", "TIKTOK", "LINKEDIN"]);
  const raw = Array.isArray(value) ? value : [];
  const platforms = raw
    .map((item) => String(item || "").toUpperCase())
    .filter((item) => allowed.has(item));
  return Array.from(new Set(platforms));
}

function desiredNewsPlatforms(rawPlatforms: unknown) {
  const preferred = normalizeSocialPlatforms(rawPlatforms);
  const base = ["TIKTOK", "YOUTUBE", "INSTAGRAM"];
  return Array.from(new Set([...base, ...preferred]));
}

function buildNewsSocialSummary(project: {
  title?: string | null;
  description?: string | null;
  metadataJson?: string | null;
}) {
  const metadata = parseProjectMetadata(project.metadataJson || "{}") || {};
  const title = String(project.title || "Resumo da noticia").trim();
  const description = String(project.description || "").trim();
  const articleUrl = String(metadata?.articleUrl || "").trim();
  return [title, description, articleUrl ? `Leia a materia completa: ${articleUrl}` : ""]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 4500);
}

export async function ensureNewsSocialPostsForProject(project: {
  id: string;
  title?: string | null;
  description?: string | null;
  metadataJson?: string | null;
  videoUrl?: string | null;
}) {
  const metadata = parseProjectMetadata(project.metadataJson || "{}") || {};
  const newsAutomation = metadata?.newsAutomation;
  if (!newsAutomation || newsAutomation.autoScheduleSocial !== true) {
    return { createdCount: 0, createdPlatforms: [] as string[], skipped: true, reason: "news_automation_disabled" };
  }

  const videoUrl = String(project.videoUrl || "").trim();
  if (!videoUrl) {
    return { createdCount: 0, createdPlatforms: [] as string[], skipped: true, reason: "video_missing" };
  }

  const summary = buildNewsSocialSummary(project);
  const postId = metadata?.postId ? String(metadata.postId) : null;
  const platforms = desiredNewsPlatforms(newsAutomation.platforms);
  const existing = await prisma.socialPost.findMany({
    where: {
      codeVideoProjectId: project.id,
      status: { not: "FAILED" },
    },
    select: {
      id: true,
      platform: true,
      postType: true,
      status: true,
    },
  });

  const existingKeys = new Set(existing.map((item) => `${String(item.platform).toUpperCase()}:${String(item.postType).toUpperCase()}`));
  const createdPlatforms: string[] = [];

  for (const platform of platforms) {
    const socialPlatform = platform === "INSTAGRAM" ? "META" : platform;
    const postType = "REEL";
    const key = `${socialPlatform}:${postType}`;
    if (existingKeys.has(key)) continue;

    const scheduledTo = await computeNextSocialQueueTime({
      platform: socialPlatform,
      desiredAt: new Date(),
    });

    await prisma.socialPost.create({
      data: {
        postId,
        codeVideoProjectId: project.id,
        summary,
        videoUrl,
        status: "SCHEDULED",
        scheduledTo,
        platform: socialPlatform,
        postType,
        log: `[${new Date().toLocaleTimeString("pt-BR")}] Enfileirado automaticamente por reconciliacao do Video Engajamento`,
      },
    });
    createdPlatforms.push(socialPlatform);
  }

  if (createdPlatforms.length > 0) {
    await upsertCodeVideoPipelineStep({
      projectId: project.id,
      stepName: "ENQUEUE_SOCIAL",
      status: "SUCCESS",
      attempt: 1,
      startedAt: new Date(),
      finishedAt: new Date(),
      responsePayload: {
        reconciled: true,
        createdCount: createdPlatforms.length,
        createdPlatforms,
      },
    }).catch(() => null);

    await logCodeVideoPipelineEvent({
      projectId: project.id,
      stepName: "ENQUEUE_SOCIAL",
      message: `Reconciliacao social criou ${createdPlatforms.length} plataforma(s) faltantes.`,
      metadata: { createdPlatforms, reconciled: true },
    }).catch(() => null);
  }

  return {
    createdCount: createdPlatforms.length,
    createdPlatforms,
    skipped: createdPlatforms.length === 0,
    reason: createdPlatforms.length === 0 ? "nothing_missing" : undefined,
  };
}
