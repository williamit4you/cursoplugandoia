import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseMetadata(text: string | null | undefined) {
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const id = String(ctx.params.id || "").trim();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const project = await prisma.codeVideoProject.findUnique({
      where: { id },
      include: {
        socialPosts: {
          orderBy: [{ scheduledTo: "asc" }, { createdAt: "asc" }],
        },
        pipelineSteps: {
          orderBy: { updatedAt: "asc" },
        },
      },
    });

    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const metadata = parseMetadata(project.metadataJson);
    const postId = String(metadata?.postId || "").trim() || null;
    const linkedPost = postId
      ? await prisma.post.findUnique({
          where: { id: postId },
          select: { id: true, title: true, status: true, slug: true, summary: true, createdAt: true, updatedAt: true },
        })
      : null;

    return NextResponse.json({
      ...project,
      linkedPost,
      metadata,
    });
  } catch (error: any) {
    console.error("[api/video-engagement/items/[id] GET]", error);
    return NextResponse.json({ error: error?.message || "Falha ao carregar video de engajamento" }, { status: 500 });
  }
}
