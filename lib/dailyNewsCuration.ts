import "server-only";

import { Prisma } from "@prisma/client";

import { DAILY_NEWS_TIMEZONE, sourceNameFromUrl } from "@/lib/dailyNewsEdition";

export const DAILY_NEWS_MIN_ITEMS = 5;
export const DAILY_NEWS_MAX_ITEMS = 8;

const SENSITIVE_TERMS = [
  "morre",
  "morte",
  "morto",
  "assassin",
  "crime",
  "guerra",
  "ataque",
  "explos",
  "tiroteio",
  "trag",
  "acidente",
  "desastre",
  "policia",
  "pris",
  "terror",
];

type CuratablePost = Prisma.PostGetPayload<{
  include: {
    categories: {
      include: { category: true };
      orderBy: { category: { sortOrder: "asc" } };
    };
  };
}>;

export type EditionVerificationSnapshot = {
  hasSource: boolean;
  sensitive: boolean;
  warnings: string[];
};

export function buildEditionWindow(editionDate: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: DAILY_NEWS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const dateLabel = formatter.format(editionDate);
  const start = new Date(`${dateLabel}T00:00:00-03:00`);
  const end = new Date(`${dateLabel}T23:59:59.999-03:00`);
  return { start, end };
}

export function isSensitiveNews(post: Pick<CuratablePost, "title" | "summary">) {
  const text = `${post.title || ""} ${post.summary || ""}`.toLocaleLowerCase("pt-BR");
  return SENSITIVE_TERMS.some((term) => text.includes(term));
}

export function buildVerificationSnapshot(
  post: Pick<CuratablePost, "title" | "summary" | "sourceUrl">,
  position: number,
): EditionVerificationSnapshot & { position: number } {
  const warnings: string[] = [];
  const hasSource = Boolean(String(post.sourceUrl || "").trim());
  const sensitive = isSensitiveNews(post);

  if (!hasSource) warnings.push("Fonte ausente");
  if (sensitive) warnings.push("Tema sensivel");

  return {
    position,
    hasSource,
    sensitive,
    warnings,
  };
}

function scorePost(post: CuratablePost, nowMs: number) {
  const publishedMs = post.publishedAt ? new Date(post.publishedAt).getTime() : 0;
  const recencyHours = publishedMs ? Math.max(1, (nowMs - publishedMs) / 36e5) : 999;
  const featuredBoost = post.featured ? 80 : 0;
  const sourceBoost = post.sourceUrl ? 25 : 0;
  const categoryBoost = post.categories.length ? 10 : 0;
  const viewsBoost = Math.min(40, Math.round((post.views || 0) / 25));
  const freshnessScore = Math.max(0, 140 - recencyHours * 4);
  const sensitivityPenalty = isSensitiveNews(post) ? 20 : 0;

  return (
    freshnessScore +
    featuredBoost +
    sourceBoost +
    categoryBoost +
    viewsBoost -
    sensitivityPenalty
  );
}

export function buildAutoCuratedEditionPosts(posts: CuratablePost[]) {
  const nowMs = Date.now();
  const uniqueBySlugOrTitle = new Map<string, CuratablePost>();

  for (const post of posts) {
    const key = String(post.slug || post.title || post.id).trim().toLocaleLowerCase("pt-BR");
    if (!key || uniqueBySlugOrTitle.has(key)) continue;
    uniqueBySlugOrTitle.set(key, post);
  }

  return Array.from(uniqueBySlugOrTitle.values())
    .sort((a, b) => {
      const scoreDiff = scorePost(b, nowMs) - scorePost(a, nowMs);
      if (scoreDiff !== 0) return scoreDiff;
      const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      return bDate - aDate;
    })
    .slice(0, DAILY_NEWS_MAX_ITEMS);
}

export async function loadCandidateNewsPosts(editionDate: Date) {
  const currentWindow = buildEditionWindow(editionDate);
  const whereBase = { status: "PUBLISHED" as const };

  const current = await (await import("@/lib/prisma")).prisma.post.findMany({
    where: {
      ...whereBase,
      publishedAt: {
        gte: currentWindow.start,
        lte: currentWindow.end,
      },
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    include: {
      categories: {
        include: { category: true },
        orderBy: { category: { sortOrder: "asc" } },
      },
    },
    take: 60,
  });

  if (current.length >= DAILY_NEWS_MIN_ITEMS) {
    return current;
  }

  const fallbackStart = new Date(currentWindow.start);
  fallbackStart.setDate(fallbackStart.getDate() - 2);

  return (await (await import("@/lib/prisma")).prisma.post.findMany({
    where: {
      ...whereBase,
      publishedAt: {
        gte: fallbackStart,
        lte: currentWindow.end,
      },
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    include: {
      categories: {
        include: { category: true },
        orderBy: { category: { sortOrder: "asc" } },
      },
    },
    take: 80,
  })) as CuratablePost[];
}

export function buildEditionSnapshots(posts: CuratablePost[]) {
  return posts.map((post, index) => {
    const verification = buildVerificationSnapshot(post, index + 1);
    return {
      postId: post.id,
      position: index + 1,
      title: post.title,
      sourceUrl: post.sourceUrl,
      sourceName: sourceNameFromUrl(post.sourceUrl),
      publishedAt: post.publishedAt?.toISOString?.() || null,
      category: post.categories[0]?.category?.name || null,
      verification,
    };
  });
}

export function buildEditionItems(posts: CuratablePost[]) {
  return posts.map((post, index) => ({
    postId: post.id,
    position: index + 1,
    category: post.categories[0]?.category?.name || null,
    titleSnapshot: post.title,
    sourceName: sourceNameFromUrl(post.sourceUrl),
    sourceUrl: post.sourceUrl || null,
    publishedAtSnapshot: post.publishedAt || null,
    verificationJson: buildVerificationSnapshot(post, index + 1),
  }));
}
