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

    // 1. Find the question
    const question = await prisma.videoQuestion.findUnique({
      where: { id },
    });

    if (!question) {
      return NextResponse.json({ error: "Video question not found" }, { status: 404 });
    }

    // Update status to processing
    await prisma.videoQuestion.update({
      where: { id },
      data: { status: "PROCESSING", startedAt: new Date(), errorMessage: null },
    });

    let projectId = question.codeVideoProjectId;

    // 2. Create project if not exists
    if (!projectId) {
      const cfg = (await prisma.videoQuestionConfig.findFirst()) || {
        defaultAspectRatio: "PORTRAIT_9_16",
        videoDurationSec: 30,
        ttsVoice: "pt-BR-AntonioNeural",
        ttsSpeed: "+5%",
      };

      const project = await prisma.codeVideoProject.create({
        data: {
          projectType: "GENERIC",
          ideaPrompt: question.questionText,
          aspectRatio: (cfg.defaultAspectRatio || "PORTRAIT_9_16") as any,
          videoDurationSec: cfg.videoDurationSec || 30,
          ttsVoice: cfg.ttsVoice || "pt-BR-AntonioNeural",
          ttsSpeed: cfg.ttsSpeed || "+5%",
          useExternalMedia: question.useExternalMedia,
          title: question.questionText,
          description: "",
        },
      });

      projectId = project.id;

      await prisma.videoQuestion.update({
        where: { id },
        data: { codeVideoProjectId: projectId },
      });
    }

    // 3. Trigger generate script
    const genResult = await callProjectAction(req, "/api/video-code/generate", projectId);
    if (!genResult.ok) {
      const errMsg = genResult.error || "Failed to generate AI spec";
      await prisma.videoQuestion.update({
        where: { id },
        data: { status: "FAILED", errorMessage: errMsg },
      });
      return NextResponse.json({ error: errMsg }, { status: 500 });
    }

    // 4. Trigger render video
    const renderResult = await callProjectAction(req, "/api/video-code/render", projectId);
    if (!renderResult.ok) {
      const errMsg = renderResult.error || "Failed to render video";
      await prisma.videoQuestion.update({
        where: { id },
        data: { status: "FAILED", errorMessage: errMsg },
      });
      return NextResponse.json({ error: errMsg }, { status: 500 });
    }

    // 5. Update question to complete
    await prisma.videoQuestion.update({
      where: { id },
      data: { status: "DONE", completedAt: new Date(), errorMessage: null },
    });

    return NextResponse.json({
      success: true,
      projectId,
      videoUrl: renderResult.data.videoUrl,
    });
  } catch (error: any) {
    console.error("[api/video-questions/[id]/run POST]", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
