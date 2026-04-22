import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { publishLinkedInPost } from "@/lib/linkedinApi";

export const dynamic = "force-dynamic";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

/**
 * POST /api/social/publish-linkedin
 * Publica um post no LinkedIn com o resumo, imagem de capa e link para o artigo.
 */
export async function POST(req: NextRequest) {
  try {
    const { socialPostId } = await req.json();

    const socialPost = await prisma.socialPost.findUnique({
      where: { id: socialPostId },
      include: {
        post: { select: { title: true, coverImage: true, slug: true } },
      },
    });
    if (!socialPost) {
      return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
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
    const articleUrl =
      socialPost.post?.slug ? `${siteUrl}/noticias/${socialPost.post.slug}` : undefined;

    const linkedinId = await publishLinkedInPost({
      text: socialPost.summary,
      title: socialPost.post?.title || "Nova notícia",
      imageUrl: socialPost.post?.coverImage || undefined,
      articleUrl,
      accessToken: settings.accessToken,
      personUrn: settings.instagramId,          // Person URN armazenado no campo instagramId
      orgUrn: settings.pageId || undefined,      // Org URN armazenado no campo pageId
    });

    const logEntry = `[${new Date().toLocaleTimeString("pt-BR")}] 💼 Publicado no LinkedIn! ID: ${linkedinId}`;
    await prisma.socialPost.update({
      where: { id: socialPostId },
      data: {
        log: socialPost.log ? `${socialPost.log}\n${logEntry}` : logEntry,
      },
    });

    return NextResponse.json({ success: true, linkedinId });
  } catch (error: any) {
    console.error("LinkedIn publishing error:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao publicar no LinkedIn" },
      { status: 500 }
    );
  }
}
