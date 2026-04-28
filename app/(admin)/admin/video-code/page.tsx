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

function parseIntSafe(v: string | string[] | undefined, fallback: number) {
  const s = Array.isArray(v) ? v[0] : v;
  if (!s) return fallback;
  const n = Number.parseInt(String(s), 10);
  return Number.isFinite(n) ? n : fallback;
}

function parseStr(v: string | string[] | undefined, fallback = "") {
  const s = Array.isArray(v) ? v[0] : v;
  return (s ?? fallback).toString();
}

function normalizeSortBy(v: string) {
  const allowed = new Set(["createdAt", "status", "videoDurationSec"]);
  return allowed.has(v) ? v : "createdAt";
}

function normalizeSortDir(v: string) {
  return v === "asc" ? "asc" : "desc";
}

export default async function VideoCodeProjectsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const page = Math.max(1, parseIntSafe(searchParams?.page, 1));
  const pageSize = Math.min(100, Math.max(10, parseIntSafe(searchParams?.pageSize, 20)));

  const q = parseStr(searchParams?.q).trim();
  const status = parseStr(searchParams?.status, "ALL");
  const aspectRatio = parseStr(searchParams?.aspectRatio, "ALL");
  const hasVideo = parseStr(searchParams?.hasVideo, "ALL"); // ALL | true | false

  const sortBy = normalizeSortBy(parseStr(searchParams?.sortBy, "createdAt"));
  const sortDir = normalizeSortDir(parseStr(searchParams?.sortDir, "desc"));

  const where: any = {};
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { ideaPrompt: { contains: q, mode: "insensitive" } },
    ];
  }
  if (status !== "ALL") where.status = status;
  if (aspectRatio !== "ALL") where.aspectRatio = aspectRatio;
  if (hasVideo === "true") where.videoUrl = { not: null };
  if (hasVideo === "false") where.videoUrl = null;

  const skip = (page - 1) * pageSize;

  const [total, projects] = await Promise.all([
    prisma.codeVideoProject.count({ where }),
    prisma.codeVideoProject.findMany({
      where,
      orderBy: [{ [sortBy]: sortDir } as any, { createdAt: "desc" }],
      skip,
      take: pageSize,
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
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const qsBase = {
    q,
    status,
    aspectRatio,
    hasVideo,
    pageSize: String(pageSize),
    sortBy,
    sortDir,
  };

  const makeHref = (patch: Record<string, string>) => {
    const usp = new URLSearchParams({ ...qsBase, ...patch });
    return `/admin/video-code?${usp.toString()}`;
  };

  const makeSortHref = (field: string) => {
    const nextDir = sortBy === field && sortDir === "desc" ? "asc" : "desc";
    return makeHref({ sortBy: field, sortDir: nextDir, page: "1" });
  };

  const sortIcon = (field: string) => {
    if (sortBy !== field) return "↕";
    return sortDir === "asc" ? "↑" : "↓";
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Vídeos com código
          </h1>
          <p className="text-gray-500 mt-1">
            Tabela com filtros, paginação e ordenação.
          </p>
        </div>
        <Link
          href="/admin/video-code/new"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-white font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Novo projeto
        </Link>
      </div>

      <form className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm mb-4" method="get">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5">
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">
              Busca
            </label>
            <input
              name="q"
              defaultValue={q}
              placeholder="Título ou prompt…"
              className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 transition-all font-semibold"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">
              Status
            </label>
            <select
              name="status"
              defaultValue={status}
              className="w-full rounded-xl border-gray-200 bg-gray-50 px-3 py-3 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 transition-all font-semibold"
            >
              <option value="ALL">Todos</option>
              {["DRAFT", "GENERATING", "READY", "RENDERING", "DONE", "FAILED"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">
              Formato
            </label>
            <select
              name="aspectRatio"
              defaultValue={aspectRatio}
              className="w-full rounded-xl border-gray-200 bg-gray-50 px-3 py-3 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 transition-all font-semibold"
            >
              <option value="ALL">Todos</option>
              <option value="PORTRAIT_9_16">Vertical</option>
              <option value="LANDSCAPE_16_9">Landscape</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">
              Vídeo
            </label>
            <select
              name="hasVideo"
              defaultValue={hasVideo}
              className="w-full rounded-xl border-gray-200 bg-gray-50 px-3 py-3 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 transition-all font-semibold"
            >
              <option value="ALL">Todos</option>
              <option value="true">Só prontos</option>
              <option value="false">Sem vídeo</option>
            </select>
          </div>

          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">
              /pág.
            </label>
            <select
              name="pageSize"
              defaultValue={String(pageSize)}
              className="w-full rounded-xl border-gray-200 bg-gray-50 px-3 py-3 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 transition-all font-semibold"
            >
              {[10, 20, 30, 50, 100].map((n) => (
                <option key={n} value={String(n)}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        <input type="hidden" name="sortBy" value={sortBy} />
        <input type="hidden" name="sortDir" value={sortDir} />
        <input type="hidden" name="page" value="1" />

        <div className="flex items-center justify-between mt-4 gap-3 flex-wrap">
          <div className="text-xs text-gray-500 font-semibold">
            Total: <span className="text-gray-900 font-black">{total}</span> · Página{" "}
            <span className="text-gray-900 font-black">{page}</span>/{totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-white font-black shadow hover:bg-indigo-700 transition-all"
            >
              Aplicar filtros
            </button>
            <Link
              href="/admin/video-code"
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-700 font-black hover:bg-gray-50 transition-all"
            >
              Limpar
            </Link>
          </div>
        </div>
      </form>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3 text-left font-black">
                  <Link href={makeSortHref("createdAt")} className="hover:text-indigo-700">
                    Criado {sortIcon("createdAt")}
                  </Link>
                </th>
                <th className="px-4 py-3 text-left font-black">
                  <Link href={makeSortHref("status")} className="hover:text-indigo-700">
                    Status {sortIcon("status")}
                  </Link>
                </th>
                <th className="px-4 py-3 text-left font-black">Título</th>
                <th className="px-4 py-3 text-left font-black">Formato</th>
                <th className="px-4 py-3 text-left font-black">
                  <Link href={makeSortHref("videoDurationSec")} className="hover:text-indigo-700">
                    Duração {sortIcon("videoDurationSec")}
                  </Link>
                </th>
                <th className="px-4 py-3 text-left font-black">Vídeo</th>
                <th className="px-4 py-3 text-right font-black">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {projects.map((p) => (
                <tr key={p.id} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500 font-semibold">
                    {new Date(p.createdAt).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider ${
                        p.status === "DONE"
                          ? "bg-emerald-100 text-emerald-700"
                          : p.status === "FAILED"
                            ? "bg-red-100 text-red-700"
                            : "bg-indigo-100 text-indigo-700"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-extrabold text-gray-900 line-clamp-1">
                      <Link href={`/admin/video-code/${p.id}`} className="hover:text-indigo-700">
                        {p.title?.trim() ? p.title : "Projeto sem título"}
                      </Link>
                    </div>
                    <div className="text-xs text-gray-500 line-clamp-1">{p.ideaPrompt}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600 font-bold">
                    {formatAspectRatio(String(p.aspectRatio))}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600 font-bold">
                    {p.videoDurationSec}s
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {p.videoUrl ? (
                      <a
                        href={p.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-xs font-black hover:bg-emerald-100"
                      >
                        ✓ Abrir
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400 font-bold">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <Link
                      href={`/admin/video-code/${p.id}`}
                      className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1 text-indigo-700 text-xs font-black hover:bg-indigo-100"
                    >
                      Abrir
                    </Link>
                  </td>
                </tr>
              ))}

              {projects.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400 font-bold">
                    Nenhum resultado com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-white">
          <div className="text-xs text-gray-500 font-semibold">
            Página <span className="text-gray-900 font-black">{page}</span>/{totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={makeHref({ page: String(Math.max(1, page - 1)) })}
              aria-disabled={page <= 1}
              className={`rounded-xl px-4 py-2 text-sm font-black border transition-all ${
                page <= 1
                  ? "bg-gray-50 text-gray-300 border-gray-200 pointer-events-none"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              ← Anterior
            </Link>
            <Link
              href={makeHref({ page: String(Math.min(totalPages, page + 1)) })}
              aria-disabled={page >= totalPages}
              className={`rounded-xl px-4 py-2 text-sm font-black border transition-all ${
                page >= totalPages
                  ? "bg-gray-50 text-gray-300 border-gray-200 pointer-events-none"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              Próxima →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

