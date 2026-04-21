import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

export const dynamic = "force-dynamic";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

// GET /api/pipeline/status?since=ISO — SSE stream de logs em tempo real
// O parâmetro ?since= filtra logs criados APÓS aquele timestamp,
// evitando que logs antigos de execuções anteriores apareçam no monitor.
export async function GET(req: NextRequest) {
  const sinceParam = req.nextUrl.searchParams.get("since");
  const sinceDate = sinceParam ? new Date(sinceParam) : null;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Inicializa lastId com o ID do log mais recente ANTES do since
      // para que o polling só busque logs NOVOS a partir do clique do botão
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
          // Silencia erros de DB para não quebrar o stream
        }
      };

      // Polling a cada 2s por até 10 minutos (300 iterações)
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
