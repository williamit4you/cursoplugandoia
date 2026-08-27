"use client";

import { useCallback, useEffect, useState } from "react";

type DirectoryStats = { path: string; bytes: number; files: number; oldestMtime?: number | null; newestMtime?: number | null };
type StorageData = { directories: DirectoryStats[]; totalBytes: number; cleanupMaxAgeSeconds: number };

function bytes(value: number) {
  if (!value) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** exponent).toFixed(exponent >= 3 ? 2 : 0)} ${units[exponent]}`;
}

function date(value?: number | null) {
  return value ? new Date(value * 1000).toLocaleString("pt-BR") : "-";
}

export default function WorkerStoragePage() {
  const [data, setData] = useState<StorageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<"older-than-24h" | "all" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/worker-storage", { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || "Falha ao consultar o worker");
      setData(payload);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Worker indisponivel");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 30_000);
    return () => window.clearInterval(timer);
  }, [load]);

  const cleanup = async (mode: "older-than-24h" | "all") => {
    const all = mode === "all";
    if (all && !window.confirm("Apagar TODOS os arquivos temporarios do worker? Nao execute enquanto houver geracao de video em andamento.")) return;
    setActing(mode);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/worker-storage", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || "Falha na limpeza");
      setData(payload.after);
      setMessage(`Limpeza concluida: ${bytes(Number(payload.freedBytes || 0))} liberados.`);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Falha na limpeza");
    } finally {
      setActing(null);
    }
  };

  const total = data?.totalBytes || 0;
  const critical = total >= 10 * 1024 ** 3;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">Saude do worker</p>
          <h2 className="mt-1 text-3xl font-black text-slate-900">Arquivos temporarios</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">Acompanhamento de uploads, audios, transcricoes e renders temporarios do motor de video. Atualiza automaticamente a cada 30 segundos.</p>
        </div>
        <button onClick={load} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">Atualizar agora</button>
      </div>

      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>}
      {message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{message}</div>}

      <section className={`rounded-3xl border p-6 shadow-sm ${critical ? "border-rose-200 bg-rose-50" : "border-emerald-200 bg-emerald-50"}`}>
        <div className="text-sm font-black uppercase tracking-wider text-slate-500">Total temporario no worker</div>
        <div className={`mt-2 text-5xl font-black ${critical ? "text-rose-700" : "text-emerald-700"}`}>{loading ? "..." : bytes(total)}</div>
        <div className="mt-2 text-sm text-slate-600">{critical ? "Atencao: o volume esta alto. Avalie limpar arquivos antigos." : "Volume sob controle."}</div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {(data?.directories || []).map((directory) => (
          <article key={directory.path} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-black text-slate-500">{directory.path}</div>
            <div className="mt-3 text-3xl font-black text-slate-900">{bytes(directory.bytes)}</div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-slate-50 p-3"><div className="text-xs font-bold text-slate-400">Arquivos</div><div className="mt-1 font-black text-slate-800">{directory.files}</div></div>
              <div className="rounded-xl bg-slate-50 p-3"><div className="text-xs font-bold text-slate-400">Mais antigo</div><div className="mt-1 text-xs font-bold text-slate-700">{date(directory.oldestMtime)}</div></div>
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-black text-slate-900">Limpeza manual</h3>
        <p className="mt-2 text-sm text-slate-600">A limpeza segura preserva itens das ultimas 24 horas. A limpeza total remove todo temporario e so deve ser usada quando nao houver processamento ativo.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button disabled={Boolean(acting)} onClick={() => cleanup("older-than-24h")} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-black text-white hover:bg-indigo-700 disabled:opacity-50">{acting === "older-than-24h" ? "Limpando..." : "Limpar arquivos com mais de 24h"}</button>
          <button disabled={Boolean(acting)} onClick={() => cleanup("all")} className="rounded-xl border border-rose-300 bg-white px-4 py-2.5 text-sm font-black text-rose-700 hover:bg-rose-50 disabled:opacity-50">{acting === "all" ? "Limpando..." : "Limpar tudo"}</button>
        </div>
      </section>
    </div>
  );
}
