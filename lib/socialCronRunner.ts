import "server-only";

import { prisma } from "@/lib/prisma";
import { markSocialCronError, markSocialCronFinished, markSocialCronRunning } from "@/lib/socialCronState";

function appendTimestamp(message: string) {
  return `[${new Date().toLocaleTimeString("pt-BR")}] ${message}`;
}

async function appendPostLog(id: string, message: string) {
  const post = await prisma.socialPost.findUnique({ where: { id }, select: { log: true } });
  const log = post?.log ? `${post.log}\n${appendTimestamp(message)}` : appendTimestamp(message);
  await prisma.socialPost.update({ where: { id }, data: { log } });
}

async function callPublisher(baseUrl: string, pathname: string, socialPostId: string) {
  const res = await fetch(`${baseUrl}${pathname}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ socialPostId }),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export async function runSocialCron(params: { baseUrl: string; limit?: number }) {
  const startedAt = new Date();
  const limit = Math.min(10, Math.max(1, Number(params.limit || 5)));
  const now = new Date();

  markSocialCronRunning(startedAt);

  const posts = await prisma.socialPost.findMany({
    where: {
      OR: [{ status: "SCHEDULED", scheduledTo: { lte: now } }, { status: "PROCESSING_MEDIA" }],
    },
    orderBy: [{ scheduledTo: "asc" }, { createdAt: "asc" }],
    take: limit,
  });

  const tiktokSettings = await prisma.integrationSettings.findUnique({ where: { platform: "TIKTOK" } }).catch(() => null);
  const results: any[] = [];

  for (const post of posts) {
    if (post.platform === "TIKTOK" && !tiktokSettings?.isActive) {
      await prisma.socialPost.update({
        where: { id: post.id },
        data: {
          status: "DRAFT",
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

    if (!result.ok && !result.data?.timeLimit) {
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
      await appendPostLog(post.id, "Meta ainda processando; o cron tentara novamente.");
    }
  }

  const summary = { checked: posts.length, results, startedAt: startedAt.toISOString() };
  markSocialCronFinished({ ok: true, checked: posts.length, results, finishedAt: new Date() });
  return summary;
}

export function registerSocialCronError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "Falha no cron social");
  markSocialCronError(message);
  return message;
}
