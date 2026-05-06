"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Play, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RefreshCcw,
  Zap,
  Info,
  Trash2,
  Ban
} from "lucide-react";

type TaskRunStep = {
  id: string;
  stepKey: string;
  stepOrder: number;
  status: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  outputJson?: string;
  errorMessage?: string | null;
};

type TaskRunItem = {
  id: string;
  triggerType: string;
  status: string;
  createdAt: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  errorMessage?: string | null;
  summary?: string | null;
  task: {
    id: string;
    name: string;
    slug: string;
    type: string;
    status: string;
  };
  steps: TaskRunStep[];
};

export default function TaskRunsPage() {
  const router = useRouter();
  const [items, setItems] = useState<TaskRunItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/task-runs?limit=50", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Falha ao carregar execuções");
      setItems(data.items || []);
    } catch (err: any) {
      setError(err?.message || "Falha ao carregar execuções");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-refresh when there's a running task
  useEffect(() => {
    const hasRunning = items.some(item => item.status === "RUNNING" || item.status === "PENDING");
    if (hasRunning || processing) {
      const timer = setInterval(() => load(true), 3000);
      return () => clearInterval(timer);
    }
  }, [items, processing, load]);

  const processOne = async () => {
    setProcessing(true);
    setError(null);
    try {
      const res = await fetch("/api/task-runs/process", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({}) 
      });
      const data = await res.json();
      if (!res.ok || data?.ok === false) throw new Error(data?.error || "Falha ao processar execução");
      await load(true);
    } catch (err: any) {
      setError(err?.message || "Falha ao processar execução");
    } finally {
      setProcessing(false);
    }
  };

  const cancelRun = async (id: string) => {
    if (!confirm("Cancelar esta execução? Steps em andamento serão marcados como ignorados.")) return;
    try {
      const res = await fetch(`/api/task-runs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      if (!res.ok) throw new Error("Falha ao cancelar");
      await load(true);
    } catch (err: any) {
      setError(err?.message || "Falha ao cancelar execução");
    }
  };

  const deleteRun = async (id: string) => {
    if (!confirm("Excluir permanentemente esta execução? Esta ação não pode ser desfeita.")) return;
    try {
      const res = await fetch(`/api/task-runs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao excluir");
      setExpandedId(null);
      await load(true);
    } catch (err: any) {
      setError(err?.message || "Falha ao excluir execução");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED": return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case "FAILED": return <XCircle className="w-4 h-4 text-rose-400" />;
      case "RUNNING": return <RefreshCcw className="w-4 h-4 text-blue-400 animate-spin" />;
      case "PENDING": return <Clock className="w-4 h-4 text-amber-400" />;
      default: return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "FAILED": return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "RUNNING": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "PENDING": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">
            Execuções
          </h1>
          <p className="text-slate-400 text-lg">
            Monitoramento em tempo real das automações e pipelines de conteúdo.
          </p>
        </div>
        
        <button
          onClick={processOne}
          disabled={processing}
          className={`
            group relative flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 
            disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl
            transition-all duration-300 shadow-lg shadow-blue-900/20 hover:scale-[1.02] active:scale-[0.98]
          `}
        >
          {processing ? (
            <RefreshCcw className="w-5 h-5 animate-spin" />
          ) : (
            <Play className="w-5 h-5 fill-current" />
          )}
          <span>{processing ? "PROCESSANDO..." : "PROCESSAR PENDENTE"}</span>
          <div className="absolute -inset-0.5 bg-blue-400/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-300"></div>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 animate-in slide-in-from-top-4 duration-300">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="font-medium">{error}</p>
          {error.includes("VIDEO_RENDER_SERVICE_URL") && (
            <div className="ml-auto text-sm bg-rose-500/20 px-3 py-1 rounded-full">
              Dica: Verifique o .env e reinicie o servidor
            </div>
          )}
        </div>
      )}

      {/* Main Table Content */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-[2rem] blur-2xl opacity-50 group-hover:opacity-75 transition duration-500"></div>
        
        <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Tarefa / ID</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Trigger</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Tempo</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Progresso</th>
                  <th className="px-6 py-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((item) => (
                  <>
                    <tr 
                      key={item.id}
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      className={`
                        group/row cursor-pointer transition-colors duration-200
                        ${expandedId === item.id ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'}
                      `}
                    >
                      <td className="px-6 py-6">
                        <div className="font-bold text-white group-hover/row:text-blue-400 transition-colors">
                          {item.task.name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 mt-1 uppercase tracking-tighter">
                          {item.id}
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <span className={`
                          inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border
                          ${getStatusStyles(item.status)}
                        `}>
                          {getStatusIcon(item.status)}
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-6">
                        <span className="text-sm text-slate-300 font-medium">{item.triggerType}</span>
                      </td>
                      <td className="px-6 py-6">
                        <div className="text-sm text-slate-300">
                          {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {new Date(item.createdAt).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex -space-x-1">
                          {item.steps.map((step) => (
                            <div 
                              key={step.id}
                              title={`${step.stepKey}: ${step.status}`}
                              className={`
                                w-2.5 h-2.5 rounded-full border border-slate-900 transition-transform hover:scale-125 hover:z-10
                                ${step.status === 'COMPLETED' ? 'bg-emerald-500' : 
                                  step.status === 'FAILED' ? 'bg-rose-500' : 
                                  step.status === 'RUNNING' ? 'bg-blue-500 animate-pulse' : 'bg-slate-700'}
                              `}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-6 text-right">
                        {expandedId === item.id ? (
                          <ChevronUp className="w-5 h-5 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-500 group-hover/row:text-white transition-colors" />
                        )}
                      </td>
                    </tr>
                    
                    {/* Expanded Content */}
                    {expandedId === item.id && (
                      <tr className="bg-slate-950/50 border-t border-white/5">
                        <td colSpan={6} className="px-6 py-8">
                          <div className="space-y-6">
                            {/* Action Buttons */}
                            <div className="flex items-center gap-3">
                              {(item.status === "PENDING" || item.status === "RUNNING") && (
                                <button
                                  onClick={() => cancelRun(item.id)}
                                  className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 text-xs font-bold rounded-xl transition-all duration-200"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  Cancelar Execução
                                </button>
                              )}
                              {(item.status === "COMPLETED" || item.status === "FAILED" || item.status === "CANCELED") && (
                                <button
                                  onClick={() => deleteRun(item.id)}
                                  className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-xl transition-all duration-200"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Excluir Execução
                                </button>
                              )}
                              <span className="text-xs text-slate-600 font-mono">{item.id}</span>
                            </div>

                            {/* Run Summary / Error */}
                            {(item.summary || item.errorMessage) && (
                              <div className={`p-4 rounded-2xl border ${item.errorMessage ? 'bg-rose-500/5 border-rose-500/20 text-rose-300' : 'bg-blue-500/5 border-blue-500/20 text-blue-300'}`}>
                                <div className="flex items-start gap-3">
                                  {item.errorMessage ? <AlertCircle className="w-5 h-5 shrink-0" /> : <Info className="w-5 h-5 shrink-0" />}
                                  <div>
                                    <div className="text-xs font-black uppercase tracking-widest mb-1">
                                      {item.errorMessage ? 'Mensagem de Erro' : 'Sumário da Execução'}
                                    </div>
                                    <p className="text-sm leading-relaxed">{item.errorMessage || item.summary}</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Steps Visual Log */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {item.steps.map((step) => (
                                <div 
                                  key={step.id}
                                  className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 transition-all hover:bg-white/[0.04]"
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                      <div className="text-xs font-black text-slate-500">{step.stepOrder}</div>
                                      <div className="font-bold text-slate-200">{step.stepKey}</div>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusStyles(step.status)}`}>
                                      {step.status}
                                    </span>
                                  </div>

                                  {step.outputJson && (
                                    <div className="relative mt-2">
                                      <div className="text-[10px] text-slate-500 mb-1 font-bold uppercase tracking-widest flex items-center gap-2">
                                        <Zap className="w-3 h-3 text-blue-400" />
                                        Log / Output
                                      </div>
                                      <pre className="text-[11px] font-mono text-blue-300/80 bg-blue-500/[0.03] p-3 rounded-xl overflow-x-auto max-h-40 border border-blue-500/10">
                                        {(() => {
                                          try {
                                            const parsed = JSON.parse(step.outputJson);
                                            // Limpa campos muito grandes para o log
                                            if (parsed.items) parsed.items = `Array(${parsed.items.length})`;
                                            return JSON.stringify(parsed, null, 2);
                                          } catch {
                                            return step.outputJson;
                                          }
                                        })()}
                                      </pre>
                                    </div>
                                  )}

                                  {step.errorMessage && (
                                    <div className="mt-2 text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                                      <div className="font-bold mb-1">ERRO:</div>
                                      {step.errorMessage}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}

                {!loading && items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-32 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center">
                          <Clock className="w-8 h-8 text-slate-600" />
                        </div>
                        <div className="text-slate-500 font-medium">Nenhuma execução registrada.</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
