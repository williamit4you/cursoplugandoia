import { google, youtube_v3 } from "googleapis";
import { PrismaClient } from "@prisma/client";

// Instancia um Prisma Client limpo ou compartilha um existente se aplicável, 
// mas para simplicidade em rota de API Serverless podemos usar a nova instância
const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════════
// YouTube Data API v3 — Service Layer
// Usa as credenciais OAuth do banco (IntegrationSettings)
// ═══════════════════════════════════════════════════════════════

async function getYoutubeClient(): Promise<youtube_v3.Youtube> {
  const youtubeIntegration = await prisma.integrationSettings.findUnique({
    where: { platform: "YOUTUBE" }
  });

  if (youtubeIntegration?.apiKey && youtubeIntegration?.apiSecret && youtubeIntegration?.refreshToken) {
    // Usar OAuth 2.0 (Mais seguro e usa cota garantida do projeto do usuário)
    const oauth2Client = new google.auth.OAuth2(
      youtubeIntegration.apiKey, // Client ID
      youtubeIntegration.apiSecret, // Client Secret
    );
    
    oauth2Client.setCredentials({ 
      refresh_token: youtubeIntegration.refreshToken 
    });

    return google.youtube({ version: "v3", auth: oauth2Client });
  }

  // Fallback para API_KEY estática se configurada no .env
  const API_KEY = process.env.YOUTUBE_DATA_API_KEY;
  if (API_KEY) {
    return google.youtube({ version: "v3", auth: API_KEY });
  }

  throw new Error("Credenciais do YouTube não configuradas. Acesse /admin/integrations para configurar as credenciais OAuth.");
}

// ── Tipos ────────────────────────────────────────────────────

export interface YtChannelData {
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
}

export interface YtVideoData {
  youtubeVideoId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  videoType: "SHORT" | "LONG" | "LIVE";
  views: bigint;
  likes: number;
  comments: number;
  duration: number; // seconds
  publishedAt: Date;
  dayOfWeek: number;
  hourOfDay: number;
}

// ── Helpers ──────────────────────────────────────────────────

/**
 * Converte ISO 8601 duration (ex: "PT1H2M10S") para segundos
 */
export function parseDuration(iso: string): number {
  if (!iso) return 0;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Classifica tipo de vídeo: SHORT, LONG ou LIVE
 */
export function classifyVideoType(
  durationSec: number,
  hasLiveDetails: boolean
): "SHORT" | "LONG" | "LIVE" {
  if (hasLiveDetails) return "LIVE";
  if (durationSec <= 60) return "SHORT";
  return "LONG";
}

/**
 * Pausa entre requests para rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── API Functions ────────────────────────────────────────────

/**
 * Busca dados de um único canal pelo Channel ID
 * Custo: 1 unit
 */
export async function fetchChannelData(
  channelId: string
): Promise<YtChannelData | null> {
  const youtube = await getYoutubeClient();
  const res = await youtube.channels.list({
    id: [channelId],
    part: ["snippet", "statistics", "brandingSettings"],
  });

  const item = res.data.items?.[0];
  if (!item) return null;

  return {
    youtubeChannelId: item.id!,
    name: item.snippet?.title || "Unknown",
    handle: item.snippet?.customUrl || undefined,
    description: item.snippet?.description || undefined,
    thumbnailUrl: item.snippet?.thumbnails?.medium?.url || undefined,
    bannerUrl:
      item.brandingSettings?.image?.bannerExternalUrl || undefined,
    country: item.snippet?.country || undefined,
    customUrl: item.snippet?.customUrl
      ? `https://youtube.com/${item.snippet.customUrl}`
      : undefined,
    subscribers: BigInt(item.statistics?.subscriberCount || "0"),
    totalViews: BigInt(item.statistics?.viewCount || "0"),
    totalVideos: parseInt(item.statistics?.videoCount || "0", 10),
  };
}

/**
 * Busca dados de múltiplos canais em batch (até 50 por request)
 * Custo: 1 unit por batch de 50
 */
export async function fetchMultipleChannels(
  channelIds: string[]
): Promise<YtChannelData[]> {
  const youtube = await getYoutubeClient();
  const results: YtChannelData[] = [];

  // Processar em batches de 50
  for (let i = 0; i < channelIds.length; i += 50) {
    const batch = channelIds.slice(i, i + 50);
    const res = await youtube.channels.list({
      id: batch,
      part: ["snippet", "statistics", "brandingSettings"],
    });

    for (const item of res.data.items || []) {
      results.push({
        youtubeChannelId: item.id!,
        name: item.snippet?.title || "Unknown",
        handle: item.snippet?.customUrl || undefined,
        description: item.snippet?.description || undefined,
        thumbnailUrl: item.snippet?.thumbnails?.medium?.url || undefined,
        bannerUrl:
          item.brandingSettings?.image?.bannerExternalUrl || undefined,
        country: item.snippet?.country || undefined,
        customUrl: item.snippet?.customUrl
          ? `https://youtube.com/${item.snippet.customUrl}`
          : undefined,
        subscribers: BigInt(item.statistics?.subscriberCount || "0"),
        totalViews: BigInt(item.statistics?.viewCount || "0"),
        totalVideos: parseInt(item.statistics?.videoCount || "0", 10),
      });
    }

    // Rate limiting entre batches
    if (i + 50 < channelIds.length) {
      await sleep(200);
    }
  }

  return results;
}

/**
 * Busca canal pelo handle (@xxx)
 * Custo: 1 unit
 */
export async function fetchChannelByHandle(
  handle: string
): Promise<YtChannelData | null> {
  const youtube = await getYoutubeClient();
  // Remove @ se presente
  const cleanHandle = handle.startsWith("@") ? handle : `@${handle}`;

  const res = await youtube.channels.list({
    forHandle: cleanHandle.replace("@", ""),
    part: ["snippet", "statistics", "brandingSettings"],
  });

  const item = res.data.items?.[0];
  if (!item) return null;

  return {
    youtubeChannelId: item.id!,
    name: item.snippet?.title || "Unknown",
    handle: cleanHandle,
    description: item.snippet?.description || undefined,
    thumbnailUrl: item.snippet?.thumbnails?.medium?.url || undefined,
    bannerUrl:
      item.brandingSettings?.image?.bannerExternalUrl || undefined,
    country: item.snippet?.country || undefined,
    customUrl: `https://youtube.com/${cleanHandle}`,
    subscribers: BigInt(item.statistics?.subscriberCount || "0"),
    totalViews: BigInt(item.statistics?.viewCount || "0"),
    totalVideos: parseInt(item.statistics?.videoCount || "0", 10),
  };
}

/**
 * Busca vídeos recentes de um canal via uploads playlist
 * Usa playlistItems.list (1 unit) + videos.list (1 unit) = 2 units total
 * Muito mais eficiente que search.list (100 units)
 */
export async function fetchChannelVideos(
  youtubeChannelId: string,
  maxResults: number = 50
): Promise<YtVideoData[]> {
  const youtube = await getYoutubeClient();

  // Converter UC... → UU... para obter playlist de uploads
  const uploadsPlaylistId = youtubeChannelId.replace(/^UC/, "UU");

  // 1. Listar IDs de vídeos via playlistItems (1 unit)
  const playlistRes = await youtube.playlistItems.list({
    playlistId: uploadsPlaylistId,
    part: ["snippet"],
    maxResults: Math.min(maxResults, 50),
  });

  const videoIds = (playlistRes.data.items || [])
    .map((item) => item.snippet?.resourceId?.videoId)
    .filter(Boolean) as string[];

  if (videoIds.length === 0) return [];

  // 2. Buscar detalhes dos vídeos em batch (1 unit)
  const videosRes = await youtube.videos.list({
    id: videoIds,
    part: ["snippet", "statistics", "contentDetails", "liveStreamingDetails"],
  });

  const results: YtVideoData[] = [];

  for (const item of videosRes.data.items || []) {
    const durationSec = parseDuration(item.contentDetails?.duration || "");
    const hasLive = !!item.liveStreamingDetails;
    const publishedAt = new Date(item.snippet?.publishedAt || Date.now());

    results.push({
      youtubeVideoId: item.id!,
      title: item.snippet?.title || "Unknown",
      description: item.snippet?.description?.slice(0, 500) || undefined,
      thumbnailUrl: item.snippet?.thumbnails?.medium?.url || undefined,
      videoType: classifyVideoType(durationSec, hasLive),
      views: BigInt(item.statistics?.viewCount || "0"),
      likes: parseInt(item.statistics?.likeCount || "0", 10),
      comments: parseInt(item.statistics?.commentCount || "0", 10),
      duration: durationSec,
      publishedAt,
      dayOfWeek: publishedAt.getDay(),
      hourOfDay: publishedAt.getHours(),
    });
  }

  return results;
}
