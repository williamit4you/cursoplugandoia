import { NextRequest, NextResponse } from "next/server";

import { ensureNewsVideoProjectForPost } from "@/lib/newsArticleVideo";
import { logCodeVideoPipelineEvent, upsertCodeVideoPipelineStep } from "@/lib/video-code/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 900;

function baseUrl(req: NextRequest) {
  const host = req.headers.get("host") || "localhost:3000";
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const protocol = forwardedProto || (host.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
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
        message: "Disparando execucao automatica de roteiro e renderizacao do video.",
      }).catch(() => null);
      const runUrl = `${baseUrl(req)}/api/video-code/projects/${project.id}/run`;
      fetch(runUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trigger: "post_create_or_update" }),
        cache: "no-store",
      }).catch((error) => {
        console.error("[api/posts/[id]/generate-video POST] background run failed", error);
        logCodeVideoPipelineEvent({
          projectId: project.id,
          level: "ERROR",
          stepName: "AUTO_START",
          message: "Falha ao iniciar a execucao automatica em background.",
          metadata: { error: error?.message || String(error) },
        }).catch(() => null);
      });
      await upsertCodeVideoPipelineStep({
        projectId: project.id,
        stepName: "AUTO_START",
        status: "SUCCESS",
        attempt: 1,
        finishedAt: new Date(),
      }).catch(() => null);
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
      status: project.status,
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
