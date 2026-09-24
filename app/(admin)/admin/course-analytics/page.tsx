"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Chip, MenuItem, Paper, TextField, Typography } from "@mui/material";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type QuickRange = "7d" | "30d" | "today";
type Counter = { pageViews: number; uniqueSessions: number; viewContents: number; initiateCheckouts: number; outboundClicks: number; leads: number; purchases: number; revenue: number; checkoutCtr: number; lastEventAt: string | null };
type Course = Counter & { pageKey: string; path: string; title: string };
type Payload = {
  summary: Counter;
  courses: Course[];
  timeseries: Array<Counter & { date: string }>;
  sources: Array<Counter & { source: string; medium: string; campaign: string; referrer: string }>;
  devices: Array<{ label: string; count: number }>;
  browsers: Array<{ label: string; count: number }>;
  systems: Array<{ label: string; count: number }>;
  locations: Array<{ label: string; count: number }>;
  engagement: Array<{ label: string; count: number }>;
  recentEvents: Array<{ id: string; course: string; pagePath: string; eventType: string; eventName: string | null; occurredAt: string; sessionIdShort: string; source: string; campaign: string; device: string; browser: string; os: string; value: number | null }>;
};

const courses = [
  { value: "", label: "Todos os cursos" },
  { value: "cursos", label: "Vitrine de cursos" },
  { value: "curso-arquitetura-software", label: "Arquitetura de Software" },
  { value: "curso-rabbitmq", label: "RabbitMQ com .NET" },
  { value: "curso-saas", label: "SaaS com IA" },
];

function getPreset(value: QuickRange) {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  if (value === "today") return { from: to, to };
  const days = value === "7d" ? 7 : 30;
  return { from: new Date(now.getTime() - (days - 1) * 86400000).toISOString().slice(0, 10), to };
}

function dateTime(value: string | null) { return value ? new Date(value).toLocaleString("pt-BR") : "-"; }
function money(value: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0); }

function Metric({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return <Paper sx={{ p: 2, gridColumn: { xs: "span 12", sm: "span 6", lg: "span 3" }, border: "1px solid rgba(15, 23, 42, .08)" }}>
    <Typography sx={{ fontSize: 12, fontWeight: 800, color: "text.secondary" }}>{label}</Typography>
    <Typography variant="h4" sx={{ mt: .6, fontWeight: 900 }}>{value}</Typography>
    {hint ? <Typography sx={{ mt: .5, fontSize: 12, color: "text.secondary" }}>{hint}</Typography> : null}
  </Paper>;
}

function SimpleTable({ headers, children, empty }: { headers: string[]; children: React.ReactNode; empty?: boolean }) {
  return <Box sx={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 650 }}>
    <thead><tr style={{ background: "rgba(15,23,42,.035)" }}>{headers.map((header) => <th key={header} style={{ textAlign: "left", padding: 14, fontSize: 12, color: "#475569" }}>{header}</th>)}</tr></thead>
    <tbody>{children}{empty ? <tr><td colSpan={headers.length} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>Nenhum dado no período.</td></tr> : null}</tbody>
  </table></Box>;
}

export default function CourseAnalyticsPage() {
  const [quickRange, setQuickRange] = useState<QuickRange>("30d");
  const preset = useMemo(() => getPreset(quickRange), [quickRange]);
  const [from, setFrom] = useState(preset.from);
  const [to, setTo] = useState(preset.to);
  const [pageKey, setPageKey] = useState("");
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartReady, setChartReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setChartReady(true), []);
  useEffect(() => { setFrom(preset.from); setTo(preset.to); }, [preset]);

  async function load() {
    setLoading(true); setError(null);
    try {
      const query = new URLSearchParams({ from, to });
      if (pageKey) query.set("pageKey", pageKey);
      const response = await fetch(`/api/admin/course-analytics?${query}`, { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error || "Não foi possível carregar os acessos.");
      setData(body);
    } catch (loadError: any) {
      setError(loadError?.message || "Não foi possível carregar os acessos.");
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); /* carregamento inicial */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = data?.summary;
  return <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 900 }}>Acessos dos cursos</Typography>
      <Typography sx={{ color: "text.secondary", mt: .75 }}>Uma visão única da vitrine e das páginas de Arquitetura, RabbitMQ e SaaS.</Typography>
    </Box>

    {error ? <Alert severity="error">{error}</Alert> : null}

    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 2 }}>
        <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}><TextField fullWidth select label="Página / curso" value={pageKey} onChange={(event) => setPageKey(event.target.value)}>{courses.map((course) => <MenuItem key={course.value} value={course.value}>{course.label}</MenuItem>)}</TextField></Box>
        <Box sx={{ gridColumn: { xs: "span 12", md: "span 3" } }}><TextField fullWidth select label="Período rápido" value={quickRange} onChange={(event) => setQuickRange(event.target.value as QuickRange)}>{[{ value: "today", label: "Hoje" }, { value: "7d", label: "Últimos 7 dias" }, { value: "30d", label: "Últimos 30 dias" }].map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}</TextField></Box>
        <Box sx={{ gridColumn: { xs: "span 6", md: "span 2.5" } }}><TextField fullWidth label="De" type="date" value={from} onChange={(event) => setFrom(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} /></Box>
        <Box sx={{ gridColumn: { xs: "span 6", md: "span 2.5" } }}><TextField fullWidth label="Até" type="date" value={to} onChange={(event) => setTo(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} /></Box>
      </Box>
      <Box sx={{ display: "flex", gap: 1, mt: 2, alignItems: "center", flexWrap: "wrap" }}><button onClick={load} disabled={loading} style={{ border: 0, background: "#0f172a", color: "white", borderRadius: 10, padding: "10px 16px", fontWeight: 800, cursor: "pointer" }}>{loading ? "Carregando..." : "Atualizar painel"}</button><Chip size="small" label={`Último evento: ${dateTime(summary?.lastEventAt || null)}`} /></Box>
    </Paper>

    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 2 }}>
      <Metric label="Visitas" value={summary?.pageViews ?? "–"} hint="Page views nas rotas selecionadas" />
      <Metric label="Sessões únicas" value={summary?.uniqueSessions ?? "–"} hint="Identificação anônima por sessão" />
      <Metric label="Leitura de conteúdo" value={summary?.viewContents ?? "–"} hint="Evento ViewContent" />
      <Metric label="Cliques no checkout" value={summary?.initiateCheckouts ?? "–"} hint={`CTR: ${summary?.checkoutCtr ?? 0}%`} />
      <Metric label="Compras confirmadas" value={summary?.purchases ?? "–"} hint="Disponível com retorno da Hotmart" />
      <Metric label="Receita confirmada" value={summary ? money(summary.revenue) : "–"} hint="Não estima vendas" />
      <Metric label="Interações na página" value={summary?.outboundClicks ?? "–"} hint="Grade, oferta, FAQ e outros eventos" />
      <Metric label="Leads" value={summary?.leads ?? "–"} hint="Quando houver captura de lead" />
    </Box>

    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 2 }}>
      <Paper sx={{ p: 2, gridColumn: { xs: "span 12", lg: "span 8" } }}><Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>Visitas x intenção de compra</Typography><Box sx={{ height: 300 }}>{chartReady ? <ResponsiveContainer><AreaChart data={data?.timeseries || []}><defs><linearGradient id="courseViews" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={.35} /><stop offset="95%" stopColor="#2563eb" stopOpacity={.02} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip /><Area type="monotone" dataKey="pageViews" name="Visitas" stroke="#2563eb" fill="url(#courseViews)" strokeWidth={3} /><Area type="monotone" dataKey="initiateCheckouts" name="Checkout" stroke="#16a34a" fill="none" strokeWidth={3} /></AreaChart></ResponsiveContainer> : null}</Box></Paper>
      <Paper sx={{ p: 2, gridColumn: { xs: "span 12", lg: "span 4" } }}><Typography variant="h6" sx={{ fontWeight: 900, mb: 1.5 }}>Dispositivos</Typography>{(data?.devices || []).map((item) => <Box key={item.label} sx={{ display: "flex", justifyContent: "space-between", py: 1, borderBottom: "1px solid rgba(15,23,42,.07)" }}><Typography>{item.label}</Typography><Typography sx={{ fontWeight: 900 }}>{item.count}</Typography></Box>)}{!data?.devices.length ? <Typography sx={{ color: "text.secondary" }}>Sem visitas no período.</Typography> : null}</Paper>
    </Box>

    <Paper sx={{ overflow: "hidden" }}><Box sx={{ p: 2, borderBottom: "1px solid rgba(15,23,42,.08)" }}><Typography variant="h6" sx={{ fontWeight: 900 }}>Desempenho por página</Typography><Typography sx={{ fontSize: 13, color: "text.secondary", mt: .5 }}>Compare o interesse real em cada oferta antes de investir em tráfego.</Typography></Box><SimpleTable headers={["Curso", "Rota", "Visitas", "Sessões", "Checkout", "CTR", "Último acesso"]} empty={!data?.courses.length}>{(data?.courses || []).map((course) => <tr key={course.pageKey} style={{ borderTop: "1px solid rgba(15,23,42,.08)" }}><td style={{ padding: 14, fontWeight: 800 }}>{course.title}</td><td style={{ padding: 14, fontFamily: "monospace", fontSize: 12 }}>{course.path}</td><td style={{ padding: 14 }}>{course.pageViews}</td><td style={{ padding: 14 }}>{course.uniqueSessions}</td><td style={{ padding: 14 }}>{course.initiateCheckouts}</td><td style={{ padding: 14 }}>{course.checkoutCtr}%</td><td style={{ padding: 14 }}>{dateTime(course.lastEventAt)}</td></tr>)}</SimpleTable></Paper>

    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 2 }}>
      <Paper sx={{ gridColumn: { xs: "span 12", lg: "span 7" }, overflow: "hidden" }}><Box sx={{ p: 2, borderBottom: "1px solid rgba(15,23,42,.08)" }}><Typography variant="h6" sx={{ fontWeight: 900 }}>Origem do tráfego e campanhas</Typography></Box><SimpleTable headers={["Origem", "Campanha", "Visitas", "Sessões", "Checkout", "CTR"]} empty={!data?.sources.length}>{(data?.sources || []).map((item, index) => <tr key={`${item.source}-${index}`} style={{ borderTop: "1px solid rgba(15,23,42,.08)" }}><td style={{ padding: 14 }}>{item.source}<br /><small>{item.medium}</small></td><td style={{ padding: 14 }}>{item.campaign}</td><td style={{ padding: 14 }}>{item.pageViews}</td><td style={{ padding: 14 }}>{item.uniqueSessions}</td><td style={{ padding: 14 }}>{item.initiateCheckouts}</td><td style={{ padding: 14 }}>{item.checkoutCtr}%</td></tr>)}</SimpleTable></Paper>
      <Paper sx={{ p: 2, gridColumn: { xs: "span 12", lg: "span 5" } }}><Typography variant="h6" sx={{ fontWeight: 900, mb: 1.5 }}>Engajamento</Typography>{(data?.engagement || []).map((item) => <Box key={item.label} sx={{ display: "flex", justifyContent: "space-between", gap: 2, py: 1, borderBottom: "1px solid rgba(15,23,42,.07)" }}><Typography sx={{ wordBreak: "break-word" }}>{item.label}</Typography><Typography sx={{ fontWeight: 900 }}>{item.count}</Typography></Box>)}{!data?.engagement.length ? <Typography sx={{ color: "text.secondary", fontSize: 14 }}>Os eventos de grade, oferta e FAQ aparecerão aqui conforme os acessos acontecerem.</Typography> : null}<Typography sx={{ mt: 2, fontSize: 12, color: "text.secondary" }}>Navegadores: {(data?.browsers || []).map((item) => `${item.label} (${item.count})`).join(" · ") || "–"}</Typography><Typography sx={{ mt: .5, fontSize: 12, color: "text.secondary" }}>Sistemas: {(data?.systems || []).map((item) => `${item.label} (${item.count})`).join(" · ") || "–"}</Typography></Paper>
    </Box>

    <Paper sx={{ overflow: "hidden" }}><Box sx={{ p: 2, borderBottom: "1px solid rgba(15,23,42,.08)" }}><Typography variant="h6" sx={{ fontWeight: 900 }}>Atividade recente</Typography><Typography sx={{ fontSize: 13, color: "text.secondary", mt: .5 }}>Sessões são exibidas de forma curta e anônima; não há e-mail, nome ou IP nesta tela.</Typography></Box><SimpleTable headers={["Quando", "Curso", "Evento", "Origem", "Dispositivo", "Sessão"]} empty={!data?.recentEvents.length}>{(data?.recentEvents || []).map((event) => <tr key={event.id} style={{ borderTop: "1px solid rgba(15,23,42,.08)" }}><td style={{ padding: 14, whiteSpace: "nowrap" }}>{dateTime(event.occurredAt)}</td><td style={{ padding: 14 }}>{event.course}<br /><small>{event.pagePath}</small></td><td style={{ padding: 14 }}>{event.eventName || event.eventType}</td><td style={{ padding: 14 }}>{event.source}{event.campaign !== "-" ? ` · ${event.campaign}` : ""}</td><td style={{ padding: 14 }}>{event.device}<br /><small>{event.browser} · {event.os}</small></td><td style={{ padding: 14, fontFamily: "monospace" }}>{event.sessionIdShort}</td></tr>)}</SimpleTable></Paper>

    <Alert severity="info">O painel usa dados de navegação agregados e anônimos. País, estado e cidade são suportados pelo banco, mas só aparecem quando sua infraestrutura de hospedagem enviar esses dados; a coleta atual não tenta identificar pessoas. Para compras e receita reais, basta conectar o webhook/postback da Hotmart aos eventos de compra.</Alert>
  </Box>;
}
