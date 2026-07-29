import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  LONG_FORM_PROJECT_TYPE,
  parseLongFormMetadata,
} from "@/lib/longFormMarketing";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 2100;

async function invoke(origin: string, path: string, body?: unknown) {
  const response = await fetch(`${origin}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(1000 * 60 * 35),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || `Falha na etapa ${path}`);
  }
  return payload;
}

export async function POST(
  req: NextRequest,
  ctx: { params: { id: string } },
) {
  const project = await prisma.codeVideoProject.findFirst({
    where: { id: ctx.params.id, projectType: LONG_FORM_PROJECT_TYPE },
  });
  if (!project) {
    return NextResponse.json({ error: "Nao encontrado" }, { status: 404 });
  }
  if (["GENERATING", "RENDERING"].includes(project.status)) {
    return NextResponse.json(
      { error: "Este video ja esta sendo processado." },
      { status: 409 },
    );
  }

  const origin = new URL(req.url).origin;
  try {
    await prisma.codeVideoProject.update({
      where: { id: project.id },
      data: {
        status: "GENERATING",
        errorMessage: null,
        videoSpecJson: "{}",
        narrationText: null,
        videoUrl: null,
        audioUrl: null,
        captionsUrl: null,
        renderProgress: 0,
      },
    });

    await invoke(origin, `/api/videos-longos/${project.id}/plan`);
    const planned = await prisma.codeVideoProject.findUnique({
      where: { id: project.id },
    });
    const meta = parseLongFormMetadata(planned?.metadataJson);
    await prisma.codeVideoProject.update({
      where: { id: project.id },
      data: {
        metadataJson: JSON.stringify({
          ...meta,
          planningApproved: true,
          finalApproved: true,
        }),
      },
    });

    await invoke(origin, "/api/video-code/render", {
      projectId: project.id,
    });
    const completed = await prisma.codeVideoProject.findUnique({
      where: { id: project.id },
      include: {
        socialPosts: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    return NextResponse.json(completed);
  } catch (error: any) {
    const message = error?.message || "Falha ao criar o video.";
    await prisma.codeVideoProject
      .update({
        where: { id: project.id },
        data: { status: "FAILED", errorMessage: message },
      })
      .catch(() => null);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
