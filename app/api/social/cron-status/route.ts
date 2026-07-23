import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { requireAdminOrCronSecret } from "@/lib/shopee-pipeline/apiAuth";
import { getSocialCronState } from "@/lib/socialCronState";
import { getInternalSocialCronSchedulerStatus } from "@/lib/internalSocialCronScheduler";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

export async function GET(req: NextRequest) {
  try {
    await requireAdminOrCronSecret(req);

    const now = new Date();
    const state = getSocialCronState();

    const youtubeSettings = await prisma.integrationSettings.findUnique({ where: { platform: "YOUTUBE" } }).catch(() => null);
    const tiktokSettings = await prisma.integrationSettings.findUnique({ where: { platform: "TIKTOK" } }).catch(() => null);
    const metaSettings = await prisma.integrationSettings.findUnique({ where: { platform: "META" } }).catch(() => null);
    const youtube = {
      isActive: Boolean(youtubeSettings?.isActive),
      hasClientId: Boolean(youtubeSettings?.apiKey),
      hasClientSecret: Boolean(youtubeSettings?.apiSecret),
      hasRefreshToken: Boolean(youtubeSettings?.refreshToken),
      updatedAt: youtubeSettings?.updatedAt ? new Date(youtubeSettings.updatedAt).toISOString() : null,
    };
    const tiktokMethod = String(process.env.TIKTOK_UPLOAD_METHOD || "browser").toLowerCase();
    const tiktok = {
      isActive: Boolean(tiktokSettings?.isActive),
      method: tiktokMethod,
      hasSession: Boolean(tiktokSettings?.refreshToken),
      hasAccessToken: Boolean(tiktokSettings?.accessToken),
      updatedAt: tiktokSettings?.updatedAt ? new Date(tiktokSettings.updatedAt).toISOString() : null,
    };
    const meta = {
      isActive: Boolean(metaSettings?.isActive),
      hasPageId: Boolean(metaSettings?.pageId),
      hasInstagramId: Boolean(metaSettings?.instagramId),
      hasAccessToken: Boolean(metaSettings?.accessToken),
      updatedAt: metaSettings?.updatedAt ? new Date(metaSettings.updatedAt).toISOString() : null,
    };

    const [dueScheduled, scheduledFuture, processing, failed] = await Promise.all([
      prisma.socialPost.count({ where: { status: "SCHEDULED", scheduledTo: { lte: now } } as any }),
      prisma.socialPost.count({ where: { status: "SCHEDULED", scheduledTo: { gt: now } } as any }),
      prisma.socialPost.count({ where: { status: { in: ["PROCESSING_MEDIA", "PUBLISHING"] } } as any }),
      prisma.socialPost.count({ where: { status: "FAILED" } as any }),
    ]);

    const preview = await prisma.socialPost.findMany({
      where: {
        OR: [
          { status: "SCHEDULED", scheduledTo: { lte: now } },
          { status: "PROCESSING_MEDIA" },
        ],
      } as any,
      orderBy: [{ scheduledTo: "asc" as const }, { createdAt: "asc" as const }],
      take: 15,
      select: {
        id: true,
        platform: true,
        postType: true,
        status: true,
        scheduledTo: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      serverTime: now.toISOString(),
      state,
      internalScheduler: getInternalSocialCronSchedulerStatus(),
      integrations: { youtube, tiktok, meta },
      stats: { dueScheduled, scheduledFuture, processing, failed },
      preview,
    });
  } catch (error: any) {
    const status = error?.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ ok: false, error: error?.message || "Failed to read social cron status" }, { status });
  }
}
