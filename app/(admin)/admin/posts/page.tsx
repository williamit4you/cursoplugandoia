import Link from "next/link";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import PostsTable from "@/components/PostsTable";
import QuickScrapeTestButton from "@/components/QuickScrapeTestButton";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const dynamic = "force-dynamic";

export default async function PostsPage() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      codeVideoProjects: { select: { id: true, newsVariant: true, status: true, videoUrl: true, socialPosts: { select: { id: true, platform: true, status: true, scheduledTo: true } } } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 text-white shadow-sm">
        <h1 className="text-3xl font-black tracking-tight">Central de Resumo de Noticias</h1>
        <p className="mt-1 text-sm font-medium text-slate-300">
          Gerencie as noticias do site com o padrao operacional da fase atual: listagem, lote, detalhe e vinculos de video.
        </p>
        <div className="mt-4">
          <div className="flex flex-wrap items-start gap-3">
            <Link
              href="/admin/operations/NEWS_CONTENT"
              className="inline-flex items-center gap-2 rounded-xl border border-indigo-300/30 bg-indigo-400/10 px-4 py-2 text-xs font-black text-indigo-100"
            >
              Abrir analytics de Noticias
            </Link>
            <Link
              href="/admin/video-engajamento"
              className="inline-flex items-center gap-2 rounded-xl border border-violet-300/30 bg-violet-400/10 px-4 py-2 text-xs font-black text-violet-100"
            >
              Abrir rastreamento de Video Engajamento
            </Link>
            <QuickScrapeTestButton />
          </div>
        </div>
      </div>
      <PostsTable initialData={posts} />
    </div>
  );
}
