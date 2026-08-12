import "server-only";

import { prisma } from "@/lib/prisma";
import { cleanupPublishedSocialMediaAssets } from "@/lib/socialMediaAssetCleanup";
import { markSocialCronError, markSocialCronFinished, markSocialCronRunning } from "@/lib/socialCronState";

function appendTimestamp(message: string) {
  return `[${new Date().toLocaleTimeString("pt-BR")}] ${message}`;
}

function retryDelayMinutes(log: string | null | undefined) {
  const attempts = (log || "").match(/Retry automatico/g)?.length || 0;
  return Math.min(360, 5 * Math.pow(2, attempts));
}

async function appendPostLog(id: string, message: string) {
  const post = await prisma.socialPost.findUnique({ where: { id }, select: { log: true } });
  const log = post?.log ? `${post.log}\n${appendTimestamp(message)}` : appendTimestamp(message);
  await prisma.socialPost.update({ where: { id }, data: { log } });
}

async function callPublisher(baseUrl: string, pathname: string, socialPostId: string) {
  try {
    const res = await fetch(`${baseUrl}${pathname}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ socialPostId }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (error: any) {
    return { ok: false, status: 503, data: { error: error?.message || "Falha ao conectar ao publicador" } };
  }
}

export async function runSocialCron(params: { baseUrl: string; limit?: number }) {
  const startedAt = new Date();
  const limit = Math.min(10, Math.max(1, Number(params.limit || 5)));
  const now = new Date();

  markSocialCronRunning(startedAt);

  // Due publications and Meta container checks are independent queues. A stuck
  // container must never consume all worker capacity and prevent new posts from
  // starting at their scheduled time.
  const duePosts = await prisma.socialPost.findMany({
    where: { status: "SCHEDULED", scheduledTo: { lte: now } },
    orderBy: [{ scheduledTo: "asc" }, { createdAt: "asc" }],
    take: limit,
  });
  const processingPosts = await prisma.socialPost.findMany({
    where: {
      status: "PROCESSING_MEDIA",
      platform: "META",
      metaContainerId: { not: null },
      metaInstagramPublishAttemptedAt: null,
    },
    orderBy: [{ updatedAt: "asc" }, { createdAt: "asc" }],
    take: limit,
  });
  const posts = [...duePosts, ...processingPosts];

  const tiktokSettings = await prisma.integrationSettings.findUnique({ where: { platform: "TIKTOK" } }).catch(() => null);
  const results: any[] = [];

  for (const post of posts) {
    if (post.platform === "TIKTOK" && !tiktokSettings?.isActive) {
      await prisma.socialPost.update({
        where: { id: post.id },
        data: {
          status: "FAILED",
          log: post.log
            ? `${post.log}\n${appendTimestamp("TikTok ignorado: integracao inativa.")}`
            : appendTimestamp("TikTok ignorado: integracao inativa."),
        },
      });
      results.push({ id: post.id, platform: post.platform, skipped: true, reason: "TikTok inativo" });
      continue;
    }

    const pathname =
      post.platform === "YOUTUBE"
        ? "/api/social/publish-youtube"
        : post.platform === "TIKTOK"
          ? "/api/social/publish-tiktok"
          : post.postType === "STORY"
            ? "/api/social/publish-story"
            : "/api/social/publish";

    const result = await callPublisher(params.baseUrl, pathname, post.id);
    results.push({ id: post.id, platform: post.platform, ok: result.ok, status: result.status, data: result.data });

    const errorText = String(result.data?.error || "").toLowerCase();
    const credentialFailure = result.status === 401 || result.status === 403 || errorText.includes("invalid_grant") || errorText.includes("credencial") || errorText.includes("token");
    const temporaryFailure = !result.ok && !credentialFailure && result.status >= 500;
    if (temporaryFailure) {
      const delayMinutes = retryDelayMinutes(post.log);
      const retryAt = new Date(Date.now() + delayMinutes * 60_000);
      await prisma.socialPost.update({
        where: { id: post.id },
        data: { status: "SCHEDULED", scheduledTo: retryAt, log: post.log ? `${post.log}\n${appendTimestamp(`Retry automatico em ${delayMinutes} minutos: ${result.data?.error || `HTTP ${result.status}`}`)}` : appendTimestamp(`Retry automatico em ${delayMinutes} minutos`) },
      });
    } else if (!result.ok && !result.data?.timeLimit) {
      await prisma.socialPost.update({
        where: { id: post.id },
        data: {
          status: "FAILED",
          log: post.log
            ? `${post.log}\n${appendTimestamp(`Falha publicador automatico: ${result.data?.error || `HTTP ${result.status}`}`)}`
            : appendTimestamp(`Falha publicador automatico: ${result.data?.error || `HTTP ${result.status}`}`),
        },
      });
    } else if (result.data?.stillProcessing) {
      await prisma.socialPost.update({
        where: { id: post.id },
        data: { status: "PROCESSING_MEDIA" },
      });
      await appendPostLog(post.id, "Meta ainda processando; o cron tentara novamente.");
    } else if (!result.ok) {
      await prisma.socialPost.update({ where: { id: post.id }, data: { status: "SCHEDULED" } });
    }
  }

  const cleanup = await cleanupPublishedSocialMediaAssets(prisma, {
    limit: Math.max(5, limit * 2),
  }).catch((error: any) => ({
    scanned: 0,
    cleanedCount: 0,
    error: error?.message || "cleanup_failed",
    results: [],
  }));

  const summary = { checked: posts.length, results, cleanup, startedAt: startedAt.toISOString() };
  markSocialCronFinished({ ok: true, checked: posts.length, results, finishedAt: new Date() });
  return summary;
}

export function registerSocialCronError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "Falha no cron social");
  markSocialCronError(message);
  return message;
}
