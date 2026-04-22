import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SECRET = process.env.WORKER_SECRET_KEY || "super-secret-worker-key-123";

/** GET — lista últimos 30 ScraperRuns com logs de IA agrupados. */
export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-worker-secret");
  if (secret !== SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const runs = await prisma.scraperRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 30,
      include: {
        aiUsageLogs: {
          select: {
            id: true,
            operation: true,
            model: true,
            promptTokens: true,
            completionTokens: true,
            totalTokens: true,
            costUsd: true,
            outputSummary: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    return NextResponse.json(runs);
  } catch (error) {
    console.error("[api/worker/runs GET]", error);
    return NextResponse.json({ error: "Failed to fetch runs" }, { status: 500 });
  }
}

/** POST — cria novo ScraperRun. Chamado pelo scraper.py ao iniciar uma coleta. */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-worker-secret");
  if (secret !== SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const run = await prisma.scraperRun.create({
      data: {
        startedAt: body.startedAt ? new Date(body.startedAt) : new Date(),
        triggerType: body.triggerType ?? "AUTO",
        status: "RUNNING",
      },
    });
    return NextResponse.json(run);
  } catch (error) {
    console.error("[api/worker/runs POST]", error);
    return NextResponse.json({ error: "Failed to create run" }, { status: 500 });
  }
}
