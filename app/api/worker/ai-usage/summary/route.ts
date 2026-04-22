import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SECRET = process.env.WORKER_SECRET_KEY || "super-secret-worker-key-123";

/** GET — resumo de custos de IA: hoje, mês atual, total histórico, breakdown por modelo. */
export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-worker-secret");
  if (secret !== SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [allLogs, todayLogs, monthLogs] = await Promise.all([
      prisma.aiUsageLog.findMany({ select: { costUsd: true, totalTokens: true, model: true } }),
      prisma.aiUsageLog.findMany({
        where: { createdAt: { gte: startOfToday } },
        select: { costUsd: true, totalTokens: true },
      }),
      prisma.aiUsageLog.findMany({
        where: { createdAt: { gte: startOfMonth } },
        select: { costUsd: true, totalTokens: true },
      }),
    ]);

    const totalCost = allLogs.reduce((s, l) => s + l.costUsd, 0);
    const todayCost = todayLogs.reduce((s, l) => s + l.costUsd, 0);
    const monthCost = monthLogs.reduce((s, l) => s + l.costUsd, 0);
    const totalTokens = allLogs.reduce((s, l) => s + l.totalTokens, 0);

    // Breakdown por modelo
    const modelMap: Record<string, { calls: number; cost: number; tokens: number }> = {};
    for (const log of allLogs) {
      if (!modelMap[log.model]) modelMap[log.model] = { calls: 0, cost: 0, tokens: 0 };
      modelMap[log.model].calls += 1;
      modelMap[log.model].cost += log.costUsd;
      modelMap[log.model].tokens += log.totalTokens;
    }

    const modelBreakdown = Object.entries(modelMap)
      .map(([model, stats]) => ({ model, ...stats }))
      .sort((a, b) => b.cost - a.cost);

    const totalRuns = await prisma.scraperRun.count();
    const todayRuns = await prisma.scraperRun.count({
      where: { startedAt: { gte: startOfToday } },
    });
    const monthRuns = await prisma.scraperRun.count({
      where: { startedAt: { gte: startOfMonth } },
    });

    return NextResponse.json({
      costs: {
        today: todayCost,
        month: monthCost,
        total: totalCost,
      },
      tokens: {
        total: totalTokens,
      },
      runs: {
        today: todayRuns,
        month: monthRuns,
        total: totalRuns,
      },
      modelBreakdown,
    });
  } catch (error) {
    console.error("[api/worker/ai-usage/summary GET]", error);
    return NextResponse.json({ error: "Failed to fetch summary" }, { status: 500 });
  }
}
