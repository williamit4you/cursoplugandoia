"use client";

import { useState } from "react";

export default function QuickScrapeTestButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [kind, setKind] = useState<"success" | "error" | "info">("info");

  const run = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/worker/trigger", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Falha ao disparar teste do scraper");
      }
      setKind("success");
      setMessage("Teste manual disparado. O robô vai pegar esse ciclo e processar a próxima coleta.");
    } catch (error: any) {
      setKind("error");
      setMessage(error?.message || "Falha ao disparar teste do scraper");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={run}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700 transition-all hover:bg-emerald-100 disabled:opacity-50"
      >
        {loading ? "Disparando teste..." : "Rodar teste rapido de scrape"}
      </button>
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
    </div>
  );
}
