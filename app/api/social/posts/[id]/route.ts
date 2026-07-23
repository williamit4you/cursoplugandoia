import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { requireAdminOrCronSecret } from "@/lib/shopee-pipeline/apiAuth";
import { auditManualAction } from "@/lib/operationsControl";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const REQUEUE_SPACING_HOURS = 2;

async function requeueExpired(req: NextRequest) {
  await requireAdminOrCronSecret(req);
  const body = await req.json().catch(() => ({}));
  const platform = String(body.platform || "ALL").trim().toUpperCase();
  const dryRun = Boolean(body.dryRun);
  const now = new Date();
  const where: any = {
    videoUrl: { not: "" },
    OR: [
      { status: "FAILED" },
      { status: "SCHEDULED", scheduledTo: { lte: now } },
    ],
  };
  if (platform !== "ALL") where.platform = platform;

  const candidates = await prisma.socialPost.findMany({
    where,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true, platform: true, log: true },
  });
  if (!candidates.length) return { count: 0, spacingHours: REQUEUE_SPACING_HOURS };

  const occupiedSlots = new Set<string>();
  const future = await prisma.socialPost.findMany({
    where: { status: "SCHEDULED", scheduledTo: { gt: now }, ...(platform !== "ALL" ? { platform } : {}) },
    orderBy: { scheduledTo: "desc" },
    select: { platform: true, scheduledTo: true },
  });
  for (const item of future) {
    if (item.scheduledTo) occupiedSlots.add(`${item.platform}:${item.scheduledTo.getTime()}`);
  }

  let cursor = new Date(now.getTime() + REQUEUE_SPACING_HOURS * 60 * 60 * 1000);
  const plan = candidates.map((item) => {
    while (occupiedSlots.has(`${item.platform}:${cursor.getTime()}`)) {
      cursor = new Date(cursor.getTime() + REQUEUE_SPACING_HOURS * 60 * 60 * 1000);
    }
    const scheduledTo = new Date(cursor);
    occupiedSlots.add(`${item.platform}:${scheduledTo.getTime()}`);
    cursor = new Date(cursor.getTime() + REQUEUE_SPACING_HOURS * 60 * 60 * 1000);
    return { item, scheduledTo };
  });
  if (dryRun) {
    return { count: plan.length, spacingHours: REQUEUE_SPACING_HOURS, preview: plan.map(({ item, scheduledTo }) => ({ id: item.id, platform: item.platform, scheduledTo })) };
  }
  const updates = plan.map(({ item, scheduledTo }) => prisma.socialPost.update({
      where: { id: item.id },
      data: {
        status: "SCHEDULED", scheduledTo, postedAt: null, postUrl: null,
        youtubePostedAt: null, youtubePostUrl: null, metaStoryPostedAt: null,
        metaStoryPostUrl: null, metaReelPostedAt: null, metaReelPostUrl: null,
        tiktokPostedAt: null, tiktokPostUrl: null, linkedinPostedAt: null,
        linkedinPostUrl: null, metaContainerId: null,
        log: `${item.log || ""}${item.log ? "\n" : ""}[${new Date().toLocaleTimeString("pt-BR")}] Reagendado automaticamente para recuperar publicação antiga.`,
      },
  }));
  await prisma.$transaction(updates);
  await auditManualAction({ action: "REQUEUE_EXPIRED_SOCIAL", entityType: "SocialPost", summary: `${updates.length} publicacoes antigas reagendadas`, metadata: { platform, spacingHours: REQUEUE_SPACING_HOURS, ids: candidates.map((item) => item.id) } });
  return { count: updates.length, spacingHours: REQUEUE_SPACING_HOURS };
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (params.id !== "requeue") return NextResponse.json({ error: "Not found" }, { status: 404 });
    const result = await requeueExpired(req);
    return NextResponse.json({ ok: true, ...result });
  } catch (error: any) {
    console.error("[api/social/posts/requeue POST]", error);
    const status = error?.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ ok: false, error: error?.message || "Falha ao reagendar publicações" }, { status });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminOrCronSecret(req);
    const { id } = params;
    const body = await req.json();
    
    // Build update payload
    const updateData: any = {};
    if (body.scheduledTo !== undefined) {
      updateData.scheduledTo = body.scheduledTo ? new Date(body.scheduledTo) : null;
    }
    if (body.status !== undefined) {
      updateData.status = body.status;
    }
    if (body.summary !== undefined) {
      updateData.summary = body.summary;
    }
    if (body.platform !== undefined) {
      updateData.platform = String(body.platform || "").trim();
    }
    if (body.postType !== undefined) {
      updateData.postType = String(body.postType || "").trim();
    }
    if (body.videoUrl !== undefined) {
      updateData.videoUrl = String(body.videoUrl || "").trim();
    }

    // Quando o usuário re-agenda/republica, limpar campos de publicação anteriores.
    if (body.resetPublication === true) {
      updateData.postedAt = null;
      updateData.postUrl = null;
      updateData.youtubePostedAt = null;
      updateData.youtubePostUrl = null;
      updateData.metaStoryPostedAt = null;
      updateData.metaStoryPostUrl = null;
      updateData.metaReelPostedAt = null;
      updateData.metaReelPostUrl = null;
      updateData.tiktokPostedAt = null;
      updateData.tiktokPostUrl = null;
      updateData.linkedinPostedAt = null;
      updateData.linkedinPostUrl = null;
      updateData.metaContainerId = null;
    }

    const updated = await prisma.socialPost.update({
      where: { id },
      data: updateData,
    });
    await auditManualAction({ action: "UPDATE_SOCIAL_POST", entityType: "SocialPost", entityId: id, summary: "Publicacao social alterada manualmente", metadata: body });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[api/social/posts/[id] PATCH]", error);
    const status = error?.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: error.message || "Failed to update social post" }, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminOrCronSecret(req);
    const { id } = params;
    await prisma.socialPost.delete({ where: { id } });
    await auditManualAction({ action: "DELETE_SOCIAL_POST", entityType: "SocialPost", entityId: id, summary: "Publicacao social removida manualmente" });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[api/social/posts/[id] DELETE]", error);
    const status = error?.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: error.message || "Failed to delete social post" }, { status });
  }
}
