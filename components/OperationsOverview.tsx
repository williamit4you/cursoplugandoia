"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
  summary: { total: number; healthy: number; attention: number; failed: number };
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
  OK: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ATTENTION: "bg-amber-50 text-amber-700 border-amber-200",
  STALE: "bg-amber-50 text-amber-700 border-amber-200",
  FAILED: "bg-rose-50 text-rose-700 border-rose-200",
  DISABLED: "bg-slate-100 text-slate-500 border-slate-200",
};

function statusLabel(status: string) {
  return { OK: "Saudavel", ATTENTION: "Atencao", STALE: "Sem heartbeat", FAILED: "Falha", DISABLED: "Desligada" }[status] || status;
}

function formatTime(value?: string) {
  if (!value) return "Nunca executou";
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default function OperationsOverview() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checklistItems = data?.checklist ? [
    {
      key: "noCriticalAlerts",
      label: "Sem alerta critico",
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
      label: "Crons com heartbeat recente",
      ok: data.checklist.freshHeartbeats,
      detail: data?.checklistDetails?.staleOperations?.length ? data.checklistDetails.staleOperations.join(", ") : "Nenhuma operacao stale",
    },
    {
      key: "integrationsActive",
      label: "Integracoes autenticadas",
      ok: data.checklist.integrationsActive,
      detail: data?.checklistDetails?.inactiveIntegrations?.length ? data.checklistDetails.inactiveIntegrations.join(", ") : "Todas ativas",
    },
    {
      key: "failuresReviewed",
      label: "Falhas da fila revisadas",
      ok: data.checklist.failuresReviewed,
      detail: `${data?.queues.socialFailed ?? 0} falha(s) pendente(s)`,
    },
    {
      key: "costsWithinLimit",
      label: "Custo dentro do limite",
      ok: data?.costs?.withinLimit ?? true,
      detail: data?.costs?.dailyLimitUsd ? `US$ ${Number(data.costs.estimatedCostTodayUsd || 0).toFixed(2)} / US$ ${Number(data.costs.dailyLimitUsd || 0).toFixed(2)}` : `US$ ${Number(data?.costs?.estimatedCostTodayUsd || 0).toFixed(2)} hoje`,
    },
  ] : [];

  const load = async () => {
    try {
      const response = await fetch("/api/pipeline/status?view=operations", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Falha ao carregar saude das operacoes");
      setData(payload);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Falha ao carregar saude das operacoes");
    }
  };

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 30000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-indigo-600">Central de operacoes</p>
          <h2 className="mt-1 text-xl font-black text-slate-900">O que esta acontecendo agora</h2>
          <p className="mt-1 text-sm text-slate-500">Saude dos processos, filas e publicacoes em uma unica visao.</p>
        </div>
        <button onClick={() => void load()} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50">Atualizar</button>
      </div>

      {error ? <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-800">{error}</div> : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          ["Operacoes", data?.summary.total ?? "-"],
          ["Saudaveis", data?.summary.healthy ?? "-"],
          ["Atencao", data?.summary.attention ?? "-"],
          ["Falhas", data?.summary.failed ?? "-"],
          ["Publicadas hoje", data?.queues.socialPostedToday ?? "-"],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</div>
            <div className="mt-1 text-2xl font-black text-slate-900">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data?.operations.map((operation) => (
          <Link href={`/admin/operations/${encodeURIComponent(operation.key)}`} key={operation.key} className="block rounded-2xl border border-slate-200 bg-white p-4 hover:border-indigo-200 hover:shadow-sm transition">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">{operation.family}</div>
                <h3 className="mt-1 text-sm font-black text-slate-900">{operation.name}</h3>
              </div>
              <span className={`rounded-full border px-2 py-1 text-[10px] font-black ${statusStyles[operation.status] || statusStyles.DISABLED}`}>{statusLabel(operation.status)}</span>
            </div>
            <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-500">{operation.description}</p>
            <div className="mt-3 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
              <div>Ultima execucao: <strong className="text-slate-700">{formatTime(operation.lastRun?.startedAt)}</strong></div>
              <div className="mt-1">Processados: <strong className="text-slate-700">{operation.lastRun?.itemsProcessed ?? 0}</strong> | Falhas: <strong className="text-slate-700">{operation.lastRun?.itemsFailed ?? 0}</strong></div>
              {operation.lastRun?.errorMessage ? <div className="mt-2 line-clamp-2 text-rose-700">{operation.lastRun.errorMessage}</div> : null}
            </div>
          </Link>
        ))}
      </div>

      {checklistItems.length ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Checklist diario</div>
              <div className="mt-1 text-sm font-black text-slate-900">Leitura rapida da operacao</div>
            </div>
            <Link href="/api/operations/daily-report" target="_blank" className="text-xs font-black text-indigo-600 hover:underline">Abrir relatorio diario</Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {checklistItems.map((item) => (
              <div key={item.key} className={`rounded-2xl border px-3 py-3 ${item.ok ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>
                <div className={`text-[10px] font-black uppercase tracking-wider ${item.ok ? "text-emerald-700" : "text-rose-700"}`}>{item.ok ? "OK" : "Acao"}</div>
                <div className="mt-1 text-sm font-black text-slate-900">{item.label}</div>
                <div className={`mt-2 text-xs ${item.ok ? "text-emerald-800" : "text-rose-800"}`}>{item.detail}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-600">
        <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-800">{data?.queues.socialDue ?? "-"} publicacoes vencidas</span>
        <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-indigo-800">{data?.queues.socialFuture ?? "-"} agendadas</span>
        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">{data?.queues.socialProcessing ?? "-"} processando</span>
        <span className="rounded-full bg-rose-50 px-3 py-1.5 text-rose-800">{data?.queues.socialFailed ?? "-"} falharam</span>
        <span className="rounded-full bg-cyan-50 px-3 py-1.5 text-cyan-800">US$ {Number(data?.costs?.estimatedCostTodayUsd || 0).toFixed(2)} estimados hoje</span>
      </div>

      {data?.queues.oldestSocial ? <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">Item mais antigo na fila: <strong>{data.queues.oldestSocial.platform}</strong> em {formatTime(data.queues.oldestSocial.createdAt)} ({data.queues.oldestSocial.status}).</div> : null}
      {data?.alerts?.length ? <div className="space-y-2">{data.alerts.map((alert) => <div key={alert.id} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"><strong>{alert.title}</strong>: {alert.message}</div>)}</div> : null}
    </section>
  );
}
