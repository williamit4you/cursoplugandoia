import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const item = await prisma.coletaDadosShoppe.findUnique({
    where: { id: params.id },
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

  if (body.active !== undefined) data.active = Boolean(body.active);
  if (body.priority !== undefined) data.priority = Number(body.priority) || 0;
  if (body.pipelineStatus) data.pipelineStatus = String(body.pipelineStatus);
  if (body.nextRunAt === null) data.nextRunAt = null;
  if (body.nextRunAt) data.nextRunAt = new Date(String(body.nextRunAt));
  if (body.unlock === true) {
    data.lockedAt = null;
    data.lockedBy = null;
  }

  const updated = await prisma.coletaDadosShoppe.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json(updated);
}

