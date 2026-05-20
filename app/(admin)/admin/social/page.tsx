"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { 
  Search, 
  Filter, 
  RefreshCcw, 
  ExternalLink, 
  MoreVertical,
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
  DRAFT: { label: "Rascunho", color: "text-slate-500 bg-slate-100 border-slate-200/60", icon: Clock },
  SCHEDULED: { label: "Agendado", color: "text-indigo-600 bg-indigo-50 border-indigo-200/60", icon: Calendar },
  PROCESSING_MEDIA: { label: "Processando", color: "text-amber-700 bg-amber-50 border-amber-200/60", icon: RefreshCcw, pulse: true },
  PUBLISHING: { label: "Publicando", color: "text-amber-700 bg-amber-50 border-amber-200/60", icon: RefreshCcw, pulse: true },
  POSTED: { label: "Publicado", color: "text-emerald-700 bg-emerald-50 border-emerald-200/60", icon: CheckCircle2 },
  FAILED: { label: "Falhou", color: "text-rose-700 bg-rose-50 border-rose-200/60", icon: XCircle },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
  const Icon = cfg.icon;
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.color} ${cfg.pulse ? 'animate-pulse' : ''}`}>
      <Icon className={`w-3 h-3 ${cfg.pulse ? 'animate-spin' : ''}`} />
      {cfg.label}
    </span>
  );
}

function PlatformIcon({ platform, postType }: { platform: string; postType?: string }) {
  const p = platform.toUpperCase();
  if (p === "YOUTUBE") return <Video className="w-4 h-4 text-rose-500" />;
  if (p === "META" || p === "INSTAGRAM") {
    return postType === "STORY" 
      ? <div className="relative"><Share2 className="w-4 h-4 text-pink-500" /><div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-pink-500 rounded-full border border-white" /></div>
      : <Share2 className="w-4 h-4 text-pink-500" />;
  }
  if (p === "TIKTOK") return <Video className="w-4 h-4 text-cyan-500" />;
  return <Share2 className="w-4 h-4 text-slate-400" />;
}

export default function SocialPostsDashboard() {
  const [posts, setPosts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [cronLoading, setCronLoading] = useState(false);
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

  const runSocialCron = useCallback(async () => {
    setCronLoading(true);
    try {
      const res = await fetch("/api/social/cron", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Falha ao rodar cron social");
      toast.success(`Cron social executado (checked=${data.checked ?? 0}).`);
      fetchPosts(true);
    } catch (err: any) {
      toast.error(err.message || "Falha ao rodar cron social");
    } finally {
      setCronLoading(false);
    }
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

  const checkOrPublish = async (post: any) => {
    setLoadingId(post.id);
    try {
      const pathname =
        post.platform === "YOUTUBE"
          ? "/api/social/publish-youtube"
          : post.platform === "TIKTOK"
            ? "/api/social/publish-tiktok"
            : post.postType === "STORY"
              ? "/api/social/publish-story"
              : "/api/social/publish";

      const res = await fetch(pathname, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socialPostId: post.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao processar publicação");
      
      if (data.stillProcessing) {
        toast.info("A Meta ainda está processando o vídeo no container assíncrono. Aguarde um minuto.");
      } else {
        toast.success("Publicação executada/atualizada com sucesso!");
      }
      fetchPosts(true);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <ToastContainer theme="colored" position="bottom-right" />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-2">
            <Share2 className="w-6 h-6 text-indigo-600" />
            Fila Social
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Gerencie e monitore as publicações automáticas em todas as redes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => fetchPosts()}
            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm"
            title="Atualizar"
          >
            <RefreshCcw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button 
            onClick={runSocialCron}
            disabled={cronLoading}
            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm disabled:opacity-50"
            title="Rodar cron agora"
          >
            <Play className={`w-4 h-4 text-slate-500 ${cronLoading ? 'animate-pulse' : ''}`} />
          </button>

          <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200/60">
            <button 
              onClick={() => setGroupByVideo(true)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${groupByVideo ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/40' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Agrupado
            </button>
            <button 
              onClick={() => setGroupByVideo(false)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!groupByVideo ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/40' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <ListIcon className="w-3.5 h-3.5" /> Lista
            </button>
          </div>
        </div>
      </div>

      {/* Info Card Explaining functionality */}
      <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-2xl flex items-start gap-3">
        <div className="p-2 bg-indigo-50 rounded-xl border border-indigo-100 text-indigo-600 shrink-0">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-indigo-900">Como funciona a Fila de Stories / Social?</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Esta fila armazena as postagens geradas que estão aguardando publicação. O robô em background varre esta tabela periodicamente, executa os envios agendados via API (Meta Graph API, YouTube API, etc.) e atualiza o status.
          </p>
          <p className="text-xs text-slate-500 leading-relaxed mt-1">
            <strong className="text-indigo-800">Nota sobre "Meta processando" / "Processando":</strong> No Instagram/Facebook, o vídeo é enviado em duas fases. A primeira cria o container e o vídeo entra em fila de processamento na Meta (status "Processando"). A postagem final ocorre no próximo ciclo do cron <code className="bg-indigo-50 px-1 py-0.5 rounded font-mono text-[10px]">/api/social/cron</code>. Se este cron não estiver rodando no seu servidor, o post parecerá travado. Você pode clicar no botão <strong>"Sincronizar/Publicar"</strong> (<RefreshCcw className="w-2.5 h-2.5 inline" />) ao lado do post para verificar o status e publicá-lo imediatamente.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <input 
            type="text"
            placeholder="Buscar por legenda..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-11 pr-4 focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 focus:bg-white transition-all text-xs font-medium text-slate-700"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-11 pr-4 appearance-none focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 focus:bg-white text-xs font-medium text-slate-700"
          >
            <option value="ALL">Todos os Status</option>
            <option value="DRAFT">Rascunho</option>
            <option value="SCHEDULED">Agendado</option>
            <option value="POSTED">Publicado</option>
            <option value="FAILED">Falhou</option>
            <option value="PROCESSING_MEDIA">Processando Mídia</option>
          </select>
        </div>

        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select 
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-11 pr-4 appearance-none focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 focus:bg-white text-xs font-medium text-slate-700"
          >
            <option value="ALL">Todas as Plataformas</option>
            <option value="META">Meta (IG/FB)</option>
            <option value="YOUTUBE">YouTube</option>
            <option value="TIKTOK">TikTok</option>
            <option value="LINKEDIN">LinkedIn</option>
          </select>
        </div>

        <div className="flex items-center justify-end text-xs text-slate-500 font-bold">
          {total} postagens encontradas
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4 bg-white rounded-2xl border border-slate-200/60 shadow-sm">
            <RefreshCcw className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-slate-500 text-sm font-medium">Carregando fila...</p>
          </div>
        ) : groupByVideo ? (
          /* Agrupado por Vídeo */
          <div className="space-y-4">
            {groupedRows.map(group => (
              <div key={group.id} className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="p-5 flex flex-col sm:flex-row items-start gap-5">
                  {/* Thumbnail */}
                  <div className="relative w-28 h-36 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200/60 group cursor-pointer shadow-sm">
                    {group.thumbUrl ? (
                      <Image src={group.thumbUrl} alt="Thumbnail" fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Video className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                    <button 
                      onClick={() => window.open(group.videoUrl, '_blank')}
                      className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      <Play className="w-6 h-6 text-white fill-current" />
                    </button>
                  </div>

                  {/* Content Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="text-base font-bold text-slate-800 line-clamp-2 mb-1">{group.summary}</h3>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1 font-medium"><Clock className="w-3.5 h-3.5" /> {new Date(group.createdAt).toLocaleString('pt-BR')}</span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full" />
                          <span className="font-mono text-[10px] uppercase tracking-wider">ID: {group.id.slice(0, 10)}...</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => toggleGroup(group.id)}
                        className="p-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-lg transition-all"
                      >
                        {expandedGroups.has(group.id) ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                      </button>
                    </div>

                    {/* Quick Status Badges */}
                    <div className="flex flex-wrap gap-2.5 pt-3 border-t border-slate-100 mt-3">
                      {group.items.map((p: any) => (
                        <div key={p.id} className="flex items-center gap-1.5 bg-slate-50/80 p-1.5 pr-3 rounded-lg border border-slate-100">
                          <PlatformIcon platform={p.platform} postType={p.postType} />
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">{p.platform.slice(0, 3)}: {p.postType || 'REEL'}</span>
                          <StatusBadge status={p.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedGroups.has(group.id) && (
                  <div className="bg-slate-50/50 border-t border-slate-100 p-5 space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <ListIcon className="w-3.5 h-3.5 text-slate-400" /> Detalhes das Publicações
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {group.items.map((p: any) => (
                        <div key={p.id} className="bg-white border border-slate-200/60 p-3.5 rounded-xl flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                              <PlatformIcon platform={p.platform} postType={p.postType} />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-800 text-xs tracking-tight">{p.platform} ({p.postType})</span>
                                <StatusBadge status={p.status} />
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {p.scheduledTo ? `Agendado: ${new Date(p.scheduledTo).toLocaleString('pt-BR')}` : 'Não agendado'}
                              </p>
                              {p.log && (
                                <p className="text-[9px] font-mono text-rose-600 mt-1 max-w-xs truncate" title={p.log}>
                                  Erro: {p.log}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {(p.status === 'FAILED' || p.status === 'PROCESSING_MEDIA' || p.status === 'PUBLISHING') && (
                              <button 
                                onClick={() => checkOrPublish(p)}
                                className={`p-1.5 rounded-lg transition-all border ${
                                  p.status === 'FAILED' 
                                    ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-600 hover:text-white' 
                                    : 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-600 hover:text-white'
                                }`}
                                title={p.status === 'FAILED' ? "Tentar Publicar Novamente" : "Verificar Status / Publicar na Meta"}
                                disabled={loadingId === p.id}
                              >
                                <RefreshCcw className={`w-3.5 h-3.5 ${loadingId === p.id ? 'animate-spin' : ''}`} />
                              </button>
                            )}
                            {p.postUrl && (
                              <a 
                                href={p.postUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-all border border-emerald-100/50"
                                title="Ver Post"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {posts.map(post => (
              <div key={post.id} className="bg-white border border-slate-200/60 rounded-2xl p-5 hover:border-indigo-500/30 transition-all group shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <PlatformIcon platform={post.platform} postType={post.postType} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">{post.platform}</h3>
                        <p className="text-[10px] text-slate-400 font-bold">{post.postType || 'REEL'}</p>
                      </div>
                    </div>
                    <StatusBadge status={post.status} />
                  </div>
                  
                  <p className="text-slate-600 text-xs line-clamp-3 mb-4 leading-relaxed">
                    {post.summary}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-2">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(post.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {(post.status === 'FAILED' || post.status === 'PROCESSING_MEDIA' || post.status === 'PUBLISHING') && (
                      <button 
                        onClick={() => checkOrPublish(post)}
                        className={`p-1.5 rounded-lg transition-all border ${
                          post.status === 'FAILED' 
                            ? 'bg-rose-50 text-rose-600 border-rose-100/50 hover:bg-rose-600 hover:text-white' 
                            : 'bg-amber-50 text-amber-600 border-amber-100/50 hover:bg-amber-600 hover:text-white'
                        }`}
                        title={post.status === 'FAILED' ? "Tentar Publicar Novamente" : "Verificar Status / Publicar na Meta"}
                        disabled={loadingId === post.id}
                      >
                        <RefreshCcw className={`w-3.5 h-3.5 ${loadingId === post.id ? 'animate-spin' : ''}`} />
                      </button>
                    )}
                    {post.postUrl && (
                      <a 
                        href={post.postUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all border border-transparent hover:border-indigo-100/50"
                        title="Ver Postagem"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && posts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4 bg-white rounded-2xl border border-dashed border-slate-200">
            <div className="p-4 bg-slate-50 rounded-full border border-slate-100">
              <AlertCircle className="w-8 h-8 text-slate-400" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-800 mb-1">Nenhum post encontrado</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Tente ajustar os filtros ou aguarde as próximas automações gerarem postagens.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="text-xs text-slate-500 font-bold">
          Página <span className="text-slate-800 font-black">{page}</span> de {Math.ceil(total / pageSize) || 1}
        </div>
        <div className="flex gap-2">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all text-slate-600"
          >
            Anterior
          </button>
          <button 
            disabled={page >= Math.ceil(total / pageSize)}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 shadow-lg shadow-indigo-600/10 transition-all"
          >
            Próximo
          </button>
        </div>
      </div>
    </div>
  );
}
