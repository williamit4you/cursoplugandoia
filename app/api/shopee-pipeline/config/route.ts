import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isComfyPromptApiTemplate, isComfyUiWorkflowTemplate } from "@/lib/shopee-pipeline/comfyui/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const config = await prisma.shopeePipelineConfig.findFirst({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(
    config || {
      enabled: false,
      runEveryMinutes: 5,
      maxItemsPerRun: 1,
      processOneAtATime: true,
      lastCronRunAt: null,
      nextCronRunAt: null,
      userBaseImageUrl: null,
      userVoiceRefUrl: null,
    }
  );
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const enabled = Boolean(body.enabled);
  const runEveryMinutes = Math.max(1, Number(body.runEveryMinutes || 5));
  const maxItemsPerRun = Math.max(1, Number(body.maxItemsPerRun || 1));
  const processOneAtATime = body.processOneAtATime === false ? false : true;
  const userBaseImageUrl = body.userBaseImageUrl ? String(body.userBaseImageUrl) : null;
  const userVoiceRefUrl = body.userVoiceRefUrl ? String(body.userVoiceRefUrl) : null;
  const comfyAudioPromptTemplate = body.comfyAudioPromptTemplate && typeof body.comfyAudioPromptTemplate === "object" ? body.comfyAudioPromptTemplate : null;
  const comfyVideoPromptTemplate = body.comfyVideoPromptTemplate && typeof body.comfyVideoPromptTemplate === "object" ? body.comfyVideoPromptTemplate : null;

  if (comfyVideoPromptTemplate && isComfyUiWorkflowTemplate(comfyVideoPromptTemplate)) {
    return NextResponse.json(
      {
        error:
          "ComfyUI Video Template está em formato Workflow/UI. No ComfyUI, exporte em formato API (Save/Export API Format) e cole esse JSON aqui.",
      },
      { status: 400 }
    );
  }

  if (comfyVideoPromptTemplate && !isComfyPromptApiTemplate(comfyVideoPromptTemplate)) {
    return NextResponse.json(
      {
        error: "ComfyUI Video Template inválido: esperado prompt API com nodes no formato { class_type, inputs }.",
      },
      { status: 400 }
    );
  }

  const existing = await prisma.shopeePipelineConfig.findFirst({ orderBy: { createdAt: "desc" } });
  const saved = existing
    ? await prisma.shopeePipelineConfig.update({
        where: { id: existing.id },
        data: { enabled, runEveryMinutes, maxItemsPerRun, processOneAtATime, userBaseImageUrl, userVoiceRefUrl, comfyAudioPromptTemplate, comfyVideoPromptTemplate },
      })
    : await prisma.shopeePipelineConfig.create({
        data: { enabled, runEveryMinutes, maxItemsPerRun, processOneAtATime, userBaseImageUrl, userVoiceRefUrl, comfyAudioPromptTemplate, comfyVideoPromptTemplate },
      });

  return NextResponse.json(saved);
}
