"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import RefreshIcon from "@mui/icons-material/Refresh";

type ComparisonItem = {
  id: string;
  title: string;
  slug: string;
  theme: string;
  status: string;
  sourceCount: number;
  validSourceCount: number;
  publishedAt: string | null;
  createdAt: string;
};

type ComparisonLinkInput = {
  affiliateUrl: string;
  productUrl: string;
};

export default function ComparisonsAdminView({ initialItems }: { initialItems: ComparisonItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [theme, setTheme] = useState("");
  const [targetYear, setTargetYear] = useState(new Date().getFullYear());
  const [links, setLinks] = useState<ComparisonLinkInput[]>([
    { affiliateUrl: "", productUrl: "" },
    { affiliateUrl: "", productUrl: "" },
  ]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      const matchesQuery =
        !query ||
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.theme.toLowerCase().includes(query.toLowerCase()) ||
        item.slug.toLowerCase().includes(query.toLowerCase());
      return matchesStatus && matchesQuery;
    });
  }, [items, query, statusFilter]);

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/comparativos?page=1&pageSize=100", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Falha ao carregar comparativos");
      setItems(data.items || []);
    } catch (err: any) {
      setError(err?.message || "Falha ao carregar comparativos");
    } finally {
      setLoading(false);
    }
  }

  function updateLink(index: number, field: keyof ComparisonLinkInput, value: string) {
    setLinks((current) =>
      current.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function addLinkField() {
    setLinks((current) => [...current, { affiliateUrl: "", productUrl: "" }]);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/comparativos", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ theme, targetYear, links }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Falha ao criar comparativo");
      setSuccess("Comparativo criado e colocado em processamento.");
      setTheme("");
      setTargetYear(new Date().getFullYear());
      setLinks([
        { affiliateUrl: "", productUrl: "" },
        { affiliateUrl: "", productUrl: "" },
      ]);
      await reload();
    } catch (err: any) {
      setError(err?.message || "Falha ao criar comparativo");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Comparativos</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Cadastre um tema e varios links de afiliados para gerar um artigo comparativo publico com SEO.
            </p>
          </div>
          <button
            onClick={reload}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshIcon fontSize="small" />
            Atualizar
          </button>
        </div>
      </div>

      <form onSubmit={handleCreate} className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-slate-800">
          <CompareArrowsIcon fontSize="small" />
          <h2 className="text-lg font-black">Novo comparativo</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-[2fr,180px]">
          <div>
            <label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Tema</label>
            <input
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="Ex: bicicleta ergometrica"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Ano</label>
            <input
              type="number"
              value={targetYear}
              onChange={(e) => setTargetYear(Number.parseInt(e.target.value, 10) || new Date().getFullYear())}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
            />
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-black uppercase tracking-wide text-slate-500">Links dos produtos</label>
            <button
              type="button"
              onClick={addLinkField}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-black text-slate-700 transition hover:bg-slate-50"
            >
              Adicionar link
            </button>
          </div>
          {links.map((link, index) => (
            <div key={index} className="grid gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-500">
                  Link de afiliado {index + 1}
                </label>
                <input
                  value={link.affiliateUrl}
                  onChange={(e) => updateLink(index, "affiliateUrl", e.target.value)}
                  placeholder="Link que o usuario final vai clicar"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-500">
                  Link final do produto {index + 1}
                </label>
                <input
                  value={link.productUrl}
                  onChange={(e) => updateLink(index, "productUrl", e.target.value)}
                  placeholder="Link redirecionado usado apenas no scraping"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
                />
              </div>
            </div>
          ))}
        </div>

        {error && <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div>}
        {success && <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{success}</div>}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? "Salvando..." : "Criar comparativo"}
          </button>
          <p className="text-xs font-medium text-slate-500">
            O scraping usa o link final do produto. A pagina publica mostra somente o link de afiliado.
          </p>
        </div>
      </form>

      <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1fr,220px]">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por tema, titulo ou slug"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
          >
            <option value="ALL">Todos os status</option>
            {["QUEUED", "SCRAPING", "ENRICHING", "WRITING", "REVIEWING", "PUBLISHED", "FAILED"].map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Titulo</th>
                <th className="px-4 py-3">Tema</th>
                <th className="px-4 py-3 text-center">Links</th>
                <th className="px-4 py-3 text-center">Validos</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3">Criado</th>
                <th className="px-4 py-3 text-right">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 transition hover:bg-slate-50/70">
                  <td className="px-4 py-4">
                    <div className="font-bold text-slate-800">{item.title}</div>
                    <div className="mt-1 text-xs font-medium text-slate-500">{item.slug}</div>
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-slate-700">{item.theme}</td>
                  <td className="px-4 py-4 text-center text-sm font-black text-slate-700">{item.sourceCount}</td>
                  <td className="px-4 py-4 text-center text-sm font-black text-emerald-700">{item.validSourceCount}</td>
                  <td className="px-4 py-4 text-center">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-black text-slate-700">
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-slate-500">
                    {new Date(item.createdAt).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/comparativos/${item.id}`}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50"
                      >
                        Abrir
                      </Link>
                      {item.status === "PUBLISHED" && (
                        <Link
                          href={`/comparativo/${item.slug}`}
                          target="_blank"
                          className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white transition hover:bg-emerald-700"
                        >
                          Ver publico
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm font-medium text-slate-400">
                    Nenhum comparativo encontrado.
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
