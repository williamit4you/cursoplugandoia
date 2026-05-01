import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

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
