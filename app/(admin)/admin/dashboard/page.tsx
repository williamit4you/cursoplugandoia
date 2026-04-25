import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import DashboardMetrics from "@/components/DashboardMetrics"

const connectionString = process.env.DATABASE_URL!
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [postsCount, totalViews, leadsCount] = await Promise.all([
    prisma.post.count(),
    prisma.post.aggregate({ _sum: { views: true } }),
    prisma.lead.count(),
  ]);

  // Fetching Video Question and Social Post stats
  let videoStats = { totalQuestions: 0, readyVideos: 0, totalPosts: 0, platforms: {} };
  try {
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const host = process.env.VERCEL_URL || 'localhost:3000';
    const statsRes = await fetch(`${protocol}://${host}/api/video-questions/stats`, { cache: 'no-store' });
    if (statsRes.ok) {
      videoStats = await statsRes.json();
    }
  } catch (e) {
    console.error("Failed to fetch video stats:", e);
  }

  const stats = {
    posts: postsCount,
    views: (totalViews._sum.views || 0) + (videoStats.views || 0),
    leads: leadsCount,
    ...videoStats
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Visão Geral</h1>
      <DashboardMetrics stats={stats} />
    </div>
  )
}
