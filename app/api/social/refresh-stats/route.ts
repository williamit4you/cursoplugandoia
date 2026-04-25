import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { getYouTubeVideoViews } from "@/lib/youtubeApi";

export const dynamic = "force-dynamic";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

export async function POST(req: NextRequest) {
  try {
    // 1. YouTube Stats
    const youtubePosts = await prisma.socialPost.findMany({
      where: { platform: "YOUTUBE", status: "POSTED", postUrl: { not: null } },
    });

    const youtubeCreds = await prisma.integrationSettings.findFirst({
      where: { platform: "YOUTUBE" },
    });

    if (youtubeCreds && youtubeCreds.apiKey && youtubeCreds.apiSecret && youtubeCreds.refreshToken) {
      for (const post of youtubePosts) {
        try {
          const videoId = post.postUrl?.split("v=")[1];
          if (videoId) {
            const views = await getYouTubeVideoViews({
              videoId,
              clientId: youtubeCreds.apiKey,
              clientSecret: youtubeCreds.apiSecret,
              refreshToken: youtubeCreds.refreshToken,
            });
            await prisma.socialPost.update({
              where: { id: post.id },
              data: { views },
            });
          }
        } catch (err) {
          console.error(`Failed to refresh YouTube views for ${post.id}`, err);
        }
      }
    }

    // TODO: Meta Stats (Instagram/Facebook)
    // Requires separate logic with different scopes

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[api/social/refresh-stats POST]", error);
    return NextResponse.json({ error: error?.message || "Failed to refresh stats" }, { status: 500 });
  }
}
