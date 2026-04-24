import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const id = ctx.params.id;
    const project = await prisma.codeVideoProject.findUnique({ where: { id } });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(project);
  } catch {
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const id = ctx.params.id;
    const body = await req.json();

    const data: any = {};

    if (body?.status != null) data.status = String(body.status);
    if (body?.ideaPrompt != null) data.ideaPrompt = String(body.ideaPrompt);
    if (body?.aspectRatio != null) {
      const aspectRatio = String(body.aspectRatio);
      if (aspectRatio !== "PORTRAIT_9_16" && aspectRatio !== "LANDSCAPE_16_9") {
        return NextResponse.json({ error: "Invalid aspectRatio" }, { status: 400 });
      }
      data.aspectRatio = aspectRatio as any;
    }
    if (body?.videoDurationSec != null) {
      const v = Number(body.videoDurationSec);
      if (!Number.isFinite(v) || v <= 0) return NextResponse.json({ error: "videoDurationSec must be > 0" }, { status: 400 });
      data.videoDurationSec = v;
    }
    if (body?.fps != null) {
      const v = Number(body.fps);
      if (!Number.isFinite(v) || v <= 0) return NextResponse.json({ error: "fps must be > 0" }, { status: 400 });
      data.fps = v;
    }

    if (body?.ttsVoice != null) data.ttsVoice = String(body.ttsVoice);
    if (body?.ttsSpeed != null) data.ttsSpeed = String(body.ttsSpeed);

    if (body?.title != null) data.title = String(body.title);
    if (body?.description != null) data.description = String(body.description);
    if (body?.narrationText != null) data.narrationText = String(body.narrationText);
    if (body?.videoSpecJson != null) data.videoSpecJson = String(body.videoSpecJson);

    if (body?.audioUrl != null) data.audioUrl = body.audioUrl ? String(body.audioUrl) : null;
    if (body?.captionsUrl != null) data.captionsUrl = body.captionsUrl ? String(body.captionsUrl) : null;
    if (body?.videoUrl != null) data.videoUrl = body.videoUrl ? String(body.videoUrl) : null;
    if (body?.thumbUrl != null) data.thumbUrl = body.thumbUrl ? String(body.thumbUrl) : null;
    if (body?.errorMessage != null) data.errorMessage = body.errorMessage ? String(body.errorMessage) : null;
    if (body?.log != null) data.log = body.log ? String(body.log) : null;

    const updated = await prisma.codeVideoProject.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const id = ctx.params.id;
    await prisma.codeVideoProject.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
