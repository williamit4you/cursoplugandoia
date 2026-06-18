import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { triggerNewsVideoGenerationForPost } from "@/lib/newsArticleVideoTrigger";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function baseUrl(req: NextRequest) {
  const host = req.headers.get("host") || "localhost:3000";
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const protocol = forwardedProto || (host.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const post = await prisma.post.findUnique({ where: { id: params.id } });
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(post);
  } catch {
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

    triggerNewsVideoGenerationForPost({
      baseUrl: baseUrl(req),
      postId: post.id,
      trigger: "post_update",
    }).catch((err) => console.error("[update post -> auto video]", err));

    if (status === "PUBLISHED") {
      try {
        const integrationInfo = await prisma.integrationSettings.findUnique({
          where: { platform: "N8N" },
        });

        if (integrationInfo?.isActive && integrationInfo.webhookUrl) {
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
                post_url: `https://seuportal.com/noticias/${post.slug}`,
              },
            }),
          }).catch((e) => console.error("Falha silenciosa ao chamar o webhook N8N", e));
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

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.post.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
