import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const connectionString = process.env.DATABASE_URL!
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const expectedSecret = process.env.WORKER_SECRET_KEY || "super-secret-worker-key-123";

    if (body.secret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    // Regra UPSERT por sourceUrl (Evita duplicar conteúdo se rodar scraper no mesmo link)
    const baseSlug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'rascunho';
    
    const upsertedPost = await prisma.post.upsert({
      where: {
        sourceUrl: body.sourceUrl // Precisamos garantir que esse field nunca será Null nesse contexto de busca
      },
      update: {}, // Não atualizar conteúdo se já existe
      create: {
        title: body.title,
        summary: body.summary,
        content: body.content,
        sourceUrl: body.sourceUrl,
        status: "DRAFT", // Sempre entra escondido!
        slug: `${baseSlug}-${Date.now().toString().slice(-5)}`
      }
    });

    if (body.videoUrl) {
      // Deduplicação: só cria SocialPost se ainda não existir para este post
      const existingSocial = await prisma.socialPost.findFirst({
        where: { postId: upsertedPost.id }
      });

      if (!existingSocial) {
        let scheduledTo = new Date();
        const lastScheduled = await prisma.socialPost.findFirst({
          where: { status: { in: ["SCHEDULED", "POSTED"] } },
          orderBy: { scheduledTo: 'desc' }
        });

        if (lastScheduled && lastScheduled.scheduledTo && lastScheduled.scheduledTo > scheduledTo) {
          scheduledTo = new Date(lastScheduled.scheduledTo.getTime() + 60 * 60 * 1000); // +1 hora
        }

        const newSocialPost = await prisma.socialPost.create({
          data: {
            postId: upsertedPost.id,
            summary: body.summary,
            videoUrl: body.videoUrl,
            status: "SCHEDULED",
            scheduledTo: scheduledTo,
            log: `Agendado automaticamente para respeitar limite de tráfego.`
          }
        });

        return NextResponse.json({
          success: true,
          post: upsertedPost.id,
          socialPostId: newSocialPost.id,
        });
      }
    }

    return NextResponse.json({ success: true, post: upsertedPost.id, socialPostId: null });


  } catch (error: any) {
    if (error.code === 'P2002') {
       return NextResponse.json({ error: "Já capturado pelo Robô", warning: true }, { status: 400 });
    }
    console.error("Worker Ingest Error:", error);
    return NextResponse.json({ error: "Ingestion failed: " + (error?.message || String(error)) }, { status: 500 });
  }
}
