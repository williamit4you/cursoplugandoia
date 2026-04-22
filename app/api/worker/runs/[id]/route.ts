import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SECRET = process.env.WORKER_SECRET_KEY || "super-secret-worker-key-123";

/** PATCH — finaliza um ScraperRun com status, contagens e totais de custo. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const secret = req.headers.get("x-worker-secret");
  if (secret !== SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const run = await prisma.scraperRun.update({
      where: { id: params.id },
      data: {
        status: body.status ?? "SUCCESS",
        finishedAt: body.finishedAt ? new Date(body.finishedAt) : new Date(),
        articlesFound: body.articlesFound ?? 0,
        articlesSaved: body.articlesSaved ?? 0,
        errorMessage: body.errorMessage ?? null,
        totalTokensIn: body.totalTokensIn ?? 0,
        totalTokensOut: body.totalTokensOut ?? 0,
        totalCostUsd: body.totalCostUsd ?? 0,
      },
    });
    return NextResponse.json(run);
  } catch (error) {
    console.error("[api/worker/runs/[id] PATCH]", error);
    return NextResponse.json({ error: "Failed to update run" }, { status: 500 });
  }
}
