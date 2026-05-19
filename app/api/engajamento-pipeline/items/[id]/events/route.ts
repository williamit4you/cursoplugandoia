import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const item = await prisma.coletaDadosShoppe.findFirst({
    where: { id: params.id, pipelineKind: "ENGAGEMENT" as any },
    select: { id: true },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
