"use client";

import { useState } from "react";
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function PostsTable({ initialData }: { initialData: any[] }) {
  const [posts, setPosts] = useState<any[]>(initialData);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [publishingAll, setPublishingAll] = useState(false);
  const publicPostUrl = (post: any) => {
    const slug = String(post?.slug || "").trim();
    return slug ? `/noticias/${slug}` : null;
  };

  const handlePublishAll = async () => {
    if (publishingAll) return;
    if (!window.confirm("Publicar todas as notícias em rascunho no site?")) return;

    setPublishingAll(true);
    try {
      const res = await fetch("/api/posts/publish-all", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Erro ao publicar notícias");

      setPosts((prev) => prev.map((post) => ({ ...post, status: "PUBLISHED" })));
      toast.success(`${data.publishedCount || 0} notícia(s) publicada(s) no site.`);
    } catch (error: any) {
      toast.error(error?.message || "Erro de conexão ao publicar notícias");
    } finally {
      setPublishingAll(false);
    }
  };

  // ── Publicar no site (mudar status para PUBLISHED) ─────────────────────────
  const handlePublish = async (id: string) => {
    setLoadingId(id + "-site");
    try {
      const res = await fetch(`/api/posts/${id}/publish`, { method: "POST" });
      if (res.ok) {
        setPosts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: "PUBLISHED" } : p))
        );
        toast.success("✅ Post publicado no site!");
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao publicar");
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setLoadingId(null);
    }
  };

  // ── Publicar no LinkedIn ───────────────────────────────────────────────────
  const handleLinkedIn = async (id: string) => {
    setLoadingId(id + "-linkedin");
    try {
      const sp = await fetch(`/api/posts/${id}/social-post`);
      if (!sp.ok) {
        toast.error("Este post ainda não tem vídeo gerado para publicar no LinkedIn.");
        return;
      }
      const { socialPostId } = await sp.json();

      const res = await fetch("/api/social/publish-linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socialPostId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("✅ Publicado no LinkedIn com sucesso!");
      } else {
        toast.error(data.error || "Erro ao publicar no LinkedIn");
      }
    } catch {
      toast.error("Erro de conexão ao publicar no LinkedIn");
    } finally {
      setLoadingId(null);
    }
  };

  // ── Buscar imagem de capa no Pexels ───────────────────────────────────────
  const handleFetchCover = async (id: string) => {
    setLoadingId(id + "-cover");
    try {
      const res = await fetch(`/api/posts/${id}/fetch-cover`, { method: "POST" });
      const data = await res.json();
      if (data.coverImage) {
        setPosts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, coverImage: data.coverImage } : p))
        );
        toast.success("🖼️ Imagem de capa buscada no Pexels!");
      } else {
        toast.error(data.error || "Erro ao buscar imagem");
      }
    } catch {
      toast.error("Erro de conexão ao buscar imagem");
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
        toast.error(data.error || "Erro ao iniciar video");
        return;
      }
      toast.success(data.alreadyDone ? "Video ja estava pronto." : data.alreadyRunning ? "Video ja estava em processamento." : "Fluxo de video iniciado.");
    } catch {
      toast.error("Erro de conexao ao iniciar video");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <ToastContainer theme="colored" />
      
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <div className="w-1.5 h-5 bg-indigo-600 rounded-full" />
          Lista de Notícias
        </h2>
        <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={handlePublishAll}
          disabled={publishingAll || !posts.some((post) => post.status !== "PUBLISHED")}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-emerald-600/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {publishingAll ? "PUBLICANDO..." : "PUBLICAR TODOS"}
        </button>
        <Link 
          href="/admin/posts/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-indigo-600/10 active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          NOVA NOTÍCIA
        </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/60 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-6 py-4">Título</th>
                <th className="px-6 py-4 text-center">Capa</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Views</th>
                <th className="px-6 py-4 text-center">Data</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {posts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                    Nenhuma notícia encontrada.
                  </td>
                </tr>
              )}
              {posts.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/30 transition-colors group">
                  {/* Título */}
                  <td className="px-6 py-4 max-w-md">
                    <div className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors truncate">
                      {item.title}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                      ID: {item.id}
                    </div>
                    {publicPostUrl(item) && (
                      <Link
                        href={publicPostUrl(item)!}
                        target="_blank"
                        className="mt-1 inline-flex text-[11px] font-bold text-indigo-600 hover:text-indigo-700"
                      >
                        Abrir no site
                      </Link>
                    )}
                  </td>

                  {/* Capa */}
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      {item.coverImage ? (
                        <img
                          src={item.coverImage}
                          alt="capa"
                          className="w-16 h-10 object-cover rounded-lg ring-1 ring-slate-100 shadow-sm"
                        />
                      ) : (
                        <button
                          disabled={loadingId === item.id + "-cover"}
                          onClick={() => handleFetchCover(item.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[10px] font-black text-slate-600 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                        >
                          {loadingId === item.id + "-cover" ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-slate-600"></div>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              PEXELS
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight
                      ${item.status === "PUBLISHED" 
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" 
                        : "bg-slate-100 text-slate-600 border border-slate-200/60"}`}
                    >
                      {item.status === "PUBLISHED" ? "Publicado" : "Rascunho"}
                    </span>
                  </td>

                  {/* Views */}
                  <td className="px-6 py-4 text-center font-mono font-bold text-indigo-600">
                    {item.views ?? 0}
                  </td>

                  {/* Data */}
                  <td className="px-6 py-4 text-center text-slate-500 text-xs">
                    {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                  </td>

                  {/* Ações */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/posts/${item.id}`}
                        className="p-2 bg-slate-50 hover:bg-slate-100 hover:text-indigo-600 text-slate-500 rounded-lg transition-colors border border-slate-100"
                        title="Editar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </Link>

                      {publicPostUrl(item) && item.status === "PUBLISHED" && (
                        <Link
                          href={publicPostUrl(item)!}
                          target="_blank"
                          className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-lg transition-all active:scale-95 border border-indigo-200/50"
                          title="Abrir artigo publicado"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 3h7m0 0v7m0-7L10 14" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5h6m-6 0a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-6" />
                          </svg>
                          SITE
                        </Link>
                      )}

                      {item.status !== "PUBLISHED" && (
                        <button
                          disabled={loadingId === item.id + "-site"}
                          onClick={() => handlePublish(item.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-lg transition-all active:scale-95 disabled:opacity-50 border border-emerald-200/50"
                        >
                          {loadingId === item.id + "-site" ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-emerald-700"></div>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              PUBLISH
                            </>
                          )}
                        </button>
                      )}

                      <button
                        disabled={loadingId === item.id + "-video"}
                        onClick={() => handleGenerateVideo(item.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 text-[10px] font-black rounded-lg transition-all active:scale-95 disabled:opacity-50 border border-violet-200/50"
                      >
                        {loadingId === item.id + "-video" ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-violet-700"></div>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h6a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            VIDEO
                          </>
                        )}
                      </button>

                      <button
                        disabled={loadingId === item.id + "-linkedin"}
                        onClick={() => handleLinkedIn(item.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-lg transition-all active:scale-95 disabled:opacity-50 border border-indigo-200/50"
                      >
                        {loadingId === item.id + "-linkedin" ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-700"></div>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 10.742l8.99-4.495m0 0l-8.99-4.499m8.99 4.495v12.567m0-12.567l-8.99 4.495" />
                            </svg>
                            LINKEDIN
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
