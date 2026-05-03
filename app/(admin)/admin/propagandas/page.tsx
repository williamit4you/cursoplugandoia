import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import Link from "next/link";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const dynamic = "force-dynamic";

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

export default async function PropagandasPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const page = Math.max(1, parseIntSafe(searchParams?.page, 1));
  const pageSize = Math.min(50, Math.max(10, parseIntSafe(searchParams?.pageSize, 20)));
  const q = parseStr(searchParams?.q).trim();
  const status = parseStr(searchParams?.status, "ALL");
  const hasVideo = parseStr(searchParams?.hasVideo, "ALL");

  const where: any = {
    projectType: "PRODUCT_AD",
  };
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { ideaPrompt: { contains: q, mode: "insensitive" } },
    ];
  }
  if (status !== "ALL") where.status = status;
  if (hasVideo === "true") where.videoUrl = { not: null };
  if (hasVideo === "false") where.videoUrl = null;

  const skip = (page - 1) * pageSize;
  const [total, items] = await Promise.all([
    prisma.codeVideoProject.count({ where }),
    prisma.codeVideoProject.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        status: true,
        title: true,
        description: true,
        aspectRatio: true,
        videoDurationSec: true,
        createdAt: true,
        videoUrl: true,
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const makeHref = (patch: Record<string, string>) => {
    const usp = new URLSearchParams({
      q,
      status,
      hasVideo,
      pageSize: String(pageSize),
      ...patch,
    });
    return `/admin/propagandas?${usp.toString()}`;
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Propagandas</h1>
          <p className="mt-1 text-gray-500">
            Seus vídeos vendedores de produtos em duas etapas: roteiro e render.
          </p>
        </div>
        <Link
          href="/admin/propagandas/new"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white shadow-lg shadow-emerald-100 transition-all hover:-translate-y-0.5 hover:bg-emerald-700"
        >
          Criar propaganda
        </Link>
      </div>

      <form className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm" method="get">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="md:col-span-6">
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">
              Busca
            </label>
            <input
              name="q"
              defaultValue={q}
              placeholder="Produto, descrição ou contexto..."
              className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 font-semibold text-gray-900"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">
              Status
            </label>
            <select
              name="status"
              defaultValue={status}
              className="w-full rounded-xl border-gray-200 bg-gray-50 px-3 py-3 font-semibold text-gray-900"
            >
              <option value="ALL">Todos</option>
              {["DRAFT", "GENERATING", "READY", "RENDERING", "DONE", "FAILED"].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">
              Vídeo
            </label>
            <select
              name="hasVideo"
              defaultValue={hasVideo}
              className="w-full rounded-xl border-gray-200 bg-gray-50 px-3 py-3 font-semibold text-gray-900"
            >
              <option value="ALL">Todos</option>
              <option value="true">Só prontos</option>
              <option value="false">Sem vídeo</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">
              /pág.
            </label>
            <select
              name="pageSize"
              defaultValue={String(pageSize)}
              className="w-full rounded-xl border-gray-200 bg-gray-50 px-3 py-3 font-semibold text-gray-900"
            >
              {[10, 20, 30, 50].map((n) => (
                <option key={n} value={String(n)}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
        <input type="hidden" name="page" value="1" />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-semibold text-gray-500">
            Total: <span className="font-black text-gray-900">{total}</span> · Página{" "}
            <span className="font-black text-gray-900">{page}</span>/{totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-4 py-2 font-black text-white transition-all hover:bg-emerald-700"
            >
              Aplicar filtros
            </button>
            <Link
              href="/admin/propagandas"
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
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left font-black">Criado</th>
                <th className="px-4 py-3 text-left font-black">Status</th>
                <th className="px-4 py-3 text-left font-black">Produto</th>
                <th className="px-4 py-3 text-left font-black">Formato</th>
                <th className="px-4 py-3 text-left font-black">Duração</th>
                <th className="px-4 py-3 text-left font-black">Vídeo</th>
                <th className="px-4 py-3 text-right font-black">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-emerald-50/30">
                  <td className="px-4 py-3 whitespace-nowrap font-semibold text-gray-500">
                    {new Date(item.createdAt).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`rounded-lg px-2 py-1 text-[11px] font-black uppercase tracking-wider ${
                        item.status === "DONE"
                          ? "bg-emerald-100 text-emerald-700"
                          : item.status === "FAILED"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="line-clamp-1 font-extrabold text-gray-900">
                      <Link href={`/admin/propagandas/${item.id}`} className="hover:text-emerald-700">
                        {item.title?.trim() ? item.title : "Propaganda sem título"}
                      </Link>
                    </div>
                    <div className="line-clamp-1 text-xs text-gray-500">{item.description || "Sem descrição"}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-bold text-gray-600">
                    {item.aspectRatio === "LANDSCAPE_16_9" ? "16:9" : "9:16"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-bold text-gray-600">
                    {item.videoDurationSec}s
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {item.videoUrl ? (
                      <a
                        href={item.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 hover:bg-emerald-100"
                      >
                        Abrir
                      </a>
                    ) : (
                      <span className="text-xs font-bold text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/propagandas/${item.id}`}
                      className="inline-flex rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 hover:bg-emerald-100"
                    >
                      Abrir
                    </Link>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center font-bold text-gray-400">
                    Nenhuma propaganda encontrada com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-gray-100 p-4">
          <div className="text-xs font-semibold text-gray-500">
            Página <span className="font-black text-gray-900">{page}</span>/{totalPages}
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
              Próxima →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
