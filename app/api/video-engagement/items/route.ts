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

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const q = String(url.searchParams.get("q") || "").trim().toLowerCase();
    const status = String(url.searchParams.get("status") || "ALL").trim().toUpperCase();

    const projects = await prisma.codeVideoProject.findMany({
      where: {
        OR: [
          { metadataJson: { contains: "\"newsAutomation\"" } },
          { metadataJson: { contains: "\"postId\":\"" } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      include: {
        socialPosts: {
          orderBy: [{ scheduledTo: "asc" }, { createdAt: "asc" }],
        },
        pipelineSteps: {
          orderBy: { updatedAt: "asc" },
        },
      },
      take: 200,
    });

    const postIds = Array.from(
      new Set(
        projects
          .map((project) => String(parseMetadata(project.metadataJson)?.postId || "").trim())
          .filter(Boolean)
      )
    );

    const posts = postIds.length
      ? await prisma.post.findMany({
          where: { id: { in: postIds } },
          select: { id: true, title: true, status: true, slug: true, createdAt: true, updatedAt: true },
        })
      : [];

    const postsById = new Map(posts.map((post) => [post.id, post]));

    const items = projects
      .map((project) => {
        const metadata = parseMetadata(project.metadataJson);
        const postId = String(metadata?.postId || "").trim() || null;
        const linkedPost = postId ? postsById.get(postId) || null : null;
        return {
          ...project,
          linkedPost,
          metadata,
        };
      })
      .filter((item) => {
        if (status !== "ALL" && item.status !== status) return false;
        if (!q) return true;
        const haystack = [
          item.title,
          item.description,
          item.linkedPost?.title,
          item.linkedPost?.slug,
          item.id,
        ]
          .map((value) => String(value || "").toLowerCase())
          .join(" ");
        return haystack.includes(q);
      });

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("[api/video-engagement/items GET]", error);
    return NextResponse.json({ error: error?.message || "Falha ao listar videos de engajamento" }, { status: 500 });
  }
}
