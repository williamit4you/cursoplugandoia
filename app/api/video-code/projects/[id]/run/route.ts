import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { POST as generateVideoCodePost } from "@/app/api/video-code/generate/route";
import { POST as renderVideoCodePost } from "@/app/api/video-code/render/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function makeJsonRequest(baseUrl: string, pathname: string, body: unknown) {
  return new NextRequest(new URL(pathname, baseUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function readRouteResponse(res: Response) {
  const data = await res.json().catch(() => ({}));
  return {
    ok: res.ok,
    status: res.status,
    data,
    error: (data as any)?.error || `HTTP ${res.status}`,
  };
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

    const baseUrl = req.url;

    const genReq = makeJsonRequest(baseUrl, "/api/video-code/generate", { projectId: id });
    const genResult = await readRouteResponse(await generateVideoCodePost(genReq));
    if (!genResult.ok) {
      return NextResponse.json({ error: genResult.error || "Failed to generate script" }, { status: 500 });
    }

    const renderReq = makeJsonRequest(baseUrl, "/api/video-code/render", { projectId: id });
    const renderResult = await readRouteResponse(await renderVideoCodePost(renderReq));
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
