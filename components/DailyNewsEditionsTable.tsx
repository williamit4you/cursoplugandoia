"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type EditionRow = {
  id: string;
  editionDate: string | Date;
  timezone: string;
  status: string;
  title?: string | null;
  description?: string | null;
  targetDurationSec: number;
  measuredDurationSec?: number | null;
  scriptApprovedAt?: string | Date | null;
  finalApprovedAt?: string | Date | null;
  youtubePostUrl?: string | null;
  errorMessage?: string | null;
  items: Array<{
    id: string;
    postId: string;
    position: number;
    titleSnapshot: string;
    category?: string | null;
  }>;
  assets: Array<{
    id: string;
    status: string;
    assetType: string;
  }>;
  codeVideoProject?: {
    id: string;
    status: string;
    videoUrl?: string | null;
    thumbUrl?: string | null;
    renderProgress?: number | null;
  } | null;
};

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function formatDate(value: string | Date | null | undefined, withTime = false) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("pt-BR", withTime ? undefined : { day: "2-digit", month: "2-digit", year: "numeric" });
}

function durationLabel(seconds: number | null | undefined) {
  if (!seconds || !Number.isFinite(seconds)) return "-";
  const total = Math.max(0, Math.round(seconds));
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return `${min}m ${String(sec).padStart(2, "0")}s`;
}

function statusTone(status: string) {
  const normalized = String(status || "").toUpperCase();
  if (["PUBLISHED", "APPROVED"].includes(normalized)) {
    return "border-emerald-200/60 bg-emerald-50 text-emerald-700";
  }
  if (["FAILED", "REJECTED", "CANCELED"].includes(normalized)) {
    return "border-rose-200/60 bg-rose-50 text-rose-700";
  }
  if (["RENDERING", "GENERATING_AUDIO", "PLANNING_VISUALS", "SCRIPTING", "CURATING"].includes(normalized)) {
    return "border-amber-200/60 bg-amber-50 text-amber-700";
  }
  return "border-slate-200/60 bg-slate-100 text-slate-600";
}

export default function DailyNewsEditionsTable({
  initialData,
}: {
  initialData: EditionRow[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<EditionRow[]>(initialData);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [approvalFilter, setApprovalFilter] = useState("ALL");
  const [publishedFilter, setPublishedFilter] = useState("ALL");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [creatingToday, setCreatingToday] = useState(false);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    return items.filter((item) => {
      const matchesSearch =
        !query ||
        item.id.toLocaleLowerCase("pt-BR").includes(query) ||
        String(item.title || "").toLocaleLowerCase("pt-BR").includes(query) ||
        String(item.description || "").toLocaleLowerCase("pt-BR").includes(query) ||
        formatDate(item.editionDate).toLocaleLowerCase("pt-BR").includes(query);
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      const matchesApproval =
        approvalFilter === "ALL" ||
        (approvalFilter === "SCRIPT_APPROVED" && Boolean(item.scriptApprovedAt)) ||
        (approvalFilter === "FINAL_APPROVED" && Boolean(item.finalApprovedAt)) ||
        (approvalFilter === "PENDING" && !item.scriptApprovedAt && !item.finalApprovedAt);
      const matchesPublished =
        publishedFilter === "ALL" ||
        (publishedFilter === "PUBLISHED" && Boolean(item.youtubePostUrl)) ||
        (publishedFilter === "UNPUBLISHED" && !item.youtubePostUrl);
      return matchesSearch && matchesStatus && matchesApproval && matchesPublished;
    });
  }, [approvalFilter, items, publishedFilter, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [currentPage, filteredItems, pageSize]);

  const allVisibleSelected =
    visibleItems.length > 0 &&
    visibleItems.every((item) => selectedIds.includes(item.id));

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.includes(item.id)),
    [items, selectedIds],
  );

  const createTodayEdition = async () => {
    setCreatingToday(true);
    try {
      const today = new Date();
      const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      const res = await fetch("/api/resumo-noticias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editionDate: date }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Falha ao criar a edicao.");
      if (data?.item) {
        setItems((current) => [data.item, ...current]);
        toast.success("Edicao de hoje criada.");
        router.push(`/admin/resumo-noticias/${data.item.id}`);
      }
    } catch (error: any) {
      toast.error(error?.message || "Erro ao criar a edicao.");
    } finally {
      setCreatingToday(false);
    }
  };

  const exportSelected = () => {
    const csv = [
      ["id", "data", "status", "titulo", "noticias", "assets", "youtube"].join(","),
      ...selectedItems.map((item) =>
        [
          item.id,
          JSON.stringify(formatDate(item.editionDate)),
          item.status,
          JSON.stringify(item.title || ""),
          item.items.length,
          item.assets.length,
          JSON.stringify(item.youtubePostUrl || ""),
        ].join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "resumo-noticias-selecao.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const copySelectedIds = async () => {
    await navigator.clipboard.writeText(selectedItems.map((item) => item.id).join("\n"));
    toast.success("IDs copiados.");
  };

  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      const visibleIds = new Set(visibleItems.map((item) => item.id));
      setSelectedIds((current) => current.filter((id) => !visibleIds.has(id)));
      return;
    }
    setSelectedIds((current) =>
      Array.from(new Set([...current, ...visibleItems.map((item) => item.id)])),
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <ToastContainer theme="colored" />

      <div className="rounded-[28px] border border-slate-200/60 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-800">
              Edicoes do resumo
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Listagem dedicada do `DailyNewsEdition` com filtros, selecao multipla e abertura da tela operacional.
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => void createTodayEdition()}
              disabled={creatingToday}
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creatingToday ? "CRIANDO..." : "GERAR EDICAO AUTOMATICA DE HOJE"}
            </button>
          </div>
        </div>

        <div className="grid gap-3 border-b border-slate-200 px-6 py-4 md:grid-cols-2 xl:grid-cols-5">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar titulo, data, status ou ID..."
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-400"
          />
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-900"
          >
            <option value="ALL">Todos os status</option>
            {Array.from(new Set(items.map((item) => item.status))).sort().map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <select
            value={approvalFilter}
            onChange={(event) => {
              setApprovalFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-900"
          >
            <option value="ALL">Todas as aprovacoes</option>
            <option value="PENDING">Sem aprovacao</option>
            <option value="SCRIPT_APPROVED">Roteiro aprovado</option>
            <option value="FINAL_APPROVED">Aprovacao final</option>
          </select>
          <select
            value={publishedFilter}
            onChange={(event) => {
              setPublishedFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-900"
          >
            <option value="ALL">Todas as publicacoes</option>
            <option value="PUBLISHED">Com URL do YouTube</option>
            <option value="UNPUBLISHED">Sem URL do YouTube</option>
          </select>
          <div className="flex items-center justify-end gap-2 text-sm font-semibold text-slate-600">
            <span>Exibir</span>
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-900"
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedIds.length ? (
          <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm font-bold text-slate-700">
              {selectedIds.length} edicao(oes) selecionada(s)
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void copySelectedIds()}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700"
              >
                Copiar IDs
              </button>
              <button
                type="button"
                onClick={exportSelected}
                className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-black text-indigo-700"
              >
                Exportar CSV
              </button>
            </div>
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1240px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="w-12 px-6 py-4">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAllVisible}
                    aria-label="Selecionar edicoes visiveis"
                  />
                </th>
                <th className="px-6 py-4">Edicao</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Aprovacoes</th>
                <th className="px-6 py-4 text-center">Noticias</th>
                <th className="px-6 py-4 text-center">Assets</th>
                <th className="px-6 py-4 text-center">Video</th>
                <th className="px-6 py-4 text-center">YouTube</th>
                <th className="px-6 py-4 text-right">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {!visibleItems.length ? (
                <tr>
                  <td colSpan={9} className="px-6 py-14 text-center text-slate-400">
                    Nenhuma edicao encontrada.
                  </td>
                </tr>
              ) : null}
              {visibleItems.map((item) => (
                <tr key={item.id} className="group transition-colors hover:bg-slate-50/30">
                  <td className="px-6 py-4 align-top">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() =>
                        setSelectedIds((current) =>
                          current.includes(item.id)
                            ? current.filter((id) => id !== item.id)
                            : [...current, item.id],
                        )
                      }
                      aria-label={`Selecionar ${item.title || item.id}`}
                    />
                  </td>
                  <td className="max-w-md px-6 py-4 align-top">
                    <div className="truncate font-bold text-slate-700 transition-colors group-hover:text-indigo-600">
                      {item.title || "Edicao sem titulo"}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {formatDate(item.editionDate)} • {item.timezone}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Alvo {durationLabel(item.targetDurationSec)} • Real {durationLabel(item.measuredDurationSec)}
                    </div>
                    {item.errorMessage ? (
                      <div className="mt-2 line-clamp-2 text-xs font-semibold text-rose-600">
                        {item.errorMessage}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-6 py-4 text-center align-top">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-tight ${statusTone(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center align-top text-xs text-slate-500">
                    <div>Roteiro: {item.scriptApprovedAt ? "OK" : "-"}</div>
                    <div>Final: {item.finalApprovedAt ? "OK" : "-"}</div>
                  </td>
                  <td className="px-6 py-4 text-center align-top">
                    <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[10px] font-black text-indigo-700">
                      {item.items.length} noticia(s)
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center align-top">
                    <span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-[10px] font-black text-violet-700">
                      {item.assets.length} asset(s)
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center align-top text-xs text-slate-500">
                    {item.codeVideoProject?.videoUrl ? "Pronto" : item.codeVideoProject ? item.codeVideoProject.status : "-"}
                  </td>
                  <td className="px-6 py-4 text-center align-top text-xs text-slate-500">
                    {item.youtubePostUrl ? "Publicado" : "-"}
                  </td>
                  <td className="px-6 py-4 text-right align-top">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/resumo-noticias/${item.id}`}
                        className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700"
                      >
                        Abrir
                      </Link>
                      {item.youtubePostUrl ? (
                        <a
                          href={item.youtubePostUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-emerald-200/50 bg-emerald-50 px-3 py-2 text-[10px] font-black text-emerald-700"
                        >
                          YouTube
                        </a>
                      ) : null}
                      {item.codeVideoProject?.videoUrl ? (
                        <a
                          href={item.codeVideoProject.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-violet-200/50 bg-violet-50 px-3 py-2 text-[10px] font-black text-violet-700"
                        >
                          Video
                        </a>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-200 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm text-slate-500">
            Pagina {currentPage} de {totalPages} - Total de {filteredItems.length} itens
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage(1)}
              disabled={currentPage === 1}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 disabled:opacity-40"
            >
              {"<<"}
            </button>
            <button
              type="button"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={currentPage === 1}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 disabled:opacity-40"
            >
              {"<"}
            </button>
            <span className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-black text-white">
              {currentPage}
            </span>
            <button
              type="button"
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              disabled={currentPage === totalPages}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 disabled:opacity-40"
            >
              {">"}
            </button>
            <button
              type="button"
              onClick={() => setPage(totalPages)}
              disabled={currentPage === totalPages}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 disabled:opacity-40"
            >
              {">>"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
