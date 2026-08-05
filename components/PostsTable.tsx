"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type PostRow = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  status: string;
  views?: number | null;
  createdAt: string | Date;
  publishedAt?: string | Date | null;
  coverImage?: string | null;
  sourceUrl?: string | null;
  codeVideoProjects?: Array<{
    id: string;
    newsVariant?: string | null;
    status: string;
    videoUrl?: string | null;
    socialPosts?: Array<{
      id: string;
      platform: string;
      status: string;
      scheduledTo?: string | Date | null;
    }>;
  }>;
};

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function publicPostUrl(post: PostRow) {
  const slug = String(post?.slug || "").trim();
  return slug ? `/noticias/${slug}` : null;
}

function sourceHost(url: string | null | undefined) {
  if (!url) return "Sem fonte";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Fonte invalida";
  }
}

export default function PostsTable({
  initialData,
  detailBasePath = "/admin/posts",
  newPath = "/admin/posts/new",
  title = "Central de Noticias",
  description = "Listagem padronizada com paginacao, acoes por linha, selecao multipla e tela de detalhe.",
}: {
  initialData: PostRow[];
  detailBasePath?: string;
  newPath?: string;
  title?: string;
  description?: string;
}) {
  const [posts, setPosts] = useState<PostRow[]>(initialData);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [publishingAll, setPublishingAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const filteredPosts = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
    return posts.filter((post) => {
      const matchesSearch =
        !normalizedSearch ||
        post.title.toLocaleLowerCase("pt-BR").includes(normalizedSearch) ||
        String(post.summary || "")
          .toLocaleLowerCase("pt-BR")
          .includes(normalizedSearch) ||
        sourceHost(post.sourceUrl).toLocaleLowerCase("pt-BR").includes(normalizedSearch);
      const matchesStatus =
        statusFilter === "ALL" || post.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [posts, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visiblePosts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPosts.slice(start, start + pageSize);
  }, [currentPage, filteredPosts, pageSize]);

  const allVisibleSelected =
    visiblePosts.length > 0 &&
    visiblePosts.every((post) => selectedIds.includes(post.id));

  const selectedPosts = useMemo(
    () => posts.filter((post) => selectedIds.includes(post.id)),
    [posts, selectedIds],
  );

  const runSequential = async (
    ids: string[],
    handler: (id: string) => Promise<void>,
    successMessage: string,
  ) => {
    if (!ids.length) return;
    try {
      for (const id of ids) {
        await handler(id);
      }
      toast.success(successMessage);
    } catch (error: any) {
      toast.error(error?.message || "Falha ao executar acao em lote.");
    }
  };

  const handlePublishAll = async () => {
    if (publishingAll) return;
    if (!window.confirm("Publicar todas as noticias em rascunho no site?")) return;

    setPublishingAll(true);
    try {
      const res = await fetch("/api/posts/publish-all", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Erro ao publicar noticias");

      setPosts((prev) => prev.map((post) => ({ ...post, status: "PUBLISHED" })));
      toast.success(`${data.publishedCount || 0} noticia(s) publicada(s) no site.`);
    } catch (error: any) {
      toast.error(error?.message || "Erro de conexao ao publicar noticias");
    } finally {
      setPublishingAll(false);
    }
  };

  const handlePublish = async (id: string) => {
    setLoadingId(id + "-site");
    try {
      const res = await fetch(`/api/posts/${id}/publish`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Erro ao publicar noticia");
      setPosts((prev) =>
        prev.map((post) => (post.id === id ? { ...post, status: "PUBLISHED" } : post)),
      );
    } finally {
      setLoadingId(null);
    }
  };

  const handleLinkedIn = async (id: string) => {
    setLoadingId(id + "-linkedin");
    try {
      const sp = await fetch(`/api/posts/${id}/social-post`);
      if (!sp.ok) {
        throw new Error("Este post ainda nao tem video gerado para publicar no LinkedIn.");
      }
      const { socialPostId } = await sp.json();

      const res = await fetch("/api/social/publish-linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socialPostId }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Erro ao publicar no LinkedIn");
      }
    } finally {
      setLoadingId(null);
    }
  };

  const handleFetchCover = async (id: string) => {
    setLoadingId(id + "-cover");
    try {
      const res = await fetch(`/api/posts/${id}/fetch-cover`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.coverImage) {
        throw new Error(data.error || "Erro ao buscar imagem");
      }
      setPosts((prev) =>
        prev.map((post) => (post.id === id ? { ...post, coverImage: data.coverImage } : post)),
      );
    } finally {
      setLoadingId(null);
    }
  };

  const handleGenerateVideo = async (id: string) => {
    setLoadingId(id + "-video");
    try {
      const res = await fetch(`/api/posts/${id}/generate-video`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trigger: "manual_posts_table" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Erro ao iniciar video");
      }
    } finally {
      setLoadingId(null);
    }
  };

  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      const visibleIds = new Set(visiblePosts.map((post) => post.id));
      setSelectedIds((current) => current.filter((id) => !visibleIds.has(id)));
      return;
    }
    setSelectedIds((current) =>
      Array.from(new Set([...current, ...visiblePosts.map((post) => post.id)])),
    );
  };

  const copySelected = async (mode: "ids" | "urls") => {
    const text =
      mode === "ids"
        ? selectedPosts.map((post) => post.id).join("\n")
        : selectedPosts
            .map((post) => publicPostUrl(post))
            .filter(Boolean)
            .join("\n");
    if (!text) return;
    await navigator.clipboard.writeText(text);
    toast.success(mode === "ids" ? "IDs copiados." : "URLs copiadas.");
  };

  const exportSelected = () => {
    const csv = [
      ["id", "titulo", "status", "fonte", "publicadoEm", "url"].join(","),
      ...selectedPosts.map((post) =>
        [
          post.id,
          JSON.stringify(post.title),
          post.status,
          JSON.stringify(sourceHost(post.sourceUrl)),
          JSON.stringify(
            new Date(post.publishedAt || post.createdAt).toLocaleString("pt-BR"),
          ),
          JSON.stringify(publicPostUrl(post) || ""),
        ].join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "noticias-selecionadas.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <ToastContainer theme="colored" />

      <div className="rounded-[28px] border border-slate-200/60 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-800">
              {title}
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {description}
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={handlePublishAll}
              disabled={publishingAll || !posts.some((post) => post.status !== "PUBLISHED")}
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
            >
              {publishingAll ? "PUBLICANDO..." : "PUBLICAR TODOS"}
            </button>
            <Link
              href={newPath}
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white transition-all"
            >
              NOVA NOTICIA
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-3">
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Buscar titulo, resumo ou fonte..."
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
              <option value="PUBLISHED">Publicado</option>
              <option value="DRAFT">Rascunho</option>
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
        </div>

        {selectedIds.length ? (
          <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm font-bold text-slate-700">
              {selectedIds.length} item(ns) selecionado(s)
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  void runSequential(
                    selectedPosts.filter((post) => post.status !== "PUBLISHED").map((post) => post.id),
                    handlePublish,
                    "Noticias selecionadas publicadas.",
                  )
                }
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700"
              >
                Publicar selecionadas
              </button>
              <button
                type="button"
                onClick={() =>
                  void runSequential(
                    selectedPosts.map((post) => post.id),
                    handleGenerateVideo,
                    "Geracao de video iniciada para a selecao.",
                  )
                }
                className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-black text-violet-700"
              >
                Gerar video
              </button>
              <button
                type="button"
                onClick={() => void copySelected("ids")}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700"
              >
                Copiar IDs
              </button>
              <button
                type="button"
                onClick={() => void copySelected("urls")}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700"
              >
                Copiar URLs
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
          <table className="w-full min-w-[1180px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="w-12 px-6 py-4">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAllVisible}
                    aria-label="Selecionar noticias visiveis"
                  />
                </th>
                <th className="px-6 py-4">Noticia</th>
                <th className="px-6 py-4 text-center">Capa</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Fonte</th>
                <th className="px-6 py-4 text-center">Data</th>
                <th className="px-6 py-4 text-center">Video</th>
                <th className="px-6 py-4 text-right">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {!visiblePosts.length ? (
                <tr>
                  <td colSpan={8} className="px-6 py-14 text-center text-slate-400">
                    Nenhuma noticia encontrada.
                  </td>
                </tr>
              ) : null}
              {visiblePosts.map((item) => (
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
                      aria-label={`Selecionar ${item.title}`}
                    />
                  </td>
                  <td className="max-w-md px-6 py-4 align-top">
                    <div className="truncate font-bold text-slate-700 transition-colors group-hover:text-indigo-600">
                      {item.title}
                    </div>
                    <div className="mt-1 line-clamp-2 text-xs text-slate-500">
                      {item.summary}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(item.codeVideoProjects || []).map((project) => (
                        <span
                          key={project.id}
                          className={`rounded px-1.5 py-0.5 text-[9px] font-black ${
                            project.status === "DONE"
                              ? "bg-emerald-50 text-emerald-700"
                              : project.status === "FAILED"
                                ? "bg-rose-50 text-rose-700"
                                : "bg-violet-50 text-violet-700"
                          }`}
                        >
                          {project.newsVariant || "PRESENTER"}: {project.status}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="flex justify-center">
                      {item.coverImage ? (
                        <img
                          src={item.coverImage}
                          alt="capa"
                          className="h-10 w-16 rounded-lg object-cover ring-1 ring-slate-100"
                        />
                      ) : (
                        <button
                          disabled={loadingId === item.id + "-cover"}
                          onClick={() =>
                            handleFetchCover(item.id)
                              .then(() => toast.success("Imagem de capa buscada."))
                              .catch((error: any) =>
                                toast.error(error?.message || "Erro ao buscar imagem."),
                              )
                          }
                          className="rounded-lg bg-slate-100 px-3 py-1.5 text-[10px] font-black text-slate-600 disabled:opacity-50"
                        >
                          {loadingId === item.id + "-cover" ? "..." : "PEXELS"}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center align-top">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-tight ${
                        item.status === "PUBLISHED"
                          ? "border-emerald-200/60 bg-emerald-50 text-emerald-700"
                          : "border-slate-200/60 bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.status === "PUBLISHED" ? "Publicado" : "Rascunho"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center align-top text-xs text-slate-500">
                    {sourceHost(item.sourceUrl)}
                  </td>
                  <td className="px-6 py-4 text-center align-top text-xs text-slate-500">
                    {new Date(item.publishedAt || item.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-6 py-4 text-center align-top">
                    <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[10px] font-black text-indigo-700">
                      {(item.codeVideoProjects || []).length} projeto(s)
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right align-top">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`${detailBasePath}/${item.id}`}
                        className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700"
                        title="Abrir detalhes"
                      >
                        Abrir
                      </Link>
                      {publicPostUrl(item) && item.status === "PUBLISHED" ? (
                        <Link
                          href={publicPostUrl(item)!}
                          target="_blank"
                          className="rounded-lg border border-indigo-200/50 bg-indigo-50 px-3 py-2 text-[10px] font-black text-indigo-700"
                          title="Abrir artigo publicado"
                        >
                          Site
                        </Link>
                      ) : null}
                      {item.sourceUrl ? (
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-emerald-200/50 bg-emerald-50 px-3 py-2 text-[10px] font-black text-emerald-700"
                        >
                          Fonte
                        </a>
                      ) : null}
                      {item.status !== "PUBLISHED" ? (
                        <button
                          disabled={loadingId === item.id + "-site"}
                          onClick={() =>
                            handlePublish(item.id)
                              .then(() => toast.success("Post publicado no site."))
                              .catch((error: any) =>
                                toast.error(error?.message || "Erro ao publicar."),
                              )
                          }
                          className="rounded-lg border border-emerald-200/50 bg-emerald-50 px-3 py-2 text-[10px] font-black text-emerald-700 disabled:opacity-50"
                        >
                          Publish
                        </button>
                      ) : null}
                      <button
                        disabled={loadingId === item.id + "-video"}
                        onClick={() =>
                          handleGenerateVideo(item.id)
                            .then(() => toast.success("Fluxo de video iniciado."))
                            .catch((error: any) =>
                              toast.error(error?.message || "Erro ao iniciar video."),
                            )
                        }
                        className="rounded-lg border border-violet-200/50 bg-violet-50 px-3 py-2 text-[10px] font-black text-violet-700 disabled:opacity-50"
                      >
                        Video
                      </button>
                      <button
                        disabled={loadingId === item.id + "-linkedin"}
                        onClick={() =>
                          handleLinkedIn(item.id)
                            .then(() => toast.success("Publicado no LinkedIn com sucesso."))
                            .catch((error: any) =>
                              toast.error(error?.message || "Erro no LinkedIn."),
                            )
                        }
                        className="rounded-lg border border-indigo-200/50 bg-indigo-50 px-3 py-2 text-[10px] font-black text-indigo-700 disabled:opacity-50"
                      >
                        LinkedIn
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-200 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm text-slate-500">
            Pagina {currentPage} de {totalPages} - Total de {filteredPosts.length} itens
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
