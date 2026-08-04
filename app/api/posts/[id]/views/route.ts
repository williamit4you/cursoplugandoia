import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { recordContentMetric } from "@/lib/operationsControl";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function safeBody(req: NextRequest) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await safeBody(req);
    const post = await prisma.post.update({
      where: { id: params.id },
      data: { views: { increment: 1 } },
    });

    recordContentMetric({
      eventType: "article_view",
      postId: post.id,
      sessionId: body?.sessionId || null,
      source: body?.source || null,
      medium: body?.medium || null,
      campaign: body?.campaign || null,
      referrer: req.headers.get("referer"),
      metadata: body?.metadata,
    }).catch(() => null);

    return NextResponse.json({ success: true, views: post.views });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Falha ao computar visualizacao." }, { status: 500 });
  }
}
