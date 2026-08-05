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

const COMMERCIAL_TITLE_PATTERNS = [
  "oferta",
  "vale a pena investir",
  "por que investir",
  "porque investir",
  "compre",
  "desconto",
  "promocao",
  "promoção",
  "produto",
];

const PRIORITY_CATEGORY_TERMS = [
  "politica",
  "economia",
  "tecnologia",
  "mundo",
  "saude",
  "esporte",
  "esportes",
  "ciencia",
  "educacao",
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

function normalizePt(value: string) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

function hasCommercialTitle(post: Pick<CuratablePost, "title" | "summary">) {
  const text = normalizePt(`${post.title || ""} ${post.summary || ""}`);
  return COMMERCIAL_TITLE_PATTERNS.some((term) => text.includes(term));
}

function resolvePrimaryCategory(post: CuratablePost) {
  return normalizePt(
    post.categories[0]?.category?.slug ||
      post.categories[0]?.category?.name ||
      "",
  );
}

function isPriorityCategory(post: CuratablePost) {
  const category = resolvePrimaryCategory(post);
  return PRIORITY_CATEGORY_TERMS.some((term) => category.includes(term));
}

function sourceDomain(post: Pick<CuratablePost, "sourceUrl">) {
  const raw = String(post.sourceUrl || "").trim();
  if (!raw) return "";
  try {
    return new URL(raw).hostname.replace(/^www\./i, "").toLocaleLowerCase("pt-BR");
  } catch {
    return "";
  }
}

function isEligibleNewsPost(post: CuratablePost) {
  return Boolean(String(post.sourceUrl || "").trim()) && !hasCommercialTitle(post);
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
  const categoryBoost = isPriorityCategory(post) ? 55 : post.categories.length ? 10 : 0;
  const viewsBoost = Math.min(40, Math.round((post.views || 0) / 25));
  const freshnessScore = Math.max(0, 140 - recencyHours * 4);
  const sensitivityPenalty = isSensitiveNews(post) ? 20 : 0;
  const commercialPenalty = hasCommercialTitle(post) ? 200 : 0;

  return (
    freshnessScore +
    featuredBoost +
    sourceBoost +
    categoryBoost +
    viewsBoost -
    sensitivityPenalty -
    commercialPenalty
  );
}

export function buildAutoCuratedEditionPosts(posts: CuratablePost[]) {
  const nowMs = Date.now();
  const uniqueBySlugOrTitle = new Map<string, CuratablePost>();

  for (const post of posts) {
    const key = String(post.slug || post.title || post.id).trim().toLocaleLowerCase("pt-BR");
    if (!key || uniqueBySlugOrTitle.has(key) || !isEligibleNewsPost(post)) continue;
    uniqueBySlugOrTitle.set(key, post);
  }

  const ranked = Array.from(uniqueBySlugOrTitle.values())
    .sort((a, b) => {
      const categoryDiff = Number(isPriorityCategory(b)) - Number(isPriorityCategory(a));
      if (categoryDiff !== 0) return categoryDiff;
      const scoreDiff = scorePost(b, nowMs) - scorePost(a, nowMs);
      if (scoreDiff !== 0) return scoreDiff;
      const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      return bDate - aDate;
    });

  const selected: CuratablePost[] = [];
  const byDomain = new Map<string, number>();

  for (const post of ranked) {
    const domain = sourceDomain(post) || `unknown:${post.id}`;
    const currentCount = byDomain.get(domain) || 0;
    if (currentCount >= 2) continue;
    selected.push(post);
    byDomain.set(domain, currentCount + 1);
    if (selected.length >= DAILY_NEWS_MAX_ITEMS) break;
  }

  return selected;
}

export async function loadCandidateNewsPosts(editionDate: Date) {
  const currentWindow = buildEditionWindow(editionDate);
  const whereBase = { status: "PUBLISHED" as const };

  const current = await (await import("@/lib/prisma")).prisma.post.findMany({
    where: {
      ...whereBase,
      sourceUrl: { not: null },
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
      sourceUrl: { not: null },
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
