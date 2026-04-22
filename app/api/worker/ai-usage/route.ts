import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SECRET = process.env.WORKER_SECRET_KEY || "super-secret-worker-key-123";

/** POST — registra uso de IA/tokens por chamada. Chamado pelo scraper.py após cada rewrite. */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-worker-secret");
  if (secret !== SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const log = await prisma.aiUsageLog.create({
      data: {
        runId: body.runId ?? null,
        postId: body.postId ?? null,
        operation: body.operation ?? "rewrite_article",
        model: body.model,
        promptTokens: body.promptTokens ?? 0,
        completionTokens: body.completionTokens ?? 0,
        totalTokens: body.totalTokens ?? 0,
        costUsd: body.costUsd ?? 0,
        inputSummary: body.inputSummary ?? null,
        outputSummary: body.outputSummary ?? null,
      },
    });
    return NextResponse.json(log);
  } catch (error) {
    console.error("[api/worker/ai-usage POST]", error);
    return NextResponse.json({ error: "Failed to log AI usage" }, { status: 500 });
  }
}

/** GET — lista logs de uso agrupados (para o histórico). */
export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-worker-secret");
  if (secret !== SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const logs = await prisma.aiUsageLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json(logs);
  } catch (error) {
    console.error("[api/worker/ai-usage GET]", error);
    return NextResponse.json({ error: "Failed to fetch AI usage logs" }, { status: 500 });
  }
}
