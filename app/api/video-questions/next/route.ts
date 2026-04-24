import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const SECRET = process.env.WORKER_SECRET_KEY || "super-secret-worker-key-123";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-worker-secret");
  if (secret !== SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cfg = await prisma.videoQuestionConfig.findFirst();
    if (!cfg || !cfg.isEnabled) {
      return NextResponse.json({ config: cfg, question: null });
    }

    // Try a few times to atomically claim one pending question.
    for (let i = 0; i < 5; i++) {
      const candidate = await prisma.videoQuestion.findFirst({
        where: { status: "PENDING" },
        orderBy: { createdAt: "asc" },
      });

      if (!candidate) return NextResponse.json({ config: cfg, question: null });

      try {
        const updated = await prisma.videoQuestion.update({
          where: { id: candidate.id },
          data: { status: "PROCESSING", startedAt: new Date(), errorMessage: null },
        });

        return NextResponse.json({ config: cfg, question: updated });
      } catch {
        // someone else claimed it
      }
    }

    return NextResponse.json({ config: cfg, question: null });
  } catch (error) {
    console.error("[api/video-questions/next GET]", error);
    return NextResponse.json({ error: "Failed to claim next question" }, { status: 500 });
  }
}

