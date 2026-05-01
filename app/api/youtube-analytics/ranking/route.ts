import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type SortOrder = "asc" | "desc";
type RankingSortBy =
  | "subscribers"
  | "totalViewsCurrent"
  | "currentPeriodVideosTotal"
  | "currentPeriodViewsLongs"
  | "currentPeriodViewsShorts"
  | "currentPeriodViewsTotal";

type ChannelAggregate = {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  customUrl: string | null;
  youtubeChannelId: string;
  country: string | null;
  category: { name: string; color: string; slug: string };
  subscribers: string;
  totalViewsCurrent: string;
  totalViewsPrevious: string | null;
  totalViewsDelta: string | null;
  currentPeriodVideosTotal: number;
  currentPeriodVideosLongs: number;
  currentPeriodVideosShorts: number;
  previousPeriodVideosTotal: number;
  previousPeriodVideosLongs: number;
  previousPeriodVideosShorts: number;
  currentPeriodViewsLongs: string;
  currentPeriodViewsShorts: string;
  currentPeriodViewsTotal: string;
  previousPeriodViewsLongs: string;
  previousPeriodViewsShorts: string;
  previousPeriodViewsTotal: string;
  currentRank: number;
  previousRank: number | null;
  rankDelta: number | null;
  percentChange: number | null;
};

function clampInt(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function parseSortBy(value: string | null): RankingSortBy {
  switch (value) {
    case "subscribers":
    case "totalViewsCurrent":
    case "currentPeriodVideosTotal":
    case "currentPeriodViewsLongs":
    case "currentPeriodViewsShorts":
    case "currentPeriodViewsTotal":
      return value;
    default:
      return "currentPeriodViewsTotal";
  }
}

function parseSortOrder(value: string | null): SortOrder {
  return value === "asc" ? "asc" : "desc";
}

function buildDefaultDateRange() {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 30);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function parseDateRange(searchParams: URLSearchParams) {
  const fallback = buildDefaultDateRange();
  const rawDateFrom = searchParams.get("dateFrom");
  const rawDateTo = searchParams.get("dateTo");

  const start = rawDateFrom ? new Date(rawDateFrom) : fallback.start;
  const end = rawDateTo ? new Date(rawDateTo) : fallback.end;

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return fallback;
  }

  return { start, end };
}

function toStringBigInt(value: bigint) {
  return value.toString();
}

function compareMetric(left: bigint | number, right: bigint | number, sortOrder: SortOrder) {
  if (typeof left === "bigint" || typeof right === "bigint") {
    const a = typeof left === "bigint" ? left : BigInt(left);
    const b = typeof right === "bigint" ? right : BigInt(right);
    if (a === b) return 0;
    return sortOrder === "asc" ? (a < b ? -1 : 1) : a > b ? -1 : 1;
  }

  if (left === right) return 0;
  return sortOrder === "asc" ? (left < right ? -1 : 1) : left > right ? -1 : 1;
}

function getMetricValue(row: ChannelAggregate, sortBy: RankingSortBy) {
  switch (sortBy) {
    case "subscribers":
      return BigInt(row.subscribers);
    case "totalViewsCurrent":
      return BigInt(row.totalViewsCurrent);
    case "currentPeriodVideosTotal":
      return row.currentPeriodVideosTotal;
    case "currentPeriodViewsLongs":
      return BigInt(row.currentPeriodViewsLongs);
    case "currentPeriodViewsShorts":
      return BigInt(row.currentPeriodViewsShorts);
    case "currentPeriodViewsTotal":
    default:
      return BigInt(row.currentPeriodViewsTotal);
  }
}

function getPreviousMetricValue(row: ChannelAggregate, sortBy: RankingSortBy) {
  switch (sortBy) {
    case "subscribers":
      return BigInt(row.subscribers);
    case "totalViewsCurrent":
      return row.totalViewsPrevious ? BigInt(row.totalViewsPrevious) : BigInt(0);
    case "currentPeriodVideosTotal":
      return row.previousPeriodVideosTotal;
    case "currentPeriodViewsLongs":
      return BigInt(row.previousPeriodViewsLongs);
    case "currentPeriodViewsShorts":
      return BigInt(row.previousPeriodViewsShorts);
    case "currentPeriodViewsTotal":
    default:
      return BigInt(row.previousPeriodViewsTotal);
  }
}

function calculatePercentChange(current: bigint | number, previous: bigint | number) {
  const currentNumber = typeof current === "bigint" ? Number(current) : current;
  const previousNumber = typeof previous === "bigint" ? Number(previous) : previous;

  if (!Number.isFinite(currentNumber) || !Number.isFinite(previousNumber)) return null;
  if (previousNumber === 0) {
    if (currentNumber === 0) return 0;
    return null;
  }

  return Number((((currentNumber - previousNumber) / previousNumber) * 100).toFixed(1));
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId") || undefined;
    const country = (searchParams.get("country") || "").trim().toUpperCase() || undefined;
    const sortBy = parseSortBy(searchParams.get("sortBy"));
    const sortOrder = parseSortOrder(searchParams.get("sortOrder"));
    const page = clampInt(parseInt(searchParams.get("page") || "1", 10) || 1, 1, 10_000);
    const pageSize = clampInt(parseInt(searchParams.get("pageSize") || "50", 10) || 50, 10, 100);
    const skip = (page - 1) * pageSize;
    const { start, end } = parseDateRange(searchParams);

    const currentDurationMs = end.getTime() - start.getTime();
    const previousEnd = new Date(start.getTime() - 1);
    const previousStart = new Date(previousEnd.getTime() - currentDurationMs);

    const where: Record<string, unknown> = { isActive: true };
    if (categoryId) where.categoryId = categoryId;
    if (country) where.country = country;

    const channels = await prisma.ytChannel.findMany({
      where,
      select: {
        id: true,
        name: true,
        thumbnailUrl: true,
        customUrl: true,
        youtubeChannelId: true,
        country: true,
        subscribers: true,
        totalViews: true,
        category: { select: { name: true, color: true, slug: true } },
      },
    });

    const ids = channels.map((channel) => channel.id);

    // Aggregate videos in DB (avoid loading all rows into memory)
    const [currentAgg, previousAgg] = ids.length
      ? await Promise.all([
          prisma.ytVideo.groupBy({
            by: ["channelId", "videoType"],
            where: { channelId: { in: ids }, publishedAt: { gte: start, lte: end } },
            _count: { _all: true },
            _sum: { views: true },
          }),
          prisma.ytVideo.groupBy({
            by: ["channelId", "videoType"],
            where: { channelId: { in: ids }, publishedAt: { gte: previousStart, lte: previousEnd } },
            _count: { _all: true },
            _sum: { views: true },
          }),
        ])
      : [[], []];

    const currentByChannel = new Map<
      string,
      { videosTotal: number; videosLongs: number; videosShorts: number; viewsLongs: bigint; viewsShorts: bigint }
    >();
    const previousByChannel = new Map<
      string,
      { videosTotal: number; videosLongs: number; videosShorts: number; viewsLongs: bigint; viewsShorts: bigint }
    >();

    function applyVideoAgg(
      target: Map<
        string,
        { videosTotal: number; videosLongs: number; videosShorts: number; viewsLongs: bigint; viewsShorts: bigint }
      >,
      rows: Array<any>
    ) {
      for (const row of rows) {
        const curr =
          target.get(row.channelId) || {
            videosTotal: 0,
            videosLongs: 0,
            videosShorts: 0,
            viewsLongs: BigInt(0),
            viewsShorts: BigInt(0),
          };

        const count = Number(row._count?._all || 0);
        const sumViews: bigint = row._sum?.views ?? BigInt(0);

        curr.videosTotal += count;
        if (row.videoType === "SHORT") {
          curr.videosShorts += count;
          curr.viewsShorts += sumViews;
        } else if (row.videoType === "LONG") {
          curr.videosLongs += count;
          curr.viewsLongs += sumViews;
        }
        target.set(row.channelId, curr);
      }
    }

    applyVideoAgg(currentByChannel, currentAgg);
    applyVideoAgg(previousByChannel, previousAgg);

    // Latest snapshots at/before end boundaries (cheap distinct queries)
    const [snapAtEnd, snapAtPreviousEnd] = ids.length
      ? await Promise.all([
          prisma.ytChannelSnapshot.findMany({
            where: { channelId: { in: ids }, snapshotDate: { lte: end } },
            orderBy: { snapshotDate: "desc" },
            distinct: ["channelId"],
            select: { channelId: true, totalViews: true },
          }),
          prisma.ytChannelSnapshot.findMany({
            where: { channelId: { in: ids }, snapshotDate: { lte: previousEnd } },
            orderBy: { snapshotDate: "desc" },
            distinct: ["channelId"],
            select: { channelId: true, totalViews: true },
          }),
        ])
      : [[], []];

    const snapEndMap = new Map(snapAtEnd.map((s) => [s.channelId, s.totalViews]));
    const snapPrevMap = new Map(snapAtPreviousEnd.map((s) => [s.channelId, s.totalViews]));

    const rows: ChannelAggregate[] = channels.map((channel) => {
      const current = currentByChannel.get(channel.id) || {
        videosTotal: 0,
        videosLongs: 0,
        videosShorts: 0,
        viewsLongs: BigInt(0),
        viewsShorts: BigInt(0),
      };
      const previous = previousByChannel.get(channel.id) || {
        videosTotal: 0,
        videosLongs: 0,
        videosShorts: 0,
        viewsLongs: BigInt(0),
        viewsShorts: BigInt(0),
      };

      const currentViewsTotal = current.viewsLongs + current.viewsShorts;
      const previousViewsTotal = previous.viewsLongs + previous.viewsShorts;

      const totalViewsCurrent = snapEndMap.get(channel.id) ?? channel.totalViews;
      const totalViewsPrevious = snapPrevMap.get(channel.id) ?? null;
      const totalViewsDelta = totalViewsPrevious !== null ? totalViewsCurrent - totalViewsPrevious : null;

      return {
        id: channel.id,
        name: channel.name,
        thumbnailUrl: channel.thumbnailUrl,
        customUrl: channel.customUrl,
        youtubeChannelId: channel.youtubeChannelId,
        country: channel.country ?? null,
        category: channel.category,
        subscribers: toStringBigInt(channel.subscribers),
        totalViewsCurrent: toStringBigInt(totalViewsCurrent),
        totalViewsPrevious: totalViewsPrevious ? toStringBigInt(totalViewsPrevious) : null,
        totalViewsDelta:
          totalViewsDelta === null ? null : toStringBigInt(totalViewsDelta),
        currentPeriodVideosTotal: current.videosTotal,
        currentPeriodVideosLongs: current.videosLongs,
        currentPeriodVideosShorts: current.videosShorts,
        previousPeriodVideosTotal: previous.videosTotal,
        previousPeriodVideosLongs: previous.videosLongs,
        previousPeriodVideosShorts: previous.videosShorts,
        currentPeriodViewsLongs: toStringBigInt(current.viewsLongs),
        currentPeriodViewsShorts: toStringBigInt(current.viewsShorts),
        currentPeriodViewsTotal: toStringBigInt(currentViewsTotal),
        previousPeriodViewsLongs: toStringBigInt(previous.viewsLongs),
        previousPeriodViewsShorts: toStringBigInt(previous.viewsShorts),
        previousPeriodViewsTotal: toStringBigInt(previousViewsTotal),
        currentRank: 0,
        previousRank: null,
        rankDelta: null,
        percentChange: null,
      };
    });

    const currentSorted = [...rows].sort((left, right) => {
      const primary = compareMetric(getMetricValue(left, sortBy), getMetricValue(right, sortBy), sortOrder);
      if (primary !== 0) return primary;
      return compareMetric(BigInt(left.subscribers), BigInt(right.subscribers), "desc");
    });

    const previousSorted = [...rows].sort((left, right) => {
      const primary = compareMetric(
        getPreviousMetricValue(left, sortBy),
        getPreviousMetricValue(right, sortBy),
        sortOrder
      );
      if (primary !== 0) return primary;
      return compareMetric(BigInt(left.subscribers), BigInt(right.subscribers), "desc");
    });

    const currentRankMap = new Map<string, number>();
    const previousRankMap = new Map<string, number>();

    currentSorted.forEach((row, index) => currentRankMap.set(row.id, index + 1));
    previousSorted.forEach((row, index) => previousRankMap.set(row.id, index + 1));

    const rankedRows = currentSorted.map((row) => {
      const currentMetric = getMetricValue(row, sortBy);
      const previousMetric = getPreviousMetricValue(row, sortBy);
      const currentRank = currentRankMap.get(row.id) || 0;
      const previousRank = previousRankMap.get(row.id) || null;

      return {
        ...row,
        currentRank,
        previousRank,
        rankDelta: previousRank ? previousRank - currentRank : null,
        percentChange: calculatePercentChange(currentMetric, previousMetric),
      };
    });

    const paginated = rankedRows.slice(skip, skip + pageSize);

    return NextResponse.json({
      total: rankedRows.length,
      page,
      pageSize,
      sortBy,
      sortOrder,
      dateFrom: start.toISOString(),
      dateTo: end.toISOString(),
      previousDateFrom: previousStart.toISOString(),
      previousDateTo: previousEnd.toISOString(),
      data: paginated,
    });
  } catch (error: any) {
    console.error("Ranking error:", error);
    return NextResponse.json({ error: "Falha ao buscar ranking" }, { status: 500 });
  }
}
