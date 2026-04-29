import { NextRequest, NextResponse } from "next/server";
import { searchChannelsByName, fetchMultipleChannels } from "@/lib/youtubeDataApi";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function parseIntSafe(value: unknown, fallback: number) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeNames(value: unknown) {
  const raw = Array.isArray(value) ? value : [];
  return raw
    .map((item) => String(item ?? "").trim())
    .filter(Boolean)
    .slice(0, 25);
}

/**
 * POST /api/youtube-analytics/resolve-channel-names
 *
 * Resolve uma lista de nomes para candidatos de canais (channelId).
 * Importante: usa search.list (quota cara). Limitado a 25 nomes por request.
 *
 * Body:
 * - names: string[]
 * - regionCode?: string
 * - relevanceLanguage?: string
 * - maxCandidates?: number (default 5, max 10)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const names = normalizeNames(body?.names);
    const regionCode = String(body?.regionCode ?? "").trim().toUpperCase() || undefined;
    const relevanceLanguage = String(body?.relevanceLanguage ?? "").trim() || undefined;
    const maxCandidates = Math.min(10, Math.max(1, parseIntSafe(body?.maxCandidates, 5)));

    if (names.length === 0) {
      return NextResponse.json({ error: "names is required" }, { status: 400 });
    }

    const results: Array<{
      name: string;
      candidates: Array<{
        youtubeChannelId: string;
        name: string;
        thumbnailUrl?: string;
        customUrl?: string;
        country?: string;
        subscribers?: string;
        totalViews?: string;
      }>;
    }> = [];

    for (const name of names) {
      const candidates = await searchChannelsByName({
        query: name,
        regionCode,
        relevanceLanguage,
        maxResults: maxCandidates,
      });

      const channelIds = candidates.map((c) => c.youtubeChannelId);
      const enriched = channelIds.length ? await fetchMultipleChannels(channelIds) : [];
      const byId = new Map(enriched.map((ch) => [ch.youtubeChannelId, ch]));

      results.push({
        name,
        candidates: candidates.map((c) => {
          const extra = byId.get(c.youtubeChannelId);
          return {
            youtubeChannelId: c.youtubeChannelId,
            name: extra?.name || c.name,
            thumbnailUrl: extra?.thumbnailUrl || c.thumbnailUrl,
            customUrl: extra?.customUrl,
            country: extra?.country,
            subscribers: extra ? extra.subscribers.toString() : undefined,
            totalViews: extra ? extra.totalViews.toString() : undefined,
          };
        }),
      });
    }

    return NextResponse.json({
      success: true,
      note:
        "Resolução baseada em busca por nome (YouTube search.list). Sempre revise antes de importar para evitar canais errados.",
      results,
      limits: { maxNamesPerRequest: 25, maxCandidatesPerName: 10 },
    });
  } catch (error: any) {
    console.error("Resolve channel names error:", error);
    return NextResponse.json(
      { error: error?.message || "Falha ao resolver nomes" },
      { status: 500 }
    );
  }
}

