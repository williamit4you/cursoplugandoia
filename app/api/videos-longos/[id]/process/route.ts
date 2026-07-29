import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  LONG_FORM_PROJECT_TYPE,
  parseLongFormMetadata,
} from "@/lib/longFormMarketing";
import { POST as planLongFormVideo } from "../plan/route";
import { POST as renderCodeVideo } from "../../../video-code/render/route";
import { logCodeVideoPipelineEvent } from "@/lib/video-code/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 2100;

async function requireSuccess(response: Response, stage: string) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || `Falha na etapa ${stage}`);
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
    await logCodeVideoPipelineEvent({
      projectId: project.id,
      stepName: "LONG_FORM_PROCESS",
      message: "Processamento completo iniciado pelo operador.",
    });

    await requireSuccess(
      await planLongFormVideo(req, { params: { id: project.id } }),
      "Geracao do roteiro",
    );
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

    const renderRequest = new NextRequest(
      new URL("/api/video-code/render", req.url),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      },
    );
    await requireSuccess(
      await renderCodeVideo(renderRequest),
      "Renderizacao do video",
    );
    const completed = await prisma.codeVideoProject.findUnique({
      where: { id: project.id },
      include: {
        socialPosts: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    await logCodeVideoPipelineEvent({
      projectId: project.id,
      stepName: "LONG_FORM_PROCESS",
      message: "Processamento completo finalizado com sucesso.",
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
    await logCodeVideoPipelineEvent({
      projectId: project.id,
      stepName: "LONG_FORM_PROCESS",
      level: "ERROR",
      message,
    }).catch(() => null);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
