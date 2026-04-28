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
      include: {
        category: { select: { name: true, color: true, slug: true } },
        videos: {
          where: {
            OR: [
              { publishedAt: { gte: start, lte: end } },
              { publishedAt: { gte: previousStart, lte: previousEnd } },
            ],
          },
          select: {
            videoType: true,
            views: true,
            publishedAt: true,
          },
        },
        snapshots: {
          where: {
            OR: [
              { snapshotDate: { lte: end } },
              { snapshotDate: { lte: previousEnd } },
            ],
          },
          orderBy: { snapshotDate: "desc" },
          select: {
            snapshotDate: true,
            totalViews: true,
          },
        },
      },
    });

    const rows: ChannelAggregate[] = channels.map((channel) => {
      let currentPeriodVideosTotal = 0;
      let currentPeriodVideosLongs = 0;
      let currentPeriodVideosShorts = 0;
      let previousPeriodVideosTotal = 0;
      let previousPeriodVideosLongs = 0;
      let previousPeriodVideosShorts = 0;
      let currentPeriodViewsLongs = BigInt(0);
      let currentPeriodViewsShorts = BigInt(0);
      let previousPeriodViewsLongs = BigInt(0);
      let previousPeriodViewsShorts = BigInt(0);

      for (const video of channel.videos) {
        const publishedAt = new Date(video.publishedAt);
        const isCurrent = publishedAt >= start && publishedAt <= end;
        const isPrevious = publishedAt >= previousStart && publishedAt <= previousEnd;

        if (isCurrent) {
          currentPeriodVideosTotal += 1;
          if (video.videoType === "SHORT") {
            currentPeriodVideosShorts += 1;
            currentPeriodViewsShorts += video.views;
          } else if (video.videoType === "LONG") {
            currentPeriodVideosLongs += 1;
            currentPeriodViewsLongs += video.views;
          }
        }

        if (isPrevious) {
          previousPeriodVideosTotal += 1;
          if (video.videoType === "SHORT") {
            previousPeriodVideosShorts += 1;
            previousPeriodViewsShorts += video.views;
          } else if (video.videoType === "LONG") {
            previousPeriodVideosLongs += 1;
            previousPeriodViewsLongs += video.views;
          }
        }
      }

      const currentPeriodViewsTotal = currentPeriodViewsLongs + currentPeriodViewsShorts;
      const previousPeriodViewsTotal = previousPeriodViewsLongs + previousPeriodViewsShorts;

      const latestAtOrBeforeEnd =
        channel.snapshots.find((snapshot) => new Date(snapshot.snapshotDate) <= end) || null;
      const latestAtOrBeforePreviousEnd =
        channel.snapshots.find((snapshot) => new Date(snapshot.snapshotDate) <= previousEnd) || null;

      const totalViewsCurrent = latestAtOrBeforeEnd?.totalViews ?? channel.totalViews;
      const totalViewsPrevious = latestAtOrBeforePreviousEnd?.totalViews ?? null;
      const totalViewsDelta =
        totalViewsPrevious !== null ? totalViewsCurrent - totalViewsPrevious : null;

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
        totalViewsDelta: totalViewsDelta ? toStringBigInt(totalViewsDelta) : totalViewsDelta === BigInt(0) ? "0" : null,
        currentPeriodVideosTotal,
        currentPeriodVideosLongs,
        currentPeriodVideosShorts,
        previousPeriodVideosTotal,
        previousPeriodVideosLongs,
        previousPeriodVideosShorts,
        currentPeriodViewsLongs: toStringBigInt(currentPeriodViewsLongs),
        currentPeriodViewsShorts: toStringBigInt(currentPeriodViewsShorts),
        currentPeriodViewsTotal: toStringBigInt(currentPeriodViewsTotal),
        previousPeriodViewsLongs: toStringBigInt(previousPeriodViewsLongs),
        previousPeriodViewsShorts: toStringBigInt(previousPeriodViewsShorts),
        previousPeriodViewsTotal: toStringBigInt(previousPeriodViewsTotal),
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
