import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  fetchMultipleChannels,
  fetchTopVideosByCategoryInPeriod,
} from "@/lib/youtubeDataApi";
import {
  upsertChannel,
  createChannelSnapshot,
  recalculateRankings,
} from "@/lib/youtubeAnalyticsRepo";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function parseIntSafe(v: any, fallback: number) {
  const n = Number.parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * POST /api/youtube-analytics/discover-top-channels
 *
 * Importa automaticamente canais a partir de TOP VÍDEOS do período (workaround).
 * Limitações importantes:
 * - NÃO existe endpoint oficial para "top 100 canais por categoria".
 * - O que fazemos aqui: pega top vídeos da categoria no período (search.list order=viewCount),
 *   agrega por channelId e cadastra os canais mais fortes.
 *
 * Body:
 *  - ytCategoryId: string (nossa categoria interna)
 *  - regionCode: string (ex: BR)
 *  - youtubeVideoCategoryId: string (ex: 23 Comedy)
 *  - publishedAfter: string RFC3339
 *  - publishedBefore: string RFC3339
 *  - maxVideos?: number (<=500, default 300)
 *  - maxChannels?: number (<=200, default 100)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ytCategoryId = String(body?.ytCategoryId ?? "").trim();
    const regionCode = String(body?.regionCode ?? "BR").trim().toUpperCase();
    const youtubeVideoCategoryId = String(body?.youtubeVideoCategoryId ?? "").trim();
    const publishedAfter = String(body?.publishedAfter ?? "").trim();
    const publishedBefore = String(body?.publishedBefore ?? "").trim();

    const maxVideos = Math.min(500, Math.max(50, parseIntSafe(body?.maxVideos, 300)));
    const maxChannels = Math.min(200, Math.max(10, parseIntSafe(body?.maxChannels, 100)));

    if (!ytCategoryId) {
      return NextResponse.json({ error: "ytCategoryId is required" }, { status: 400 });
    }
    if (!youtubeVideoCategoryId) {
      return NextResponse.json({ error: "youtubeVideoCategoryId is required" }, { status: 400 });
    }
    if (!publishedAfter || !publishedBefore) {
      return NextResponse.json(
        { error: "publishedAfter and publishedBefore are required (RFC3339)" },
        { status: 400 }
      );
    }

    const cat = await prisma.ytCategory.findUnique({ where: { id: ytCategoryId } });
    if (!cat) {
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
    }

    const topVideos = await fetchTopVideosByCategoryInPeriod({
      regionCode,
      videoCategoryId: youtubeVideoCategoryId,
      publishedAfter,
      publishedBefore,
      maxResults: maxVideos,
    });

    // Aggregate by channel
    const byChannel = new Map<
      string,
      { youtubeChannelId: string; videos: number; summedViews: bigint }
    >();
    for (const v of topVideos) {
      const curr = byChannel.get(v.youtubeChannelId) || {
        youtubeChannelId: v.youtubeChannelId,
        videos: 0,
        summedViews: BigInt(0),
      };
      curr.videos += 1;
      curr.summedViews += v.views;
      byChannel.set(v.youtubeChannelId, curr);
    }

    const ranked = Array.from(byChannel.values())
      .sort((a, b) => (a.summedViews > b.summedViews ? -1 : a.summedViews < b.summedViews ? 1 : 0))
      .slice(0, maxChannels);

    const channelIds = ranked.map((r) => r.youtubeChannelId);
    const channelData = await fetchMultipleChannels(channelIds);

    const createdOrUpdated: string[] = [];
    const errors: Array<{ youtubeChannelId: string; error: string }> = [];

    for (const data of channelData) {
      try {
        const updated = await upsertChannel(
          {
            ...data,
            country: data.country || regionCode,
          },
          ytCategoryId
        );
        createdOrUpdated.push(updated.id);
        await createChannelSnapshot(updated.id);
      } catch (e: any) {
        errors.push({ youtubeChannelId: data.youtubeChannelId, error: e?.message || "Erro ao upsert" });
      }
    }

    await recalculateRankings();

    return NextResponse.json({
      success: true,
      ytCategory: { id: cat.id, name: cat.name, slug: cat.slug },
      regionCode,
      youtubeVideoCategoryId,
      publishedAfter,
      publishedBefore,
      topVideosFetched: topVideos.length,
      channelsDiscovered: byChannel.size,
      channelsImported: createdOrUpdated.length,
      errorsCount: errors.length,
      errors,
      note:
        "Import baseado em TOP VÍDEOS do período (não é 'top canais' oficial). Views são viewCount total no momento da coleta.",
    });
  } catch (error: any) {
    console.error("Discover top channels error:", error);
    return NextResponse.json(
      { error: error?.message || "Falha ao descobrir canais" },
      { status: 500 }
    );
  }
}

