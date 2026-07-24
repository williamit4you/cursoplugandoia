"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RefreshIcon from '@mui/icons-material/Refresh';

type Operation = {
  key: string;
  name: string;
  family: string;
  description?: string | null;
  status: string;
  lastRun?: {
    startedAt: string;
    heartbeatAt: string;
    itemsProcessed: number;
    itemsFailed: number;
    estimatedCostUsd: number;
    errorMessage?: string | null;
  } | null;
};

type Overview = {
  operations: Operation[];
  queues: { socialDue: number; socialFuture: number; socialProcessing: number; socialFailed: number; socialPostedToday: number; oldestSocial?: { createdAt: string; platform: string; status: string } | null };
  summary: { total: number; healthy: number; attention: number; failed: number; disabled?: number; runningNow?: number };
  familySummary?: Array<{ family: string; total: number; healthy: number; attention: number; failed: number; disabled: number; runningNow: number }>;
  alerts?: { id: string; severity: string; title: string; message: string; actionUrl?: string | null }[];
  costs?: { estimatedCostTodayUsd: number; dailyLimitUsd?: number | null; withinLimit?: boolean };
  checklist?: {
    noCriticalAlerts: boolean;
    noOverdueQueue: boolean;
    freshHeartbeats: boolean;
    integrationsActive: boolean;
    videosAccountedFor: boolean;
    articlesReceivingVisits: boolean;
    failuresReviewed: boolean;
  };
  checklistDetails?: {
    overdueSocial?: number;
    staleOperations?: string[];
    inactiveIntegrations?: string[];
  };
};

const statusStyles: Record<string, string> = {
  OK: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  ATTENTION: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  STALE: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  FAILED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  DISABLED: "bg-slate-800 text-slate-400 border-slate-700",
};

const statusGlow: Record<string, string> = {
  OK: "shadow-[0_0_15px_rgba(52,211,153,0.15)]",
  ATTENTION: "shadow-[0_0_15px_rgba(251,191,36,0.15)]",
  STALE: "shadow-[0_0_15px_rgba(251,191,36,0.15)]",
  FAILED: "shadow-[0_0_15px_rgba(244,63,94,0.15)]",
  DISABLED: "",
};

function statusLabel(status: string) {
  return { OK: "Saudável", ATTENTION: "Atenção", STALE: "Sem heartbeat", FAILED: "Falha", DISABLED: "Desligada" }[status] || status;
}

function formatTime(value?: string) {
  if (!value) return "Nunca executou";
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default function OperationsOverview() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const runningOperations = (data?.operations || []).filter((operation) => String((operation.lastRun as any)?.status || "") === "RUNNING");

  const checklistItems = data?.checklist ? [
    {
      key: "noCriticalAlerts",
      label: "Sem alerta crítico",
      ok: data.checklist.noCriticalAlerts,
      detail: data.alerts?.length ? `${data.alerts.length} alerta(s) aberto(s)` : "Nenhum alerta aberto",
    },
    {
      key: "noOverdueQueue",
      label: "Fila social no prazo",
      ok: data.checklist.noOverdueQueue,
      detail: `${data?.checklistDetails?.overdueSocial ?? 0} item(ns) vencido(s)`,
    },
    {
      key: "freshHeartbeats",
      label: "Heartbeat recente",
      ok: data.checklist.freshHeartbeats,
      detail: data?.checklistDetails?.staleOperations?.length ? data.checklistDetails.staleOperations.join(", ") : "Nenhuma operação stale",
    },
    {
      key: "integrationsActive",
      label: "Integrações ativas",
      ok: data.checklist.integrationsActive,
      detail: data?.checklistDetails?.inactiveIntegrations?.length ? data.checklistDetails.inactiveIntegrations.join(", ") : "Todas ativas",
    },
    {
      key: "failuresReviewed",
      label: "Falhas revisadas",
      ok: data.checklist.failuresReviewed,
      detail: `${data?.queues.socialFailed ?? 0} falha(s) pendente(s)`,
    },
    {
      key: "costsWithinLimit",
      label: "Custo no limite",
      ok: data?.costs?.withinLimit ?? true,
      detail: data?.costs?.dailyLimitUsd ? `US$ ${Number(data.costs.estimatedCostTodayUsd || 0).toFixed(2)} / US$ ${Number(data.costs.dailyLimitUsd || 0).toFixed(2)}` : `US$ ${Number(data?.costs?.estimatedCostTodayUsd || 0).toFixed(2)} hoje`,
    },
  ] : [];

  const load = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/pipeline/status?view=operations", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Falha ao carregar saúde das operações");
      setData(payload);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Falha ao carregar saúde das operações");
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 30000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 shadow-2xl space-y-8 relative overflow-hidden">
      {/* Decorative gradient blob inside the section */}
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between relative z-10">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.6)]" />
            <h2 className="text-2xl font-black text-white tracking-tight">Central de Operações</h2>
          </div>
          <p className="mt-1.5 text-sm text-slate-400 pl-4.5 font-medium">Monitoramento em tempo real dos processos e filas.</p>
        </div>
        <button 
          onClick={() => void load()} 
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition-all active:scale-95"
        >
          <RefreshIcon fontSize="small" className={`${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
          {isRefreshing ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      {error ? <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-400 backdrop-blur-md shadow-[0_0_20px_rgba(244,63,94,0.1)]">{error}</div> : null}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-7 relative z-10">
        {[
          ["Total", data?.summary.total ?? "-", "text-white"],
          ["Rodando", data?.summary.runningNow ?? "-", "text-indigo-400"],
          ["Saudáveis", data?.summary.healthy ?? "-", "text-emerald-400"],
          ["Atenção", data?.summary.attention ?? "-", "text-amber-400"],
          ["Falhas", data?.summary.failed ?? "-", "text-rose-400"],
          ["Desligadas", data?.summary.disabled ?? "-", "text-slate-500"],
          ["Publicadas", data?.queues.socialPostedToday ?? "-", "text-cyan-400"],
        ].map(([label, value, colorClass]) => (
          <div key={String(label)} className="rounded-2xl border border-white/5 bg-black/20 p-4 hover:bg-white/5 transition-colors">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</div>
            <div className={`mt-2 text-3xl font-black tracking-tighter ${colorClass}`}>{value}</div>
          </div>
        ))}
      </div>

      {data?.familySummary?.length ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 relative z-10">
          <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            Por Família
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.familySummary.map((family) => (
              <div key={family.family} className="rounded-2xl border border-white/5 bg-black/40 px-5 py-4 hover:border-white/10 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-black text-white">{family.family}</div>
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold text-slate-300">{family.total} ops</span>
                </div>
                <div className="mt-3.5 flex flex-wrap gap-2 text-[10px] font-bold">
                  {family.healthy > 0 && <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-emerald-300 border border-emerald-500/20">{family.healthy} ok</span>}
                  {family.attention > 0 && <span className="rounded-full bg-amber-500/20 px-2 py-1 text-amber-300 border border-amber-500/20">{family.attention} alerta</span>}
                  {family.failed > 0 && <span className="rounded-full bg-rose-500/20 px-2 py-1 text-rose-300 border border-rose-500/20">{family.failed} falha</span>}
                  {family.disabled > 0 && <span className="rounded-full bg-slate-800 px-2 py-1 text-slate-400 border border-slate-700">{family.disabled} off</span>}
                  {family.runningNow > 0 && <span className="rounded-full bg-indigo-500/20 px-2 py-1 text-indigo-300 border border-indigo-500/20 animate-pulse">{family.runningNow} on</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {runningOperations.length ? (
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5 relative z-10 shadow-[0_0_30px_rgba(99,102,241,0.05)]">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Rodando Agora</div>
              <div className="mt-1 text-xs font-medium text-indigo-200/70">Operações em execução neste momento</div>
            </div>
            <span className="rounded-full bg-indigo-500 px-3 py-1 text-[10px] font-black text-white animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.5)]">
              {runningOperations.length} ativa(s)
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {runningOperations.map((operation) => (
              <Link
                key={operation.key}
                href={`/admin/operations/${encodeURIComponent(operation.key)}`}
                className="group rounded-2xl border border-indigo-500/30 bg-black/40 px-5 py-4 hover:border-indigo-400 hover:bg-indigo-500/10 transition-all duration-300"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-black text-white group-hover:text-indigo-300 transition-colors">{operation.name}</div>
                  <span className="rounded-full bg-indigo-500/20 px-2 py-1 text-[10px] font-bold text-indigo-300">{operation.family}</span>
                </div>
                <div className="mt-3 text-xs text-slate-400">
                  Início: <strong className="text-slate-200">{formatTime(operation.lastRun?.startedAt)}</strong>
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  Progresso: <strong className="text-indigo-400">{operation.lastRun?.itemsProcessed ?? 0} processados</strong>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 relative z-10">
        {data?.operations.map((operation) => (
          <Link 
            href={`/admin/operations/${encodeURIComponent(operation.key)}`} 
            key={operation.key} 
            className={`block rounded-2xl border bg-black/20 p-5 transition-all duration-300 hover:scale-[1.01] hover:bg-white/5 ${statusStyles[operation.status]?.split(' ')[2] || 'border-white/5'} ${statusGlow[operation.status]}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">{operation.family}</div>
                <h3 className="mt-1.5 text-sm font-black text-white">{operation.name}</h3>
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-[9px] uppercase tracking-wider font-black ${statusStyles[operation.status] || statusStyles.DISABLED}`}>
                {statusLabel(operation.status)}
              </span>
            </div>
            {operation.description && (
              <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-400">{operation.description}</p>
            )}
            <div className="mt-4 pt-4 border-t border-white/5 text-[11px] text-slate-500 flex flex-col gap-1.5">
              <div className="flex justify-between">
                <span>Última execução</span>
                <strong className="text-slate-300">{formatTime(operation.lastRun?.startedAt)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Resultado</span>
                <div className="flex gap-2">
                  <span className="text-emerald-400/80 font-medium">{operation.lastRun?.itemsProcessed ?? 0} proc</span>
                  {operation.lastRun?.itemsFailed ? <span className="text-rose-400/80 font-medium">{operation.lastRun.itemsFailed} falhas</span> : null}
                </div>
              </div>
              {operation.lastRun?.errorMessage ? (
                <div className="mt-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300/90 line-clamp-2 leading-relaxed">
                  {operation.lastRun.errorMessage}
                </div>
              ) : null}
            </div>
          </Link>
        ))}
      </div>

      {checklistItems.length ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 relative z-10">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
              <div className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Checklist Diário</div>
            </div>
            <Link href="/api/operations/daily-report" target="_blank" className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 hover:underline">
              Relatório Completo &rarr;
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {checklistItems.map((item) => (
              <div key={item.key} className={`flex items-start gap-3 rounded-xl border px-4 py-3 backdrop-blur-sm transition-colors ${item.ok ? "border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10" : "border-rose-500/30 bg-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.1)] hover:bg-rose-500/20"}`}>
                <div className={`mt-0.5 w-2 h-2 rounded-full ${item.ok ? "bg-emerald-400" : "bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]"}`} />
                <div>
                  <div className="text-sm font-bold text-white">{item.label}</div>
                  <div className={`mt-1 text-xs font-medium ${item.ok ? "text-emerald-400/70" : "text-rose-300"}`}>{item.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 text-[11px] font-bold relative z-10 p-4 rounded-2xl bg-black/20 border border-white/5">
        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-amber-300">{data?.queues.socialDue ?? "-"} atrasadas</span>
        <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-indigo-300">{data?.queues.socialFuture ?? "-"} agendadas</span>
        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-cyan-300">{data?.queues.socialProcessing ?? "-"} processando</span>
        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-rose-300">{data?.queues.socialFailed ?? "-"} falharam</span>
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-emerald-300">US$ {Number(data?.costs?.estimatedCostTodayUsd || 0).toFixed(2)} hoje</span>
      </div>

      <div className="space-y-2 relative z-10">
        {data?.queues.oldestSocial && (
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Fila mais antiga: <strong className="text-white">{data.queues.oldestSocial.platform}</strong> em {formatTime(data.queues.oldestSocial.createdAt)} ({data.queues.oldestSocial.status})
          </div>
        )}
        {data?.alerts?.map((alert) => (
          <div key={alert.id} className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200 flex items-start gap-2 shadow-[0_0_15px_rgba(251,191,36,0.1)]">
             <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
             <div>
               <strong className="text-amber-400 block mb-0.5">{alert.title}</strong>
               <span className="opacity-90 leading-relaxed">{alert.message}</span>
             </div>
          </div>
        ))}
      </div>
    </section>
  );
}
