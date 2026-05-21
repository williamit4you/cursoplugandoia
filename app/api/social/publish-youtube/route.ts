import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { publishYouTubeVideo } from "@/lib/youtubeApi";

export const dynamic = "force-dynamic";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

export async function POST(req: NextRequest) {
  let targetSocialPostId: string | null = null;
  try {
    const { socialPostId } = await req.json();
    targetSocialPostId = socialPostId;

    let socialPost = await prisma.socialPost.findUnique({
      where: { id: socialPostId },
    });

    if (!socialPost) {
      return NextResponse.json({ error: "Post social não encontrado" }, { status: 404 });
    }

    // Resolvendo post irmão se houver incompatibilidade de plataforma
    if (socialPost.platform !== "YOUTUBE") {
      const sister = await prisma.socialPost.findFirst({
        where: {
          postId: socialPost.postId,
          codeVideoProjectId: socialPost.codeVideoProjectId,
          automationTaskId: socialPost.automationTaskId,
          automationTaskRunId: socialPost.automationTaskRunId,
          platform: "YOUTUBE",
        },
      });
      if (sister) {
        socialPost = sister;
        targetSocialPostId = sister.id;
      }
    }

    const settings = await prisma.integrationSettings.findUnique({
      where: { platform: "YOUTUBE" },
    });

    if (!settings || !settings.isActive || !settings.apiKey || !settings.apiSecret || !settings.refreshToken) {
      return NextResponse.json(
        { error: "YouTube não configurado ou credenciais ausentes. Autentique-se novamente no Hub de Integrações." },
        { status: 400 }
      );
    }

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const redirectUri = `${protocol}://${host}/api/integrations/youtube/callback`;

    const firstLineTitle = (socialPost.summary || "")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find(Boolean);

    const title = (firstLineTitle || "Novo vídeo").slice(0, 100);

    const shouldAppendShortsTag = socialPost.postType === "REEL";
    const descriptionBase = socialPost.summary || "";
    const hasShortsTag = /(^|\s)#shorts(\s|$)/i.test(descriptionBase);
    const description = shouldAppendShortsTag && !hasShortsTag
      ? `${descriptionBase}\n\n#shorts`
      : descriptionBase;

    const videoId = await publishYouTubeVideo({
      title,
      description,
      videoUrl: socialPost.videoUrl,
      accessToken: settings.accessToken || "",
      refreshToken: settings.refreshToken,
      clientId: settings.apiKey,
      clientSecret: settings.apiSecret,
      redirectUri,
    });

    const postUrl = `https://www.youtube.com/watch?v=${videoId}`;

    const logEntry = `[${new Date().toLocaleTimeString("pt-BR")}] 🎥 Publicado no YouTube! ID: ${videoId}`;
    await prisma.socialPost.update({
      where: { id: targetSocialPostId },
      data: {
        status: "POSTED",
        postedAt: new Date(),
        youtubePostedAt: new Date(),
        postUrl,
        youtubePostUrl: postUrl,
        log: socialPost.log ? `${socialPost.log}\n${logEntry}` : logEntry,
      },
    });

    return NextResponse.json({ success: true, videoId });
  } catch (error: any) {
    console.error("YouTube publishing error:", error);
    
    // Tenta extrair mensagem de erro do Google
    const errorMessage = error.response?.data?.error?.message || error.message || "Erro desconhecido ao publicar no YouTube";
    const logEntry = `[${new Date().toLocaleTimeString("pt-BR")}] ❌ Falha ao publicar no YouTube: ${errorMessage}`;

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
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
