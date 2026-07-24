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
    <div className="-m-6 p-6 min-h-[calc(100vh-64px)] bg-[#030712] relative overflow-hidden text-slate-50">
      {/* Premium ambient background effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[60%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-purple-500/5 blur-[100px] pointer-events-none mix-blend-screen" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBmaWxsPSJub25lIj48cGF0aCBkPSJNMCA0MGw0MC00MCIvPjxwYXRoIGQ9Ik00MCA0MEwwIDAiLz48L2c+PC9zdmc+')] opacity-50 pointer-events-none" />

      <div className="relative z-10 max-w-[1600px] mx-auto space-y-10 pb-20">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Plugando IA
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-500 tracking-tight">
              Visão Geral
            </h1>
            <p className="text-slate-400 font-medium">Acompanhe o desempenho da sua operação de IA em tempo real.</p>
          </div>
          
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/10 shadow-2xl">
             <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse" />
             <div className="flex flex-col">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</span>
               <span className="text-sm font-bold text-slate-200">
                 {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
               </span>
             </div>
          </div>
        </header>

        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-both">
          <OperationsOverview />
        </section>

        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
          <DashboardMetrics stats={stats} />
        </section>
      </div>
    </div>
  )
}
