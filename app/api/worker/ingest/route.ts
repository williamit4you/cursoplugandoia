import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { buildTitleCoverDataUrl } from "@/lib/titleCover";
import { computeNextSocialQueueTime } from "@/lib/socialQueueSchedule";
import { triggerNewsVideoGenerationForPost } from "@/lib/newsArticleVideoTrigger";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function normalizeTitle(value: string) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleTokens(value: string) {
  const stopwords = new Set([
    "a", "o", "as", "os", "de", "da", "do", "das", "dos", "e", "em", "na", "no", "nas", "nos",
    "um", "uma", "para", "por", "com", "sem", "que", "mais", "menos", "ao", "aos", "como",
  ]);
  return normalizeTitle(value)
    .split(" ")
    .filter((token) => token.length >= 3 && !stopwords.has(token));
}

function titleSimilarity(a: string, b: string) {
  const aTokens = new Set(titleTokens(a));
  const bTokens = new Set(titleTokens(b));
  if (aTokens.size === 0 || bTokens.size === 0) return 0;

  let intersection = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) intersection += 1;
  }

  return intersection / Math.max(aTokens.size, bTokens.size);
}

async function findLikelyDuplicatePost(params: { sourceUrl?: string | null; title: string }) {
  const sourceUrl = String(params.sourceUrl || "").trim();
  const normalizedIncomingTitle = normalizeTitle(params.title);
  if (!normalizedIncomingTitle) return null;

  const recentPosts = await prisma.post.findMany({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      },
    },
    orderBy: { createdAt: "desc" },
    take: 80,
    select: {
      id: true,
      title: true,
      slug: true,
      sourceUrl: true,
      createdAt: true,
    },
  });

  for (const post of recentPosts) {
    const normalizedExistingTitle = normalizeTitle(post.title || "");
    if (!normalizedExistingTitle) continue;

    const sameSource = sourceUrl && post.sourceUrl && String(post.sourceUrl).trim() === sourceUrl;
    const exactTitle = normalizedExistingTitle === normalizedIncomingTitle;
    const containsTitle =
      normalizedExistingTitle.includes(normalizedIncomingTitle) ||
      normalizedIncomingTitle.includes(normalizedExistingTitle);
    const similarity = titleSimilarity(normalizedExistingTitle, normalizedIncomingTitle);

    if (sameSource || exactTitle || (containsTitle && normalizedIncomingTitle.length >= 32) || similarity >= 0.8) {
      return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        createdAt: post.createdAt,
        reason: sameSource ? "same_source" : exactTitle ? "exact_title" : containsTitle ? "contains_title" : "high_similarity",
        similarity,
      };
    }
  }

  return null;
}

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

    const duplicate = await findLikelyDuplicatePost({
      sourceUrl: body.sourceUrl,
      title: String(body.title || ""),
    });

    if (duplicate) {
      return NextResponse.json(
        {
          warning: true,
          skipped: true,
          reason: "duplicate_news",
          message: "Noticia muito parecida com uma ja existente. Pulando para diversificar a coleta.",
          duplicate,
        },
        { status: 409 }
      );
    }

    const baseSlug =
      String(body.title || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "") || "rascunho";

    const upsertedPost = await prisma.post.upsert({
      where: {
        sourceUrl: body.sourceUrl,
      },
      update: {},
      create: {
        title: body.title,
        summary: body.summary,
        content: body.content,
        sourceUrl: body.sourceUrl,
        status: "DRAFT",
        slug: `${baseSlug}-${Date.now().toString().slice(-5)}`,
        coverImage: body.coverImage || buildTitleCoverDataUrl(body.title),
      },
    });

    triggerNewsVideoGenerationForPost({
      baseUrl: baseUrl(req),
      postId: upsertedPost.id,
      trigger: "worker_ingest",
    }).catch((err) => console.error("[worker ingest -> auto video]", err));

    if (body.videoUrl) {
      const existingSocial = await prisma.socialPost.findFirst({
        where: { postId: upsertedPost.id },
      });

      if (!existingSocial) {
        const scraperConfig = await prisma.scraperConfig.findFirst({
          orderBy: { createdAt: "desc" },
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
              scheduledTo,
              log: `Agendado automaticamente para respeitar limite de trafego para a plataforma ${item.platform} (${item.postType}).`,
            },
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
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Ja capturado pelo robo", warning: true }, { status: 400 });
    }
    console.error("Worker Ingest Error:", error);
    return NextResponse.json({ error: "Ingestion failed: " + (error?.message || String(error)) }, { status: 500 });
  }
}
