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
  if (v === "LANDSCAPE_16_9") return "Landscape (16:9)";
  return "Vertical (9:16)";
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
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Vídeos com código</h1>
          <p className="text-gray-500 mt-1">Crie roteiros dinâmicos e renderize vídeos profissionais com Remotion.</p>
        </div>
        <Link
          href="/admin/video-code/new"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-white font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Novo projeto
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
             <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900">Nenhum vídeo ainda</h3>
          <p className="text-gray-500 mb-6 max-w-xs mx-auto">Comece criando um novo projeto de vídeo a partir de uma ideia ou comando.</p>
          <Link
            href="/admin/video-code/new"
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-6 py-2 text-indigo-700 font-bold hover:bg-indigo-100 transition-all"
          >
            Criar meu primeiro vídeo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/admin/video-code/${p.id}`}
              className="group relative flex flex-col rounded-3xl border border-gray-100 bg-white shadow-sm hover:shadow-xl hover:shadow-indigo-50 hover:border-indigo-100 transition-all overflow-hidden"
            >
              <div className="h-40 bg-gray-100 flex items-center justify-center relative overflow-hidden">
                {/* Background Pattern / Abstract */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,#4f46e5_0,transparent_70%)]"></div>
                <svg className="w-12 h-12 text-gray-300 group-hover:scale-110 group-hover:text-indigo-200 transition-all duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                
                {p.videoUrl && (
                   <div className="absolute top-3 right-3 bg-emerald-500 text-white p-1 rounded-full shadow-lg">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                   </div>
                )}
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                    p.status === 'DONE' ? 'bg-emerald-100 text-emerald-700' : 
                    p.status === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {p.status}
                  </div>
                  <span className="text-[10px] font-bold text-gray-400">
                    {new Date(p.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                
                <h3 className="font-extrabold text-gray-900 line-clamp-1 mb-2 group-hover:text-indigo-600 transition-colors">
                  {p.title?.trim() ? p.title : "Projeto sem título"}
                </h3>
                
                <p className="text-xs text-gray-500 line-clamp-2 mb-4 flex-1 leading-relaxed">
                  {p.ideaPrompt}
                </p>

                <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex gap-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase">{formatAspectRatio(String(p.aspectRatio))}</span>
                    <span className="text-[10px] font-black text-gray-300">•</span>
                    <span className="text-[10px] font-black text-gray-400 uppercase">{p.videoDurationSec}S</span>
                  </div>
                  <div className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in {
          animation: fade-in 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
