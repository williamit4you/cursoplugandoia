import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

export const dynamic = "force-dynamic";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

/**
 * POST /api/posts/[id]/publish
 * Muda o status do Post para PUBLISHED e dispara webhook N8N se configurado.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const post = await prisma.post.update({
      where: { id: params.id },
      data: { status: "PUBLISHED" },
    });

    // Disparar webhook N8N se configurado
    const n8n = await prisma.integrationSettings.findUnique({ where: { platform: "N8N" } });
    if (n8n?.isActive && n8n.webhookUrl) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
      fetch(n8n.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "POST_PUBLISHED",
          data: {
            title: post.title,
            summary: post.summary,
            content: post.content,
            coverImage: post.coverImage,
            post_url: `${siteUrl}/noticias/${post.slug}`,
          },
        }),
      }).catch((err) => console.error("[N8N webhook]", err));
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Post publish error:", error);
    return NextResponse.json({ error: error.message || "Erro ao publicar" }, { status: 500 });
  }
}
