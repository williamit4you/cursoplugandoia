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
import { BookOpen, Eye, MousePointerClick, RefreshCw, Search, Users, Video } from "lucide-react";

type Filters = {
  from: string;
  to: string;
  q: string;
  category: string;
  source: string;
  device: string;
  browser: string;
};

type DashboardData = {
  period: { from: string; to: string; timezone: string };
  truncated: boolean;
  summary: {
    publishedArticles: number;
    totalViews: number;
    engagedReads: number;
    sessions: number;
    affiliateClicks: number;
    engagementRate: number;
    pagesWithTraffic: number;
    youtubeVideosPosted: number;
    youtubeViewsTotal: number;
  };
  timeseries: Array<{ date: string; views: number; engagedReads: number; clicks: number; sessions: number }>;
  topPosts: Array<{
    id: string;
    title: string;
    slug: string;
    summary: string;
    category: string;
    publishedAt: string;
    rawViews: number;
    trackedViews: number;
    engagedReads: number;
    affiliateClicks: number;
    sessions: number;
    engagementRate: number;
    youtubePosted: boolean;
    youtubeViews: number;
    youtubeUrl: string | null;
  }>;
  byCategory: Array<{ key: string; label: string; views: number; engagedReads: number; clicks: number; sessions: number; engagementRate: number }>;
  bySource: Array<{ key: string; label: string; views: number; engagedReads: number; clicks: number; sessions: number; engagementRate: number }>;
  byDevice: Array<{ key: string; label: string; views: number; engagedReads: number; clicks: number; sessions: number; engagementRate: number }>;
  byBrowser: Array<{ key: string; label: string; views: number; engagedReads: number; clicks: number; sessions: number; engagementRate: number }>;
  recentEvents: Array<{ id: string; occurredAt: string; eventType: string; title: string; slug: string; source: string; device: string; browser: string; category: string }>;
  options: {
    categories: Array<{ value: string; label: string }>;
    sources: string[];
    devices: string[];
    browsers: string[];
  };
};

const COLORS = ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#e11d48", "#8b5cf6", "#14b8a6"];

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
    category: "",
    source: "",
    device: "",
    browser: "",
  };
}

function filtersFromSearch(search: URLSearchParams): Filters {
  const fallback = defaultFilters();
  return {
    from: search.get("from") || fallback.from,
    to: search.get("to") || fallback.to,
    q: search.get("q") || "",
    category: search.get("category") || "",
    source: search.get("source") || "",
    device: search.get("device") || "",
    browser: search.get("browser") || "",
  };
}

function filtersToQuery(filters: Filters) {
  const query = new URLSearchParams();
  query.set("scope", "news");
  Object.entries(filters).forEach(([key, value]) => {
    if (!value) return;
    query.set(key, value);
  });
  return query;
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

function NewsAnalyticsDashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<Filters>(() => filtersFromSearch(searchParams));
  const [appliedFilters, setAppliedFilters] = useState<Filters>(() => filtersFromSearch(searchParams));
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (active: Filters) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/commerce-analytics/dashboard?${filtersToQuery(active)}`, {
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Falha ao carregar analytics de noticias");
      setData(payload);
    } catch (loadError: any) {
      setError(loadError?.message || "Falha ao carregar analytics de noticias");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(appliedFilters);
  }, [appliedFilters, load]);

  const apply = () => {
    setAppliedFilters(filters);
    router.replace(`/admin/operations/NEWS_CONTENT?${filtersToQuery(filters)}`, { scroll: false });
  };

  const reset = () => {
    const next = defaultFilters();
    setFilters(next);
    setAppliedFilters(next);
    router.replace(`/admin/operations/NEWS_CONTENT?${filtersToQuery(next)}`, { scroll: false });
  };

  const topSources = useMemo(() => (data?.bySource || []).slice(0, 8), [data?.bySource]);
  const topPosts = useMemo(() => (data?.topPosts || []).slice(0, 12), [data?.topPosts]);

  return (
    <div className="space-y-5 pb-12">
      <section className="overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,.22),transparent_36%),linear-gradient(135deg,#0f172a,#312e81)] px-6 py-7 text-white shadow-xl shadow-slate-900/10 md:px-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.22em] text-indigo-200">Conteudo • Noticias</div>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Leitura, engajamento e video</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-indigo-100/80">
              Veja quais noticias atraem visitas, quais realmente sao lidas e como os videos do YouTube estao apoiando o portal.
            </p>
          </div>
          <button
            onClick={() => load(appliedFilters)}
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-black text-white hover:bg-white/15"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
          </button>
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <Field label="Data inicial"><input type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} className="input" /></Field>
          <Field label="Data final"><input type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} className="input" /></Field>
          <Field label="Buscar noticia"><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={filters.q} onChange={(event) => setFilters({ ...filters, q: event.target.value })} placeholder="Titulo, resumo, slug..." className="input pl-9" /></div></Field>
          <SelectField label="Categoria" value={filters.category} onChange={(value) => setFilters({ ...filters, category: value })} options={(data?.options.categories || []).map((item) => [item.value, item.label])} />
          <SelectField label="Origem" value={filters.source} onChange={(value) => setFilters({ ...filters, source: value })} options={(data?.options.sources || []).map((item) => [item, item])} />
          <SelectField label="Dispositivo" value={filters.device} onChange={(value) => setFilters({ ...filters, device: value })} options={(data?.options.devices || []).map((item) => [item, item])} />
          <SelectField label="Navegador" value={filters.browser} onChange={(value) => setFilters({ ...filters, browser: value })} options={(data?.options.browsers || []).map((item) => [item, item])} />
        </div>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button onClick={reset} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">Limpar</button>
          <button onClick={apply} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-black text-white hover:bg-indigo-700">Aplicar filtros</button>
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</div> : null}
      {data?.truncated ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">O periodo ultrapassou o limite de eventos carregados. Use filtros para aprofundar.</div> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi title="Visualizacoes" value={data?.summary.totalViews} detail={`${formatNumber(data?.summary.pagesWithTraffic || 0)} artigos com trafego`} icon={<Eye />} color="indigo" loading={loading} />
        <Kpi title="Leituras engajadas" value={data?.summary.engagedReads} detail={`Taxa ${formatPercent(data?.summary.engagementRate || 0)}`} icon={<BookOpen />} color="emerald" loading={loading} />
        <Kpi title="Sessoes" value={data?.summary.sessions} detail={`${formatNumber(data?.summary.affiliateClicks || 0)} cliques afiliados`} icon={<Users />} color="sky" loading={loading} />
        <Kpi title="Videos no YouTube" value={data?.summary.youtubeVideosPosted} detail={`${formatNumber(data?.summary.youtubeViewsTotal || 0)} views de video`} icon={<Video />} color="violet" loading={loading} />
        <Kpi title="Artigos publicados" value={data?.summary.publishedArticles} detail="Dentro dos filtros aplicados" icon={<MousePointerClick />} color="amber" loading={loading} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.65fr_1fr]">
        <ChartCard title="Evolucao diaria" subtitle="Visualizacoes, leituras engajadas e sessoes">
          {data?.timeseries.length ? (
            <ResponsiveContainer width="100%" height={330}>
              <AreaChart data={data.timeseries}>
                <defs>
                  <linearGradient id="newsViews" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4f46e5" stopOpacity={0.28} /><stop offset="95%" stopColor="#4f46e5" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <RechartsTooltip labelFormatter={(value) => formatDate(String(value))} />
                <Legend />
                <Area type="monotone" dataKey="views" name="Visualizacoes" stroke="#4f46e5" fill="url(#newsViews)" strokeWidth={2.5} />
                <Line type="monotone" dataKey="engagedReads" name="Leituras engajadas" stroke="#10b981" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="sessions" name="Sessoes" stroke="#0ea5e9" strokeWidth={2.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyChart loading={loading} />}
        </ChartCard>

        <ChartCard title="Dispositivos" subtitle="Origem do consumo por aparelho">
          {data?.byDevice.some((item) => item.views) ? (
            <ResponsiveContainer width="100%" height={330}>
              <PieChart>
                <Pie data={data.byDevice} dataKey="views" nameKey="label" innerRadius={72} outerRadius={112} paddingAngle={3}>
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
        <ChartCard title="Categorias" subtitle="Categorias com mais leituras">
          {data?.byCategory.length ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={data.byCategory.slice(0, 8)} layout="vertical" margin={{ left: 15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="label" width={120} tick={{ fontSize: 11 }} />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="views" name="Visualizacoes" fill="#4f46e5" radius={[0, 6, 6, 0]} />
                <Bar dataKey="engagedReads" name="Leituras engajadas" fill="#10b981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart loading={loading} />}
        </ChartCard>

        <div className="rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-lg font-black text-slate-900">Fontes</h2>
            <p className="mt-1 text-xs text-slate-500">De onde vem o trafego das noticias.</p>
          </div>
          <div className="max-h-[350px] overflow-y-auto p-3">
            {topSources.map((item, index) => (
              <div key={item.key} className="grid grid-cols-[32px_1fr_auto] items-center gap-3 rounded-xl px-3 py-3 hover:bg-slate-50">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 text-xs font-black text-slate-500">{index + 1}</span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-black text-slate-800">{item.label}</div>
                  <div className="mt-1 text-[11px] text-slate-500">{formatNumber(item.sessions)} sessoes • Engajamento {formatPercent(item.engagementRate)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-indigo-700">{formatNumber(item.views)}</div>
                  <div className="text-[11px] font-bold text-emerald-600">{formatNumber(item.engagedReads)} leituras</div>
                </div>
              </div>
            ))}
            {!topSources.length ? <div className="p-8 text-center text-sm text-slate-400">Ainda nao ha fontes registradas.</div> : null}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-lg font-black text-slate-900">Artigos com melhor desempenho</h2>
          <p className="mt-1 text-xs text-slate-500">Noticias mais lidas no periodo, com sinal de video do YouTube quando existir.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full">
            <thead className="bg-slate-50 text-left text-[11px] font-black uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-4">Artigo</th>
                <th className="px-4 py-4">Categoria</th>
                <th className="px-4 py-4 text-right">Views</th>
                <th className="px-4 py-4 text-right">Leituras</th>
                <th className="px-4 py-4 text-right">Taxa</th>
                <th className="px-4 py-4 text-right">Video</th>
                <th className="px-5 py-4 text-right">Abrir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topPosts.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70">
                  <td className="max-w-[420px] px-5 py-4">
                    <div className="truncate text-sm font-black text-slate-900">{item.title}</div>
                    <div className="mt-1 line-clamp-2 text-xs text-slate-500">{item.summary}</div>
                  </td>
                  <td className="px-4 py-4"><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-black text-indigo-700">{item.category}</span></td>
                  <td className="px-4 py-4 text-right text-sm font-black text-slate-700">{formatNumber(item.trackedViews || item.rawViews)}</td>
                  <td className="px-4 py-4 text-right text-sm font-black text-emerald-700">{formatNumber(item.engagedReads)}</td>
                  <td className="px-4 py-4 text-right text-sm font-black text-sky-700">{formatPercent(item.engagementRate)}</td>
                  <td className="px-4 py-4 text-right text-sm font-black text-violet-700">{item.youtubePosted ? formatNumber(item.youtubeViews) : "—"}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <a href={`/noticias/${item.slug}`} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50">Site</a>
                      {item.youtubeUrl ? <a href={item.youtubeUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-black text-rose-700 hover:bg-rose-50">YouTube</a> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!topPosts.length ? <div className="p-12 text-center text-sm text-slate-400">{loading ? "Carregando artigos..." : "Nenhum artigo encontrado para os filtros."}</div> : null}
        </div>
      </section>

      <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5"><h2 className="text-lg font-black text-slate-900">Atividade recente</h2><p className="mt-1 text-xs text-slate-500">Ultimos sinais de leitura e engajamento.</p></div>
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] font-black uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Data</th><th className="px-4 py-3">Evento</th><th className="px-4 py-3">Artigo</th><th className="px-4 py-3">Origem</th><th className="px-4 py-3">Dispositivo</th><th className="px-5 py-3">Categoria</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {(data?.recentEvents || []).map((event) => (
                <tr key={event.id}>
                  <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-500">{formatDateTime(event.occurredAt)}</td>
                  <td className="px-4 py-3"><EventBadge type={event.eventType} /></td>
                  <td className="max-w-[300px] px-4 py-3"><div className="truncate font-semibold text-slate-800">{event.title}</div><div className="truncate font-mono text-[10px] text-slate-400">/noticias/{event.slug}</div></td>
                  <td className="px-4 py-3 text-xs text-slate-600">{event.source}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{event.device} • {event.browser}</td>
                  <td className="px-5 py-3 text-xs text-slate-500">{event.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data?.recentEvents.length ? <div className="p-10 text-center text-sm text-slate-400">Nenhuma atividade encontrada no periodo.</div> : null}
        </div>
      </section>

      <style jsx global>{`
        .input { width: 100%; border: 1px solid rgb(226 232 240); border-radius: 0.75rem; background: white; padding: 0.7rem 0.75rem; font-size: 0.75rem; color: rgb(30 41 59); outline: none; }
        .input:focus { border-color: rgb(129 140 248); box-shadow: 0 0 0 3px rgba(99,102,241,.1); }
      `}</style>
    </div>
  );
}

export default function NewsAnalyticsDashboard() {
  return (
    <Suspense fallback={<div className="grid min-h-[420px] place-items-center rounded-[24px] border border-slate-200 bg-white"><RefreshCw className="h-7 w-7 animate-spin text-indigo-600" /></div>}>
      <NewsAnalyticsDashboardInner />
    </Suspense>
  );
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
  return <div className="grid h-[330px] place-items-center rounded-2xl bg-slate-50 text-sm text-slate-400">{loading ? <RefreshCw className="h-6 w-6 animate-spin" /> : "Ainda nao ha dados para este grafico."}</div>;
}

function EventBadge({ type }: { type: string }) {
  const config: Record<string, { label: string; style: string }> = {
    article_view: { label: "Visualizacao", style: "bg-indigo-50 text-indigo-700" },
    article_engaged: { label: "Leitura", style: "bg-emerald-50 text-emerald-700" },
    affiliate_click: { label: "Clique", style: "bg-amber-50 text-amber-700" },
  };
  const item = config[type] || { label: type, style: "bg-slate-100 text-slate-600" };
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${item.style}`}>{item.label}</span>;
}
