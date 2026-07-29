import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  LONG_FORM_PROJECT_TYPE,
  normalizeSubtopics,
  parseLongFormMetadata,
} from "@/lib/longFormMarketing";

export const dynamic = "force-dynamic";

async function read(id: string) {
  return prisma.codeVideoProject.findFirst({
    where: { id, projectType: LONG_FORM_PROJECT_TYPE },
    include: {
      socialPosts: { orderBy: { createdAt: "desc" } },
      pipelineSteps: { orderBy: { createdAt: "asc" } },
      pipelineEvents: { orderBy: { createdAt: "desc" }, take: 30 },
    },
  });
}

export async function GET(
  _: NextRequest,
  ctx: { params: { id: string } },
) {
  const project = await read(ctx.params.id);
  return project
    ? NextResponse.json(project)
    : NextResponse.json({ error: "Nao encontrado" }, { status: 404 });
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: { id: string } },
) {
  const project = await read(ctx.params.id);
  if (!project) {
    return NextResponse.json({ error: "Nao encontrado" }, { status: 404 });
  }
  if (["GENERATING", "RENDERING"].includes(project.status)) {
    return NextResponse.json(
      { error: "Aguarde o processamento atual terminar antes de editar." },
      { status: 409 },
    );
  }

  const body = await req.json();
  const currentMeta = parseLongFormMetadata(project.metadataJson);
  const workingTitle =
    body.workingTitle != null
      ? String(body.workingTitle).trim()
      : String(project.ideaPrompt || "").trim();
  const subtopics =
    body.subtopics != null
      ? normalizeSubtopics(body.subtopics)
      : currentMeta.subtopics || [];
  const briefingChanged =
    body.workingTitle != null ||
    body.subtopics != null ||
    body.funnelStage != null;

  if (workingTitle.length < 5) {
    return NextResponse.json(
      { error: "Informe um titulo com pelo menos 5 caracteres." },
      { status: 400 },
    );
  }
  if (subtopics.length < 1) {
    return NextResponse.json(
      { error: "Informe pelo menos 1 subtitulo." },
      { status: 400 },
    );
  }

  const funnelStage = ["TOPO", "MEIO", "FUNDO"].includes(
    String(body.funnelStage),
  )
    ? String(body.funnelStage)
    : currentMeta.funnelStage || "TOPO";
  const nextMeta = {
    ...currentMeta,
    ...(body.metadata || {}),
    funnelStage,
    subtopics,
    ...(briefingChanged
      ? {
          titleOptions: undefined,
          selectedTitle: undefined,
          chapters: undefined,
          thumbnailConcepts: undefined,
          thumbnailOptions: undefined,
          subtopicCoverage: undefined,
          planningApproved: false,
          finalApproved: false,
          actualDurationSec: null,
        }
      : {}),
  };

  const data: any = { metadataJson: JSON.stringify(nextMeta) };
  if (body.title != null) data.title = String(body.title).slice(0, 100);
  if (body.description != null) {
    data.description = String(body.description).slice(0, 4500);
  }
  if (body.narrationText != null) {
    data.narrationText = String(body.narrationText);
  }
  if (body.thumbUrl != null) data.thumbUrl = String(body.thumbUrl);

  if (briefingChanged) {
    Object.assign(data, {
      ideaPrompt: workingTitle,
      title: workingTitle.slice(0, 100),
      status: "DRAFT",
      errorMessage: null,
      narrationText: null,
      description: "",
      videoSpecJson: "{}",
      audioUrl: null,
      captionsUrl: null,
      videoUrl: null,
      thumbUrl: null,
      renderProgress: 0,
      videoStatus: null,
    });
  }

  return NextResponse.json(
    await prisma.codeVideoProject.update({
      where: { id: project.id },
      data,
    }),
  );
}

export async function DELETE(
  _: NextRequest,
  ctx: { params: { id: string } },
) {
  const project = await read(ctx.params.id);
  if (!project) {
    return NextResponse.json({ error: "Nao encontrado" }, { status: 404 });
  }
  if (project.socialPosts.some((post) => post.status === "POSTED")) {
    return NextResponse.json(
      { error: "Video ja publicado nao pode ser excluido por seguranca." },
      { status: 409 },
    );
  }

  await prisma.$transaction([
    prisma.socialPost.deleteMany({
      where: { codeVideoProjectId: project.id },
    }),
    prisma.codeVideoProject.delete({ where: { id: project.id } }),
  ]);
  return NextResponse.json({ ok: true });
}
