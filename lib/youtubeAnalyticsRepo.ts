import { prisma } from "./prisma";

// ── Types ────────────────────────────────────────────────────

export interface ChannelFilters {
  search?: string;
  categoryId?: string;
  country?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface DashboardKPIs {
  totalChannels: number;
  totalViewsNiche: string;
  totalViewsShorts: string;
  totalViewsLongs: string;
  weeklyGrowth: number;
  monthlyGrowth: number;
  avgUploads: number;
  avgViewsPerVideo: number;
  avgViewsPerShort: number;
  avgSubsGained: number;
}

// ── Helper: BigInt serialization ────────────────────────────

function serializeBigInt(val: bigint): string {
  const n = Number(val);
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function bigintToNumber(val: bigint): number {
  return Number(val);
}

// ── Categories ──────────────────────────────────────────────

export async function getCategories() {
  return prisma.ytCategory.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

// ── Dashboard KPIs ──────────────────────────────────────────

export async function getDashboardKPIs(
  categoryId?: string
): Promise<DashboardKPIs> {
  const where = categoryId ? { categoryId, isActive: true } : { isActive: true };

  const channels = await prisma.ytChannel.findMany({ where });

  const totalChannels = channels.length;
  let totalViews = BigInt(0);
  let totalViewsShorts = BigInt(0);
  let totalViewsLongs = BigInt(0);
  let totalWeeklyGrowth = 0;
  let totalMonthlyGrowth = 0;
  let totalUploads = 0;
  let totalAvgViewsPerVideo = 0;
  let totalAvgViewsPerShort = 0;
  let totalSubsGained = 0;

  for (const ch of channels) {
    totalViews += ch.totalViews;
    totalViewsShorts += ch.viewsShorts;
    totalViewsLongs += ch.viewsLongs;
    totalWeeklyGrowth += ch.weeklyGrowth;
    totalMonthlyGrowth += ch.monthlyGrowth;
    totalUploads += ch.uploadsThisWeek;
    totalAvgViewsPerVideo += ch.avgViewsPerVideo;
    totalAvgViewsPerShort += ch.avgViewsPerShort;
    totalSubsGained += ch.subsGainedWeek;
  }

  const count = totalChannels || 1;

  return {
    totalChannels,
    totalViewsNiche: serializeBigInt(totalViews),
    totalViewsShorts: serializeBigInt(totalViewsShorts),
    totalViewsLongs: serializeBigInt(totalViewsLongs),
    weeklyGrowth: parseFloat((totalWeeklyGrowth / count).toFixed(2)),
    monthlyGrowth: parseFloat((totalMonthlyGrowth / count).toFixed(2)),
    avgUploads: parseFloat((totalUploads / count).toFixed(1)),
    avgViewsPerVideo: Math.round(totalAvgViewsPerVideo / count),
    avgViewsPerShort: Math.round(totalAvgViewsPerShort / count),
    avgSubsGained: Math.round(totalSubsGained / count),
  };
}

// ── Channels CRUD ───────────────────────────────────────────

export async function getChannels(filters: ChannelFilters) {
  const page = filters.page || 1;
  const pageSize = Math.min(filters.pageSize || 20, 100);
  const skip = (page - 1) * pageSize;

  const where: any = { isActive: true };
  if (filters.search) {
    where.name = { contains: filters.search, mode: "insensitive" };
  }
  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }
  if (filters.country) {
    where.country = filters.country;
  }

  const orderBy: any = {};
  const sortBy = filters.sortBy || "rankPosition";
  const sortOrder = filters.sortOrder || "asc";
  orderBy[sortBy] = sortOrder;

  const [data, total] = await Promise.all([
    prisma.ytChannel.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: {
        category: { select: { name: true, color: true, slug: true } },
      },
    }),
    prisma.ytChannel.count({ where }),
  ]);

  // Serialize BigInt fields for JSON response
  const serialized = data.map((ch) => ({
    ...ch,
    subscribers: ch.subscribers.toString(),
    totalViews: ch.totalViews.toString(),
    viewsShorts: ch.viewsShorts.toString(),
    viewsLongs: ch.viewsLongs.toString(),
    viewsLives: ch.viewsLives.toString(),
  }));

  return {
    data: serialized,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getChannelById(id: string) {
  const channel = await prisma.ytChannel.findUnique({
    where: { id },
    include: {
      category: true,
      snapshots: {
        orderBy: { snapshotDate: "desc" },
        take: 90, // últimos 90 dias
      },
      videos: {
        orderBy: { publishedAt: "desc" },
        take: 20,
      },
      aiReports: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!channel) return null;

  // Calcular distribuição por tipo
  const allVideos = await prisma.ytVideo.groupBy({
    by: ["videoType"],
    where: { channelId: id },
    _count: true,
  });

  const videoTypeDistribution: Record<string, number> = {};
  for (const v of allVideos) {
    videoTypeDistribution[v.videoType] = v._count;
  }

  return {
    channel: {
      ...channel,
      subscribers: channel.subscribers.toString(),
      totalViews: channel.totalViews.toString(),
      viewsShorts: channel.viewsShorts.toString(),
      viewsLongs: channel.viewsLongs.toString(),
      viewsLives: channel.viewsLives.toString(),
      snapshots: channel.snapshots.map((s) => ({
        ...s,
        subscribers: s.subscribers.toString(),
        totalViews: s.totalViews.toString(),
        viewsShorts: s.viewsShorts.toString(),
        viewsLongs: s.viewsLongs.toString(),
        deltaViews: s.deltaViews.toString(),
      })),
      videos: channel.videos.map((v) => ({
        ...v,
        views: v.views.toString(),
      })),
    },
    videoTypeDistribution,
  };
}

// ── Upsert Channel ──────────────────────────────────────────

export async function upsertChannel(
  data: {
    youtubeChannelId: string;
    name: string;
    handle?: string;
    description?: string;
    thumbnailUrl?: string;
    bannerUrl?: string;
    country?: string;
    customUrl?: string;
    subscribers: bigint;
    totalViews: bigint;
    totalVideos: number;
  },
  categoryId: string
) {
  return prisma.ytChannel.upsert({
    where: { youtubeChannelId: data.youtubeChannelId },
    update: {
      name: data.name,
      handle: data.handle,
      description: data.description,
      thumbnailUrl: data.thumbnailUrl,
      bannerUrl: data.bannerUrl,
      country: data.country,
      customUrl: data.customUrl,
      subscribers: data.subscribers,
      totalViews: data.totalViews,
      totalVideos: data.totalVideos,
      lastFetchedAt: new Date(),
    },
    create: {
      youtubeChannelId: data.youtubeChannelId,
      name: data.name,
      handle: data.handle,
      description: data.description,
      thumbnailUrl: data.thumbnailUrl,
      bannerUrl: data.bannerUrl,
      country: data.country,
      customUrl: data.customUrl,
      subscribers: data.subscribers,
      totalViews: data.totalViews,
      totalVideos: data.totalVideos,
      categoryId,
      lastFetchedAt: new Date(),
    },
  });
}

// ── Upsert Videos ───────────────────────────────────────────

export async function upsertVideos(
  channelId: string,
  videos: Array<{
    youtubeVideoId: string;
    title: string;
    description?: string;
    thumbnailUrl?: string;
    videoType: string;
    views: bigint;
    likes: number;
    comments: number;
    duration: number;
    publishedAt: Date;
    dayOfWeek: number;
    hourOfDay: number;
  }>
) {
  for (const video of videos) {
    await prisma.ytVideo.upsert({
      where: { youtubeVideoId: video.youtubeVideoId },
      update: {
        views: video.views,
        likes: video.likes,
        comments: video.comments,
        title: video.title,
      },
      create: {
        youtubeVideoId: video.youtubeVideoId,
        title: video.title,
        description: video.description,
        thumbnailUrl: video.thumbnailUrl,
        videoType: video.videoType,
        views: video.views,
        likes: video.likes,
        comments: video.comments,
        duration: video.duration,
        publishedAt: video.publishedAt,
        dayOfWeek: video.dayOfWeek,
        hourOfDay: video.hourOfDay,
        channelId,
      },
    });
  }
}

// ── Snapshots ───────────────────────────────────────────────

export async function createChannelSnapshot(channelId: string) {
  const channel = await prisma.ytChannel.findUnique({ where: { id: channelId } });
  if (!channel) return null;

  // Buscar snapshot anterior para calcular deltas
  const prevSnapshot = await prisma.ytChannelSnapshot.findFirst({
    where: { channelId },
    orderBy: { snapshotDate: "desc" },
  });

  const deltaSubscribers = prevSnapshot
    ? Number(channel.subscribers) - Number(prevSnapshot.subscribers)
    : 0;
  const deltaViews = prevSnapshot
    ? channel.totalViews - prevSnapshot.totalViews
    : BigInt(0);
  const deltaVideos = prevSnapshot
    ? channel.totalVideos - prevSnapshot.totalVideos
    : 0;

  return prisma.ytChannelSnapshot.create({
    data: {
      channelId,
      subscribers: channel.subscribers,
      totalViews: channel.totalViews,
      totalVideos: channel.totalVideos,
      viewsShorts: channel.viewsShorts,
      viewsLongs: channel.viewsLongs,
      deltaSubscribers,
      deltaViews,
      deltaVideos,
    },
  });
}

// ── Recalculate Metrics ─────────────────────────────────────

export async function recalculateChannelMetrics(channelId: string) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Snapshots para cálculo de crescimento
  const weekSnapshot = await prisma.ytChannelSnapshot.findFirst({
    where: { channelId, snapshotDate: { lte: weekAgo } },
    orderBy: { snapshotDate: "desc" },
  });

  const monthSnapshot = await prisma.ytChannelSnapshot.findFirst({
    where: { channelId, snapshotDate: { lte: monthAgo } },
    orderBy: { snapshotDate: "desc" },
  });

  const channel = await prisma.ytChannel.findUnique({ where: { id: channelId } });
  if (!channel) return;

  // Views por tipo
  const viewsByType = await prisma.ytVideo.groupBy({
    by: ["videoType"],
    where: { channelId },
    _sum: { views: true },
  });

  let viewsShorts = BigInt(0);
  let viewsLongs = BigInt(0);
  let viewsLives = BigInt(0);
  let shortCount = 0;

  for (const v of viewsByType) {
    const s = v._sum.views || BigInt(0);
    if (v.videoType === "SHORT") { viewsShorts = s; shortCount++; }
    if (v.videoType === "LONG") viewsLongs = s;
    if (v.videoType === "LIVE") viewsLives = s;
  }

  // Uploads recentes
  const uploadsThisWeek = await prisma.ytVideo.count({
    where: { channelId, publishedAt: { gte: weekAgo } },
  });
  const uploadsThisMonth = await prisma.ytVideo.count({
    where: { channelId, publishedAt: { gte: monthAgo } },
  });

  // Lives por mês
  const livesCount = await prisma.ytVideo.count({
    where: { channelId, videoType: "LIVE", publishedAt: { gte: monthAgo } },
  });

  // Último vídeo
  const lastVideo = await prisma.ytVideo.findFirst({
    where: { channelId },
    orderBy: { publishedAt: "desc" },
  });

  // Calcular crescimento
  const currentViews = bigintToNumber(channel.totalViews);
  const weeklyGrowth =
    weekSnapshot && bigintToNumber(weekSnapshot.totalViews) > 0
      ? ((currentViews - bigintToNumber(weekSnapshot.totalViews)) /
          bigintToNumber(weekSnapshot.totalViews)) *
        100
      : 0;

  const monthlyGrowth =
    monthSnapshot && bigintToNumber(monthSnapshot.totalViews) > 0
      ? ((currentViews - bigintToNumber(monthSnapshot.totalViews)) /
          bigintToNumber(monthSnapshot.totalViews)) *
        100
      : 0;

  // Subs ganhos
  const subsGainedWeek = weekSnapshot
    ? Number(channel.subscribers) - Number(weekSnapshot.subscribers)
    : 0;
  const subsGainedMonth = monthSnapshot
    ? Number(channel.subscribers) - Number(monthSnapshot.subscribers)
    : 0;

  // Médias
  const totalVids = channel.totalVideos || 1;
  const avgViewsPerVideo = currentViews / totalVids;

  const shortsData = await prisma.ytVideo.aggregate({
    where: { channelId, videoType: "SHORT" },
    _avg: { views: true },
    _count: true,
  });
  const avgViewsPerShort = shortsData._count > 0 
    ? Number(shortsData._avg.views || 0)
    : 0;

  await prisma.ytChannel.update({
    where: { id: channelId },
    data: {
      viewsShorts,
      viewsLongs,
      viewsLives,
      weeklyGrowth: parseFloat(weeklyGrowth.toFixed(2)),
      monthlyGrowth: parseFloat(monthlyGrowth.toFixed(2)),
      uploadsThisWeek,
      uploadsThisMonth,
      subsGainedWeek,
      subsGainedMonth,
      livesPerMonth: livesCount,
      lastVideoAt: lastVideo?.publishedAt || null,
      avgViewsPerVideo: Math.round(avgViewsPerVideo),
      avgViewsPerShort: Math.round(avgViewsPerShort),
    },
  });
}

// ── Recalculate Rankings ────────────────────────────────────

export async function recalculateRankings() {
  const channels = await prisma.ytChannel.findMany({
    where: { isActive: true },
    orderBy: { subscribers: "desc" },
    select: { id: true },
  });

  for (let i = 0; i < channels.length; i++) {
    await prisma.ytChannel.update({
      where: { id: channels[i].id },
      data: { rankPosition: i + 1 },
    });
  }
}

// ── Charts Data ─────────────────────────────────────────────

export async function getChartData(
  chartType: string,
  filters: { period?: string; categoryId?: string; channelIds?: string[] }
) {
  switch (chartType) {
    case "evolution": return getViewsEvolution(filters);
    case "subscribers": return getSubscribersEvolution(filters);
    case "types": return getVideoTypeDistribution(filters);
    case "weekday": return getUploadsByWeekday(filters);
    case "hourly": return getPostingHeatmap(filters);
    case "niche": return getGrowthByNiche();
    case "topGrowth": return getTopByGrowth();
    case "topViews": return getTopByViews();
    case "format": return getFormatComparison(filters);
    case "frequency": return getPostingFrequency(filters);
    default: return {};
  }
}

async function getViewsEvolution(filters: any) {
  const where: any = {};
  if (filters.categoryId) {
    const channels = await prisma.ytChannel.findMany({
      where: { categoryId: filters.categoryId },
      select: { id: true },
    });
    where.channelId = { in: channels.map((c) => c.id) };
  }

  const snapshots = await prisma.ytChannelSnapshot.findMany({
    where,
    orderBy: { snapshotDate: "asc" },
    take: 365,
  });

  // Agrupar por data
  const byDate: Record<string, bigint> = {};
  for (const s of snapshots) {
    const key = s.snapshotDate.toISOString().split("T")[0];
    byDate[key] = (byDate[key] || BigInt(0)) + s.totalViews;
  }

  return Object.entries(byDate).map(([date, views]) => ({
    date,
    views: Number(views),
  }));
}

async function getSubscribersEvolution(filters: any) {
  const where: any = {};
  if (filters.categoryId) {
    const channels = await prisma.ytChannel.findMany({
      where: { categoryId: filters.categoryId },
      select: { id: true },
    });
    where.channelId = { in: channels.map((c) => c.id) };
  }

  const snapshots = await prisma.ytChannelSnapshot.findMany({
    where,
    orderBy: { snapshotDate: "asc" },
    take: 365,
  });

  const byDate: Record<string, bigint> = {};
  for (const s of snapshots) {
    const key = s.snapshotDate.toISOString().split("T")[0];
    byDate[key] = (byDate[key] || BigInt(0)) + s.subscribers;
  }

  return Object.entries(byDate).map(([date, subscribers]) => ({
    date,
    subscribers: Number(subscribers),
  }));
}

async function getVideoTypeDistribution(filters: any) {
  const where: any = {};
  if (filters.categoryId) {
    const channels = await prisma.ytChannel.findMany({
      where: { categoryId: filters.categoryId },
      select: { id: true },
    });
    where.channelId = { in: channels.map((c) => c.id) };
  }

  const groups = await prisma.ytVideo.groupBy({
    by: ["videoType"],
    where,
    _count: true,
    _sum: { views: true },
  });

  return groups.map((g) => ({
    type: g.videoType,
    count: g._count,
    views: Number(g._sum.views || 0),
  }));
}

async function getUploadsByWeekday(filters: any) {
  const where: any = {};
  if (filters.categoryId) {
    const channels = await prisma.ytChannel.findMany({
      where: { categoryId: filters.categoryId },
      select: { id: true },
    });
    where.channelId = { in: channels.map((c) => c.id) };
  }

  const groups = await prisma.ytVideo.groupBy({
    by: ["dayOfWeek"],
    where,
    _count: true,
  });

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  return dayNames.map((name, i) => ({
    day: name,
    count: groups.find((g) => g.dayOfWeek === i)?._count || 0,
  }));
}

async function getPostingHeatmap(filters: any) {
  const where: any = {};
  if (filters.categoryId) {
    const channels = await prisma.ytChannel.findMany({
      where: { categoryId: filters.categoryId },
      select: { id: true },
    });
    where.channelId = { in: channels.map((c) => c.id) };
  }

  const groups = await prisma.ytVideo.groupBy({
    by: ["dayOfWeek", "hourOfDay"],
    where,
    _count: true,
  });

  return groups.map((g) => ({
    day: g.dayOfWeek,
    hour: g.hourOfDay,
    count: g._count,
  }));
}

async function getGrowthByNiche() {
  const categories = await prisma.ytCategory.findMany({
    where: { isActive: true },
    include: {
      channels: {
        where: { isActive: true },
        select: { weeklyGrowth: true },
      },
    },
  });

  return categories
    .map((cat) => {
      const avg =
        cat.channels.length > 0
          ? cat.channels.reduce((sum, ch) => sum + ch.weeklyGrowth, 0) /
            cat.channels.length
          : 0;
      return { niche: cat.name, growth: parseFloat(avg.toFixed(2)), color: cat.color };
    })
    .sort((a, b) => b.growth - a.growth);
}

async function getTopByGrowth() {
  const channels = await prisma.ytChannel.findMany({
    where: { isActive: true },
    orderBy: { weeklyGrowth: "desc" },
    take: 10,
    select: {
      id: true,
      name: true,
      thumbnailUrl: true,
      weeklyGrowth: true,
      subscribers: true,
    },
  });

  return channels.map((ch) => ({
    ...ch,
    subscribers: ch.subscribers.toString(),
  }));
}

async function getTopByViews() {
  const channels = await prisma.ytChannel.findMany({
    where: { isActive: true },
    orderBy: { totalViews: "desc" },
    take: 10,
    select: {
      id: true,
      name: true,
      thumbnailUrl: true,
      totalViews: true,
      subscribers: true,
    },
  });

  return channels.map((ch) => ({
    ...ch,
    totalViews: ch.totalViews.toString(),
    subscribers: ch.subscribers.toString(),
  }));
}

async function getFormatComparison(filters: any) {
  const where: any = {};
  if (filters.categoryId) {
    const channels = await prisma.ytChannel.findMany({
      where: { categoryId: filters.categoryId },
      select: { id: true },
    });
    where.channelId = { in: channels.map((c) => c.id) };
  }

  // Agrupar por mês e tipo
  const videos = await prisma.ytVideo.findMany({
    where,
    select: { videoType: true, publishedAt: true },
    orderBy: { publishedAt: "asc" },
  });

  const byMonth: Record<string, Record<string, number>> = {};
  for (const v of videos) {
    const month = v.publishedAt.toISOString().slice(0, 7);
    if (!byMonth[month]) byMonth[month] = { SHORT: 0, LONG: 0, LIVE: 0 };
    byMonth[month][v.videoType]++;
  }

  return Object.entries(byMonth).map(([month, types]) => ({
    month,
    ...types,
  }));
}

async function getPostingFrequency(filters: any) {
  const where: any = {};
  if (filters.categoryId) {
    const channels = await prisma.ytChannel.findMany({
      where: { categoryId: filters.categoryId },
      select: { id: true, name: true },
    });
    where.channelId = { in: channels.map((c) => c.id) };
  }

  const channels = await prisma.ytChannel.findMany({
    where: { isActive: true, ...(filters.categoryId ? { categoryId: filters.categoryId } : {}) },
    take: 20,
    orderBy: { totalViews: "desc" },
    select: { id: true, name: true },
  });

  const result = [];
  for (const ch of channels) {
    const videos = await prisma.ytVideo.findMany({
      where: { channelId: ch.id },
      select: { publishedAt: true },
      orderBy: { publishedAt: "desc" },
      take: 30,
    });
    result.push({
      channel: ch.name,
      uploads: videos.map((v) => v.publishedAt.toISOString().split("T")[0]),
    });
  }

  return result;
}

// ── Bubble Chart Data ───────────────────────────────────────

export async function getBubbleData(
  sizeBy: string = "views",
  categoryId?: string
) {
  const where: any = { isActive: true };
  if (categoryId) where.categoryId = categoryId;

  const channels = await prisma.ytChannel.findMany({
    where,
    orderBy: { totalViews: "desc" },
    take: 200,
    include: { category: { select: { name: true, color: true } } },
  });

  return channels.map((ch) => ({
    id: ch.id,
    name: ch.name,
    totalViews: Number(ch.totalViews),
    subscribers: Number(ch.subscribers),
    viewsShorts: Number(ch.viewsShorts),
    viewsLongs: Number(ch.viewsLongs),
    growth: ch.weeklyGrowth,
    url: ch.customUrl || `https://youtube.com/channel/${ch.youtubeChannelId}`,
    category: ch.category.name,
    categoryColor: ch.category.color,
    thumbnailUrl: ch.thumbnailUrl,
  }));
}

// ── AI Reports ──────────────────────────────────────────────

export async function saveAiReport(
  channelId: string,
  report: {
    summary: string;
    insights: string;
    recommendations: string;
    rawResponse?: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    costUsd: number;
  }
) {
  return prisma.ytAiReport.create({
    data: { channelId, ...report },
  });
}

export async function getLatestAiReport(channelId: string) {
  return prisma.ytAiReport.findFirst({
    where: { channelId },
    orderBy: { createdAt: "desc" },
  });
}

// ── Export ───────────────────────────────────────────────────

export async function getAllChannelsForExport(categoryId?: string) {
  const where: any = { isActive: true };
  if (categoryId) where.categoryId = categoryId;

  return prisma.ytChannel.findMany({
    where,
    orderBy: { rankPosition: "asc" },
    include: { category: { select: { name: true } } },
  });
}

// ── Active Channels for Scheduler ───────────────────────────

export async function getActiveChannels() {
  return prisma.ytChannel.findMany({
    where: { isActive: true },
    select: { id: true, youtubeChannelId: true, categoryId: true },
  });
}
