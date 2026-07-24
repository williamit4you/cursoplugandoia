import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import DashboardMetrics from "@/components/DashboardMetrics"
import OperationsOverview from "@/components/OperationsOverview"

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

  let videoStats = { totalQuestions: 0, readyVideos: 0, totalPosts: 0, platforms: {}, views: 0 as number };
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

  const { views: videoViews, ...restVideoStats } = videoStats;
  const stats = {
    posts: postsCount,
    views: (totalViews._sum.views || 0) + (videoViews || 0),
    leads: leadsCount,
    ...restVideoStats
  }

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-indigo-400">Bem-vindo de volta,</p>
          <h1 className="text-4xl font-black text-white tracking-tight">Visao Geral</h1>
        </div>
        
        <div className="flex items-center gap-2 text-slate-400 text-sm font-medium glass px-4 py-2 rounded-xl border-white/5">
           <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
           {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
        </div>
      </header>

      <section>
        <OperationsOverview />
      </section>

      <section>
        <DashboardMetrics stats={stats} />
      </section>
    </div>
  )
}
