import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

export const dynamic = "force-dynamic";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

/**
 * GET /api/posts/[id]/social-post
 * Retorna o SocialPost mais recente associado ao Post (para publicar no LinkedIn).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const socialPost = await prisma.socialPost.findFirst({
    where: { postId: params.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, status: true, videoUrl: true },
  });

  if (!socialPost) {
    return NextResponse.json({ error: "Nenhum vídeo associado a este post" }, { status: 404 });
  }

  return NextResponse.json({ socialPostId: socialPost.id, status: socialPost.status });
}
