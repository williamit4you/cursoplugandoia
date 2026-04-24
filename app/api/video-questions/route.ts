import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const questions = await prisma.videoQuestion.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        codeVideoProject: { select: { id: true, status: true, title: true, videoUrl: true } },
      },
    });
    return NextResponse.json(questions);
  } catch (error) {
    console.error("[api/video-questions GET]", error);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const questionText = String(body?.questionText ?? "").trim();
    if (!questionText) return NextResponse.json({ error: "questionText is required" }, { status: 400 });

    const q = await prisma.videoQuestion.create({
      data: { questionText },
    });
    return NextResponse.json(q);
  } catch (error) {
    console.error("[api/video-questions POST]", error);
    return NextResponse.json({ error: "Failed to create question" }, { status: 500 });
  }
}

