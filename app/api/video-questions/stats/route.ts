import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [totalQuestions, readyVideos, totalPosts, platformStats, viewsStats] = await Promise.all([
      prisma.videoQuestion.count(),
      prisma.videoQuestion.count({ where: { status: "DONE" } }),
      prisma.socialPost.count({ where: { status: "POSTED" } }),
      prisma.socialPost.groupBy({
        by: ["platform"],
        where: { status: "POSTED" },
        _count: { _all: true },
      }),
      prisma.socialPost.aggregate({
        where: { status: "POSTED" },
        _sum: { views: true },
      }),
    ]);

    const platforms: Record<string, number> = {};
    platformStats.forEach((stat) => {
      platforms[stat.platform] = stat._count._all;
    });

    return NextResponse.json({
      totalQuestions,
      readyVideos,
      totalPosts,
      views: viewsStats._sum.views || 0,
      platforms,
    });
  } catch (error: any) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
