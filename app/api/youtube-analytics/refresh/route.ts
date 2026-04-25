import { NextRequest, NextResponse } from "next/server";
import {
  fetchMultipleChannels,
  fetchChannelVideos,
} from "@/lib/youtubeDataApi";
import {
  getActiveChannels,
  upsertChannel,
  upsertVideos,
  createChannelSnapshot,
  recalculateChannelMetrics,
  recalculateRankings,
} from "@/lib/youtubeAnalyticsRepo";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min max for this heavy endpoint

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function POST(req: NextRequest) {
  try {
    const startTime = Date.now();
    const body = await req.json().catch(() => ({}));
    const requestedIds: string[] | undefined = body.channelIds;

    // Buscar canais para atualizar
    let channels = await getActiveChannels();
    if (requestedIds && requestedIds.length > 0) {
      channels = channels.filter((ch) =>
        requestedIds.includes(ch.youtubeChannelId)
      );
    }

    const result = {
      channelsUpdated: 0,
      videosUpserted: 0,
      snapshotsCreated: 0,
      errors: [] as string[],
    };

    // Processar em batches de 50
    for (let i = 0; i < channels.length; i += 50) {
      const batch = channels.slice(i, i + 50);
      try {
        const ids = batch.map((c) => c.youtubeChannelId);
        const channelData = await fetchMultipleChannels(ids);

        for (const data of channelData) {
          try {
            const dbChannel = batch.find(
              (b) => b.youtubeChannelId === data.youtubeChannelId
            );
            if (!dbChannel) continue;

            await upsertChannel(data, dbChannel.categoryId);
            await createChannelSnapshot(dbChannel.id);

            // Buscar vídeos recentes
            const videos = await fetchChannelVideos(data.youtubeChannelId, 50);
            await upsertVideos(dbChannel.id, videos);

            // Recalcular métricas
            await recalculateChannelMetrics(dbChannel.id);

            result.channelsUpdated++;
            result.videosUpserted += videos.length;
            result.snapshotsCreated++;
          } catch (chErr: any) {
            result.errors.push(
              `Channel ${data.youtubeChannelId}: ${chErr.message}`
            );
          }
        }
      } catch (batchErr: any) {
        result.errors.push(`Batch error: ${batchErr.message}`);
      }

      // Rate limiting entre batches
      if (i + 50 < channels.length) {
        await sleep(1000);
      }
    }

    // Recalcular rankings globais
    await recalculateRankings();

    // Log no PipelineLog
    await prisma.pipelineLog.create({
      data: {
        step: "YT_COLLECTION",
        message: `Atualizado ${result.channelsUpdated} canais, ${result.videosUpserted} vídeos, ${result.snapshotsCreated} snapshots. Erros: ${result.errors.length}`,
        level: result.errors.length > 0 ? "WARN" : "SUCCESS",
      },
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    return NextResponse.json({
      status: "completed",
      duration: `${duration}s`,
      ...result,
    });
  } catch (error: any) {
    console.error("Refresh error:", error);
    return NextResponse.json(
      { error: "Falha ao atualizar dados", details: error.message },
      { status: 500 }
    );
  }
}
