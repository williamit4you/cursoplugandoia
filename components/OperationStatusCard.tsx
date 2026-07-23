"use client";

type Props = {
  title: string;
  status: "OK" | "ATTENTION" | "FAILED" | "RUNNING" | "DISABLED" | string;
  lastActivity?: string | Date | null;
  progress?: { current: number; total: number };
  error?: string | null;
  retryLabel?: string;
  onRetry?: () => void;
};

const styles: Record<string, string> = {
  OK: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ATTENTION: "bg-amber-50 text-amber-700 border-amber-200",
  FAILED: "bg-rose-50 text-rose-700 border-rose-200",
  RUNNING: "bg-indigo-50 text-indigo-700 border-indigo-200",
  DISABLED: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function OperationStatusCard({ title, status, lastActivity, progress, error, retryLabel = "Tentar novamente", onRetry }: Props) {
  const percent = progress?.total ? Math.min(100, Math.round((progress.current / progress.total) * 100)) : null;
  return <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <h3 className="text-sm font-black text-slate-900">{title}</h3>
      <span className={`rounded-full border px-2 py-1 text-[10px] font-black ${styles[status] || styles.ATTENTION}`}>{status}</span>
    </div>
    {progress ? <div className="mt-3"><div className="flex justify-between text-xs text-slate-500"><span>Progresso</span><span>{progress.current}/{progress.total}</span></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-indigo-500 transition-all" style={{ width: `${percent || 0}%` }} /></div></div> : null}
    {lastActivity ? <p className="mt-3 text-xs text-slate-500">Ultima atividade: {new Date(lastActivity).toLocaleString("pt-BR")}</p> : null}
    {error ? <p className="mt-3 rounded-lg bg-rose-50 px-2 py-1.5 text-xs text-rose-700">{error}</p> : null}
    {onRetry ? <button type="button" onClick={onRetry} className="mt-3 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">{retryLabel}</button> : null}
  </section>;
}
