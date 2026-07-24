import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function inferResumeStatus(item: any) {
  if (item.inputMode === "MANUAL_VIDEO") {
    if (item.pipelineStatus === "PUBLISHED") return "PUBLISHED";
    if (!String(item.aiPromptVendas || "").trim()) return "GENERATING_COPY";
    if (!item.audioUrl) return "GENERATING_AUDIO";
    if (!item.copyVideoUrl) return "GENERATING_COPY_VIDEO";
    if (!item.videoFinalUrl) return "MERGING_VIDEOS";
    const metadata = item.platformMetadata as any;
    if (!metadata?.TIKTOK || !metadata?.INSTAGRAM || !metadata?.YOUTUBE) return "GENERATING_PLATFORM_METADATA";
    return "READY_FOR_SCHEDULING";
  }

  const keepCurrentStatuses = new Set([
    "WAITING_POD",
    "GENERATING_AUDIO",
    "GENERATING_COPY_VIDEO",
    "MERGING_VIDEOS",
    "GENERATING_AFFILIATE_LINK",
    "READY_FOR_STORY",
  ]);
  if (keepCurrentStatuses.has(String(item.pipelineStatus || ""))) return item.pipelineStatus;
  if (item.pipelineStatus === "PUBLISHED") return "PUBLISHED";
  if (item.affiliateUrl) return "AFFILIATE_LINK_READY";
  if (item.videoFinalUrl) return "FINAL_VIDEO_READY";
  if (item.copyVideoUrl) return "COPY_VIDEO_READY";
  if (item.audioUrl) return "AUDIO_READY";
  if (String(item.aiPromptVendas || "").trim()) return "COPY_READY";
  return "PENDING";
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const item = await prisma.coletaDadosShoppe.findFirst({
    where: { id: params.id, pipelineKind: "SALES" as any },
    include: {
      linksMedia: true,
      pipelineSteps: { orderBy: { updatedAt: "desc" } },
      pipelineEvents: { orderBy: { createdAt: "desc" }, take: 200 },
      storyAd: { include: { publications: true } },
      bioProduct: true,
    },
  });

  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const data: any = {};
  const current = await prisma.coletaDadosShoppe.findFirst({
    where: { id: params.id, pipelineKind: "SALES" as any },
  });

  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.active !== undefined) data.active = Boolean(body.active);
  if (body.priority !== undefined) data.priority = Number(body.priority) || 0;
  if (body.pipelineStatus) data.pipelineStatus = String(body.pipelineStatus);
  if (body.nextRunAt === null) data.nextRunAt = null;
  if (body.nextRunAt) data.nextRunAt = new Date(String(body.nextRunAt));
  if (body.unlock === true) {
    data.lockedAt = null;
    data.lockedBy = null;
  }

  if (body.forceResumeNow === true) {
    const resumedStatus =
      typeof body.resumeStatus === "string" && body.resumeStatus.trim()
        ? body.resumeStatus.trim()
        : inferResumeStatus(current);

    data.active = true;
    data.pipelineStatus = resumedStatus;
    data.nextRunAt = null;
    data.lockedAt = null;
    data.lockedBy = null;
    data.lastError = null;
  }

  const updated = await prisma.coletaDadosShoppe.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json({
    ...updated,
    resumeInfo:
      body.forceResumeNow === true
        ? {
            resumedStatus: data.pipelineStatus,
            message: "Item preparado para continuar do ponto mais proximo possivel.",
          }
        : null,
  });
}
