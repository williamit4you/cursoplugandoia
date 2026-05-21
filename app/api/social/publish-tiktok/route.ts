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
  let targetSocialPostId: string | undefined = undefined;
  try {
    const { socialPostId } = await req.json();
    targetSocialPostId = socialPostId;

    let socialPost = await prisma.socialPost.findUnique({
      where: { id: socialPostId },
      include: { post: { select: { title: true } } },
    });
    if (!socialPost) {
      return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
    }

    // Resolvendo post irmão se houver incompatibilidade de plataforma
    if (socialPost.platform !== "TIKTOK") {
      const sister = await prisma.socialPost.findFirst({
        where: {
          postId: socialPost.postId,
          codeVideoProjectId: socialPost.codeVideoProjectId,
          automationTaskId: socialPost.automationTaskId,
          automationTaskRunId: socialPost.automationTaskRunId,
          platform: "TIKTOK",
        },
        include: { post: { select: { title: true } } },
      });
      if (sister) {
        socialPost = sister;
        targetSocialPostId = sister.id;
      }
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
      where: { id: targetSocialPostId },
      data: {
        status: "POSTED",
        postedAt: new Date(),
        tiktokPostedAt: new Date(),
        postUrl: publishId ? `tiktok:${publishId}` : undefined,
        tiktokPostUrl: publishId ? `tiktok:${publishId}` : undefined,
        log: socialPost.log ? `${socialPost.log}\n${logEntry}` : logEntry,
      },
    });

    return NextResponse.json({ success: true, publishId });
  } catch (error: any) {
    console.error("TikTok publishing error:", error);
    const errorMessage = error.message || "Erro ao publicar no TikTok";
    const logEntry = `[${new Date().toLocaleTimeString("pt-BR")}] ❌ Falha ao publicar no TikTok: ${errorMessage}`;

    if (targetSocialPostId) {
      try {
        const currentPost = await prisma.socialPost.findUnique({ where: { id: targetSocialPostId } });
        await prisma.socialPost.update({
          where: { id: targetSocialPostId },
          data: {
            status: "FAILED",
            log: currentPost?.log ? `${currentPost.log}\n${logEntry}` : logEntry,
          },
        });
      } catch (dbErr) {
        console.error("Failed to update SocialPost status to FAILED:", dbErr);
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
