"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  IconButton,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

type Metric = "subscribers" | "viewsLongs" | "viewsShorts" | "totalViews";
type Period = "7d" | "30d" | "90d";

type Category = { id: string; name: string; slug: string; color: string };

type RankingRow = {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  customUrl: string | null;
  youtubeChannelId: string;
  country: string | null;
  category: { name: string; color: string; slug: string };
  subscribers: string;
  totalViews: string;
  viewsLongs: string;
  viewsShorts: string;
  deltaSubscribers: string | null;
  deltaTotalViews: string | null;
  deltaViewsLongs: string | null;
  deltaViewsShorts: string | null;
};

function formatNum(numStr: string) {
  const n = Number(numStr);
  if (!Number.isFinite(n)) return "0";
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toString();
}

function formatDelta(delta: string | null) {
  if (delta === null) return "—";
  const n = Number(delta);
  if (!Number.isFinite(n)) return "—";
  const sign = n >= 0 ? "+" : "";
  return sign + formatNum(delta);
}

export default function RankingPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [country, setCountry] = useState("");

  const [metric, setMetric] = useState<Metric>("subscribers");
  const [period, setPeriod] = useState<Period>("30d");

  const [data, setData] = useState<RankingRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    const res = await fetch("/api/youtube-analytics/categories");
    if (!res.ok) return;
    const json = await res.json();
    setCategories(Array.isArray(json?.categories) ? json.categories : []);
  }, []);

  const fetchRanking = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        metric,
        period,
        page: String(page + 1),
        pageSize: String(pageSize),
        categoryId,
        country,
      });
      const res = await fetch(`/api/youtube-analytics/ranking?${qs.toString()}`);
      const json = await res.json();
      setData(Array.isArray(json?.data) ? json.data : []);
      setTotal(Number(json?.total) || 0);
    } finally {
      setLoading(false);
    }
  }, [metric, period, page, pageSize, categoryId, country]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchRanking();
  }, [fetchRanking]);

  const rankOffset = useMemo(() => page * pageSize, [page, pageSize]);

  const deltaField = useMemo(() => {
    switch (metric) {
      case "subscribers":
        return "deltaSubscribers" as const;
      case "totalViews":
        return "deltaTotalViews" as const;
      case "viewsLongs":
        return "deltaViewsLongs" as const;
      case "viewsShorts":
        return "deltaViewsShorts" as const;
      default:
        return "deltaSubscribers" as const;
    }
  }, [metric]);

  const metricLabel = useMemo(() => {
    switch (metric) {
      case "subscribers":
        return "Inscritos";
      case "totalViews":
        return "Views (total)";
      case "viewsLongs":
        return "Views (long)";
      case "viewsShorts":
        return "Views (short)";
      default:
        return "Inscritos";
    }
  }, [metric]);

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap", mb: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Ranking
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Top canais por métrica + variação por período (via snapshots).
          </Typography>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 2, borderRadius: 3, border: "1px solid #f1f5f9" }} elevation={0}>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          <ToggleButtonGroup
            value={metric}
            exclusive
            onChange={(_e, v) => {
              if (!v) return;
              setMetric(v);
              setPage(0);
            }}
            size="small"
          >
            <ToggleButton value="subscribers">Inscritos</ToggleButton>
            <ToggleButton value="viewsLongs">Views long</ToggleButton>
            <ToggleButton value="viewsShorts">Views short</ToggleButton>
            <ToggleButton value="totalViews">Views total</ToggleButton>
          </ToggleButtonGroup>

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
            <ToggleButtonGroup
              value={period}
              exclusive
              onChange={(_e, v) => {
                if (!v) return;
                setPeriod(v);
                setPage(0);
              }}
              size="small"
            >
              <ToggleButton value="7d">7d</ToggleButton>
              <ToggleButton value="30d">30d</ToggleButton>
              <ToggleButton value="90d">90d</ToggleButton>
            </ToggleButtonGroup>

            <FormControl size="small" sx={{ minWidth: 260 }}>
              <InputLabel>Nicho</InputLabel>
              <Select
                label="Nicho"
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(String(e.target.value));
                  setPage(0);
                }}
              >
                <MenuItem value="">Todos</MenuItem>
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>País</InputLabel>
              <Select
                label="País"
                value={country}
                onChange={(e) => {
                  setCountry(String(e.target.value).toUpperCase());
                  setPage(0);
                }}
              >
                <MenuItem value="">Todos</MenuItem>
                {["BR", "US", "PT", "AR", "MX", "ES"].map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius: 3, border: "1px solid #f1f5f9" }} elevation={0}>
        <Table sx={{ minWidth: 980 }}>
          <TableHead sx={{ bgcolor: "#f8fafc" }}>
            <TableRow>
              <TableCell>Rank</TableCell>
              <TableCell>Canal</TableCell>
              <TableCell>Nicho</TableCell>
              <TableCell align="right">{metricLabel}</TableCell>
              <TableCell align="right">Δ {period}</TableCell>
              <TableCell align="center">País</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  Carregando...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  Nenhum canal encontrado
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, idx) => {
                const url = row.customUrl || `https://youtube.com/channel/${row.youtubeChannelId}`;
                const currentValue =
                  metric === "subscribers"
                    ? row.subscribers
                    : metric === "viewsLongs"
                      ? row.viewsLongs
                      : metric === "viewsShorts"
                        ? row.viewsShorts
                        : row.totalViews;
                const delta = (row as any)[deltaField] as string | null;

                return (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ fontWeight: 900, color: "text.secondary" }}>
                      #{rankOffset + idx + 1}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Avatar src={row.thumbnailUrl || undefined} alt={row.name} />
                        <Box>
                          <Typography sx={{ fontWeight: 800 }}>{row.name}</Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            {formatNum(row.subscribers)} subs · {formatNum(row.totalViews)} views
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={row.category.name}
                        sx={{
                          bgcolor: `${row.category.color}15`,
                          color: row.category.color,
                          fontWeight: 800,
                        }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900 }}>
                      {formatNum(currentValue)}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 900,
                        color:
                          delta === null
                            ? "text.secondary"
                            : Number(delta) >= 0
                              ? "success.main"
                              : "error.main",
                      }}
                    >
                      {formatDelta(delta)}
                    </TableCell>
                    <TableCell align="center">{row.country || "—"}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Abrir no YouTube">
                        <IconButton size="small" component="a" href={url} target="_blank">
                          <OpenInNewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 20, 50, 100]}
          component="div"
          count={total}
          rowsPerPage={pageSize}
          page={page}
          onPageChange={(_e, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setPageSize(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Linhas por página:"
        />
      </TableContainer>
    </Box>
  );
}

