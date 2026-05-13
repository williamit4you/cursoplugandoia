import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toInt(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const take = Math.min(200, Math.max(1, toInt(url.searchParams.get("take"), 50)));
  const status = url.searchParams.get("status");
  const active = url.searchParams.get("active");

  const items = await prisma.coletaDadosShoppe.findMany({
    take,
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
    where: {
      ...(status ? { pipelineStatus: status as any } : {}),
      ...(active === "true" ? { active: true } : active === "false" ? { active: false } : {}),
    },
    include: {
      linksMedia: true,
      storyAd: true,
      bioProduct: true,
      pipelineSteps: { orderBy: { updatedAt: "desc" }, take: 5 },
    },
  });

  return NextResponse.json(items);
}

