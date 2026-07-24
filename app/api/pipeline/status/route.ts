import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { prisma as sharedPrisma } from "@/lib/prisma";
import { DEFINITIONS } from "@/lib/operationObservability";
import { requireAdminOrCronSecret } from "@/lib/shopee-pipeline/apiAuth";
import { resolveOperationAlert, upsertOperationAlert } from "@/lib/operationsControl";
import { buildDailyChecklist, listStaleOperations } from "@/lib/operationsChecklist";

export const dynamic = "force-dynamic";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
// GET /api/pipeline/status?since=ISO - SSE stream de logs em tempo real.
// O parametro ?since= filtra logs criados apos aquele timestamp,
// evitando que logs antigos de execucoes anteriores aparecam no monitor.
export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("view") === "operation-runs") {
    try {
      await requireAdminOrCronSecret(req);
      const operationKey = req.nextUrl.searchParams.get("operationKey") || undefined;
      const status = req.nextUrl.searchParams.get("status") || undefined;
      const take = Math.min(200, Math.max(10, Number(req.nextUrl.searchParams.get("take") || 50)));
      const runs = await sharedPrisma.operationRun.findMany({
        where: { ...(operationKey ? { operationKey } : {}), ...(status ? { status } : {}) },
        orderBy: { startedAt: "desc" },
        take,
      });
      return Response.json({ ok: true, runs });
    } catch (error: any) {
      const status = error?.message === "Unauthorized" ? 401 : 500;
      return Response.json({ ok: false, error: error?.message || "Falha ao carregar execucoes" }, { status });
    }
  }

  if (req.nextUrl.searchParams.get("view") === "operations") {
    try {
      await requireAdminOrCronSecret(req);
      const now = new Date();
      const definitions = await sharedPrisma.operationDefinition.findMany({
        orderBy: [{ family: "asc" }, { name: "asc" }],
        include: { runs: { orderBy: { startedAt: "desc" }, take: 1 } },
      });
      const runs = await sharedPrisma.operationRun.findMany({ orderBy: { startedAt: "desc" }, take: 250 });
      const latest = new Map<string, typeof runs[number]>();
      for (const run of runs) if (!latest.has(run.operationKey)) latest.set(run.operationKey, run);
      const staleOperationKeys = listStaleOperations(
        definitions.map((definition) => ({
          key: definition.key,
          expectedEverySec: definition.expectedEverySec,
          runs: definition.runs.slice(0, 1).map((run) => ({ heartbeatAt: run.heartbeatAt })),
        })),
        now,
      );
      const staleOperationSet = new Set(staleOperationKeys);
      const operations = definitions.map((definition) => {
        const run = latest.get(definition.key);
        const stale = staleOperationSet.has(definition.key);
        return {
          key: definition.key,
          name: definition.name,
          family: definition.family,
          description: definition.description,
          status: !definition.enabled ? "DISABLED" : stale ? "STALE" : run?.status === "FAILED" ? "FAILED" : run?.status === "PARTIAL" ? "ATTENTION" : "OK",
          lastRun: run || null,
        };
      });
      const familySummary = Object.values(
        operations.reduce((acc, operation) => {
          const current = acc[operation.family] || {
            family: operation.family,
            total: 0,
            healthy: 0,
            attention: 0,
            failed: 0,
            disabled: 0,
            runningNow: 0,
          };
          current.total += 1;
          if (operation.status === "OK") current.healthy += 1;
          else if (operation.status === "FAILED") current.failed += 1;
          else if (operation.status === "DISABLED") current.disabled += 1;
          else current.attention += 1;
          if (String(operation.lastRun?.status || "") === "RUNNING") current.runningNow += 1;
          acc[operation.family] = current;
          return acc;
        }, {} as Record<string, { family: string; total: number; healthy: number; attention: number; failed: number; disabled: number; runningNow: number }>),
      );
      const [socialDue, socialFuture, socialProcessing, socialFailed, socialPostedToday, oldestSocial, alerts, estimatedCostToday] = await Promise.all([
        sharedPrisma.socialPost.count({ where: { status: "SCHEDULED", scheduledTo: { lte: now } } }),
        sharedPrisma.socialPost.count({ where: { status: "SCHEDULED", scheduledTo: { gt: now } } }),
        sharedPrisma.socialPost.count({ where: { status: { in: ["PROCESSING_MEDIA", "PUBLISHING"] } } }),
        sharedPrisma.socialPost.count({ where: { status: "FAILED" } }),
        sharedPrisma.socialPost.count({ where: { status: "POSTED", postedAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) } } }),
        sharedPrisma.socialPost.findFirst({ where: { status: { in: ["SCHEDULED", "PROCESSING_MEDIA", "PUBLISHING", "FAILED"] } }, orderBy: { createdAt: "asc" }, select: { id: true, platform: true, status: true, createdAt: true, scheduledTo: true } }),
        sharedPrisma.operationAlert.findMany({ where: { status: { in: ["OPEN", "ACKNOWLEDGED"] } }, orderBy: [{ severity: "desc" }, { lastSeenAt: "desc" }], take: 10 }),
        sharedPrisma.costLedger.aggregate({ where: { occurredAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) } }, _sum: { costUsd: true } }),
      ]);
      if (socialDue > 0) await upsertOperationAlert({ fingerprint: "social:overdue", operationKey: "SOCIAL_PUBLISHER", severity: "CRITICAL", title: "Publicacoes sociais vencidas", message: `${socialDue} publicacao(oes) aguardam horario passado. Reagende ou publique agora.`, actionUrl: "/admin/social" });
      else await resolveOperationAlert("social:overdue");
      if (socialFailed > 0) await upsertOperationAlert({ fingerprint: "social:failed", operationKey: "SOCIAL_PUBLISHER", severity: "WARNING", title: "Falhas na fila social", message: `${socialFailed} publicacao(oes) falharam e precisam de nova tentativa ou reautenticacao.`, actionUrl: "/admin/social" });
      else await resolveOperationAlert("social:failed");
      const dailyCostLimitUsd = Math.max(0, Number(process.env.DAILY_COST_LIMIT_USD || 0));
      const currentCostUsd = estimatedCostToday._sum.costUsd || 0;
      if (dailyCostLimitUsd > 0 && currentCostUsd >= dailyCostLimitUsd) await upsertOperationAlert({ fingerprint: "cost:daily-limit", severity: "CRITICAL", title: "Limite diario de custo atingido", message: `Custo estimado de US$ ${currentCostUsd.toFixed(2)} atingiu o limite de US$ ${dailyCostLimitUsd.toFixed(2)}.`, actionUrl: "/admin/dashboard" });
      else await resolveOperationAlert("cost:daily-limit");
      const checklist = buildDailyChecklist({
        alerts,
        overdueSocial: socialDue,
        staleOperations: staleOperationKeys,
        integrations,
        videosWithoutPublication: 0,
        articlesWithoutVisits: 0,
        socialFailed,
      });
      return Response.json({
        ok: true,
        serverTime: now.toISOString(),
        operations,
        catalog: Object.entries(DEFINITIONS).map(([key, value]) => ({ key, ...value })),
        queues: { socialDue, socialFuture, socialProcessing, socialFailed, socialPostedToday, oldestSocial },
        alerts,
        costs: { estimatedCostTodayUsd: currentCostUsd, dailyLimitUsd: dailyCostLimitUsd || null, withinLimit: dailyCostLimitUsd <= 0 || currentCostUsd < dailyCostLimitUsd },
        checklist,
        checklistDetails: {
          overdueSocial: socialDue,
          staleOperations: staleOperationKeys,
          inactiveIntegrations: integrations.filter((item) => !item.isActive).map((item) => item.platform),
        },
        summary: {
          total: operations.length,
          healthy: operations.filter((item) => item.status === "OK").length,
          attention: operations.filter((item) => ["ATTENTION", "STALE"].includes(item.status)).length,
          failed: operations.filter((item) => item.status === "FAILED").length,
          disabled: operations.filter((item) => item.status === "DISABLED").length,
          runningNow: operations.filter((item) => String(item.lastRun?.status || "") === "RUNNING").length,
        },
        familySummary,
      });
    } catch (error: any) {
      const status = error?.message === "Unauthorized" ? 401 : 500;
      return Response.json({ ok: false, error: error?.message || "Falha ao carregar operacoes" }, { status });
    }
  }

  const sinceParam = req.nextUrl.searchParams.get("since");
  const sinceDate = sinceParam ? new Date(sinceParam) : null;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Inicializa lastId com o ID do log mais recente antes do since
      // para que o polling so busque logs novos a partir do clique do botao.
      let lastId = "";
      if (sinceDate) {
        try {
          const latestBefore = await prisma.pipelineLog.findFirst({
            where: { createdAt: { lt: sinceDate } },
            orderBy: { createdAt: "desc" },
          });
          if (latestBefore) lastId = latestBefore.id;
        } catch {}
      }

      const poll = async () => {
        try {
          const where: any = lastId ? { id: { gt: lastId } } : {};
          const logs = await prisma.pipelineLog.findMany({
            where,
            orderBy: { createdAt: "asc" },
            take: 20,
          });
          if (logs.length > 0) {
            lastId = logs[logs.length - 1].id;
            logs.forEach((l: { id: string; step: string; message: string; level: string; createdAt: Date }) => send(l));
          }
        } catch {
          // Silencia erros de DB para nao quebrar o stream.
        }
      };

      // Polling a cada 2s por ate 10 minutos (300 iteracoes).
      for (let i = 0; i < 300; i++) {
        if (req.signal.aborted) break;
        await poll();
        await new Promise((r) => setTimeout(r, 2000));
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
