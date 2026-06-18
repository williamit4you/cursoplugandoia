import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EventRow = {
  id: string;
  createdAt: Date;
  level: string;
  stepName: string | null;
  message: string;
  metadata: unknown;
};

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  const projectId = String(ctx.params.id || "").trim();
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const exists = await prisma.codeVideoProject.findUnique({
    where: { id: projectId },
    select: { id: true },
  });
  if (!exists) {
    return NextResponse.json({ error: "Code video project not found" }, { status: 404 });
  }

  const sinceParam = req.nextUrl.searchParams.get("since");
  const sinceDate = sinceParam ? new Date(sinceParam) : null;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const seenIds = new Set<string>();
      let lastSeenAt = sinceDate && !Number.isNaN(sinceDate.getTime()) ? sinceDate : new Date(0);

      send({ type: "connected", projectId, at: new Date().toISOString() });

      const poll = async () => {
        const rows = await prisma.codeVideoPipelineEvent.findMany({
          where: {
            projectId,
            createdAt: { gte: lastSeenAt },
          },
          orderBy: { createdAt: "asc" },
          take: 50,
        });

        for (const row of rows as EventRow[]) {
          if (seenIds.has(row.id)) continue;
          seenIds.add(row.id);
          lastSeenAt = row.createdAt > lastSeenAt ? row.createdAt : lastSeenAt;
          send({
            type: "event",
            payload: {
              id: row.id,
              createdAt: row.createdAt,
              level: row.level,
              stepName: row.stepName,
              message: row.message,
              metadata: row.metadata,
            },
          });
        }
      };

      try {
        for (let i = 0; i < 600; i++) {
          if (req.signal.aborted) break;
          await poll();
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      } catch (error: any) {
        send({
          type: "error",
          message: error?.message || "stream_error",
          at: new Date().toISOString(),
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
