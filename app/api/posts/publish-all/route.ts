import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await prisma.post.updateMany({
      where: { status: { not: "PUBLISHED" } },
      data: { status: "PUBLISHED" },
    });

    return NextResponse.json({ success: true, publishedCount: result.count });
  } catch (error: any) {
    console.error("[api/posts/publish-all POST]", error);
    return NextResponse.json(
      { error: error?.message || "Falha ao publicar as notícias" },
      { status: 500 },
    );
  }
}
