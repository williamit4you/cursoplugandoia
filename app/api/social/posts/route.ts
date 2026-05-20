import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { requireAdminOrCronSecret } from "@/lib/shopee-pipeline/apiAuth";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const dynamic = "force-dynamic";

function parseIntSafe(v: string | null, fallback: number) {
  if (!v) return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeSortBy(v: string | null) {
  const allowed = new Set([
    "createdAt",
    "updatedAt",
    "postedAt",
    "scheduledTo",
    "views",
    "status",
    "platform",
    "postType",
  ]);
  if (!v) return "createdAt";
  return allowed.has(v) ? v : "createdAt";
}

function normalizeSortDir(v: string | null) {
  return v === "asc" ? "asc" : "desc";
}

// Retorna posts (ou um único post por ?id=xxx)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const post = await prisma.socialPost.findUnique({ where: { id } });
      return NextResponse.json(post || { error: "Not found" });
    }

    const page = Math.max(1, parseIntSafe(searchParams.get("page"), 1));
    const pageSize = Math.min(
      500,
      Math.max(5, parseIntSafe(searchParams.get("pageSize"), 20))
    );

    const sortBy = normalizeSortBy(searchParams.get("sortBy"));
    const sortDir = normalizeSortDir(searchParams.get("sortDir"));

    const status = searchParams.get("status") || undefined;
    const platform = searchParams.get("platform") || undefined;
    const postType = searchParams.get("postType") || undefined;
    const q = (searchParams.get("q") || "").trim();

    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (platform && platform !== "ALL") where.platform = platform;
    if (postType && postType !== "ALL") where.postType = postType;
    if (q) {
      where.OR = [
        { summary: { contains: q, mode: "insensitive" } },
        { postUrl: { contains: q, mode: "insensitive" } },
        { videoUrl: { contains: q, mode: "insensitive" } },
        { log: { contains: q, mode: "insensitive" } },
        { id: { equals: q } },
      ];
    }

    const skip = (page - 1) * pageSize;

    const [total, items] = await Promise.all([
      prisma.socialPost.count({ where }),
      prisma.socialPost.findMany({
        where,
        orderBy: [{ [sortBy]: sortDir } as any, { createdAt: "desc" }],
        skip,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({ items, total, page, pageSize, sortBy, sortDir });
  } catch (error) {
    console.error("[api/social/posts GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminOrCronSecret(req);
    const body = await req.json().catch(() => ({}));

    const platform = String(body.platform || "META").trim().toUpperCase();
    const postType = String(body.postType || "REEL").trim().toUpperCase();
    const summary = String(body.summary || "").trim();
    const videoUrl = String(body.videoUrl || "").trim();
    const status = String(body.status || "SCHEDULED").trim().toUpperCase();
    const scheduledTo = body.scheduledTo ? new Date(String(body.scheduledTo)) : null;

    if (!videoUrl) return NextResponse.json({ error: "videoUrl is required" }, { status: 400 });
    if (!summary) return NextResponse.json({ error: "summary is required" }, { status: 400 });

    const created = await prisma.socialPost.create({
      data: {
        platform,
        postType,
        summary,
        videoUrl,
        status,
        scheduledTo,
      },
    });

    return NextResponse.json(created);
  } catch (error: any) {
    const status = error?.message === "Unauthorized" ? 401 : 500;
    console.error("[api/social/posts POST]", error);
    return NextResponse.json({ error: error?.message || "Failed to create social post" }, { status });
  }
}
