"use client";

import { useEffect, useMemo, useState } from "react";

type TriggerStep = {
  id: string;
  stepKey: string;
  stepOrder: number;
  status: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  errorMessage?: string | null;
  outputJson?: string | null;
};

type TriggerRun = {
  id: string;
  status: string;
  summary?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  steps: TriggerStep[];
};

function fmtDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("pt-BR");
}

function statusTone(status: string) {
  if (status === "COMPLETED") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "FAILED") return "border-rose-200 bg-rose-50 text-rose-700";
  if (status === "RUNNING") return "border-sky-200 bg-sky-50 text-sky-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function stepLabel(stepKey: string) {
  if (stepKey === "BUTTON_CLICKED") return "Botao acionado";
  if (stepKey === "WAITING_WORKER") return "Aguardando worker";
  return stepKey;
}

export default function QuickScrapeTestButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [kind, setKind] = useState<"success" | "error" | "info">("info");
  const [runs, setRuns] = useState<TriggerRun[]>([]);
  const [logsOpen, setLogsOpen] = useState(false);
  const [pollEnabled, setPollEnabled] = useState(false);

  const loadRuns = async () => {
    const res = await fetch("/api/worker/trigger/status?limit=5", { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Falha ao carregar status do teste");
    setRuns(Array.isArray(data.items) ? data.items : []);
    return Array.isArray(data.items) ? data.items : [];
  };

  useEffect(() => {
    loadRuns().catch(() => null);
  }, []);

  useEffect(() => {
    if (!pollEnabled) return;
    const timer = window.setInterval(async () => {
      const nextRuns = await loadRuns().catch(() => []);
      const hasRunning = Array.isArray(nextRuns) && nextRuns.some((item) => item.status === "RUNNING");
      if (!hasRunning) setPollEnabled(false);
    }, 2500);
    return () => window.clearInterval(timer);
  }, [pollEnabled]);

  const latestRun = runs[0] || null;
  const hasRunning = useMemo(() => runs.some((run) => run.status === "RUNNING"), [runs]);

  const run = async () => {
    setLoading(true);
    setMessage(null);
    setLogsOpen(true);
    try {
      const res = await fetch("/api/worker/trigger", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Falha ao disparar teste do scraper");
      }
      setKind("success");
      setMessage("Teste manual disparado. Abaixo voce consegue acompanhar cada etapa e saber quando o worker consumiu o gatilho.");
      await loadRuns();
      setPollEnabled(true);
    } catch (error: any) {
      setKind("error");
      setMessage(error?.message || "Falha ao disparar teste do scraper");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={run}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700 transition-all hover:bg-emerald-100 disabled:opacity-50"
        >
          {loading ? "Disparando teste..." : "Rodar teste rapido de scrape"}
        </button>
        <button
          onClick={() => setLogsOpen((value) => !value)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black text-slate-700"
        >
          {logsOpen ? "Ocultar log do teste" : "Ver log do teste"}
        </button>
        {hasRunning && (
          <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-black text-sky-700">
            Teste em andamento
          </span>
        )}
      </div>

      {message && (
        <div
          className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
            kind === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : kind === "error"
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-slate-200 bg-slate-50 text-slate-700"
          }`}
        >
          {message}
        </div>
      )}

      {logsOpen && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-black text-slate-900">Log do teste rapido</div>
              <div className="text-xs text-slate-500">Mostra quando o botao foi clicado e quando o worker realmente consumiu o gatilho.</div>
            </div>
            <button
              onClick={() => loadRuns().catch(() => null)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700"
            >
              Atualizar log
            </button>
          </div>

          {!latestRun ? (
            <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-500">
              Nenhum teste manual registrado ainda.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="text-sm font-black text-slate-900">Ultima execucao</div>
                    <div className="mt-1 text-xs text-slate-500">
                      Run {latestRun.id} • Criado em {fmtDate(latestRun.createdAt)}
                    </div>
                    <div className="mt-2 text-sm text-slate-700">{latestRun.summary || "Sem resumo."}</div>
                    {latestRun.errorMessage && <div className="mt-2 text-sm font-semibold text-rose-700">{latestRun.errorMessage}</div>}
                  </div>
                  <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase ${statusTone(latestRun.status)}`}>
                    {latestRun.status}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {latestRun.steps.map((step) => (
                  <div key={step.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="text-sm font-black text-slate-900">{step.stepOrder}. {stepLabel(step.stepKey)}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          Inicio: {fmtDate(step.startedAt)} • Fim: {fmtDate(step.finishedAt)}
                        </div>
                        {step.errorMessage && <div className="mt-2 text-sm font-semibold text-rose-700">{step.errorMessage}</div>}
                        {step.outputJson && (
                          <pre className="mt-3 max-w-full overflow-x-auto rounded-xl bg-slate-950 p-3 text-[11px] text-slate-100">
                            {step.outputJson}
                          </pre>
                        )}
                      </div>
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${statusTone(step.status)}`}>
                        {step.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {runs.length > 1 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-sm font-black text-slate-900">Execucoes anteriores</div>
                  <div className="mt-3 space-y-2">
                    {runs.slice(1).map((run) => (
                      <div key={run.id} className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="text-xs font-black text-slate-800">{run.summary || "Sem resumo"}</div>
                          <div className="mt-1 text-[11px] text-slate-500">
                            {fmtDate(run.createdAt)} • {run.id}
                          </div>
                        </div>
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${statusTone(run.status)}`}>
                          {run.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
