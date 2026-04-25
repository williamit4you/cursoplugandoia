import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.max(1, Math.min(100, Number(searchParams.get("limit") || 10)));
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [{ questionText: { contains: search, mode: "insensitive" as any } }],
        }
      : {};

    const [questions, total] = await Promise.all([
      prisma.videoQuestion.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          codeVideoProject: {
            include: {
              socialPosts: {
                select: {
                  platform: true,
                  status: true,
                  postType: true,
                  postedAt: true,
                }
              }
            }
          },
        },
        skip,
        take: limit,
      }),
      prisma.videoQuestion.count({ where }),
    ]);

    return NextResponse.json({
      questions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[api/video-questions GET]", error);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const questionText = String(body?.questionText ?? "").trim();
    const useExternalMedia = Boolean(body?.useExternalMedia ?? false);

    if (!questionText) return NextResponse.json({ error: "questionText is required" }, { status: 400 });

    const q = await prisma.videoQuestion.create({
      data: {
        questionText,
        useExternalMedia,
      },
    });
    return NextResponse.json(q);
  } catch (error) {
    console.error("[api/video-questions POST]", error);
    return NextResponse.json({ error: "Failed to create question" }, { status: 500 });
  }
}

