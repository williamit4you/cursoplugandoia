import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { videoUrl, summary, platform, postType, projectId } = body;

    if (!videoUrl || !summary || !platform) {
      return NextResponse.json({ error: "videoUrl, summary and platform are required" }, { status: 400 });
    }

    if (projectId) {
      const existing = await prisma.socialPost.findFirst({
        where: {
          codeVideoProjectId: projectId,
          platform,
          postType: postType || "REEL",
          status: { not: "FAILED" }
        }
      });
      if (existing) {
        return NextResponse.json({ success: true, socialPostId: existing.id, alreadyExists: true });
      }
    }

    const post = await prisma.socialPost.create({
      data: {
        postId: null,
        codeVideoProjectId: projectId || null,
        summary,
        videoUrl,
        status: "DRAFT",
        platform,
        postType: postType || "REEL",
        log: `[${new Date().toLocaleTimeString("pt-BR")}] Enfileirado via Sistema`,
      },
    });

    return NextResponse.json({ success: true, socialPostId: post.id });
  } catch (error: any) {
    console.error("[api/social/enqueue POST]", error);
    return NextResponse.json({ error: error?.message || "Failed to enqueue social post" }, { status: 500 });
  }
}
