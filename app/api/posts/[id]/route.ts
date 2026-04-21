import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const connectionString = process.env.DATABASE_URL!
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const post = await prisma.post.findUnique({ where: { id: params.id } });
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(post);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { title, summary, content, status, coverImage } = body;

    const post = await prisma.post.update({
      where: { id: params.id },
      data: {
        title,
        summary,
        content,
        status,
        coverImage,
      },
    });

    // Se o status alterado foi pra PUBLISHED, verificar se a integração N8N está ativa e atirar!
    if (status === "PUBLISHED") {
      try {
        const integrationInfo = await prisma.integrationSettings.findUnique({
          where: { platform: "N8N" }
        });
        
        if (integrationInfo?.isActive && integrationInfo.webhookUrl) {
          // Disparo invisível ("fire and forget"), não bloqueamos o return da API caso o webhook trave
          fetch(integrationInfo.webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              event: "POST_PUBLISHED",
              data: {
                id: post.id,
                title: post.title,
                summary: post.summary,
                content: post.content,
                coverImage: post.coverImage,
                post_url: `https://seuportal.com/noticias/${post.slug}`
              }
            })
          }).catch(e => console.error("Falha silenciosa ao chamar o webhook N8N", e));
        }
      } catch (err) {
        console.error("Erro ao validar/disparar webhook N8N:", err);
      }
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("Update Post error:", error);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.post.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
