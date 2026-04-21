import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

// GET /api/pipeline/status — SSE stream de logs em tempo real
export async function GET(req: NextRequest) {
  let lastId = "";

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const poll = async () => {
        try {
          const where = lastId ? { id: { gt: lastId } } : {};
          const logs = await prisma.pipelineLog.findMany({
            where,
            orderBy: { createdAt: "asc" },
            take: 20,
          });
          if (logs.length > 0) {
            lastId = logs[logs.length - 1].id;
            logs.forEach((l: { id: string; step: string; message: string; level: string; createdAt: Date }) => send(l));
          }
        } catch (e) {
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
      "X-Accel-Buffering": "no", // Para Nginx/proxy não bufferizar
    },
  });
}
