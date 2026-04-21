import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

// POST /api/pipeline/log — recebe logs do scraper Python
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-worker-secret");
  if (secret !== process.env.WORKER_SECRET_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { step, message, level } = await req.json();
    await prisma.pipelineLog.create({
      data: { step: step || "INFO", message: message || "", level: level || "INFO" },
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// GET /api/pipeline/log — últimos 100 logs para polling
export async function GET() {
  try {
    const logs = await prisma.pipelineLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json(logs.reverse());
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
