"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { 
  Search, 
  Filter, 
  RefreshCcw, 
  ExternalLink, 
  MoreVertical, 
  Youtube, 
  Instagram, 
  Video, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Play,
  Trash2,
  Calendar,
  LayoutGrid,
  List as ListIcon,
  ChevronDown,
  ChevronUp,
  Share2
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Image from "next/image";

// Configuração de Status
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; pulse?: boolean }> = {
  DRAFT: { label: "Rascunho", color: "text-slate-400 bg-slate-500/10 border-slate-500/20", icon: Clock },
  SCHEDULED: { label: "Agendado", color: "text-blue-400 bg-blue-500/10 border-blue-500/20", icon: Calendar },
  PROCESSING_MEDIA: { label: "Meta Processando", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: RefreshCcw, pulse: true },
  PUBLISHING: { label: "Publicando", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: RefreshCcw, pulse: true },
  POSTED: { label: "Publicado", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2 },
  FAILED: { label: "Falhou", color: "text-rose-400 bg-rose-500/10 border-rose-500/20", icon: XCircle },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
  const Icon = cfg.icon;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.color} ${cfg.pulse ? 'animate-pulse' : ''}`}>
      <Icon className={`w-3.5 h-3.5 ${cfg.pulse ? 'animate-spin' : ''}`} />
      {cfg.label}
    </span>
  );
}

function PlatformIcon({ platform, postType }: { platform: string; postType?: string }) {
  const p = platform.toUpperCase();
  if (p === "YOUTUBE") return <Youtube className="w-5 h-5 text-rose-500" />;
  if (p === "META" || p === "INSTAGRAM") {
    return postType === "STORY" 
      ? <div className="relative"><Instagram className="w-5 h-5 text-pink-500" /><div className="absolute -top-1 -right-1 w-2 h-2 bg-pink-500 rounded-full border border-slate-900" /></div>
      : <Instagram className="w-5 h-5 text-pink-500" />;
  }
  if (p === "TIKTOK") return <Video className="w-5 h-5 text-cyan-400" />;
  return <Share2 className="w-5 h-5 text-slate-400" />;
}

export default function SocialPostsDashboard() {
  const [posts, setPosts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [groupByVideo, setGroupByVideo] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [platformFilter, setPlatformFilter] = useState("ALL");
  const [q, setQ] = useState("");

  const fetchPosts = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        status: statusFilter,
        platform: platformFilter,
        q: q.trim(),
      });

      const res = await fetch(`/api/social/posts?${qs.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Falha ao carregar posts");
      const data = await res.json();
      setPosts(Array.isArray(data?.items) ? data.items : []);
      setTotal(data?.total || 0);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [page, pageSize, statusFilter, platformFilter, q]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Auto-refresh for processing posts
  useEffect(() => {
    const hasActive = posts.some(p => p.status === "PUBLISHING" || p.status === "PROCESSING_MEDIA");
    if (hasActive) {
      const timer = setInterval(() => fetchPosts(true), 5000);
      return () => clearInterval(timer);
    }
  }, [posts, fetchPosts]);

  const toggleGroup = (id: string) => {
    const next = new Set(expandedGroups);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedGroups(next);
  };

  const groupedRows = useMemo(() => {
    if (!groupByVideo) return [];
    const map = new Map<string, any>();
    for (const p of posts) {
      const key = String(p.codeVideoProjectId || p.videoUrl || p.id);
      const row = map.get(key);
      if (!row) {
        map.set(key, {
          id: key,
          summary: p.summary,
          videoUrl: p.videoUrl,
          thumbUrl: p.thumbUrl,
          createdAt: p.createdAt,
          items: [p],
        });
        continue;
      }
      row.items.push(p);
    }
    return Array.from(map.values());
  }, [posts, groupByVideo]);

  const handleAction = async (id: string, action: string) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/social/posts/${id}/${action}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha na ação");
      toast.success("Ação realizada com sucesso!");
      fetchPosts(true);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingId(null);
    }
  };

  const retryPublish = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await fetch("/api/social/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socialPostId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao publicar");
      toast.success("Publicação iniciada!");
      fetchPosts(true);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 md:p-10 space-y-8 animate-in fade-in duration-700">
      <ToastContainer theme="dark" position="bottom-right" />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2 flex items-center gap-3">
            <Share2 className="w-10 h-10 text-blue-500" />
            Fila Social
          </h1>
          <p className="text-slate-400 text-lg">
            Gerencie e monitore as publicações automáticas em todas as redes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => fetchPosts()}
            className="p-3 bg-slate-900 border border-slate-800 rounded-2xl hover:bg-slate-800 transition-colors"
            title="Atualizar"
          >
            <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800">
            <button 
              onClick={() => setGroupByVideo(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${groupByVideo ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              <LayoutGrid className="w-4 h-4" /> Agrupado
            </button>
            <button 
              onClick={() => setGroupByVideo(false)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${!groupByVideo ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              <ListIcon className="w-4 h-4" /> Lista
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900/50 p-6 rounded-3xl border border-white/5 backdrop-blur-sm">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
          <input 
            type="text"
            placeholder="Buscar por legenda..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="ALL">Todos os Status</option>
            <option value="DRAFT">Rascunho</option>
            <option value="SCHEDULED">Agendado</option>
            <option value="POSTED">Publicado</option>
            <option value="FAILED">Falhou</option>
          </select>
        </div>

        <div className="relative">
          <PlatformIcon platform={platformFilter === "ALL" ? "" : platformFilter} />
          <select 
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="ALL">Todas as Plataformas</option>
            <option value="META">Meta (IG/FB)</option>
            <option value="YOUTUBE">YouTube</option>
            <option value="TIKTOK">TikTok</option>
          </select>
        </div>

        <div className="flex items-center justify-end text-sm text-slate-500 font-medium">
          {total} postagens encontradas
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <RefreshCcw className="w-12 h-12 text-blue-500 animate-spin" />
            <p className="text-slate-400 font-medium">Carregando fila...</p>
          </div>
        ) : groupByVideo ? (
          /* Agrupado por Vídeo */
          <div className="space-y-6">
            {groupedRows.map(group => (
              <div key={group.id} className="bg-slate-900 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-6 flex items-start gap-6">
                  {/* Thumbnail */}
                  <div className="relative w-32 h-44 bg-slate-950 rounded-2xl overflow-hidden shrink-0 border border-white/5 group">
                    {group.thumbUrl ? (
                      <Image src={group.thumbUrl} alt="Thumbnail" fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Video className="w-8 h-8 text-slate-800" />
                      </div>
                    )}
                    <button 
                      onClick={() => window.open(group.videoUrl, '_blank')}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      <Play className="w-8 h-8 text-white fill-current" />
                    </button>
                  </div>

                  {/* Content Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white truncate max-w-xl mb-1">{group.summary}</h3>
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                          <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {new Date(group.createdAt).toLocaleString('pt-BR')}</span>
                          <span className="w-1 h-1 bg-slate-700 rounded-full" />
                          <span className="font-mono text-xs uppercase tracking-wider">{group.id.slice(0, 8)}...</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => toggleGroup(group.id)}
                        className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
                      >
                        {expandedGroups.has(group.id) ? <ChevronUp /> : <ChevronDown />}
                      </button>
                    </div>

                    {/* Quick Status Badges */}
                    <div className="flex flex-wrap gap-4 pt-2 border-t border-white/5 mt-4">
                      {group.items.map((p: any) => (
                        <div key={p.id} className="flex items-center gap-2 bg-slate-950/50 p-2 pr-4 rounded-2xl border border-white/5">
                          <PlatformIcon platform={p.platform} postType={p.postType} />
                          <span className="text-xs font-bold text-slate-300 uppercase">{p.postType || 'REEL'}</span>
                          <StatusBadge status={p.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedGroups.has(group.id) && (
                  <div className="bg-slate-950/50 border-t border-white/5 p-6 space-y-4">
                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <ListIcon className="w-4 h-4" /> Detalhes das Publicações
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {group.items.map((p: any) => (
                        <div key={p.id} className="bg-slate-900/50 border border-white/5 p-4 rounded-2xl flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                            <PlatformIcon platform={p.platform} postType={p.postType} />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white tracking-wide">{p.platform} {p.postType}</span>
                                <StatusBadge status={p.status} />
                              </div>
                              <p className="text-xs text-slate-500 mt-1">
                                {p.scheduledTo ? `Agendado: ${new Date(p.scheduledTo).toLocaleString('pt-BR')}` : 'Não agendado'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {p.status === 'FAILED' && (
                              <button 
                                onClick={() => retryPublish(p.id)}
                                className="p-2 bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
                                title="Repetir"
                              >
                                <RefreshCcw className="w-4 h-4" />
                              </button>
                            )}
                            {p.postUrl && (
                              <a 
                                href={p.postUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="p-2 bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-lg transition-all"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                            <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-500">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Lista Simples (Bento style) */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {posts.map(post => (
              <div key={post.id} className="bg-slate-900 border border-white/5 rounded-3xl p-6 hover:border-blue-500/30 transition-all group shadow-xl">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-slate-950 rounded-2xl border border-white/5">
                      <PlatformIcon platform={post.platform} postType={post.postType} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white uppercase tracking-wider">{post.platform}</h3>
                      <p className="text-xs text-slate-500">{post.postType || 'REEL'}</p>
                    </div>
                  </div>
                  <StatusBadge status={post.status} />
                </div>
                
                <p className="text-slate-300 text-sm line-clamp-3 mb-6 min-h-[60px]">
                  {post.summary}
                </p>

                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(post.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                  <div className="flex items-center gap-2">
                    {post.postUrl && (
                      <a 
                        href={post.postUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-xl transition-all"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    )}
                    <button className="p-2 text-slate-500 hover:bg-slate-800 rounded-xl transition-all">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && posts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 space-y-6 bg-slate-900/30 rounded-3xl border border-dashed border-slate-800">
            <div className="p-6 bg-slate-900 rounded-full border border-slate-800">
              <AlertCircle className="w-12 h-12 text-slate-700" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-2">Nenhum post encontrado</h3>
              <p className="text-slate-500 max-w-xs mx-auto">
                Tente ajustar os filtros ou aguarde as próximas automações.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between bg-slate-900/50 p-6 rounded-3xl border border-white/5">
        <div className="text-sm text-slate-500">
          Página <span className="text-white font-bold">{page}</span> de {Math.ceil(total / pageSize)}
        </div>
        <div className="flex gap-2">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-6 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition-all"
          >
            Anterior
          </button>
          <button 
            disabled={page >= Math.ceil(total / pageSize)}
            onClick={() => setPage(p => p + 1)}
            className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500 transition-all"
          >
            Próximo
          </button>
        </div>
      </div>
    </div>
  );
}
