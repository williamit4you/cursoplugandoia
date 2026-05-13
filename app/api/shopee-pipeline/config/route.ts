import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
