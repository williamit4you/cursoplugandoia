"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Share2, 
  Video, 
  Trash2, 
  ExternalLink, 
  X, 
  Play, 
  Pause, 
  Check, 
  AlertCircle,
  RefreshCcw
} from "lucide-react";

type SocialPost = {
  id: string;
  summary: string;
  platform: string;
  postType: string;
  status: string;
  scheduledTo?: string | null;
  postedAt?: string | null;
  videoUrl?: string | null;
  postUrl?: string | null;
  log?: string | null;
};

const PLATFORM_CONFIG: Record<string, { label: string; bg: string; border: string; text: string; icon: any }> = {
  META: { label: "Instagram/Meta", bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-700", icon: Share2 },
  YOUTUBE: { label: "YouTube Shorts", bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", icon: Video },
  TIKTOK: { label: "TikTok", bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700", icon: Video },
  LINKEDIN: { label: "LinkedIn", bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700", icon: Share2 },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Rascunho / Pausado", color: "bg-slate-100 text-slate-700 border-slate-200" },
  SCHEDULED: { label: "Agendado", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  PROCESSING_MEDIA: { label: "Processando (Meta)", color: "bg-amber-100 text-amber-700 border-amber-200 animate-pulse" },
  PUBLISHING: { label: "Publicando", color: "bg-amber-100 text-amber-700 border-amber-200 animate-pulse" },
  POSTED: { label: "Publicado", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  FAILED: { label: "Falhou", color: "bg-rose-100 text-rose-700 border-rose-200" },
};

function monthLabel(date: Date) {
  const label = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function startOfGrid(base: Date) {
  const first = new Date(base.getFullYear(), base.getMonth(), 1);
  const day = first.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  first.setDate(first.getDate() + diff);
  return first;
}

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function SocialCalendarPage() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [cursor, setCursor] = useState(() => new Date());
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [requeueLoading, setRequeueLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/social/posts?page=1&pageSize=500&sortBy=scheduledTo&sortDir=asc", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      setPosts((data?.items || []).filter((item: SocialPost) => item.scheduledTo));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const days = useMemo(() => {
    const start = startOfGrid(cursor);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [cursor]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, SocialPost[]>();
    for (const post of posts) {
      if (!post.scheduledTo) continue;
       const key = localDateKey(new Date(post.scheduledTo));
      const list = map.get(key) || [];
      list.push(post);
      map.set(key, list);
    }
    return map;
  }, [posts]);

  const currentMonthPosts = useMemo(() => posts.filter((post) => {
    if (!post.scheduledTo) return false;
    const date = new Date(post.scheduledTo);
    return date.getFullYear() === cursor.getFullYear() && date.getMonth() === cursor.getMonth();
  }), [posts, cursor]);

  const statusCounts = useMemo(() => currentMonthPosts.reduce((acc, post) => {
    acc[post.status] = (acc[post.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>), [currentMonthPosts]);

  const requeueExpired = async () => {
    if (!confirm("Reagendar todas as publicações vencidas e com falha? Os vídeos serão mantidos e voltarão para a fila em intervalos de 3 horas.")) return;
    setRequeueLoading(true);
    setNotice(null);
    try {
      const res = await fetch("/api/social/posts/requeue", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Não foi possível reagendar");
      setNotice(data.count ? `${data.count} publicação(ões) reagendada(s) em intervalos de 3 horas.` : "Não há publicações vencidas para reagendar.");
      await fetchPosts();
    } catch (error: any) {
      setNotice(error.message || "Falha ao reagendar publicações");
    } finally {
      setRequeueLoading(false);
    }
  };

  const handleItemClick = (post: SocialPost) => {
    setSelectedPost(post);
    if (post.scheduledTo) {
      const d = new Date(post.scheduledTo);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      setEditDate(`${yyyy}-${mm}-${dd}`);
      setEditTime(`${hh}:${min}`);
    } else {
      setEditDate("");
      setEditTime("");
    }
    setEditStatus(post.status);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!selectedPost) return;
    setSaving(true);
    try {
      let newScheduledTo: string | null = null;
      if (editDate && editTime) {
        newScheduledTo = new Date(`${editDate}T${editTime}:00`).toISOString();
      }
      
      const res = await fetch(`/api/social/posts/${selectedPost.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledTo: newScheduledTo,
          status: editStatus
        })
      });
      if (!res.ok) throw new Error("Erro ao salvar alterações");
      
      await fetchPosts();
      setShowModal(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPost) return;
    if (!confirm("Tem certeza que deseja excluir esta postagem da fila?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/social/posts/${selectedPost.id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Erro ao excluir postagem");
      
      await fetchPosts();
      setShowModal(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-[1500px] mx-auto px-4 py-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-indigo-600" />
            Calendário Social
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Visualize e reagende seus vídeos programados para publicação nas redes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={requeueExpired}
            disabled={requeueLoading}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-black text-white bg-indigo-600 border border-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-60 shadow-sm"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${requeueLoading ? "animate-spin" : ""}`} />
            {requeueLoading ? "Reagendando..." : "Reaproveitar vencidos"}
          </button>
          <button
            onClick={() => setCursor((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
            className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm"
          >
            ← Mês anterior
          </button>
          <button
            onClick={() => setCursor((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
            className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm"
          >
            Próximo mês →
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6 text-[11px] font-bold text-slate-500">
        <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">{currentMonthPosts.length} neste mês</span>
        <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700">{statusCounts.FAILED || 0} falharam</span>
        <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">{posts.filter(p => p.status === "SCHEDULED" && p.scheduledTo && new Date(p.scheduledTo) <= new Date()).length} vencidas</span>
      </div>

      {notice ? (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-800">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-indigo-500 hover:text-indigo-800" aria-label="Fechar aviso"><X className="w-4 h-4" /></button>
        </div>
      ) : null}

      {/* Legend & Summary Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-slate-50 border border-slate-200/80 p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <strong className="text-slate-800 font-extrabold text-base">{monthLabel(cursor)}</strong>
          <span className="text-slate-400">|</span>
          <span className="text-slate-500 text-xs font-bold">
            {loading ? "Carregando agenda..." : `${posts.length} publicação(ões) agendada(s)`}
          </span>
        </div>
        
        {/* Colors Legend */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Legenda:</span>
          {Object.entries(PLATFORM_CONFIG).map(([key, value]) => {
            const Icon = value.icon;
            return (
              <span key={key} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-black ${value.bg} ${value.border} ${value.text}`}>
                <Icon className="w-3 h-3" />
                {value.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-3 mb-10">
        {/* Week Days Headers */}
        {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((label) => (
          <div key={label} className="text-xs font-black text-slate-400 uppercase tracking-widest px-2 py-1">
            {label}
          </div>
        ))}

        {/* Days cells */}
        {days.map((day) => {
           const key = localDateKey(day);
          const items = eventsByDay.get(key) || [];
          const isCurrentMonth = day.getMonth() === cursor.getMonth();
          const isToday = new Date().toDateString() === day.toDateString();

          return (
            <div
              key={key}
              className={`min-h-[160px] p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                isToday 
                  ? "bg-indigo-50/20 border-indigo-300 ring-2 ring-indigo-500/10 shadow-sm" 
                  : isCurrentMonth 
                    ? "bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-md hover:shadow-slate-100" 
                    : "bg-slate-50/40 border-slate-100 text-slate-400 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-black rounded-lg w-6 h-6 flex items-center justify-center ${
                  isToday 
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" 
                    : isCurrentMonth ? "text-slate-700" : "text-slate-400"
                }`}>
                  {day.getDate()}
                </span>
                {items.length > 0 && (
                  <span className="text-[9px] font-black uppercase bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                    {items.length} Post{items.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[110px] scrollbar-thin">
                {items.map((item) => {
                  const cfg = PLATFORM_CONFIG[item.platform.toUpperCase()] || {
                    bg: "bg-slate-50",
                    border: "border-slate-200",
                    text: "text-slate-700",
                    icon: Share2
                  };
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`w-full text-left p-2 rounded-xl border text-[11px] font-medium leading-relaxed transition-all hover:scale-[1.02] shadow-sm flex flex-col justify-between gap-1 ${cfg.bg} ${cfg.border} ${cfg.text}`}
                    >
                      <div className="flex items-center justify-between gap-1 font-bold">
                        <span className="uppercase tracking-tighter text-[9px] font-black">{item.postType || "REEL"}</span>
                        <span>{new Date(item.scheduledTo!).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <div className="line-clamp-2 text-[10px] leading-tight font-semibold text-slate-800">
                        {item.summary}
                      </div>
                    </button>
                  );
                })}
                {items.length === 0 && (
                  <div className="text-[10px] text-slate-300 italic pt-1">Vazio</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Popup Detalhes */}
      {showModal && selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <span>Publicação Detalhada</span>
                  <span className={`px-2 py-0.5 rounded-lg border text-[10px] uppercase font-black ${
                    STATUS_LABELS[selectedPost.status]?.color || "bg-slate-100 text-slate-700"
                  }`}>
                    {STATUS_LABELS[selectedPost.status]?.label || selectedPost.status}
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">ID: {selectedPost.id}</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-slate-200 text-slate-500 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Info & Video Player */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Legenda / Sumário</h4>
                  <p className="text-xs text-slate-700 leading-relaxed font-semibold max-h-32 overflow-y-auto bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                    {selectedPost.summary || "Sem legenda."}
                  </p>
                </div>

                {selectedPost.videoUrl ? (
                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Vídeo Ingerido</h4>
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 aspect-[9/16] max-h-60 mx-auto flex items-center justify-center">
                      <video 
                        src={selectedPost.videoUrl} 
                        controls 
                        className="h-full object-contain"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <h5 className="text-xs font-bold text-amber-800">Vídeo não encontrado</h5>
                      <p className="text-[10px] text-amber-600 leading-relaxed mt-0.5">
                        Esta publicação não possui URL de vídeo associada.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Rescheduling Controls & Logs */}
              <div className="space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Plat / Type details */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Plataforma</span>
                      <strong className="text-slate-800 text-xs font-extrabold">{selectedPost.platform}</strong>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Tipo de Post</span>
                      <strong className="text-slate-800 text-xs font-extrabold">{selectedPost.postType || "REEL"}</strong>
                    </div>
                  </div>

                  {/* Rescheduling Form */}
                  <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <h4 className="text-xs font-black text-slate-600 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Reagendar Postagem
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Data</label>
                        <input 
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="w-full text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Hora</label>
                        <input 
                          type="time"
                          value={editTime}
                          onChange={(e) => setEditTime(e.target.value)}
                          className="w-full text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status controls */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Alterar Status</h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditStatus("DRAFT")}
                        className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          editStatus === "DRAFT" 
                            ? "bg-slate-200 text-slate-800 border-slate-300 shadow-sm" 
                            : "bg-white text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        <Pause className="w-3.5 h-3.5" /> Pausar (Rascunho)
                      </button>
                      <button
                        onClick={() => setEditStatus("SCHEDULED")}
                        className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          editStatus === "SCHEDULED" 
                            ? "bg-indigo-600 text-white border-indigo-700 shadow-lg shadow-indigo-600/20" 
                            : "bg-white text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        <Play className="w-3.5 h-3.5" /> Agendar
                      </button>
                    </div>
                  </div>

                  {/* Post log (in case of error or info) */}
                  {selectedPost.log && (
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Histórico / Logs</h4>
                      <p className="text-[10px] font-mono text-slate-500 bg-slate-900 text-slate-200 p-2.5 rounded-xl max-h-24 overflow-y-auto leading-relaxed border border-slate-800">
                        {selectedPost.log}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer Controls inside Right Column */}
                <div className="pt-4 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-xl font-bold text-xs shadow-md shadow-indigo-600/10 flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all"
                    >
                      <Check className="w-4 h-4" /> {saving ? "Salvando..." : "Salvar Alterações"}
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl border border-rose-100/50 hover:border-transparent transition-all disabled:opacity-50"
                      title="Excluir Postagem"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Link to Social Queue */}
                  <Link
                    href={`/admin/social?q=${selectedPost.id}`}
                    className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Ver na Fila Social
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
