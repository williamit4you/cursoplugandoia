import "server-only";

import { prisma } from "@/lib/prisma";
import { computeNextSocialQueueTime } from "@/lib/socialQueueSchedule";
import { parseProjectMetadata } from "@/lib/newsVideoProject";
import { logCodeVideoPipelineEvent, upsertCodeVideoPipelineStep } from "@/lib/video-code/logger";
import { withCampaignTracking } from "@/lib/trackingLinks";

function normalizeSocialPlatforms(value: unknown) {
  // Meta/Instagram is intentionally excluded from automatic news publishing.
  const allowed = new Set(["YOUTUBE", "TIKTOK", "LINKEDIN"]);
  const raw = Array.isArray(value) ? value : [];
  const platforms = raw
    .map((item) => String(item || "").toUpperCase())
    .filter((item) => allowed.has(item));
  return Array.from(new Set(platforms));
}

function desiredNewsPlatforms(rawPlatforms: unknown, variant: string) {
  const preferred = normalizeSocialPlatforms(rawPlatforms);
  // Do not infer platforms here. This function is run by the cron as a
  // reconciliation step, so defaults here could resurrect a cancelled queue.
  return preferred;
}

async function disableLegacyNewsMetaPosts(projectId: string) {
  const stalePosts = await prisma.socialPost.findMany({
    where: {
      codeVideoProjectId: projectId,
      platform: "META",
      status: { in: ["DRAFT", "SCHEDULED", "PROCESSING_MEDIA", "PUBLISHING"] },
    },
    select: {
      id: true,
      log: true,
      status: true,
    },
  });

  for (const stalePost of stalePosts) {
    const nextLog = [
      stalePost.log || "",
      `[${new Date().toLocaleTimeString("pt-BR")}] Fila META desativada automaticamente: videos de noticia nao devem mais ser publicados no Instagram/Facebook.`,
    ]
      .filter(Boolean)
      .join("\n");

    await prisma.socialPost.update({
      where: { id: stalePost.id },
      data: {
        status: "FAILED",
        log: nextLog,
      },
    });
  }

  return stalePosts.map((item) => item.id);
}

function buildNewsSocialSummary(project: {
  title?: string | null;
  description?: string | null;
  metadataJson?: string | null;
}, source = "social") {
  const metadata = parseProjectMetadata(project.metadataJson || "{}") || {};
  const dailyNewsDescription = String(metadata?.dailyNews?.youtubeDescription || "").trim();
  const title = String(project.title || "Resumo da noticia").trim();
  const description = String(project.description || "").trim();
  const articleUrl = String(metadata?.articleUrl || "").trim();
  const trackedUrl = articleUrl ? withCampaignTracking(articleUrl, { source: source.toLowerCase(), medium: "organic", campaign: "news_video" }) : "";
  return [title, dailyNewsDescription || description, trackedUrl ? `Leia a materia completa: ${trackedUrl}` : ""]
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

  const postId = metadata?.postId ? String(metadata.postId) : null;
  const newsVariant = String(metadata?.newsVariant || (project as any).newsVariant || "PRESENTER").toUpperCase();
  const platforms = desiredNewsPlatforms(newsAutomation.platforms, newsVariant);
  const disabledMetaPostIds = await disableLegacyNewsMetaPosts(project.id);
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
    const summary = buildNewsSocialSummary(project, socialPlatform);
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
        newsVariant,
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
        disabledMetaPostIds,
        newsVariant,
      },
    }).catch(() => null);

    await logCodeVideoPipelineEvent({
      projectId: project.id,
      stepName: "ENQUEUE_SOCIAL",
      message: `Reconciliacao social criou ${createdPlatforms.length} plataforma(s) faltantes.`,
      metadata: { createdPlatforms, reconciled: true, disabledMetaPostIds },
    }).catch(() => null);
  }

  return {
    createdCount: createdPlatforms.length,
    createdPlatforms,
    disabledMetaPostIds,
    newsVariant,
    skipped: createdPlatforms.length === 0,
    reason: createdPlatforms.length === 0 ? "nothing_missing" : undefined,
  };
}
