import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { buildTitleCoverDataUrl } from "@/lib/titleCover"
import { computeNextSocialQueueTime } from "@/lib/socialQueueSchedule"

const connectionString = process.env.DATABASE_URL!
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

function baseUrl(req: NextRequest) {
  const host = req.headers.get("host") || "localhost:3000";
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const protocol = forwardedProto || (host.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

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
        slug: `${baseSlug}-${Date.now().toString().slice(-5)}`,
        coverImage: body.coverImage || buildTitleCoverDataUrl(body.title),
      }
    });

    fetch(`${baseUrl(req)}/api/posts/${upsertedPost.id}/generate-video`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trigger: "worker_ingest" }),
      cache: "no-store",
    }).catch((err) => console.error("[worker ingest -> auto video]", err));

    if (body.videoUrl) {
      // Deduplicação: só cria SocialPost se ainda não existir para este post
      const existingSocial = await prisma.socialPost.findFirst({
        where: { postId: upsertedPost.id }
      });

      if (!existingSocial) {
        const scraperConfig = await prisma.scraperConfig.findFirst({
          orderBy: { createdAt: "desc" }
        });

        const platformsToCreate: { platform: string; postType: string }[] = [];
        if (scraperConfig) {
          if (scraperConfig.autoPublishReels) {
            platformsToCreate.push({ platform: "META", postType: "REEL" });
          }
          if (scraperConfig.autoPublishStory) {
            platformsToCreate.push({ platform: "META", postType: "STORY" });
          }
          if (scraperConfig.autoPublishTikTok) {
            platformsToCreate.push({ platform: "TIKTOK", postType: "REEL" });
          }
          if (scraperConfig.autoPublishLinkedIn) {
            platformsToCreate.push({ platform: "LINKEDIN", postType: "REEL" });
          }
          if (scraperConfig.autoPublishYouTube) {
            platformsToCreate.push({ platform: "YOUTUBE", postType: "REEL" });
          }
        }

        // Se nenhuma plataforma estiver marcada para auto-publicar, cria o rascunho/agendamento padrão
        if (platformsToCreate.length === 0) {
          platformsToCreate.push({ platform: "META", postType: "REEL" });
        }

        const createdPosts = [];
        for (const item of platformsToCreate) {
          const scheduledTo = await computeNextSocialQueueTime({
            platform: item.platform,
            desiredAt: new Date(),
          });
          const newSocialPost = await prisma.socialPost.create({
            data: {
              postId: upsertedPost.id,
              summary: body.summary,
              videoUrl: body.videoUrl,
              platform: item.platform,
              postType: item.postType,
              status: "SCHEDULED",
              scheduledTo: scheduledTo,
              log: `Agendado automaticamente para respeitar limite de tráfego para a plataforma ${item.platform} (${item.postType}).`
            }
          });
          createdPosts.push(newSocialPost);
        }

        return NextResponse.json({
          success: true,
          post: upsertedPost.id,
          socialPostId: createdPosts[0].id,
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
