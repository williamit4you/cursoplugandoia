import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const url = new URL(req.url);
  const take = Math.min(500, Math.max(1, Number(url.searchParams.get("take") || 200)));
  const level = url.searchParams.get("level");
  const stepName = url.searchParams.get("stepName");

  const events = await prisma.shopeePipelineEvent.findMany({
    where: {
      coletaId: params.id,
      ...(level ? { level: String(level) } : {}),
      ...(stepName ? { stepName: String(stepName) } : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
  });

  return NextResponse.json(events);
}

