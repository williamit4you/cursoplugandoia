import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { publishTikTokVideo } from "@/lib/tiktokApi";

export const dynamic = "force-dynamic";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

/**
 * POST /api/social/publish-tiktok
 * Publica o vídeo do SocialPost no TikTok via Content Posting API v2.
 */
export async function POST(req: NextRequest) {
  try {
    const { socialPostId } = await req.json();

    const socialPost = await prisma.socialPost.findUnique({
      where: { id: socialPostId },
      include: { post: { select: { title: true } } },
    });
    if (!socialPost) {
      return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
    }

    const settings = await prisma.integrationSettings.findUnique({
      where: { platform: "TIKTOK" },
    });
    if (!settings?.accessToken || !settings.isActive) {
      return NextResponse.json(
        { error: "TikTok não configurado ou inativo. Configure em Hub de Integrações." },
        { status: 400 }
      );
    }

    const title = socialPost.post?.title || socialPost.summary?.slice(0, 150) || "Nova notícia";
    const publishId = await publishTikTokVideo(
      socialPost.videoUrl,
      title,
      settings.accessToken
    );

    const logEntry = `[${new Date().toLocaleTimeString("pt-BR")}] 🎵 Enviado ao TikTok! Publish ID: ${publishId}`;
    await prisma.socialPost.update({
      where: { id: socialPostId },
      data: {
        log: socialPost.log ? `${socialPost.log}\n${logEntry}` : logEntry,
      },
    });

    return NextResponse.json({ success: true, publishId });
  } catch (error: any) {
    console.error("TikTok publishing error:", error);
    return NextResponse.json({ error: error.message || "Erro ao publicar no TikTok" }, { status: 500 });
  }
}
