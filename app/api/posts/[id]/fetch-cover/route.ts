import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { fetchAndStorePexelsImage } from "@/lib/pexelsImage";

export const dynamic = "force-dynamic";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

/**
 * POST /api/posts/[id]/fetch-cover
 * Busca uma imagem de capa no Pexels baseada no título do Post e salva em MinIO.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const post = await prisma.post.findUnique({ where: { id: params.id } });
    if (!post) {
      return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
    }

    const imageUrl = await fetchAndStorePexelsImage(post.title);
    if (!imageUrl) {
      return NextResponse.json(
        { error: "Não foi possível buscar imagem no Pexels. Verifique PEXELS_API_KEY." },
        { status: 500 }
      );
    }

    await prisma.post.update({
      where: { id: params.id },
      data: { coverImage: imageUrl },
    });

    return NextResponse.json({ coverImage: imageUrl });
  } catch (error: any) {
    console.error("fetch-cover error:", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}
