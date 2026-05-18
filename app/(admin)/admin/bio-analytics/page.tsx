"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Chip, MenuItem, Paper, TextField, Typography } from "@mui/material";

type BioAnalyticsItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string | null;
  videoUrl: string | null;
  affiliateUrl: string;
  active: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  clicksTotal: number;
  clicks7d: number;
  clicks30d: number;
};

function baseUrl() {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

export default function BioAnalyticsPage() {
  const [items, setItems] = useState<BioAnalyticsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [active, setActive] = useState("true");

  const load = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const qs = new URLSearchParams({ q, active });
      const res = await fetch(`/api/bio/admin/analytics?${qs.toString()}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Falha ao carregar");
      setItems(data.items || []);
    } catch (error: any) {
      setMessage(error?.message || "Falha ao carregar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = useMemo(() => {
    const total = items.reduce((acc, item) => acc + (item.clicksTotal || 0), 0);
    const d7 = items.reduce((acc, item) => acc + (item.clicks7d || 0), 0);
    const d30 = items.reduce((acc, item) => acc + (item.clicks30d || 0), 0);
    return { total, d7, d30 };
  }, [items]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          Bio Analytics
        </Typography>
        <Typography sx={{ opacity: 0.8, mt: 1 }}>
          Cliques nos produtos da vitrine pública (`/bio`).
        </Typography>
      </Box>

      {message ? <Alert severity="error">{message}</Alert> : null}

      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 2 }}>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 7" } }}>
            <TextField
              fullWidth
              label="Buscar"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Título, slug, descrição..."
            />
          </Box>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 5" } }}>
            <TextField select fullWidth label="Ativo" value={active} onChange={(e) => setActive(e.target.value)}>
              <MenuItem value="true">Somente ativos</MenuItem>
              <MenuItem value="false">Somente inativos</MenuItem>
              <MenuItem value="all">Todos</MenuItem>
            </TextField>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 2, mt: 2, alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={load}
            disabled={loading}
            style={{ padding: "10px 14px", borderRadius: 10, fontWeight: 800, background: "#111827", color: "white" }}
          >
            Aplicar
          </button>

          <Chip label={`Cliques 7d: ${totals.d7}`} size="small" />
          <Chip label={`Cliques 30d: ${totals.d30}`} size="small" />
          <Chip label={`Cliques total: ${totals.total}`} size="small" />
          <Chip label={`Itens: ${items.length}`} size="small" variant="outlined" />
        </Box>
      </Paper>

      <Paper sx={{ p: 0, overflow: "hidden" }}>
        <Box sx={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                {["Produto", "Ativo", "Cliques (7d/30d/Total)", "Links"].map((label) => (
                  <th key={label} style={{ textAlign: "left", padding: 16, fontSize: 12 }}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <td style={{ padding: 16, maxWidth: 620 }}>
                    <div style={{ fontWeight: 900 }}>{item.title}</div>
                    <div style={{ opacity: 0.7, fontSize: 12, marginTop: 4, fontFamily: "monospace" }}>{item.slug}</div>
                  </td>
                  <td style={{ padding: 16 }}>
                    <Chip label={item.active ? "ATIVO" : "INATIVO"} size="small" color={item.active ? "success" : "default"} />
                  </td>
                  <td style={{ padding: 16 }}>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <Chip size="small" label={`7d: ${item.clicks7d}`} />
                      <Chip size="small" label={`30d: ${item.clicks30d}`} />
                      <Chip size="small" label={`Total: ${item.clicksTotal}`} />
                    </div>
                  </td>
                  <td style={{ padding: 16, minWidth: 360 }}>
                    <div style={{ display: "grid", gap: 8 }}>
                      <a
                        href={`${baseUrl()}/bio/${encodeURIComponent(item.slug)}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontWeight: 900 }}
                      >
                        Abrir página /bio
                      </a>
                      <a href={item.affiliateUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, opacity: 0.8 }}>
                        Abrir link afiliado
                      </a>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && items.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: 24, textAlign: "center", opacity: 0.7 }}>
                    Nenhum item encontrado.
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

