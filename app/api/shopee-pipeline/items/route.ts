import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toInt(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

type ItemsOrder =
  | "priority_desc_updatedAt_desc"
  | "createdAt_asc"
  | "createdAt_desc"
  | "updatedAt_desc"
  | "nextRunAt_asc"
  | "status_asc";

function parseOrder(value: string | null): ItemsOrder {
  const v = String(value || "").trim();
  const allowed: ItemsOrder[] = [
    "priority_desc_updatedAt_desc",
    "createdAt_asc",
    "createdAt_desc",
    "updatedAt_desc",
    "nextRunAt_asc",
    "status_asc",
  ];
  return (allowed as string[]).includes(v) ? (v as ItemsOrder) : "priority_desc_updatedAt_desc";
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const take = Math.min(200, Math.max(1, toInt(url.searchParams.get("take"), 50)));
  const status = url.searchParams.get("status");
  const active = url.searchParams.get("active");
  const order = parseOrder(url.searchParams.get("order"));

  const orderBy =
    order === "createdAt_asc"
      ? [{ createdAt: "asc" as const }]
      : order === "createdAt_desc"
        ? [{ createdAt: "desc" as const }]
        : order === "updatedAt_desc"
          ? [{ updatedAt: "desc" as const }]
          : order === "nextRunAt_asc"
            ? [{ nextRunAt: "asc" as const }, { priority: "desc" as const }, { updatedAt: "desc" as const }]
            : order === "status_asc"
              ? [{ pipelineStatus: "asc" as const }, { priority: "desc" as const }, { updatedAt: "desc" as const }]
              : [{ priority: "desc" as const }, { updatedAt: "desc" as const }];

  const items = await prisma.coletaDadosShoppe.findMany({
    take,
    orderBy,
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
