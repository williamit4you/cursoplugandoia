import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import Link from "next/link";
import PipelineVideoCodeView from "@/components/PipelineVideoCodeView";

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

function deriveProjectUsage(project: {
  postId?: string | null;
  socialPosts?: Array<{ status?: string | null }>;
}) {
  const linked = Boolean(project.postId);
  const socialPosts = Array.isArray(project.socialPosts) ? project.socialPosts : [];
  const posted = socialPosts.some((item) => item.status === "POSTED");
  const queued = socialPosts.some((item) => item.status && item.status !== "FAILED" && item.status !== "POSTED");

  if (posted) return { key: "PUBLISHED", label: "Publicado", tone: "bg-emerald-100 text-emerald-700" };
  if (linked && queued) return { key: "IN_USE", label: "Em uso", tone: "bg-blue-100 text-blue-700" };
  if (linked) return { key: "LINKED", label: "Vinculado", tone: "bg-amber-100 text-amber-700" };
  return { key: "ORPHAN", label: "Sem vinculo", tone: "bg-slate-100 text-slate-700" };
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
  const hasVideo = parseStr(searchParams?.hasVideo, "ALL");
  const usage = parseStr(searchParams?.usage, "ALL");

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
  if (usage === "LINKED") where.postId = { not: null };
  if (usage === "ORPHAN") where.postId = null;
  if (usage === "IN_USE") {
    where.AND = [
      ...(where.AND || []),
      { postId: { not: null } },
      { socialPosts: { some: { status: { notIn: ["FAILED", "POSTED"] } } } },
    ];
  }
  if (usage === "PUBLISHED") {
    where.socialPosts = { some: { status: "POSTED" } };
  }

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
        postId: true,
        newsVariant: true,
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
          },
        },
        socialPosts: {
          select: {
            id: true,
            platform: true,
            status: true,
            scheduledTo: true,
            postedAt: true,
            postUrl: true,
            youtubePostUrl: true,
          },
          orderBy: [{ postedAt: "desc" }, { scheduledTo: "desc" }, { createdAt: "desc" }],
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const qsBase = {
    q,
    status,
    aspectRatio,
    hasVideo,
    usage,
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
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Videos de Noticias</h1>
          <p className="mt-1 text-gray-500">
            Veja quais projetos estao vinculados a artigos, publicados ou sem uso no fluxo de noticias.
          </p>
        </div>
        <Link
          href="/admin/video-code/new"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white shadow-lg shadow-indigo-100 transition-all hover:-translate-y-0.5 hover:bg-indigo-700 active:translate-y-0"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Novo projeto
        </Link>
      </div>

      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
        <div className="shrink-0 rounded-xl border border-indigo-100 bg-indigo-50 p-2 text-indigo-600">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-indigo-900">Leitura rapida da situacao</h4>
          <p className="text-xs leading-relaxed text-slate-600">
            <strong>Publicado</strong> significa que o projeto ja gerou ao menos uma publicacao social.{" "}
            <strong>Em uso</strong> indica fila social criada, mas ainda nao publicada.{" "}
            <strong>Vinculado</strong> indica projeto preso a um artigo, porem sem fila criada.{" "}
            <strong>Sem vinculo</strong> mostra projetos que nao apontam para nenhum post.
          </p>
        </div>
      </div>

      <div className="mb-6">
        <PipelineVideoCodeView initialData={projects} />
      </div>

      <form className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm" method="get">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="md:col-span-4">
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Busca</label>
            <input
              name="q"
              defaultValue={q}
              placeholder="Titulo ou prompt..."
              className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 font-semibold text-gray-900 transition-all focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Status</label>
            <select
              name="status"
              defaultValue={status}
              className="w-full rounded-xl border-gray-200 bg-gray-50 px-3 py-3 font-semibold text-gray-900 transition-all focus:border-indigo-500 focus:ring-indigo-500"
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
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Formato</label>
            <select
              name="aspectRatio"
              defaultValue={aspectRatio}
              className="w-full rounded-xl border-gray-200 bg-gray-50 px-3 py-3 font-semibold text-gray-900 transition-all focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="ALL">Todos</option>
              <option value="PORTRAIT_9_16">Vertical</option>
              <option value="LANDSCAPE_16_9">Landscape</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Video</label>
            <select
              name="hasVideo"
              defaultValue={hasVideo}
              className="w-full rounded-xl border-gray-200 bg-gray-50 px-3 py-3 font-semibold text-gray-900 transition-all focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="ALL">Todos</option>
              <option value="true">So prontos</option>
              <option value="false">Sem video</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Situacao</label>
            <select
              name="usage"
              defaultValue={usage}
              className="w-full rounded-xl border-gray-200 bg-gray-50 px-3 py-3 font-semibold text-gray-900 transition-all focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="ALL">Todos</option>
              <option value="PUBLISHED">Publicado</option>
              <option value="IN_USE">Em uso</option>
              <option value="LINKED">Vinculado a artigo</option>
              <option value="ORPHAN">Sem vinculo</option>
            </select>
          </div>

          <div className="md:col-span-12 lg:col-span-1">
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">/pag.</label>
            <select
              name="pageSize"
              defaultValue={String(pageSize)}
              className="w-full rounded-xl border-gray-200 bg-gray-50 px-3 py-3 font-semibold text-gray-900 transition-all focus:border-indigo-500 focus:ring-indigo-500"
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

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-semibold text-gray-500">
            Total: <span className="font-black text-gray-900">{total}</span> · Pagina{" "}
            <span className="font-black text-gray-900">{page}</span>/{totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-4 py-2 font-black text-white shadow transition-all hover:bg-indigo-700"
            >
              Aplicar filtros
            </button>
            <Link
              href="/admin/video-code"
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 font-black text-gray-700 transition-all hover:bg-gray-50"
            >
              Limpar
            </Link>
          </div>
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-xs uppercase tracking-wider text-gray-500">
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
                <th className="px-4 py-3 text-left font-black">Titulo</th>
                <th className="px-4 py-3 text-left font-black">Vinculo</th>
                <th className="px-4 py-3 text-left font-black">Formato</th>
                <th className="px-4 py-3 text-left font-black">
                  <Link href={makeSortHref("videoDurationSec")} className="hover:text-indigo-700">
                    Duracao {sortIcon("videoDurationSec")}
                  </Link>
                </th>
                <th className="px-4 py-3 text-left font-black">Video</th>
                <th className="px-4 py-3 text-right font-black">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {projects.map((p) => {
                const usageState = deriveProjectUsage(p);
                const postedCount = p.socialPosts.filter((item) => item.status === "POSTED").length;
                const queuedCount = p.socialPosts.filter(
                  (item) => item.status && item.status !== "FAILED" && item.status !== "POSTED",
                ).length;
                const publicLink =
                  p.socialPosts.find((item) => item.youtubePostUrl || item.postUrl)?.youtubePostUrl ||
                  p.socialPosts.find((item) => item.youtubePostUrl || item.postUrl)?.postUrl ||
                  null;

                return (
                  <tr key={p.id} className="transition-colors hover:bg-indigo-50/30">
                    <td className="whitespace-nowrap px-4 py-3 align-top font-semibold text-gray-500">
                      {new Date(p.createdAt).toLocaleString("pt-BR")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 align-top">
                      <span
                        className={`rounded-lg px-2 py-1 text-[11px] font-black uppercase tracking-wider ${
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
                    <td className="px-4 py-3 align-top">
                      <div className="line-clamp-1 font-extrabold text-gray-900">
                        <Link href={`/admin/video-code/${p.id}`} className="hover:text-indigo-700">
                          {p.title?.trim() ? p.title : "Projeto sem titulo"}
                        </Link>
                      </div>
                      <div className="line-clamp-1 text-xs text-gray-500">{p.ideaPrompt}</div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {p.newsVariant ? (
                          <span className="rounded-lg bg-violet-50 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-violet-700">
                            {p.newsVariant}
                          </span>
                        ) : null}
                        <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-700">
                          {p.id.slice(0, 8)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-wrap gap-1">
                        <span className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider ${usageState.tone}`}>
                          {usageState.label}
                        </span>
                      </div>
                      {p.post ? (
                        <div className="mt-2 space-y-1">
                          <Link href={`/admin/posts/${p.post.id}`} className="block text-xs font-black text-indigo-700 hover:text-indigo-800">
                            {p.post.title}
                          </Link>
                          <div className="text-[11px] text-gray-500">/noticias/{p.post.slug}</div>
                        </div>
                      ) : (
                        <div className="mt-2 text-xs font-semibold text-gray-400">Projeto sem post associado.</div>
                      )}
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className="rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700">
                          {postedCount} publicado(s)
                        </span>
                        <span className="rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-700">
                          {queuedCount} em fila
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 align-top font-bold text-gray-600">
                      {formatAspectRatio(String(p.aspectRatio))}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 align-top font-bold text-gray-600">
                      {p.videoDurationSec}s
                    </td>
                    <td className="px-4 py-3 align-top">
                      {p.videoUrl ? (
                        <div className="flex flex-col items-start gap-2">
                          <a
                            href={p.videoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 hover:bg-emerald-100"
                          >
                            ✓ Abrir video
                          </a>
                          {publicLink ? (
                            <a
                              href={publicLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-black text-rose-700 hover:bg-rose-100"
                            >
                              Ver publicacao
                            </a>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-gray-400">-</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right align-top">
                      <Link
                        href={`/admin/video-code/${p.id}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700 hover:bg-indigo-100"
                      >
                        Abrir
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {projects.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center font-bold text-gray-400">
                    Nenhum resultado com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 bg-white p-4">
          <div className="text-xs font-semibold text-gray-500">
            Pagina <span className="font-black text-gray-900">{page}</span>/{totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={makeHref({ page: String(Math.max(1, page - 1)) })}
              aria-disabled={page <= 1}
              className={`rounded-xl border px-4 py-2 text-sm font-black transition-all ${
                page <= 1
                  ? "pointer-events-none border-gray-200 bg-gray-50 text-gray-300"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              ← Anterior
            </Link>
            <Link
              href={makeHref({ page: String(Math.min(totalPages, page + 1)) })}
              aria-disabled={page >= totalPages}
              className={`rounded-xl border px-4 py-2 text-sm font-black transition-all ${
                page >= totalPages
                  ? "pointer-events-none border-gray-200 bg-gray-50 text-gray-300"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Proxima →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
