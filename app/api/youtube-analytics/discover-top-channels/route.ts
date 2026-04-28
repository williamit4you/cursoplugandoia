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
import { resolveYoutubeCategoryFromInternalCategory } from "@/lib/youtubeCategoryMapping";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function parseIntSafe(value: unknown, fallback: number) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function resolveRelevanceLanguage(regionCode: string) {
  const byRegion: Record<string, string> = {
    BR: "pt",
    PT: "pt",
    US: "en",
    MX: "es",
    AR: "es",
    ES: "es",
  };

  return byRegion[regionCode] || "en";
}

/**
 * POST /api/youtube-analytics/discover-top-channels
 *
 * Importa automaticamente canais a partir de vídeos com mais views no período.
 * Não existe endpoint oficial do YouTube para "top canais por categoria", então
 * a descoberta é feita a partir de vídeos da categoria e agregação por canal.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ytCategoryId = String(body?.ytCategoryId ?? "").trim();
    const regionCode = String(body?.regionCode ?? "BR").trim().toUpperCase();
    const youtubeVideoCategoryIdInput = String(body?.youtubeVideoCategoryId ?? "").trim();
    const publishedAfter = String(body?.publishedAfter ?? "").trim();
    const publishedBefore = String(body?.publishedBefore ?? "").trim();
    const requireChannelCountryMatch = body?.requireChannelCountryMatch !== false;

    const maxVideos = Math.min(500, Math.max(50, parseIntSafe(body?.maxVideos, 300)));
    const maxChannels = Math.min(200, Math.max(10, parseIntSafe(body?.maxChannels, 100)));

    if (!ytCategoryId) {
      return NextResponse.json({ error: "ytCategoryId is required" }, { status: 400 });
    }

    if (!publishedAfter || !publishedBefore) {
      return NextResponse.json(
        { error: "publishedAfter and publishedBefore are required (RFC3339)" },
        { status: 400 }
      );
    }

    const category = await prisma.ytCategory.findUnique({ where: { id: ytCategoryId } });
    if (!category) {
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
    }

    const { youtubeCategoryId, youtubeCategoryLabel } =
      resolveYoutubeCategoryFromInternalCategory(category);
    const youtubeVideoCategoryId = youtubeVideoCategoryIdInput || youtubeCategoryId;
    const relevanceLanguage = resolveRelevanceLanguage(regionCode);

    const topVideos = await fetchTopVideosByCategoryInPeriod({
      regionCode,
      relevanceLanguage,
      videoCategoryId: youtubeVideoCategoryId,
      publishedAfter,
      publishedBefore,
      maxResults: maxVideos,
    });

    const byChannel = new Map<
      string,
      { youtubeChannelId: string; videos: number; summedViews: bigint }
    >();

    for (const video of topVideos) {
      const current = byChannel.get(video.youtubeChannelId) || {
        youtubeChannelId: video.youtubeChannelId,
        videos: 0,
        summedViews: BigInt(0),
      };

      current.videos += 1;
      current.summedViews += video.views;
      byChannel.set(video.youtubeChannelId, current);
    }

    const rankedChannels = Array.from(byChannel.values())
      .sort((left, right) =>
        left.summedViews > right.summedViews
          ? -1
          : left.summedViews < right.summedViews
            ? 1
            : 0
      )
      .slice(0, maxChannels);

    const channelIds = rankedChannels.map((channel) => channel.youtubeChannelId);
    const channelData = channelIds.length ? await fetchMultipleChannels(channelIds) : [];

    const createdOrUpdated: string[] = [];
    const errors: Array<{ youtubeChannelId: string; error: string }> = [];
    const skippedCountryMismatch: Array<{ youtubeChannelId: string; country: string | null }> = [];
    const skippedMissingCountry: string[] = [];

    let matchedCountryCount = 0;
    let missingCountryCount = 0;

    for (const data of channelData) {
      const channelCountry = data.country?.trim().toUpperCase() || null;

      if (channelCountry === regionCode) {
        matchedCountryCount += 1;
      } else if (!channelCountry) {
        missingCountryCount += 1;
      }

      if (requireChannelCountryMatch) {
        if (!channelCountry) {
          skippedMissingCountry.push(data.youtubeChannelId);
          continue;
        }

        if (channelCountry !== regionCode) {
          skippedCountryMismatch.push({
            youtubeChannelId: data.youtubeChannelId,
            country: channelCountry,
          });
          continue;
        }
      }

      try {
        const updated = await upsertChannel(data, ytCategoryId);
        createdOrUpdated.push(updated.id);
        await createChannelSnapshot(updated.id);
      } catch (error: any) {
        errors.push({
          youtubeChannelId: data.youtubeChannelId,
          error: error?.message || "Erro ao cadastrar canal",
        });
      }
    }

    await recalculateRankings();

    return NextResponse.json({
      success: true,
      ytCategory: { id: category.id, name: category.name, slug: category.slug },
      regionCode,
      requireChannelCountryMatch,
      relevanceLanguage,
      youtubeVideoCategoryId,
      youtubeVideoCategoryLabel: youtubeCategoryLabel,
      publishedAfter,
      publishedBefore,
      topVideosFetched: topVideos.length,
      channelsDiscovered: byChannel.size,
      rankedChannelsConsidered: rankedChannels.length,
      channelDetailsFetched: channelData.length,
      channelsWithCountryMatch: matchedCountryCount,
      channelsWithMissingCountry: missingCountryCount,
      skippedMissingCountryCount: skippedMissingCountry.length,
      skippedCountryMismatchCount: skippedCountryMismatch.length,
      skippedCountryMismatchSample: skippedCountryMismatch.slice(0, 10),
      channelsImported: createdOrUpdated.length,
      errorsCount: errors.length,
      errors,
      note:
        requireChannelCountryMatch
          ? "Importação restrita a canais cujo country público no YouTube corresponde ao país selecionado."
          : "Importação baseada em vídeos mais vistos do período, sem exigir correspondência exata do country do canal.",
    });
  } catch (error: any) {
    console.error("Discover top channels error:", error);
    return NextResponse.json(
      { error: error?.message || "Falha ao descobrir canais" },
      { status: 500 }
    );
  }
}
