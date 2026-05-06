"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type TaskListItem = {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  isEnabled: boolean;
  priority: number;
  nextRunAt?: string | null;
  lastRunAt?: string | null;
  updatedAt: string;
  runs?: Array<{
    id: string;
    status: string;
    createdAt: string;
    finishedAt?: string | null;
    errorMessage?: string | null;
  }>;
};

export default function TasksPage() {
  const [items, setItems] = useState<TaskListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [type, setType] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const load = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const query = new URLSearchParams();
      if (q.trim()) query.set("q", q.trim());
      if (type !== "ALL") query.set("type", type);
      if (status !== "ALL") query.set("status", status);

      const res = await fetch(`/api/tasks?${query.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Falha ao carregar tasks");
      setItems(data.items || []);
    } catch (error: any) {
      setMessage({ type: "error", text: error?.message || "Falha ao carregar tasks" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const deleteTask = async (id: string) => {
    if (!window.confirm("Excluir esta task? Essa ação remove também as execuções relacionadas.")) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Falha ao excluir task");
      setMessage({ type: "success", text: "Task excluída com sucesso." });
      await load();
    } catch (error: any) {
      setMessage({ type: "error", text: error?.message || "Falha ao excluir task" });
    }
  };

  const runTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}/run`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Falha ao criar execução");
      setMessage({ type: "success", text: `Execução criada: ${data.id}` });
      await load();
    } catch (error: any) {
      setMessage({ type: "error", text: error?.message || "Falha ao criar execução" });
    }
  };

  return (
    <div className="space-y-8 animate-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-indigo-400">
            <div className="w-8 h-1 bg-indigo-500 rounded-full" />
            <span className="text-xs font-black uppercase tracking-widest">Automation Engine</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">Tasks</h1>
          <p className="text-slate-400 text-sm max-w-xl">
            Gerencie as automações do sistema. Novos fluxos de IA devem ser configurados aqui.
          </p>
        </div>
        <Link 
          href="/admin/tasks/new"
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-indigo-500/20 active:scale-95 text-center whitespace-nowrap"
        >
          Nova Task
        </Link>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`p-4 rounded-2xl border ${
          message.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
          message.type === "error" ? "bg-red-500/10 border-red-500/20 text-red-400" :
          "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
        }`}>
          <p className="text-sm font-bold">{message.text}</p>
        </div>
      )}

      {/* Filters Section */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Busca</label>
            <input 
              type="text" 
              placeholder="Nome ou slug..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              value={q} 
              onChange={(e) => setQ(e.target.value)} 
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Tipo</label>
            <select 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none"
              value={type} 
              onChange={(e) => setType(e.target.value)}
            >
              <option value="ALL">Todos os Tipos</option>
              {["NEWS_VIDEO", "QA_VIDEO", "MERCADO_LIVRE_VIDEO", "SHOPEE_VIDEO"].map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Status</label>
            <select 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none"
              value={status} 
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="ALL">Qualquer Status</option>
              {["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"].map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={load} 
            disabled={loading}
            className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? "Carregando..." : "Aplicar Filtros"}
          </button>
          <button 
            onClick={() => { setQ(""); setType("ALL"); setStatus("ALL"); }}
            className="px-5 py-2 text-slate-400 hover:text-white text-sm font-bold rounded-xl transition-colors"
          >
            Limpar
          </button>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-[10px] uppercase tracking-widest text-slate-400 font-black">
                <th className="px-6 py-4">Task Info</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Status / Power</th>
                <th className="px-6 py-4">Última Execução</th>
                <th className="px-6 py-4">Próxima</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <Link href={`/admin/tasks/${item.id}`} className="font-bold text-slate-200 group-hover:text-white transition-colors">
                        {item.name}
                      </Link>
                      <span className="text-[10px] text-slate-500 font-mono mt-1">{item.slug}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black text-indigo-400 tracking-tighter bg-indigo-500/5 px-2 py-1 rounded border border-indigo-500/10">
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase
                        ${item.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-400"}`}>
                        {item.status}
                      </span>
                      <span className={`w-2 h-2 rounded-full ${item.isEnabled ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-xs font-mono">
                    {item.runs?.[0]?.createdAt ? new Date(item.runs[0].createdAt).toLocaleString("pt-BR") : "—"}
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-xs font-mono">
                    {item.nextRunAt ? new Date(item.nextRunAt).toLocaleString("pt-BR") : "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link 
                        href={`/admin/tasks/${item.id}`}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-black rounded-lg transition-all"
                      >
                        EDITAR
                      </Link>
                      <button 
                        onClick={() => runTask(item.id)}
                        className="px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 text-[10px] font-black rounded-lg transition-all active:scale-95"
                      >
                        RUN NOW
                      </button>
                      <button 
                        onClick={() => deleteTask(item.id)}
                        className="px-3 py-1.5 hover:bg-red-500/10 text-red-500/60 hover:text-red-500 text-[10px] font-black rounded-lg transition-all"
                      >
                        DELETE
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">
                    Nenhuma task encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

