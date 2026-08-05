import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  LONG_FORM_PROJECT_TYPE,
  LONG_FORM_MIN_DURATION_SEC,
  durationFromVideoSpec,
  normalizeSubtopics,
  parseLongFormMetadata,
} from "@/lib/longFormMarketing";
import { clearPlanningApproval } from "@/lib/longFormWorkflow";
import { getLongFormApprovalActor, markFinalApproved, markPlanningApproved } from "@/lib/longFormWorkflow";
import { requireServerSession } from "@/lib/serverAuth";
import { logCodeVideoPipelineEvent } from "@/lib/video-code/logger";
import { upsertCodeVideoPipelineStep } from "@/lib/video-code/logger";

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
      ? clearPlanningApproval({
          ...currentMeta,
          ...(body.metadata || {}),
          funnelStage,
          subtopics,
          titleOptions: undefined,
          selectedTitle: undefined,
          chapters: undefined,
          thumbnailConcepts: undefined,
          thumbnailOptions: undefined,
          subtopicCoverage: undefined,
          renderSegments: undefined,
          mergeStatus: undefined,
          actualDurationSec: null,
        })
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

export async function POST(
  req: NextRequest,
  ctx: { params: { id: string } },
) {
  const session = await requireServerSession();
  const user = session?.user as any;
  if (!session?.user || String(user?.role || "") !== "ADMIN") {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const project = await read(ctx.params.id);
  if (!project) {
    return NextResponse.json({ error: "Nao encontrado" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const action = String(body?.action || "").trim();
  const metadata = parseLongFormMetadata(project.metadataJson);
  const actor = await getLongFormApprovalActor();

  if (action === "approve-planning") {
    if (!String(project.narrationText || "").trim()) {
      return NextResponse.json(
        { error: "Gere o planejamento antes de aprovar." },
        { status: 409 },
      );
    }

    const startedAt = new Date();
    const updated = await prisma.codeVideoProject.update({
      where: { id: project.id },
      data: {
        status: project.videoUrl ? project.status : "READY",
        metadataJson: JSON.stringify(markPlanningApproved(metadata, actor)),
      },
    });

    await upsertCodeVideoPipelineStep({
      projectId: project.id,
      stepName: "LONG_FORM_APPROVE_PLANNING",
      status: "SUCCESS",
      attempt: 1,
      startedAt,
      finishedAt: new Date(),
      responsePayload: {
        actorId: actor.id,
        actorLabel: actor.label,
      },
    }).catch(() => null);
    await logCodeVideoPipelineEvent({
      projectId: project.id,
      stepName: "LONG_FORM_APPROVAL",
      message: `Planejamento aprovado por ${actor.label}.`,
      metadata: {
        actorId: actor.id,
        actorLabel: actor.label,
      },
    }).catch(() => null);

    return NextResponse.json({ project: updated });
  }

  if (action === "approve-final") {
    if (!metadata.planningApproved) {
      return NextResponse.json(
        { error: "Aprove o planejamento antes da aprovacao final." },
        { status: 409 },
      );
    }

    if (!project.videoUrl) {
      return NextResponse.json(
        { error: "Renderize o MP4 final antes da aprovacao final." },
        { status: 409 },
      );
    }

    const actualDurationSec = Number(metadata.actualDurationSec || 0);
    if (actualDurationSec < LONG_FORM_MIN_DURATION_SEC) {
      return NextResponse.json(
        {
          error: `Duracao real do MP4 nao confirmada ou inferior a ${LONG_FORM_MIN_DURATION_SEC}s.`,
        },
        { status: 409 },
      );
    }

    const startedAt = new Date();
    const updated = await prisma.codeVideoProject.update({
      where: { id: project.id },
      data: {
        metadataJson: JSON.stringify(markFinalApproved(metadata, actor)),
      },
    });

    await upsertCodeVideoPipelineStep({
      projectId: project.id,
      stepName: "LONG_FORM_APPROVE_FINAL",
      status: "SUCCESS",
      attempt: 1,
      startedAt,
      finishedAt: new Date(),
      responsePayload: {
        actorId: actor.id,
        actorLabel: actor.label,
      },
    }).catch(() => null);
    await logCodeVideoPipelineEvent({
      projectId: project.id,
      stepName: "LONG_FORM_APPROVAL",
      message: `Aprovacao final registrada por ${actor.label}.`,
      metadata: {
        actorId: actor.id,
        actorLabel: actor.label,
      },
    }).catch(() => null);

    return NextResponse.json({ project: updated });
  }

  if (action === "stats") {
    return NextResponse.json({
      projectId: project.id,
      plannedDurationSec: durationFromVideoSpec(project.videoSpecJson),
      actualDurationSec: Number(metadata.actualDurationSec || 0),
    });
  }

  return NextResponse.json(
    { error: "Acao nao suportada." },
    { status: 400 },
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
