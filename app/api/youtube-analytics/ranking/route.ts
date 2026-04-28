import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Metric = "subscribers" | "viewsLongs" | "viewsShorts" | "totalViews";
type Period = "7d" | "30d" | "90d";

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function parseMetric(v: string | null): Metric {
  if (v === "viewsLongs" || v === "viewsShorts" || v === "totalViews") return v;
  return "subscribers";
}

function parsePeriod(v: string | null): Period {
  if (v === "7d" || v === "90d") return v;
  return "30d";
}

function daysFromPeriod(p: Period) {
  if (p === "7d") return 7;
  if (p === "90d") return 90;
  return 30;
}

function toStringBigInt(v: bigint) {
  return v.toString();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const metric = parseMetric(searchParams.get("metric"));
    const period = parsePeriod(searchParams.get("period"));
    const categoryId = searchParams.get("categoryId") || undefined;
    const country = (searchParams.get("country") || "").trim().toUpperCase() || undefined;

    const page = clampInt(parseInt(searchParams.get("page") || "1", 10) || 1, 1, 10_000);
    const pageSize = clampInt(parseInt(searchParams.get("pageSize") || "20", 10) || 20, 10, 100);
    const skip = (page - 1) * pageSize;

    const where: any = { isActive: true };
    if (categoryId) where.categoryId = categoryId;
    if (country) where.country = country;

    const orderBy: any = {};
    orderBy[metric] = "desc";

    const [total, channels] = await Promise.all([
      prisma.ytChannel.count({ where }),
      prisma.ytChannel.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: { category: { select: { name: true, color: true, slug: true } } },
      }),
    ]);

    const ids = channels.map((c) => c.id);
    const startDate = new Date(Date.now() - daysFromPeriod(period) * 24 * 60 * 60 * 1000);

    const [latestSnapshots, startSnapshots] = await Promise.all([
      prisma.ytChannelSnapshot.findMany({
        where: { channelId: { in: ids } },
        orderBy: { snapshotDate: "desc" },
        distinct: ["channelId"],
      }),
      prisma.ytChannelSnapshot.findMany({
        where: { channelId: { in: ids }, snapshotDate: { lte: startDate } },
        orderBy: { snapshotDate: "desc" },
        distinct: ["channelId"],
      }),
    ]);

    const latestMap = new Map(latestSnapshots.map((s) => [s.channelId, s]));
    const startMap = new Map(startSnapshots.map((s) => [s.channelId, s]));

    const data = channels.map((ch) => {
      const latest = latestMap.get(ch.id) ?? null;
      const start = startMap.get(ch.id) ?? null;

      const deltaSubscribers =
        latest && start ? (latest.subscribers - start.subscribers).toString() : null;
      const deltaTotalViews =
        latest && start ? (latest.totalViews - start.totalViews).toString() : null;
      const deltaViewsLongs =
        latest && start ? (latest.viewsLongs - start.viewsLongs).toString() : null;
      const deltaViewsShorts =
        latest && start ? (latest.viewsShorts - start.viewsShorts).toString() : null;

      return {
        id: ch.id,
        name: ch.name,
        thumbnailUrl: ch.thumbnailUrl,
        customUrl: ch.customUrl,
        youtubeChannelId: ch.youtubeChannelId,
        country: ch.country ?? null,
        category: ch.category,
        subscribers: toStringBigInt(ch.subscribers),
        totalViews: toStringBigInt(ch.totalViews),
        viewsLongs: toStringBigInt(ch.viewsLongs),
        viewsShorts: toStringBigInt(ch.viewsShorts),
        deltaSubscribers,
        deltaTotalViews,
        deltaViewsLongs,
        deltaViewsShorts,
      };
    });

    return NextResponse.json({
      metric,
      period,
      total,
      page,
      pageSize,
      data,
    });
  } catch (error: any) {
    console.error("Ranking error:", error);
    return NextResponse.json(
      { error: "Falha ao buscar ranking" },
      { status: 500 }
    );
  }
}

