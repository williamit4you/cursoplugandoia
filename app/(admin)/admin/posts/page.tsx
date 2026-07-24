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
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Posts & Noticias</h1>
        <p className="text-slate-500 text-sm font-medium mt-1">
          Gerencie artigos e publicacoes do site. As noticias automatizadas ja ficam visiveis assim que sao criadas.
        </p>
        <div className="mt-4">
          <div className="flex flex-wrap items-start gap-3">
            <Link
              href="/admin/video-engajamento"
              className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-black text-violet-700"
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
