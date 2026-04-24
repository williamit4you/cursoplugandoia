import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import Link from "next/link";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const dynamic = "force-dynamic";

function formatAspectRatio(v: string) {
  if (v === "LANDSCAPE_16_9") return "YouTube (16:9)";
  return "TikTok/Reels (9:16)";
}

export default async function VideoCodeProjectsPage() {
  const projects = await prisma.codeVideoProject.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      title: true,
      ideaPrompt: true,
      aspectRatio: true,
      videoDurationSec: true,
      createdAt: true,
      videoUrl: true,
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Vídeos com código</h1>
          <p className="text-sm text-gray-600">Crie um roteiro + cenas (templates) e depois renderize com Remotion.</p>
        </div>
        <Link
          href="/admin/video-code/new"
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-white font-semibold hover:bg-indigo-700"
        >
          + Novo vídeo
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-lg border bg-white p-6 text-gray-700">
          Nenhum projeto ainda. Clique em <b>Novo vídeo</b>.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/admin/video-code/${p.id}`}
              className="rounded-lg border bg-white p-4 hover:border-indigo-300"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-bold text-gray-900 truncate">
                    {p.title?.trim() ? p.title : p.ideaPrompt.slice(0, 80)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1 line-clamp-2">{p.ideaPrompt}</div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-gray-100 px-2 py-1 font-semibold text-gray-700">
                      {formatAspectRatio(String(p.aspectRatio))}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-1 font-semibold text-gray-700">
                      {p.videoDurationSec}s
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-1 font-semibold text-gray-700">
                      {p.status}
                    </span>
                    {p.videoUrl ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 font-semibold text-emerald-800">MP4 pronto</span>
                    ) : null}
                  </div>
                </div>
                <div className="text-xs text-gray-500 whitespace-nowrap">
                  {new Date(p.createdAt).toLocaleString("pt-BR")}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

