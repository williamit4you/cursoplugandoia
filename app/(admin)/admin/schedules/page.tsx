"use client";

import { useEffect, useState } from "react";
import { Alert } from "@mui/material";
import { Clock, Calendar, RefreshCcw, Filter, ExternalLink, Play } from "lucide-react";

type ScheduleItem = {
  id: string;
  status: string;
  platform: string;
  postType: string;
  scheduledTo: string | null;
  postedAt: string | null;
  summary: string;
  videoUrl: string;
  thumbUrl: string | null;
  postUrl: string | null;
  automationTaskId: string | null;
  automationTaskRunId: string | null;
  createdAt: string;
};

export default function SchedulesPage() {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState("ALL");
  const [platform, setPlatform] = useState("ALL");

  const load = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const qs = new URLSearchParams({ page: "1", pageSize: "100", status, platform });
      const res = await fetch(`/api/schedules?${qs.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Falha ao carregar agendamentos");
      setItems(data.items || []);
    } catch (error: any) {
      setMessage(error?.message || "Falha ao carregar agendamentos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            Agendamentos
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Posts sociais criados automaticamente que estão agendados ou já foram publicados.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm disabled:opacity-50"
          title="Atualizar"
        >
          <RefreshCcw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {message && (
        <Alert severity="error" className="rounded-xl shadow-sm border border-rose-200/50">
          {message}
        </Alert>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-11 pr-4 appearance-none focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 focus:bg-white text-xs font-medium text-slate-700"
          >
            <option value="ALL">Todos os Status</option>
            {["DRAFT", "SCHEDULED", "POSTED", "FAILED", "PROCESSING_MEDIA"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-11 pr-4 appearance-none focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 focus:bg-white text-xs font-medium text-slate-700"
          >
            <option value="ALL">Todas as Plataformas</option>
            {["META", "YOUTUBE", "TIKTOK", "LINKEDIN"].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <button
          onClick={load}
          disabled={loading}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/10 transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
          ) : (
            "FILTRAR AGENDAMENTOS"
          )}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/60 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-6 py-4">Agendado</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Plataforma / Canal</th>
                <th className="px-6 py-4">Resumo & Link</th>
                <th className="px-6 py-4 text-right">Task Run ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading && items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex justify-center items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                      Carregando...
                    </div>
                  </td>
                </tr>
              )}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                    Nenhum agendamento encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/30 transition-colors group">
                  {/* Agendado */}
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600 text-xs font-semibold">
                    {item.scheduledTo ? (
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(item.scheduledTo).toLocaleString("pt-BR")}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight
                      ${item.status === "POSTED" 
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" 
                        : item.status === "FAILED"
                        ? "bg-rose-50 text-rose-700 border border-rose-200/60"
                        : "bg-slate-100 text-slate-600 border border-slate-200/60"}`}
                    >
                      {item.status}
                    </span>
                  </td>

                  {/* Plataforma */}
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-1 bg-indigo-50/40 text-indigo-700 text-[10px] font-bold uppercase tracking-tight rounded-lg border border-indigo-100/50">
                      {item.platform} / {item.postType}
                    </span>
                  </td>

                  {/* Resumo & Link */}
                  <td className="px-6 py-4 max-w-md">
                    <div className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {item.summary}
                    </div>
                    {item.videoUrl && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-slate-400 text-xs font-medium">
                        <Play className="w-3.5 h-3.5 text-indigo-500 fill-indigo-50" />
                        <a 
                          href={item.videoUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="hover:underline hover:text-indigo-600 truncate max-w-xs"
                        >
                          {item.videoUrl}
                        </a>
                      </div>
                    )}
                    {item.postUrl && (
                      <div className="flex items-center gap-1.5 mt-1 text-slate-400 text-xs font-medium">
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-500" />
                        <a 
                          href={item.postUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="hover:underline hover:text-emerald-600 font-bold"
                        >
                          Ver publicação original
                        </a>
                      </div>
                    )}
                  </td>

                  {/* Task Run ID */}
                  <td className="px-6 py-4 text-right">
                    <div className="font-mono text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded px-2.5 py-1 inline-block">
                      {item.automationTaskRunId ? item.automationTaskRunId.slice(0, 12) + "..." : "—"}
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
