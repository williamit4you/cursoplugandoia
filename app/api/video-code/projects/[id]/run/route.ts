import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function callProjectAction(req: NextRequest, pathname: string, projectId: string) {
  const url = new URL(pathname, req.url);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data, error: data?.error || `HTTP ${res.status}` };
}

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const id = ctx.params.id;

    // 1. Verify project exists
    const project = await prisma.codeVideoProject.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json({ error: "Code video project not found" }, { status: 404 });
    }

    // 2. Trigger generate script
    const genResult = await callProjectAction(req, "/api/video-code/generate", id);
    if (!genResult.ok) {
      return NextResponse.json({ error: genResult.error || "Failed to generate script" }, { status: 500 });
    }

    // 3. Trigger render video
    const renderResult = await callProjectAction(req, "/api/video-code/render", id);
    if (!renderResult.ok) {
      return NextResponse.json({ error: renderResult.error || "Failed to render video" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      projectId: id,
      videoUrl: renderResult.data.videoUrl,
    });
  } catch (error: any) {
    console.error("[api/video-code/projects/[id]/run POST]", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
