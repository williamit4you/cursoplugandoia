"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Chip, MenuItem, Paper, TextField, Typography } from "@mui/material";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type SummaryPayload = {
  pageViews: number;
  uniqueVisitors: number;
  viewContents: number;
  initiateCheckouts: number;
  leads: number;
  purchases: number;
  revenue: number;
  checkoutCtr: number;
  viewToCheckoutRate: number;
  purchaseRate: number;
  lastEventAt: string | null;
};

type FunnelItem = {
  step: string;
  count: number;
  rateFromPrevious: number;
};

type SourceItem = {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  referrer: string;
  pageViews: number;
  initiateCheckouts: number;
  uniqueVisitors: number;
  checkoutCtr: number;
};

type TimeseriesItem = {
  date: string;
  pageViews: number;
  viewContents: number;
  initiateCheckouts: number;
  purchases: number;
  revenue: number;
};

type RecentEvent = {
  id: string;
  eventType: string;
  occurredAt: string;
  sessionIdShort: string;
  utmSource: string | null;
  utmCampaign: string | null;
  deviceType: string;
  browser: string | null;
  value: number | null;
};

type QuickRange = "7d" | "30d" | "today";

const quickRangeOptions: { label: string; value: QuickRange }[] = [
  { label: "Últimos 7 dias", value: "7d" },
  { label: "Últimos 30 dias", value: "30d" },
  { label: "Hoje", value: "today" },
];

function getRangePreset(value: QuickRange) {
  const now = new Date();
  const end = now.toISOString().slice(0, 10);

  if (value === "today") {
    return { from: end, to: end };
  }

  const days = value === "7d" ? 7 : 30;
  const from = new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
  return {
    from: from.toISOString().slice(0, 10),
    to: end,
  };
}

function formatDateTime(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-BR");
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
}

function kpiCards(summary: SummaryPayload | null) {
  if (!summary) return [];

  return [
    { label: "Page Views", value: summary.pageViews },
    { label: "Visitantes únicos", value: summary.uniqueVisitors },
    { label: "ViewContent", value: summary.viewContents },
    { label: "Cliques em comprar", value: summary.initiateCheckouts },
    { label: "CTR checkout", value: `${summary.checkoutCtr}%` },
    { label: "Receita", value: formatCurrency(summary.revenue) },
  ];
}

export default function SalesAnalyticsPage() {
  const [isChartReady, setIsChartReady] = useState(false);
  const [pageKey, setPageKey] = useState("curso-fundamentos-ia");
  const [quickRange, setQuickRange] = useState<QuickRange>("30d");
  const preset = useMemo(() => getRangePreset(quickRange), [quickRange]);
  const [from, setFrom] = useState(preset.from);
  const [to, setTo] = useState(preset.to);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [summary, setSummary] = useState<SummaryPayload | null>(null);
  const [funnel, setFunnel] = useState<FunnelItem[]>([]);
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [timeseries, setTimeseries] = useState<TimeseriesItem[]>([]);
  const [events, setEvents] = useState<RecentEvent[]>([]);

  useEffect(() => {
    setIsChartReady(true);
  }, []);

  useEffect(() => {
    setFrom(preset.from);
    setTo(preset.to);
  }, [preset.from, preset.to]);

  async function load() {
    setLoading(true);
    setMessage(null);

    try {
      const query = new URLSearchParams({
        pageKey,
        from,
        to,
      }).toString();

      const [summaryRes, funnelRes, sourcesRes, timeseriesRes, eventsRes] = await Promise.all([
        fetch(`/api/admin/sales-analytics/summary?${query}`, { cache: "no-store" }),
        fetch(`/api/admin/sales-analytics/funnel?${query}`, { cache: "no-store" }),
        fetch(`/api/admin/sales-analytics/sources?${query}`, { cache: "no-store" }),
        fetch(`/api/admin/sales-analytics/timeseries?${query}`, { cache: "no-store" }),
        fetch(`/api/admin/sales-analytics/events?${query}`, { cache: "no-store" }),
      ]);

      const [summaryData, funnelData, sourcesData, timeseriesData, eventsData] = await Promise.all([
        summaryRes.json(),
        funnelRes.json(),
        sourcesRes.json(),
        timeseriesRes.json(),
        eventsRes.json(),
      ]);

      if (!summaryRes.ok) throw new Error(summaryData?.error || "Falha ao carregar resumo");
      if (!funnelRes.ok) throw new Error(funnelData?.error || "Falha ao carregar funil");
      if (!sourcesRes.ok) throw new Error(sourcesData?.error || "Falha ao carregar origens");
      if (!timeseriesRes.ok) throw new Error(timeseriesData?.error || "Falha ao carregar série temporal");
      if (!eventsRes.ok) throw new Error(eventsData?.error || "Falha ao carregar eventos");

      setSummary(summaryData);
      setFunnel(funnelData.items || []);
      setSources(sourcesData.items || []);
      setTimeseries(timeseriesData.items || []);
      setEvents(eventsData.items || []);
    } catch (error: any) {
      setMessage(error?.message || "Falha ao carregar analytics da landing");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          Sales Analytics
        </Typography>
        <Typography sx={{ opacity: 0.8, mt: 1 }}>
          Dashboard da landing page com funil próprio em paralelo ao Meta Pixel.
        </Typography>
      </Box>

      {message ? <Alert severity="error">{message}</Alert> : null}

      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 2 }}>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
            <TextField fullWidth label="Landing" value={pageKey} onChange={(e) => setPageKey(e.target.value)} />
          </Box>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 3" } }}>
            <TextField select fullWidth label="Período rápido" value={quickRange} onChange={(e) => setQuickRange(e.target.value as QuickRange)}>
              {quickRangeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 2.5" } }}>
            <TextField fullWidth label="De" type="date" value={from} onChange={(e) => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Box>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 2.5" } }}>
            <TextField fullWidth label="Até" type="date" value={to} onChange={(e) => setTo(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5, mt: 2, alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={load}
            disabled={loading}
            style={{ padding: "10px 14px", borderRadius: 10, fontWeight: 800, background: "#111827", color: "white" }}
          >
            {loading ? "Carregando..." : "Atualizar"}
          </button>
          <Chip label={`Último evento: ${formatDateTime(summary?.lastEventAt || null)}`} size="small" />
        </Box>
      </Paper>

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 2 }}>
        {kpiCards(summary).map((card) => (
          <Paper key={card.label} sx={{ p: 2, gridColumn: { xs: "span 12", md: "span 2" } }}>
            <Typography sx={{ fontSize: 12, opacity: 0.7 }}>{card.label}</Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, mt: 1 }}>
              {card.value}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 2 }}>
        <Paper sx={{ p: 2, gridColumn: { xs: "span 12", lg: "span 8" } }}>
          <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
            Série temporal
          </Typography>
          <Box sx={{ width: "100%", height: 320 }}>
            {isChartReady ? (
              <ResponsiveContainer>
                <AreaChart data={timeseries}>
                  <defs>
                    <linearGradient id="salesViews" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.04} />
                    </linearGradient>
                    <linearGradient id="salesCheckout" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="pageViews" stroke="#06b6d4" fill="url(#salesViews)" strokeWidth={3} />
                  <Area type="monotone" dataKey="initiateCheckouts" stroke="#22c55e" fill="url(#salesCheckout)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            ) : null}
          </Box>
        </Paper>

        <Paper sx={{ p: 2, gridColumn: { xs: "span 12", lg: "span 4" } }}>
          <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
            Funil
          </Typography>
          <Box sx={{ display: "grid", gap: 1.5 }}>
            {funnel.map((item) => (
              <Box key={item.step} sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.12)" }}>
                <Typography sx={{ fontSize: 12, opacity: 0.7 }}>{item.step}</Typography>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  {item.count}
                </Typography>
                <Typography sx={{ fontSize: 12, opacity: 0.75 }}>
                  Conversão da etapa anterior: {item.rateFromPrevious}%
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>

      <Paper sx={{ p: 0, overflow: "hidden" }}>
        <Box sx={{ p: 2, borderBottom: "1px solid rgba(15, 23, 42, 0.08)" }}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Origens e campanhas
          </Typography>
        </Box>
        <Box sx={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(15,23,42,0.03)" }}>
                {["Source", "Medium", "Campaign", "Referrer", "Views", "Checkout", "Únicos", "CTR"].map((label) => (
                  <th key={label} style={{ textAlign: "left", padding: 16, fontSize: 12 }}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sources.map((item, index) => (
                <tr key={`${item.utmSource}-${index}`} style={{ borderTop: "1px solid rgba(15,23,42,0.08)" }}>
                  <td style={{ padding: 16 }}>{item.utmSource}</td>
                  <td style={{ padding: 16 }}>{item.utmMedium}</td>
                  <td style={{ padding: 16 }}>{item.utmCampaign}</td>
                  <td style={{ padding: 16, maxWidth: 280, wordBreak: "break-word" }}>{item.referrer}</td>
                  <td style={{ padding: 16 }}>{item.pageViews}</td>
                  <td style={{ padding: 16 }}>{item.initiateCheckouts}</td>
                  <td style={{ padding: 16 }}>{item.uniqueVisitors}</td>
                  <td style={{ padding: 16 }}>{item.checkoutCtr}%</td>
                </tr>
              ))}
              {!loading && sources.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 24, textAlign: "center", opacity: 0.7 }}>
                    Nenhuma origem encontrada no período.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </Box>
      </Paper>

      <Paper sx={{ p: 0, overflow: "hidden" }}>
        <Box sx={{ p: 2, borderBottom: "1px solid rgba(15, 23, 42, 0.08)" }}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Eventos recentes
          </Typography>
        </Box>
        <Box sx={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(15,23,42,0.03)" }}>
                {["Quando", "Evento", "Sessão", "Source", "Campaign", "Device", "Browser", "Valor"].map((label) => (
                  <th key={label} style={{ textAlign: "left", padding: 16, fontSize: 12 }}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} style={{ borderTop: "1px solid rgba(15,23,42,0.08)" }}>
                  <td style={{ padding: 16 }}>{formatDateTime(event.occurredAt)}</td>
                  <td style={{ padding: 16 }}>{event.eventType}</td>
                  <td style={{ padding: 16, fontFamily: "monospace" }}>{event.sessionIdShort}</td>
                  <td style={{ padding: 16 }}>{event.utmSource || "-"}</td>
                  <td style={{ padding: 16 }}>{event.utmCampaign || "-"}</td>
                  <td style={{ padding: 16 }}>{event.deviceType}</td>
                  <td style={{ padding: 16 }}>{event.browser || "-"}</td>
                  <td style={{ padding: 16 }}>{event.value ? formatCurrency(event.value) : "-"}</td>
                </tr>
              ))}
              {!loading && events.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 24, textAlign: "center", opacity: 0.7 }}>
                    Nenhum evento encontrado.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </Box>
      </Paper>
    </Box>
  );
}
