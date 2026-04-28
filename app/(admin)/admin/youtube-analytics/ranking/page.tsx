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
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Alert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";

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
  deltaLikesTotal: string | null;
  deltaCommentsTotal: string | null;
  deltaLikesLongs: string | null;
  deltaCommentsLongs: string | null;
  deltaLikesShorts: string | null;
  deltaCommentsShorts: string | null;
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

  const [openDiscover, setOpenDiscover] = useState(false);
  const [discoverYtCategoryId, setDiscoverYtCategoryId] = useState("");
  const [discoverRegionCode, setDiscoverRegionCode] = useState("BR");
  const [discoverYoutubeVideoCategoryId, setDiscoverYoutubeVideoCategoryId] = useState("23");
  const [discoverAfter, setDiscoverAfter] = useState("2026-04-01T00:00:00Z");
  const [discoverBefore, setDiscoverBefore] = useState("2026-04-30T23:59:59Z");
  const [discoverMaxChannels, setDiscoverMaxChannels] = useState(100);
  const [discoverMaxVideos, setDiscoverMaxVideos] = useState(300);
  const [discoverResult, setDiscoverResult] = useState<string | null>(null);

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

  const deltaLikesField = useMemo(() => {
    if (metric === "viewsLongs") return "deltaLikesLongs" as const;
    if (metric === "viewsShorts") return "deltaLikesShorts" as const;
    return "deltaLikesTotal" as const;
  }, [metric]);

  const deltaCommentsField = useMemo(() => {
    if (metric === "viewsLongs") return "deltaCommentsLongs" as const;
    if (metric === "viewsShorts") return "deltaCommentsShorts" as const;
    return "deltaCommentsTotal" as const;
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
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Button
            variant="contained"
            startIcon={<AutoAwesomeIcon />}
            onClick={() => {
              setDiscoverResult(null);
              setDiscoverYtCategoryId(categoryId || (categories[0]?.id || ""));
              setOpenDiscover(true);
            }}
          >
            Descobrir top canais (beta)
          </Button>
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
              <TableCell align="right">Likes Δ</TableCell>
              <TableCell align="right">Coments Δ</TableCell>
              <TableCell align="center">País</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  Carregando...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
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
                const deltaLikes = (row as any)[deltaLikesField] as string | null;
                const deltaComments = (row as any)[deltaCommentsField] as string | null;

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
                    <TableCell align="right" sx={{ fontWeight: 900, color: "text.secondary" }}>
                      {formatDelta(deltaLikes)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900, color: "text.secondary" }}>
                      {formatDelta(deltaComments)}
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

      <Dialog open={openDiscover} onClose={() => setOpenDiscover(false)} maxWidth="md" fullWidth>
        <DialogTitle>Descobrir top canais por categoria (beta)</DialogTitle>
        <DialogContent dividers>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Não existe endpoint oficial do YouTube para “Top 100 canais por categoria”.
            Esta automação usa <strong>TOP VÍDEOS</strong> no período (search order=viewCount) e agrega por canal.
            As views são o <strong>viewCount total no momento</strong> (não “views do mês” históricas).
          </Alert>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 160px 220px" }, gap: 2, mb: 2 }}>
            <FormControl size="small">
              <InputLabel>Categoria interna</InputLabel>
              <Select
                label="Categoria interna"
                value={discoverYtCategoryId}
                onChange={(e) => setDiscoverYtCategoryId(String(e.target.value))}
              >
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              size="small"
              label="RegionCode"
              value={discoverRegionCode}
              onChange={(e) => setDiscoverRegionCode(e.target.value.toUpperCase())}
              placeholder="BR"
            />

            <FormControl size="small">
              <InputLabel>Categoria YouTube</InputLabel>
              <Select
                label="Categoria YouTube"
                value={discoverYoutubeVideoCategoryId}
                onChange={(e) => setDiscoverYoutubeVideoCategoryId(String(e.target.value))}
              >
                <MenuItem value="23">23 — Comedy</MenuItem>
                <MenuItem value="24">24 — Entertainment</MenuItem>
                <MenuItem value="20">20 — Gaming</MenuItem>
                <MenuItem value="22">22 — People & Blogs</MenuItem>
                <MenuItem value="15">15 — Pets & Animals</MenuItem>
                <MenuItem value="1">1 — Film & Animation</MenuItem>
                <MenuItem value="10">10 — Music</MenuItem>
                <MenuItem value="17">17 — Sports</MenuItem>
                <MenuItem value="28">28 — Science & Technology</MenuItem>
                <MenuItem value="26">26 — Howto & Style</MenuItem>
                <MenuItem value="25">25 — News & Politics</MenuItem>
                <MenuItem value="27">27 — Education</MenuItem>
                <MenuItem value="29">29 — Nonprofits & Activism</MenuItem>
                <MenuItem value="2">2 — Autos & Vehicles</MenuItem>
                <MenuItem value="19">19 — Travel & Events</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2, mb: 2 }}>
            <TextField
              size="small"
              label="publishedAfter (RFC3339)"
              value={discoverAfter}
              onChange={(e) => setDiscoverAfter(e.target.value)}
            />
            <TextField
              size="small"
              label="publishedBefore (RFC3339)"
              value={discoverBefore}
              onChange={(e) => setDiscoverBefore(e.target.value)}
            />
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
            <TextField
              size="small"
              type="number"
              label="maxChannels"
              value={discoverMaxChannels}
              onChange={(e) => setDiscoverMaxChannels(Number(e.target.value))}
            />
            <TextField
              size="small"
              type="number"
              label="maxVideos (até 500)"
              value={discoverMaxVideos}
              onChange={(e) => setDiscoverMaxVideos(Number(e.target.value))}
            />
          </Box>

          {discoverResult && (
            <Alert severity="info" sx={{ mt: 2 }}>
              {discoverResult}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDiscover(false)}>Fechar</Button>
          <Button
            variant="contained"
            onClick={async () => {
              setDiscoverResult(null);
              try {
                const res = await fetch("/api/youtube-analytics/discover-top-channels", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    ytCategoryId: discoverYtCategoryId,
                    regionCode: discoverRegionCode,
                    youtubeVideoCategoryId: discoverYoutubeVideoCategoryId,
                    publishedAfter: discoverAfter,
                    publishedBefore: discoverBefore,
                    maxChannels: discoverMaxChannels,
                    maxVideos: discoverMaxVideos,
                  }),
                });
                const json = await res.json();
                if (!res.ok) {
                  setDiscoverResult(json?.error || "Erro ao descobrir canais");
                  return;
                }
                setDiscoverResult(
                  `Import concluído: ${json.channelsImported}/${json.channelsDiscovered} canais. Vídeos coletados: ${json.topVideosFetched}. Erros: ${json.errorsCount}.`
                );
                setOpenDiscover(false);
              } catch (e: any) {
                setDiscoverResult(e?.message || "Erro ao descobrir canais");
              }
            }}
          >
            Rodar descoberta
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
