import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const SECRET = process.env.WORKER_SECRET_KEY || "super-secret-worker-key-123";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  const secret = req.headers.get("x-worker-secret");
  if (secret !== SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = ctx.params.id;
    const body = await req.json();
    const platform = String(body?.platform ?? "").trim().toUpperCase();

    if (!platform) return NextResponse.json({ error: "platform is required" }, { status: 400 });
    if (!["META", "TIKTOK", "LINKEDIN", "YOUTUBE"].includes(platform)) {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
    }

    const q = await prisma.videoQuestion.findUnique({
      where: { id },
      include: { codeVideoProject: true },
    });
    if (!q) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!q.codeVideoProject?.videoUrl) return NextResponse.json({ error: "Video not ready" }, { status: 400 });
    if (platform === "YOUTUBE") return NextResponse.json({ error: "YouTube integration not implemented yet" }, { status: 400 });

    const summary =
      q.codeVideoProject.description ||
      q.codeVideoProject.title ||
      q.questionText.slice(0, 240);

    const post = await prisma.socialPost.create({
      data: {
        postId: null,
        summary,
        videoUrl: q.codeVideoProject.videoUrl,
        status: "DRAFT",
        platform,
        postType: "REEL",
        log: `[${new Date().toLocaleTimeString("pt-BR")}] Enfileirado via Perguntas → vídeos`,
      },
    });

    return NextResponse.json({ success: true, socialPostId: post.id });
  } catch (error: any) {
    console.error("[api/video-questions/[id]/enqueue-social POST]", error);
    return NextResponse.json({ error: error?.message || "Failed to enqueue social post" }, { status: 500 });
  }
}

