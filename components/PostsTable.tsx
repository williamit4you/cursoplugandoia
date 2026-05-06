"use client";

import { useState } from "react";
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function PostsTable({ initialData }: { initialData: any[] }) {
  const [posts, setPosts] = useState<any[]>(initialData);
  const [loadingId, setLoadingId] = useState<string | null>(null);

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

  return (
    <div className="space-y-6 animate-in">
      <ToastContainer theme="dark" />
      
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <div className="w-1.5 h-5 bg-indigo-500 rounded-full" />
          Lista de Notícias
        </h2>
        <Link 
          href="/admin/posts/new"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
        >
          Nova Notícia
        </Link>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-[10px] uppercase tracking-widest text-slate-400 font-black">
                <th className="px-6 py-4">Título</th>
                <th className="px-6 py-4 text-center">Capa</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Views</th>
                <th className="px-6 py-4 text-center">Data</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {posts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">
                    Nenhuma notícia encontrada.
                  </td>
                </tr>
              )}
              {posts.map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                  {/* Título */}
                  <td className="px-6 py-4 max-w-md">
                    <div className="font-bold text-slate-200 group-hover:text-white transition-colors truncate">
                      {item.title}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.id}
                    </div>
                  </td>

                  {/* Capa */}
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      {item.coverImage ? (
                        <img
                          src={item.coverImage}
                          alt="capa"
                          className="w-16 h-10 object-cover rounded-lg ring-1 ring-white/10 shadow-lg"
                        />
                      ) : (
                        <button
                          disabled={loadingId === item.id + "-cover"}
                          onClick={() => handleFetchCover(item.id)}
                          className="px-3 py-1 bg-white/5 hover:bg-white/10 text-[10px] font-black text-slate-300 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                        >
                          {loadingId === item.id + "-cover" ? "⏳" : "🖼️ PEXELS"}
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tight
                      ${item.status === "PUBLISHED" 
                        ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20" 
                        : "bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/20"}`}
                    >
                      {item.status}
                    </span>
                  </td>

                  {/* Views */}
                  <td className="px-6 py-4 text-center font-mono font-bold text-indigo-400">
                    {item.views ?? 0}
                  </td>

                  {/* Data */}
                  <td className="px-6 py-4 text-center text-slate-400 text-xs">
                    {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                  </td>

                  {/* Ações */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/posts/${item.id}`}
                        className="p-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors"
                        title="Editar"
                      >
                        ✏️
                      </Link>

                      {item.status !== "PUBLISHED" && (
                        <button
                          disabled={loadingId === item.id + "-site"}
                          onClick={() => handlePublish(item.id)}
                          className="px-3 py-1 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 text-[10px] font-black rounded-lg transition-all active:scale-95 disabled:opacity-50"
                        >
                          {loadingId === item.id + "-site" ? "⏳" : "PUBLISH"}
                        </button>
                      )}

                      <button
                        disabled={loadingId === item.id + "-linkedin"}
                        onClick={() => handleLinkedIn(item.id)}
                        className="px-3 py-1 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-[10px] font-black rounded-lg transition-all active:scale-95 disabled:opacity-50 border border-blue-500/20"
                      >
                        {loadingId === item.id + "-linkedin" ? "⏳" : "LINKEDIN"}
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

