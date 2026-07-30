"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  Bot,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Filter,
  Link2,
  MousePointerClick,
  RefreshCw,
  Search,
  Store,
  Users,
  X,
} from "lucide-react";

type Summary = {
  publishedPages: number;
  pagesWithViews: number;
  pageViews: number;
  sessions: number;
  visitors: number;
  totalClicks: number;
  allTimeClicks: number;
  leads: number;
  clickRate: number;
  leadRate: number;
};

type AggregateRow = {
  key: string;
  label: string;
  pageViews: number;
  clicks: number;
  leads: number;
  sessions: number;
  visitors: number;
  clickRate: number;
  leadRate: number;
};

type PageRow = {
  key: string;
  path: string;
  url: string;
  title: string;
  pageType: string;
  pageTypeLabel: string;
  storeSlug: string | null;
  storeName: string | null;
  category: string;
  primaryKeyword: string | null;
  secondaryKeywords: string[];
  updatedAt: string | null;
  pageViews: number;
  clicks: number;
  leads: number;
  sessions: number;
  visitors: number;
  clickRate: number;
  leadRate: number;
};

type DashboardData = {
  period: { from: string; to: string; timezone: string };
  truncated: boolean;
  summary: Summary;
  timeseries: Array<{ date: string; pageViews: number; clicks: number; leads: number; sessions: number }>;
  pages: PageRow[];
  byCategory: AggregateRow[];
  byPageType: AggregateRow[];
  byStore: AggregateRow[];
  bySource: AggregateRow[];
  byMedium: AggregateRow[];
  byCampaign: AggregateRow[];
  byDevice: AggregateRow[];
  byBrowser: AggregateRow[];
  byDestination: AggregateRow[];
  recentEvents: Array<{
    id: string;
    occurredAt: string;
    eventType: string;
    pagePath: string;
    pageTitle: string | null;
    source: string | null;
    campaign: string | null;
    device: string;
    destination: string | null;
  }>;
  options: {
    pageTypes: Array<{ value: string; label: string }>;
    stores: Array<{ value: string; label: string }>;
    categories: string[];
    devices: string[];
    browsers: string[];
    sources: string[];
    mediums: string[];
    campaigns: string[];
    destinations: string[];
  };
};

type Filters = {
  from: string;
  to: string;
  q: string;
  pageType: string;
  store: string;
  category: string;
  source: string;
  medium: string;
  campaign: string;
  device: string;
  browser: string;
  destination: string;
  eventType: string;
  includeBots: boolean;
};

const COLORS = ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#e11d48", "#8b5cf6", "#14b8a6"];
const PAGE_SIZE = 20;

function dateInput(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function defaultFilters(): Filters {
  const now = new Date();
  const from = new Date(now);
  from.setDate(now.getDate() - 29);
  return {
    from: dateInput(from),
    to: dateInput(now),
    q: "",
    pageType: "",
    store: "",
    category: "",
    source: "",
    medium: "",
    campaign: "",
    device: "",
    browser: "",
    destination: "",
    eventType: "",
    includeBots: false,
  };
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value || 0);
}

function formatPercent(value: number) {
  return `${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 }).format(value || 0)}%`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(new Date(`${value}T12:00:00`));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function filtersFromSearch(search: URLSearchParams): Filters {
  const fallback = defaultFilters();
  return {
    ...fallback,
    ...Object.fromEntries(
      Object.keys(fallback)
        .filter((key) => key !== "includeBots")
        .map((key) => [key, search.get(key) || (fallback as any)[key]]),
    ),
    includeBots: search.get("includeBots") === "true",
  };
}

function filtersToQuery(filters: Filters) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === "" || value === false) return;
    query.set(key, String(value));
  });
  return query;
}

function CompraEspertaAnalyticsDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<Filters>(() => filtersFromSearch(searchParams));
  const [appliedFilters, setAppliedFilters] = useState<Filters>(() => filtersFromSearch(searchParams));
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [ranking, setRanking] = useState<"category" | "store" | "source" | "destination">("category");

  const load = useCallback(async (active: Filters) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/commerce-analytics/dashboard?${filtersToQuery(active)}`, {
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Falha ao carregar o dashboard");
      setData(payload);
    } catch (loadError: any) {
      setError(loadError?.message || "Falha ao carregar o dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(appliedFilters);
  }, [appliedFilters, load]);

  const apply = () => {
    setPage(1);
    setAppliedFilters(filters);
    router.replace(`/admin/compra-esperta?${filtersToQuery(filters)}`, { scroll: false });
  };

  const reset = () => {
    const next = defaultFilters();
    setFilters(next);
    setAppliedFilters(next);
    setPage(1);
    router.replace(`/admin/compra-esperta?${filtersToQuery(next)}`, { scroll: false });
  };

  const quickRange = (days: number) => {
    const to = new Date();
    const from = new Date(to);
    from.setDate(to.getDate() - (days - 1));
    setFilters((current) => ({ ...current, from: dateInput(from), to: dateInput(to) }));
  };

  const monthRange = () => {
    const to = new Date();
    const from = new Date(to.getFullYear(), to.getMonth(), 1);
    setFilters((current) => ({ ...current, from: dateInput(from), to: dateInput(to) }));
  };

  const totalPages = Math.max(1, Math.ceil((data?.pages.length || 0) / PAGE_SIZE));
  const visiblePages = useMemo(
    () => (data?.pages || []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [data?.pages, page],
  );

  const rankingRows = useMemo(() => {
    if (!data) return [];
    if (ranking === "store") return data.byStore;
    if (ranking === "source") return data.bySource;
    if (ranking === "destination") return data.byDestination;
    return data.byCategory;
  }, [data, ranking]);

  const exportCsv = () => {
    if (!data) return;
    const header = ["URL", "Título", "Tipo", "Categoria", "Loja", "Palavra-chave", "Visitas", "Sessões", "Visitantes", "Cliques", "CTR", "Leads"];
    const rows = data.pages.map((item) => [
      item.url,
      item.title,
      item.pageTypeLabel,
      item.category,
      item.storeName || "",
      item.primaryKeyword || "",
      item.pageViews,
      item.sessions,
      item.visitors,
      item.clicks,
      item.clickRate,
      item.leads,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `compra-esperta-analytics-${appliedFilters.from}-${appliedFilters.to}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 pb-12">
      <section className="overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,.25),transparent_36%),linear-gradient(135deg,#0f172a,#172554)] px-6 py-7 text-white shadow-xl shadow-slate-900/10 md:px-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">Crescimento • Compra Esperta</div>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Tráfego, conteúdo e cliques</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Acompanhe todas as páginas comerciais, fontes de tráfego, categorias, lojas, destinos e conversões no mesmo painel.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="https://compraesperta-promocoes.shop" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-bold hover:bg-white/15">
              Abrir site <ExternalLink className="h-4 w-4" />
            </a>
            <button onClick={() => load(appliedFilters)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-4 py-2.5 text-sm font-black text-slate-950 hover:bg-emerald-200">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4">
          <div className="mr-2 inline-flex items-center gap-2 text-sm font-black text-slate-800"><CalendarDays className="h-4 w-4 text-indigo-500" /> Período</div>
          <QuickButton onClick={() => quickRange(1)}>Hoje</QuickButton>
          <QuickButton onClick={() => quickRange(7)}>7 dias</QuickButton>
          <QuickButton onClick={() => quickRange(30)}>30 dias</QuickButton>
          <QuickButton onClick={monthRange}>Mês atual</QuickButton>
          <QuickButton onClick={() => quickRange(90)}>90 dias</QuickButton>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <Field label="Data inicial"><input type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} className="input" /></Field>
          <Field label="Data final"><input type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} className="input" /></Field>
          <Field label="Buscar página ou palavra"><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={filters.q} onChange={(event) => setFilters({ ...filters, q: event.target.value })} placeholder="Título, URL, keyword..." className="input pl-9" /></div></Field>
          <SelectField label="Tipo de página" value={filters.pageType} onChange={(value) => setFilters({ ...filters, pageType: value })} options={(data?.options.pageTypes || []).map((item) => [item.value, item.label])} />
          <SelectField label="Loja" value={filters.store} onChange={(value) => setFilters({ ...filters, store: value })} options={(data?.options.stores || []).map((item) => [item.value, item.label])} />
          <SelectField label="Categoria" value={filters.category} onChange={(value) => setFilters({ ...filters, category: value })} options={(data?.options.categories || []).map((item) => [item, item])} />
          <SelectField label="Origem" value={filters.source} onChange={(value) => setFilters({ ...filters, source: value })} options={(data?.options.sources || []).map((item) => [item, item])} />
          <SelectField label="Mídia" value={filters.medium} onChange={(value) => setFilters({ ...filters, medium: value })} options={(data?.options.mediums || []).map((item) => [item, item])} />
          <SelectField label="Campanha" value={filters.campaign} onChange={(value) => setFilters({ ...filters, campaign: value })} options={(data?.options.campaigns || []).map((item) => [item, item])} />
          <SelectField label="Dispositivo" value={filters.device} onChange={(value) => setFilters({ ...filters, device: value })} options={(data?.options.devices || []).map((item) => [item, item])} />
          <SelectField label="Navegador" value={filters.browser} onChange={(value) => setFilters({ ...filters, browser: value })} options={(data?.options.browsers || []).map((item) => [item, item])} />
          <SelectField label="Destino do clique" value={filters.destination} onChange={(value) => setFilters({ ...filters, destination: value })} options={(data?.options.destinations || []).map((item) => [item, item])} />
          <SelectField label="Interação" value={filters.eventType} onChange={(value) => setFilters({ ...filters, eventType: value })} options={[
            ["PAGE_VIEW", "Visualização"],
            ["OUTBOUND_CLICK", "Clique externo"],
            ["LEAD", "Lead"],
          ]} />
          <label className="flex min-h-[66px] items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <input type="checkbox" checked={filters.includeBots} onChange={(event) => setFilters({ ...filters, includeBots: event.target.checked })} className="h-4 w-4 rounded border-slate-300" />
            <span className="pb-0.5 text-xs font-bold text-slate-700">Incluir bots</span>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button onClick={reset} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"><X className="h-4 w-4" /> Limpar</button>
          <button onClick={apply} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-black text-white hover:bg-indigo-700"><Filter className="h-4 w-4" /> Aplicar filtros</button>
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</div> : null}
      {data?.truncated ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">O período ultrapassou 250 mil eventos. Reduza o intervalo ou aplique filtros para detalhamento completo.</div> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi title="Visualizações" value={data?.summary.pageViews} detail={`${formatNumber(data?.summary.pagesWithViews || 0)} páginas acessadas`} icon={<BarChart3 />} color="indigo" loading={loading} />
        <Kpi title="Sessões" value={data?.summary.sessions} detail={`${formatNumber(data?.summary.visitors || 0)} visitantes`} icon={<Users />} color="sky" loading={loading} />
        <Kpi title="Cliques no período" value={data?.summary.totalClicks} detail={`CTR ${formatPercent(data?.summary.clickRate || 0)}`} icon={<MousePointerClick />} color="emerald" loading={loading} />
        <Kpi title="Cliques ao todo" value={data?.summary.allTimeClicks} detail="Desde o novo rastreamento" icon={<Link2 />} color="amber" loading={loading} />
        <Kpi title="Páginas publicadas" value={data?.summary.publishedPages} detail={`${formatNumber(data?.summary.leads || 0)} leads no período`} icon={<Store />} color="violet" loading={loading} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.65fr_1fr]">
        <ChartCard title="Evolução diária" subtitle="Visualizações, sessões e cliques no período selecionado">
          {data?.timeseries.length ? (
            <ResponsiveContainer width="100%" height={330}>
              <AreaChart data={data.timeseries}>
                <defs>
                  <linearGradient id="views" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4f46e5" stopOpacity={0.28} /><stop offset="95%" stopColor="#4f46e5" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <RechartsTooltip labelFormatter={(value) => formatDate(String(value))} />
                <Legend />
                <Area type="monotone" dataKey="pageViews" name="Visualizações" stroke="#4f46e5" fill="url(#views)" strokeWidth={2.5} />
                <Line type="monotone" dataKey="sessions" name="Sessões" stroke="#0ea5e9" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="clicks" name="Cliques" stroke="#10b981" strokeWidth={2.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyChart loading={loading} />}
        </ChartCard>

        <ChartCard title="Dispositivos" subtitle="Distribuição das visualizações por dispositivo">
          {data?.byDevice.some((item) => item.pageViews) ? (
            <ResponsiveContainer width="100%" height={330}>
              <PieChart>
                <Pie data={data.byDevice} dataKey="pageViews" nameKey="label" innerRadius={72} outerRadius={112} paddingAngle={3}>
                  {data.byDevice.map((entry, index) => <Cell key={entry.key} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <RechartsTooltip formatter={(value) => formatNumber(Number(value))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyChart loading={loading} />}
        </ChartCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <ChartCard title="Desempenho por categoria" subtitle="Categorias com mais visualizações e cliques">
          {data?.byCategory.length ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={data.byCategory.slice(0, 10)} layout="vertical" margin={{ left: 15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="label" width={115} tick={{ fontSize: 11 }} />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="pageViews" name="Visualizações" fill="#4f46e5" radius={[0, 6, 6, 0]} />
                <Bar dataKey="clicks" name="Cliques" fill="#10b981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart loading={loading} />}
        </ChartCard>

        <div className="rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-lg font-black text-slate-900">Rankings</h2>
            <p className="mt-1 text-xs text-slate-500">Compare os principais agrupamentos do site.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(["category", "store", "source", "destination"] as const).map((item) => (
                <button key={item} onClick={() => setRanking(item)} className={`rounded-xl px-3 py-2 text-xs font-black ${ranking === item ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {{ category: "Categorias", store: "Lojas", source: "Origens", destination: "Destinos" }[item]}
                </button>
              ))}
            </div>
          </div>
          <div className="max-h-[350px] overflow-y-auto p-3">
            {rankingRows.slice(0, 20).map((item, index) => (
              <div key={item.key} className="grid grid-cols-[32px_1fr_auto] items-center gap-3 rounded-xl px-3 py-3 hover:bg-slate-50">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 text-xs font-black text-slate-500">{index + 1}</span>
                <div className="min-w-0"><div className="truncate text-sm font-black text-slate-800">{item.label}</div><div className="mt-1 text-[11px] text-slate-500">{formatNumber(item.sessions)} sessões • CTR {formatPercent(item.clickRate)}</div></div>
                <div className="text-right"><div className="text-sm font-black text-indigo-700">{formatNumber(item.pageViews)}</div><div className="text-[11px] font-bold text-emerald-600">{formatNumber(item.clicks)} cliques</div></div>
              </div>
            ))}
            {!rankingRows.length ? <div className="p-8 text-center text-sm text-slate-400">Ainda não há dados para este ranking.</div> : null}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-black text-slate-900">Todas as páginas do Compra Esperta</h2>
            <p className="mt-1 text-xs text-slate-500">{formatNumber(data?.pages.length || 0)} URLs encontradas no inventário atual.</p>
          </div>
          <button onClick={exportCsv} disabled={!data?.pages.length} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"><Download className="h-4 w-4" /> Exportar CSV</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[1250px] w-full">
            <thead className="bg-slate-50 text-left text-[11px] font-black uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-4">Página</th>
                <th className="px-4 py-4">Tipo / categoria</th>
                <th className="px-4 py-4">Palavra-chave</th>
                <th className="px-4 py-4 text-right">Visitas</th>
                <th className="px-4 py-4 text-right">Sessões</th>
                <th className="px-4 py-4 text-right">Visitantes</th>
                <th className="px-4 py-4 text-right">Cliques</th>
                <th className="px-4 py-4 text-right">CTR</th>
                <th className="px-4 py-4 text-right">Leads</th>
                <th className="px-5 py-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visiblePages.map((item) => (
                <tr key={item.key} className="hover:bg-slate-50/70">
                  <td className="max-w-[320px] px-5 py-4"><div className="truncate text-sm font-black text-slate-900" title={item.title}>{item.title}</div><div className="mt-1 truncate font-mono text-[11px] text-slate-400">{item.path}</div>{item.storeName ? <div className="mt-1 text-[11px] font-bold text-indigo-600">{item.storeName}</div> : null}</td>
                  <td className="px-4 py-4"><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-black text-indigo-700">{item.pageTypeLabel}</span><div className="mt-2 text-xs text-slate-500">{item.category}</div></td>
                  <td className="max-w-[240px] px-4 py-4"><div className="line-clamp-2 text-xs font-semibold leading-5 text-slate-700">{item.primaryKeyword || "Não definida"}</div></td>
                  <MetricCell value={item.pageViews} />
                  <MetricCell value={item.sessions} />
                  <MetricCell value={item.visitors} />
                  <MetricCell value={item.clicks} highlight />
                  <td className="px-4 py-4 text-right text-sm font-black text-emerald-700">{formatPercent(item.clickRate)}</td>
                  <MetricCell value={item.leads} />
                  <td className="px-5 py-4 text-right"><a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">Abrir <ExternalLink className="h-3.5 w-3.5" /></a></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visiblePages.length ? <div className="p-12 text-center text-sm text-slate-400">{loading ? "Carregando páginas..." : "Nenhuma página corresponde aos filtros."}</div> : null}
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
          <div className="text-xs text-slate-500">Página {page} de {totalPages}</div>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-slate-200 p-2 text-slate-600 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
            <button disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="rounded-lg border border-slate-200 p-2 text-slate-600 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5"><h2 className="text-lg font-black text-slate-900">Atividade recente</h2><p className="mt-1 text-xs text-slate-500">Últimos eventos dentro dos filtros aplicados.</p></div>
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] font-black uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Data</th><th className="px-4 py-3">Evento</th><th className="px-4 py-3">Página</th><th className="px-4 py-3">Origem</th><th className="px-4 py-3">Dispositivo</th><th className="px-5 py-3">Destino</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {(data?.recentEvents || []).slice(0, 30).map((event) => (
                <tr key={event.id}><td className="whitespace-nowrap px-5 py-3 text-xs text-slate-500">{formatDateTime(event.occurredAt)}</td><td className="px-4 py-3"><EventBadge type={event.eventType} /></td><td className="max-w-[260px] px-4 py-3"><div className="truncate font-semibold text-slate-800">{event.pageTitle || event.pagePath}</div><div className="truncate font-mono text-[10px] text-slate-400">{event.pagePath}</div></td><td className="px-4 py-3 text-xs text-slate-600">{event.source || "direto"}{event.campaign ? <div className="text-[10px] text-slate-400">{event.campaign}</div> : null}</td><td className="px-4 py-3 text-xs text-slate-600">{event.device}</td><td className="max-w-[220px] px-5 py-3"><div className="truncate text-xs text-slate-500">{event.destination || "-"}</div></td></tr>
              ))}
            </tbody>
          </table>
          {!data?.recentEvents.length ? <div className="p-10 text-center text-sm text-slate-400">Nenhuma atividade encontrada no período.</div> : null}
        </div>
      </section>

      <style jsx global>{`
        .input { width: 100%; border: 1px solid rgb(226 232 240); border-radius: 0.75rem; background: white; padding: 0.7rem 0.75rem; font-size: 0.75rem; color: rgb(30 41 59); outline: none; }
        .input:focus { border-color: rgb(129 140 248); box-shadow: 0 0 0 3px rgba(99,102,241,.1); }
      `}</style>
    </div>
  );
}

export default function CompraEspertaAnalyticsPage() {
  return (
    <Suspense fallback={<div className="grid min-h-[420px] place-items-center rounded-[24px] border border-slate-200 bg-white"><RefreshCw className="h-7 w-7 animate-spin text-indigo-600" /></div>}>
      <CompraEspertaAnalyticsDashboard />
    </Suspense>
  );
}

function QuickButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-600 hover:bg-indigo-50 hover:text-indigo-700">{children}</button>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</span>{children}</label>;
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<[string, string]> }) {
  return <Field label={label}><select value={value} onChange={(event) => onChange(event.target.value)} className="input"><option value="">Todos</option>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></Field>;
}

function Kpi({ title, value, detail, icon, color, loading }: { title: string; value: number | undefined; detail: string; icon: React.ReactNode; color: string; loading: boolean }) {
  const palette: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600",
    sky: "bg-sky-50 text-sky-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
  };
  return <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm"><div className={`grid h-10 w-10 place-items-center rounded-xl [&>svg]:h-5 [&>svg]:w-5 ${palette[color]}`}>{icon}</div><div className="mt-5 text-xs font-black uppercase tracking-wider text-slate-500">{title}</div><div className="mt-1 text-3xl font-black tracking-tight text-slate-900">{loading && value === undefined ? "—" : formatNumber(value || 0)}</div><div className="mt-2 text-xs font-semibold text-slate-500">{detail}</div></div>;
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-black text-slate-900">{title}</h2><p className="mt-1 text-xs text-slate-500">{subtitle}</p><div className="mt-5">{children}</div></div>;
}

function EmptyChart({ loading }: { loading: boolean }) {
  return <div className="grid h-[330px] place-items-center rounded-2xl bg-slate-50 text-sm text-slate-400">{loading ? <RefreshCw className="h-6 w-6 animate-spin" /> : "Ainda não há dados para este gráfico."}</div>;
}

function MetricCell({ value, highlight = false }: { value: number; highlight?: boolean }) {
  return <td className={`px-4 py-4 text-right text-sm font-black ${highlight ? "text-emerald-700" : "text-slate-700"}`}>{formatNumber(value)}</td>;
}

function EventBadge({ type }: { type: string }) {
  const config: Record<string, { label: string; style: string }> = {
    PAGE_VIEW: { label: "Visualização", style: "bg-indigo-50 text-indigo-700" },
    OUTBOUND_CLICK: { label: "Clique", style: "bg-emerald-50 text-emerald-700" },
    LEAD: { label: "Lead", style: "bg-amber-50 text-amber-700" },
  };
  const item = config[type] || { label: type, style: "bg-slate-100 text-slate-600" };
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${item.style}`}>{item.label}</span>;
}
