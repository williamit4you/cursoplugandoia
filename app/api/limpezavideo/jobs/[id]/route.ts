import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireLimpezaVideoSession } from "@/lib/limpezavideo/auth";
import { toPlainJson } from "@/lib/limpezavideo/serialize";
import {
  applyVideoCleanupJobDefaults,
  buildVideoCleanupJobSelect,
  buildVideoCleanupJobUpdateData,
  hasVideoCleanupJobColumn,
} from "@/lib/limpezavideo/dbCompat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireLimpezaVideoSession();
  if (!auth.ok) return auth.response;

  const job = await prisma.videoCleanupJob.findFirst({
    where: {
      id: params.id,
      ownerUserId: auth.userId,
    },
    select: await buildVideoCleanupJobSelect(true),
  });

  if (!job) {
    return NextResponse.json({ error: "Job nao encontrado." }, { status: 404 });
  }

  return NextResponse.json({ job: toPlainJson(applyVideoCleanupJobDefaults(job)) });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireLimpezaVideoSession();
  if (!auth.ok) return auth.response;

  const current = await prisma.videoCleanupJob.findFirst({
    where: {
      id: params.id,
      ownerUserId: auth.userId,
    },
    select: await buildVideoCleanupJobSelect(false),
  });

  if (!current) {
    return NextResponse.json({ error: "Job nao encontrado." }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const affiliateUrl = typeof body?.affiliateUrl === "string" ? body.affiliateUrl.trim() : undefined;
  const isPublished = typeof body?.isPublished === "boolean" ? body.isPublished : undefined;
  const showTopMessage = typeof body?.showTopMessage === "boolean" ? body.showTopMessage : undefined;

  const canUseIsPublished = await hasVideoCleanupJobColumn("isPublished");
  const canUsePublishedAt = await hasVideoCleanupJobColumn("publishedAt");

  const updated = await prisma.videoCleanupJob.update({
    where: { id: current.id },
    data: await buildVideoCleanupJobUpdateData({
      ...(affiliateUrl !== undefined ? { affiliateUrl: affiliateUrl || null } : {}),
      ...(showTopMessage !== undefined ? { showTopMessage } : {}),
      ...(isPublished !== undefined && canUseIsPublished
        ? {
            isPublished,
            ...(canUsePublishedAt ? { publishedAt: isPublished ? current.publishedAt || new Date() : null } : {}),
          }
        : {}),
    }),
    select: await buildVideoCleanupJobSelect(true),
  });

  return NextResponse.json({ ok: true, job: toPlainJson(applyVideoCleanupJobDefaults(updated)) });
}
