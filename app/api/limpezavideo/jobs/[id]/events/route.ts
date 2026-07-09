import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireLimpezaVideoSession } from "@/lib/limpezavideo/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireLimpezaVideoSession();
  if (!auth.ok) return auth.response;

  const job = await prisma.videoCleanupJob.findFirst({
    where: { id: params.id, ownerUserId: auth.userId },
    select: { id: true },
  });
  if (!job) {
    return NextResponse.json({ error: "Job não encontrado." }, { status: 404 });
  }

  const events = await prisma.videoCleanupEvent.findMany({
    where: { jobId: job.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return NextResponse.json({ events });
}
