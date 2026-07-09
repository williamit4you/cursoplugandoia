import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireLimpezaVideoSession } from "@/lib/limpezavideo/auth";
import { toPlainJson } from "@/lib/limpezavideo/serialize";

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
    include: {
      steps: {
        orderBy: { createdAt: "asc" },
      },
      events: {
        orderBy: { createdAt: "desc" },
        take: 30,
      },
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Job não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ job: toPlainJson(job) });
}
