import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { publishLinkedInPost } from "@/lib/linkedinApi";
import { withCampaignTracking } from "@/lib/trackingLinks";

export const dynamic = "force-dynamic";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

/**
 * POST /api/social/publish-linkedin
 * Publica um post no LinkedIn com o resumo, imagem de capa e link para o artigo.
 */
export async function POST(req: NextRequest) {
  let targetSocialPostId: string | undefined = undefined;
  try {
    const { socialPostId } = await req.json();
    targetSocialPostId = socialPostId;

    let socialPost = await prisma.socialPost.findUnique({
      where: { id: socialPostId },
      include: {
        post: { select: { title: true, coverImage: true, slug: true } },
      },
    });
    if (!socialPost) {
      return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
    }

    // Resolvendo post irmão se houver incompatibilidade de plataforma
    if (socialPost.platform !== "LINKEDIN") {
      const sister = await prisma.socialPost.findFirst({
        where: {
          postId: socialPost.postId,
          codeVideoProjectId: socialPost.codeVideoProjectId,
          automationTaskId: socialPost.automationTaskId,
          automationTaskRunId: socialPost.automationTaskRunId,
          platform: "LINKEDIN",
        },
        include: {
          post: { select: { title: true, coverImage: true, slug: true } },
        },
      });
      if (sister) {
        socialPost = sister;
        targetSocialPostId = sister.id;
      }
    }

    const settings = await prisma.integrationSettings.findUnique({
      where: { platform: "LINKEDIN" },
    });
    if (!settings?.accessToken || !settings?.instagramId || !settings.isActive) {
      return NextResponse.json(
        { error: "LinkedIn não configurado ou inativo. Configure em Hub de Integrações." },
        { status: 400 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
    const articleUrl = socialPost.post?.slug
      ? withCampaignTracking(`${siteUrl}/noticias/${socialPost.post.slug}`, { source: "linkedin", medium: "organic", campaign: "news_video", content: targetSocialPostId })
      : undefined;

    const linkedinId = await publishLinkedInPost({
      text: socialPost.summary,
      title: socialPost.post?.title || "Nova notícia",
      imageUrl: socialPost.post?.coverImage || undefined,
      articleUrl,
      accessToken: settings.accessToken,
      personUrn: settings.instagramId,          // Person URN armazenado no campo instagramId
      orgUrn: settings.pageId || undefined,      // Org URN armazenado no campo pageId
    });

    const postUrl = linkedinId ? `https://www.linkedin.com/feed/update/${linkedinId}` : undefined;

    const logEntry = `[${new Date().toLocaleTimeString("pt-BR")}] 💼 Publicado no LinkedIn! ID: ${linkedinId}`;
    await prisma.socialPost.update({
      where: { id: targetSocialPostId },
      data: {
        status: "POSTED",
        postedAt: new Date(),
        linkedinPostedAt: new Date(),
        postUrl: postUrl,
        linkedinPostUrl: postUrl,
        log: socialPost.log ? `${socialPost.log}\n${logEntry}` : logEntry,
      },
    });

    return NextResponse.json({ success: true, linkedinId });
  } catch (error: any) {
    console.error("LinkedIn publishing error:", error);
    const errorMessage = error.message || "Erro ao publicar no LinkedIn";
    const logEntry = `[${new Date().toLocaleTimeString("pt-BR")}] ❌ Falha ao publicar no LinkedIn: ${errorMessage}`;

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
