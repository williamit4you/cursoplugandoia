import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  LONG_FORM_MIN_DURATION_SEC,
  LONG_FORM_PROJECT_TYPE,
  durationFromVideoSpec,
  enqueueLongFormYoutube,
  parseLongFormMetadata,
} from "@/lib/longFormMarketing";
import { logCodeVideoPipelineEvent } from "@/lib/video-code/logger";
import { upsertCodeVideoPipelineStep } from "@/lib/video-code/logger";

export async function POST(
  _req: NextRequest,
  ctx: { params: { id: string } },
) {
  const project = await prisma.codeVideoProject.findFirst({
    where: { id: ctx.params.id, projectType: LONG_FORM_PROJECT_TYPE },
  });

  if (!project) {
    return NextResponse.json({ error: "Nao encontrado" }, { status: 404 });
  }

  const plannedDurationSec = durationFromVideoSpec(project.videoSpecJson);
  if (plannedDurationSec < LONG_FORM_MIN_DURATION_SEC) {
    return NextResponse.json(
      {
        error: `Video longo bloqueado: a timeline tem ${Math.round(plannedDurationSec)}s; o minimo e ${LONG_FORM_MIN_DURATION_SEC}s.`,
      },
      { status: 400 },
    );
  }

  const meta = parseLongFormMetadata(project.metadataJson);
  if (!meta.planningApproved) {
    return NextResponse.json(
      {
        error:
          "Aprovacao de planejamento obrigatoria antes do agendamento.",
      },
      { status: 409 },
    );
  }

  if (!meta.finalApproved) {
    return NextResponse.json(
      { error: "Aprovacao final obrigatoria antes do agendamento." },
      { status: 409 },
    );
  }

  const actualDurationSec = Number(meta.actualDurationSec || 0);
  if (actualDurationSec < LONG_FORM_MIN_DURATION_SEC) {
    return NextResponse.json(
      {
        error: `Video longo bloqueado: duracao real do MP4 nao confirmada ou inferior a ${LONG_FORM_MIN_DURATION_SEC}s.`,
      },
      { status: 400 },
    );
  }

  const startedAt = new Date();
  const social = await enqueueLongFormYoutube(project);
  await upsertCodeVideoPipelineStep({
    projectId: project.id,
    stepName: "LONG_FORM_SCHEDULE_YOUTUBE",
    status: "SUCCESS",
    attempt: 1,
    startedAt,
    finishedAt: new Date(),
    responsePayload: {
      socialPostId: social.id,
      platform: social.platform,
      status: social.status,
    },
  }).catch(() => null);
  await logCodeVideoPipelineEvent({
    projectId: project.id,
    stepName: "LONG_FORM_SCHEDULE",
    message: "Video longo enviado para a fila do YouTube com aprovacao valida.",
    metadata: {
      socialPostId: social.id,
      planningApprovedAt: meta.planningApprovedAt || null,
      finalApprovedAt: meta.finalApprovedAt || null,
    },
  }).catch(() => null);

  return NextResponse.json({ project, social });
}
