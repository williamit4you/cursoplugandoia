import { prisma } from "@/lib/prisma";

const MAX_RANGE_DAYS = 366;
const MAX_EVENTS = 250_000;

function clean(value: string | null, max = 160) {
  return String(value || "").trim().slice(0, max);
}

function rangeFromSearchParams(searchParams: URLSearchParams) {
  const now = new Date();
  const fallbackFrom = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
  const fromValue = clean(searchParams.get("from"), 10);
  const toValue = clean(searchParams.get("to"), 10);
  let from = /^\d{4}-\d{2}-\d{2}$/.test(fromValue)
    ? new Date(`${fromValue}T00:00:00.000-03:00`)
    : fallbackFrom;
  let to = /^\d{4}-\d{2}-\d{2}$/.test(toValue)
    ? new Date(`${toValue}T23:59:59.999-03:00`)
    : now;

  if (Number.isNaN(from.getTime())) from = fallbackFrom;
  if (Number.isNaN(to.getTime())) to = now;
  if (to < from) [from, to] = [to, from];
  const maximumTo = new Date(from.getTime() + MAX_RANGE_DAYS * 24 * 60 * 60 * 1000);
  if (to > maximumTo) to = maximumTo;
  return { from, to };
}

function saoPauloDay(value: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

function percent(value: number, total: number) {
  return total ? Number(((value / total) * 100).toFixed(2)) : 0;
}

function parseJson(text: string | null) {
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

function parseReferrerHost(value: string | null) {
  try {
    return value ? new URL(value).hostname.replace(/^www\./, "") : "(direto)";
  } catch {
    return value ? String(value).slice(0, 80) : "(direto)";
  }
}

function uniqueCount(values: Array<string | null | undefined>) {
  return new Set(values.filter(Boolean)).size;
}

function aggregateRows<T extends Record<string, any>>(
  rows: T[],
  keyFor: (row: T) => string,
  labelFor?: (row: T) => string,
) {
  const grouped = new Map<string, any>();
  for (const row of rows) {
    const key = keyFor(row) || "(nao informado)";
    const current = grouped.get(key) || {
      key,
      label: labelFor?.(row) || key,
      views: 0,
      engagedReads: 0,
      clicks: 0,
      sessions: new Set<string>(),
    };
    if (row.eventType === "article_view") current.views += 1;
    if (row.eventType === "article_engaged") current.engagedReads += 1;
    if (row.eventType === "affiliate_click") current.clicks += 1;
    if (row.sessionId) current.sessions.add(row.sessionId);
    grouped.set(key, current);
  }
  return Array.from(grouped.values())
    .map((entry) => ({
      ...entry,
      sessions: entry.sessions.size,
      engagementRate: percent(entry.engagedReads, entry.views),
      clickRate: percent(entry.clicks, entry.views),
    }))
    .sort((a, b) => b.views - a.views || b.engagedReads - a.engagedReads || b.clicks - a.clicks);
}

export async function buildNewsAnalyticsDashboard(searchParams: URLSearchParams) {
  const range = rangeFromSearchParams(searchParams);
  const q = clean(searchParams.get("q"), 120);
  const category = clean(searchParams.get("category"), 80);
  const source = clean(searchParams.get("source"), 120);
  const device = clean(searchParams.get("device"), 40);
  const browser = clean(searchParams.get("browser"), 80);

  const postWhere = {
    status: "PUBLISHED",
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { summary: { contains: q, mode: "insensitive" as const } },
            { slug: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(category ? { categories: { some: { category: { slug: category } } } } : {}),
  };

  const [posts, categories] = await Promise.all([
    prisma.post.findMany({
      where: postWhere,
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        views: true,
        createdAt: true,
        updatedAt: true,
        publishedAt: true,
        featured: true,
        categories: {
          select: {
            category: {
              select: { id: true, name: true, slug: true, color: true },
            },
          },
          orderBy: { category: { sortOrder: "asc" } },
        },
        socialPosts: {
          where: { platform: "YOUTUBE" },
          select: {
            id: true,
            status: true,
            views: true,
            youtubePostUrl: true,
            postUrl: true,
          },
        },
      },
    }),
    prisma.newsCategory.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true },
    }),
  ]);

  const postIds = posts.map((post) => post.id);
  const rawEvents = postIds.length
    ? await prisma.contentMetricEvent.findMany({
        where: {
          postId: { in: postIds },
          occurredAt: { gte: range.from, lte: range.to },
          eventType: { in: ["article_view", "article_engaged", "affiliate_click"] },
        },
        orderBy: { occurredAt: "asc" },
        take: MAX_EVENTS,
        select: {
          id: true,
          postId: true,
          sessionId: true,
          source: true,
          medium: true,
          campaign: true,
          referrer: true,
          metadataJson: true,
          eventType: true,
          occurredAt: true,
        },
      })
    : [];

  const postsById = new Map(posts.map((post) => [post.id, post]));
  let events = rawEvents.map((event) => {
    const metadata = parseJson(event.metadataJson);
    const post = event.postId ? postsById.get(event.postId) : null;
    const primaryCategory = post?.categories?.[0]?.category || null;
    const resolvedSource = String(event.source || parseReferrerHost(event.referrer)).trim() || "(direto)";
    const resolvedDevice = String(metadata?.device || "UNKNOWN").trim() || "UNKNOWN";
    const resolvedBrowser = String(metadata?.browser || "Other").trim() || "Other";

    return {
      ...event,
      metadata,
      sourceLabel: resolvedSource,
      deviceLabel: resolvedDevice,
      browserLabel: resolvedBrowser,
      categoryLabel: primaryCategory?.name || "Sem categoria",
      categorySlug: primaryCategory?.slug || "",
      title: post?.title || "Post removido",
      slug: post?.slug || "",
    };
  });

  if (source) {
    const lowered = source.toLowerCase();
    events = events.filter((event) => event.sourceLabel.toLowerCase().includes(lowered));
  }
  if (device) {
    events = events.filter((event) => event.deviceLabel === device);
  }
  if (browser) {
    events = events.filter((event) => event.browserLabel === browser);
  }

  const views = events.filter((event) => event.eventType === "article_view");
  const engagedReads = events.filter((event) => event.eventType === "article_engaged");
  const affiliateClicks = events.filter((event) => event.eventType === "affiliate_click");

  const metricsByPost = new Map<string, { views: number; engagedReads: number; clicks: number; sessions: Set<string> }>();
  for (const event of events) {
    if (!event.postId) continue;
    const current = metricsByPost.get(event.postId) || {
      views: 0,
      engagedReads: 0,
      clicks: 0,
      sessions: new Set<string>(),
    };
    if (event.eventType === "article_view") current.views += 1;
    if (event.eventType === "article_engaged") current.engagedReads += 1;
    if (event.eventType === "affiliate_click") current.clicks += 1;
    if (event.sessionId) current.sessions.add(event.sessionId);
    metricsByPost.set(event.postId, current);
  }

  const topPosts = posts
    .map((post) => {
      const metric = metricsByPost.get(post.id);
      const youtubePost = post.socialPosts.find((item) => item.status === "POSTED");
      const youtubeViews = post.socialPosts.reduce((sum, item) => sum + Number(item.views || 0), 0);
      return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        summary: post.summary,
        category: post.categories?.[0]?.category?.name || "Sem categoria",
        publishedAt: post.publishedAt || post.createdAt,
        rawViews: post.views,
        trackedViews: metric?.views || 0,
        engagedReads: metric?.engagedReads || 0,
        affiliateClicks: metric?.clicks || 0,
        sessions: metric?.sessions.size || 0,
        engagementRate: percent(metric?.engagedReads || 0, metric?.views || 0),
        youtubePosted: Boolean(youtubePost),
        youtubeViews,
        youtubeUrl: youtubePost?.youtubePostUrl || youtubePost?.postUrl || null,
      };
    })
    .sort((a, b) => b.trackedViews - a.trackedViews || b.engagedReads - a.engagedReads || b.rawViews - a.rawViews);

  const byDay = new Map<string, { date: string; views: number; engagedReads: number; clicks: number; sessions: Set<string> }>();
  for (const event of events) {
    const date = saoPauloDay(event.occurredAt);
    const row = byDay.get(date) || {
      date,
      views: 0,
      engagedReads: 0,
      clicks: 0,
      sessions: new Set<string>(),
    };
    if (event.eventType === "article_view") row.views += 1;
    if (event.eventType === "article_engaged") row.engagedReads += 1;
    if (event.eventType === "affiliate_click") row.clicks += 1;
    if (event.sessionId) row.sessions.add(event.sessionId);
    byDay.set(date, row);
  }

  const recentEvents = [...events]
    .slice(-80)
    .reverse()
    .map((event) => ({
      id: event.id,
      occurredAt: event.occurredAt,
      eventType: event.eventType,
      title: event.title,
      slug: event.slug,
      source: event.sourceLabel,
      device: event.deviceLabel,
      browser: event.browserLabel,
      category: event.categoryLabel,
    }));

  return {
    period: {
      from: range.from.toISOString(),
      to: range.to.toISOString(),
      timezone: "America/Sao_Paulo",
    },
    truncated: rawEvents.length >= MAX_EVENTS,
    summary: {
      publishedArticles: posts.length,
      totalViews: views.length,
      engagedReads: engagedReads.length,
      sessions: uniqueCount(views.map((event) => event.sessionId)),
      affiliateClicks: affiliateClicks.length,
      engagementRate: percent(engagedReads.length, views.length),
      pagesWithTraffic: uniqueCount(views.map((event) => event.postId)),
      youtubeVideosPosted: topPosts.filter((post) => post.youtubePosted).length,
      youtubeViewsTotal: topPosts.reduce((sum, post) => sum + post.youtubeViews, 0),
    },
    timeseries: Array.from(byDay.values())
      .map((row) => ({ ...row, sessions: row.sessions.size }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    topPosts,
    byCategory: aggregateRows(events, (event) => event.categorySlug || event.categoryLabel, (event) => event.categoryLabel),
    bySource: aggregateRows(events, (event) => event.sourceLabel),
    byDevice: aggregateRows(events, (event) => event.deviceLabel),
    byBrowser: aggregateRows(events, (event) => event.browserLabel),
    recentEvents,
    options: {
      categories: categories.map((item) => ({ value: item.slug, label: item.name })),
      sources: Array.from(new Set(events.map((event) => event.sourceLabel))).sort(),
      devices: Array.from(new Set(events.map((event) => event.deviceLabel))).sort(),
      browsers: Array.from(new Set(events.map((event) => event.browserLabel))).sort(),
    },
  };
}
