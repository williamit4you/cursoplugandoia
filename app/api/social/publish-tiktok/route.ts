import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { publishTikTokVideo } from "@/lib/tiktokApi";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

function tiktokConfigError(settings: {
  isActive?: boolean | null;
  refreshToken?: string | null;
  accessToken?: string | null;
} | null) {
  const method = (process.env.TIKTOK_UPLOAD_METHOD || "browser").toLowerCase();

  if (!settings) {
    return "TikTok nao configurado. Abra o Hub de Integracoes, ative o TikTok e salve o Session ID.";
  }

  if (!settings.isActive) {
    return "TikTok inativo. Abra o Hub de Integracoes e ligue a chave do TikTok.";
  }

  if (method === "browser" && !String(settings.refreshToken || "").trim()) {
    return "TikTok sem Session ID. No Hub de Integracoes, preencha o campo Session ID para o tiktok-uploader.";
  }

  if (method === "official" && !String(settings.accessToken || "").trim()) {
    return "TikTok sem Access Token. No modo official, preencha o Access Token no Hub de Integracoes.";
  }

  if (method === "auto" && !String(settings.refreshToken || "").trim() && !String(settings.accessToken || "").trim()) {
    return "TikTok sem credenciais. Preencha o Session ID ou o Access Token no Hub de Integracoes.";
  }

  return null;
}

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
      return NextResponse.json({ error: "Post nao encontrado" }, { status: 404 });
    }

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

    const configError = tiktokConfigError(settings);
    if (configError) {
      return NextResponse.json(
        { error: configError },
        { status: 400 }
      );
    }

    const title = socialPost.post?.title || socialPost.summary?.slice(0, 150) || "Nova noticia";
    const { publishId, method } = await publishTikTokVideo(socialPost.videoUrl, title, {
      accessToken: settings!.accessToken,
      sessionId: settings!.refreshToken,
    });

    const logEntry = `[${new Date().toLocaleTimeString("pt-BR")}] TikTok enviado via ${method}. Publish ID: ${publishId}`;

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

    return NextResponse.json({ success: true, publishId, method });
  } catch (error: any) {
    console.error("TikTok publishing error:", error);
    const errorMessage = error.message || "Erro ao publicar no TikTok";
    const logEntry = `[${new Date().toLocaleTimeString("pt-BR")}] Falha ao publicar no TikTok: ${errorMessage}`;

    if (targetSocialPostId) {
      try {
        const currentPost = await prisma.socialPost.findUnique({
          where: { id: targetSocialPostId },
        });

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
