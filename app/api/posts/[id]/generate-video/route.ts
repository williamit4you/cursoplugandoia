import { NextRequest, NextResponse } from "next/server";

import { ensureNewsVideoProjectForPost } from "@/lib/newsArticleVideo";
import { logCodeVideoPipelineEvent, upsertCodeVideoPipelineStep } from "@/lib/video-code/logger";
import { POST as runVideoCodeProjectPost } from "@/app/api/video-code/projects/[id]/run/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 900;

async function callRunPipeline(req: NextRequest, projectId: string) {
  const runReq = new NextRequest(new URL(`/api/video-code/projects/${projectId}/run`, req.url), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trigger: "post_create_or_update" }),
  });
  const res = await runVideoCodeProjectPost(runReq, { params: { id: projectId } });
  const data = await res.json().catch(() => ({}));
  return {
    ok: res.ok,
    status: res.status,
    data,
  };
}

async function runPipelineInBackground(req: NextRequest, projectId: string) {
  const runCall = await callRunPipeline(req, projectId);
  if (!runCall.ok) {
    const errMessage = String(runCall.data?.error || `Falha ao executar pipeline de video (HTTP ${runCall.status})`);
    await upsertCodeVideoPipelineStep({
      projectId,
      stepName: "AUTO_START",
      status: "FAILED",
      attempt: 1,
      finishedAt: new Date(),
      errorMessage: errMessage,
      responsePayload: runCall.data || null,
    }).catch(() => null);
    await logCodeVideoPipelineEvent({
      projectId,
      level: "ERROR",
      stepName: "AUTO_START",
      message: errMessage,
      metadata: runCall.data || null,
    }).catch(() => null);
    return;
  }

  await upsertCodeVideoPipelineStep({
    projectId,
    stepName: "AUTO_START",
    status: "SUCCESS",
    attempt: 1,
    finishedAt: new Date(),
    responsePayload: runCall.data || null,
  }).catch(() => null);
  await logCodeVideoPipelineEvent({
    projectId,
    stepName: "AUTO_START",
    message: "Execucao automatica concluida com sucesso.",
    metadata: runCall.data || null,
  }).catch(() => null);
}

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const ensured = await ensureNewsVideoProjectForPost(ctx.params.id);

    if (ensured.skipped) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: ensured.reason,
      });
    }

    const project = ensured.project;
    const isDone = project.status === "DONE" && project.videoUrl;
    const isBusy = project.status === "GENERATING" || project.status === "READY" || project.status === "RENDERING";

    if (!isDone && !isBusy) {
      await upsertCodeVideoPipelineStep({
        projectId: project.id,
        stepName: "AUTO_START",
        status: "RUNNING",
        attempt: 1,
        startedAt: new Date(),
        requestPayload: { trigger: "post_create_or_update" },
      }).catch(() => null);
      await logCodeVideoPipelineEvent({
        projectId: project.id,
        stepName: "AUTO_START",
        message: "Projeto entrou na fila de processamento automatico do video-engajamento.",
      }).catch(() => null);
      void runPipelineInBackground(req, project.id).catch((error) => {
        console.error("[video-engagement][background-run]", error);
      });
    } else if (isDone) {
      await logCodeVideoPipelineEvent({
        projectId: project.id,
        stepName: "AUTO_START",
        message: "Projeto ja concluiu a renderizacao anteriormente. Nenhuma nova execucao foi iniciada.",
      }).catch(() => null);
    } else if (isBusy) {
      await logCodeVideoPipelineEvent({
        projectId: project.id,
        stepName: "AUTO_START",
        message: "Projeto ja estava em processamento. Mantendo execucao atual.",
      }).catch(() => null);
    }

    return NextResponse.json({
      ok: true,
      skipped: false,
      projectId: project.id,
      status: !isDone && !isBusy ? "QUEUED" : project.status,
      videoUrl: project.videoUrl || null,
      platforms: ensured.platforms,
      alreadyDone: Boolean(isDone),
      alreadyRunning: Boolean(!isDone && isBusy),
    });
  } catch (error: any) {
    console.error("[api/posts/[id]/generate-video POST]", error);
    return NextResponse.json({ error: error?.message || "Falha ao gerar video do artigo" }, { status: 500 });
  }
}
