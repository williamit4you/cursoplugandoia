"use client";

import Link from "next/link";
import { useState } from "react";

type ComparisonDetail = {
  id: string;
  title: string;
  slug: string;
  theme: string;
  targetYear: number | null;
  status: string;
  errorMessage: string | null;
  introSummary: string | null;
  contentHtml: string;
  items: any[];
  steps: any[];
  events: any[];
};

export default function ComparisonAdminDetailView({ initialItem }: { initialItem: ComparisonDetail }) {
  const [item, setItem] = useState(initialItem);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    setBusy(true);
    try {
      const res = await fetch(`/api/comparativos/${item.id}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Falha ao atualizar");
      setItem(data);
      setMessage(null);
    } catch (error: any) {
      setMessage(error?.message || "Falha ao atualizar");
    } finally {
      setBusy(false);
    }
  }

  async function rerun() {
    setBusy(true);
    try {
      const res = await fetch(`/api/comparativos/${item.id}/run`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Falha ao reprocessar");
      setMessage("Comparativo reenfileirado com sucesso.");
      await refresh();
    } catch (error: any) {
      setMessage(error?.message || "Falha ao reprocessar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-slate-400">Comparativo</div>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">{item.title}</h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Tema: <span className="font-black text-slate-700">{item.theme}</span> {item.targetYear ? `• Ano ${item.targetYear}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={refresh}
              disabled={busy}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Atualizar
            </button>
            <button
              onClick={rerun}
              disabled={busy}
              className="rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-black text-white transition hover:bg-indigo-700 disabled:opacity-60"
            >
              Reprocessar
            </button>
            {item.status === "PUBLISHED" && (
              <Link
                href={`/comparativo/${item.slug}`}
                target="_blank"
                className="rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-black text-white transition hover:bg-emerald-700"
              >
                Ver publico
              </Link>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-black text-slate-700">
            {item.status}
          </span>
          {item.errorMessage && <span className="text-sm font-semibold text-rose-600">{item.errorMessage}</span>}
          {message && <span className="text-sm font-semibold text-indigo-600">{message}</span>}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">Produtos cadastrados</h2>
            <div className="mt-4 space-y-3">
              {item.items.map((product, index) => (
                <div key={product.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="text-xs font-black uppercase tracking-wide text-slate-400">#{index + 1}</div>
                      <div className="mt-1 font-black text-slate-800">{product.productTitle || "Titulo ainda nao identificado"}</div>
                      <div className="mt-1 text-sm font-medium text-slate-500">{product.storeName || product.sourceDomain}</div>
                      <a href={product.affiliateUrl} target="_blank" rel="noreferrer" className="mt-2 block text-xs font-semibold text-indigo-600 hover:underline">
                        {product.affiliateUrl}
                      </a>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-slate-700">{product.priceText || "Preco nao encontrado"}</div>
                      <div className="mt-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-black text-slate-700">
                        {product.status}
                      </div>
                    </div>
                  </div>
                  {product.shortDescription && <p className="mt-3 text-sm leading-6 text-slate-600">{product.shortDescription}</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">Preview do artigo</h2>
            {item.introSummary && <p className="mt-2 text-sm font-medium text-slate-500">{item.introSummary}</p>}
            <div
              className="prose prose-slate mt-6 max-w-none"
              dangerouslySetInnerHTML={{ __html: item.contentHtml || "<p>O artigo ainda nao foi gerado.</p>" }}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">Etapas do pipeline</h2>
            <div className="mt-4 space-y-3">
              {item.steps.map((step) => (
                <div key={step.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="font-black text-slate-800">{step.stepName}</div>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-black text-slate-700">
                      {step.status}
                    </span>
                  </div>
                  {step.errorMessage && <div className="mt-2 text-sm font-semibold text-rose-600">{step.errorMessage}</div>}
                </div>
              ))}
              {item.steps.length === 0 && <div className="text-sm font-medium text-slate-400">Nenhuma etapa registrada ainda.</div>}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">Timeline</h2>
            <div className="mt-4 space-y-3">
              {item.events.map((event) => (
                <div key={event.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-sm font-black text-slate-800">{event.message}</div>
                    <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{event.level}</div>
                  </div>
                  <div className="mt-2 text-xs font-medium text-slate-500">
                    {new Date(event.createdAt).toLocaleString("pt-BR")}
                    {event.stepName ? ` • ${event.stepName}` : ""}
                  </div>
                </div>
              ))}
              {item.events.length === 0 && <div className="text-sm font-medium text-slate-400">Nenhum evento registrado ainda.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
