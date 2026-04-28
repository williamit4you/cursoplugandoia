"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  LinearProgress,
  ListItemText,
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
  TextField,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { resolveYoutubeCategoryFromInternalCategory } from "@/lib/youtubeCategoryMapping";

type Metric = "subscribers" | "viewsLongs" | "viewsShorts" | "totalViews";
type Period = "7d" | "30d" | "90d";

type Category = {
  id: string;
  name: string;
  slug: string;
  color: string;
};

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

type DiscoverStatus = "pending" | "running" | "success" | "empty" | "error";

type DiscoverRun = {
  categoryId: string;
  categoryName: string;
  youtubeCategoryLabel: string;
  status: DiscoverStatus;
  topVideosFetched: number;
  channelsDiscovered: number;
  channelsImported: number;
  errorsCount: number;
  note?: string;
  message?: string;
};

const COUNTRY_OPTIONS = ["BR", "US", "PT", "AR", "MX", "ES"];
const MAX_CHANNEL_OPTIONS = [20, 50, 100, 150, 200];
const MAX_VIDEO_OPTIONS = [100, 200, 300, 400, 500];

function formatNum(numStr: string) {
  const value = Number(numStr);
  if (!Number.isFinite(value)) return "0";
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toString();
}

function formatDelta(delta: string | null) {
  if (delta === null) return "—";
  const value = Number(delta);
  if (!Number.isFinite(value)) return "—";
  return `${value >= 0 ? "+" : ""}${formatNum(delta)}`;
}

function formatLocalDateTimeInput(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function buildDefaultDateRange() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 30);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setHours(23, 59, 0, 0);

  return {
    start: formatLocalDateTimeInput(start),
    end: formatLocalDateTimeInput(end),
  };
}

function toIsoString(value: string) {
  return new Date(value).toISOString();
}

function getStatusLabel(status: DiscoverStatus) {
  switch (status) {
    case "running":
      return "Processando";
    case "success":
      return "Concluída";
    case "empty":
      return "Sem resultados";
    case "error":
      return "Com erro";
    default:
      return "Pendente";
  }
}

function getStatusColor(status: DiscoverStatus) {
  switch (status) {
    case "running":
      return "warning";
    case "success":
      return "success";
    case "empty":
      return "info";
    case "error":
      return "error";
    default:
      return "default";
  }
}

export default function RankingPage() {
  const defaultDateRange = useMemo(() => buildDefaultDateRange(), []);

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
  const [discoverCategoryIds, setDiscoverCategoryIds] = useState<string[]>([]);
  const [discoverRegionCode, setDiscoverRegionCode] = useState("BR");
  const [discoverAfter, setDiscoverAfter] = useState(defaultDateRange.start);
  const [discoverBefore, setDiscoverBefore] = useState(defaultDateRange.end);
  const [discoverMaxChannels, setDiscoverMaxChannels] = useState(100);
  const [discoverMaxVideos, setDiscoverMaxVideos] = useState(300);
  const [discoverRunning, setDiscoverRunning] = useState(false);
  const [discoverFeedback, setDiscoverFeedback] = useState<string | null>(null);
  const [discoverRuns, setDiscoverRuns] = useState<DiscoverRun[]>([]);
  const [discoverProgress, setDiscoverProgress] = useState({
    completed: 0,
    total: 0,
    currentCategoryName: "",
  });

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
        return "Views totais";
      case "viewsLongs":
        return "Views long";
      case "viewsShorts":
        return "Views short";
      default:
        return "Inscritos";
    }
  }, [metric]);

  const selectedDiscoverCategories = useMemo(
    () => categories.filter((category) => discoverCategoryIds.includes(category.id)),
    [categories, discoverCategoryIds]
  );

  const discoverProgressValue = useMemo(() => {
    if (discoverProgress.total === 0) return 0;
    return Math.round((discoverProgress.completed / discoverProgress.total) * 100);
  }, [discoverProgress]);

  const discoverSummary = useMemo(() => {
    const successCount = discoverRuns.filter((run) => run.status === "success").length;
    const emptyCount = discoverRuns.filter((run) => run.status === "empty").length;
    const errorCount = discoverRuns.filter((run) => run.status === "error").length;
    const importedCount = discoverRuns.reduce((sum, run) => sum + run.channelsImported, 0);
    const discoveredCount = discoverRuns.reduce((sum, run) => sum + run.channelsDiscovered, 0);
    const videoCount = discoverRuns.reduce((sum, run) => sum + run.topVideosFetched, 0);

    return {
      successCount,
      emptyCount,
      errorCount,
      importedCount,
      discoveredCount,
      videoCount,
    };
  }, [discoverRuns]);

  const openDiscoverDialog = () => {
    const fallbackCategoryId = categoryId || categories[0]?.id || "";
    setDiscoverFeedback(null);
    setDiscoverRuns([]);
    setDiscoverProgress({ completed: 0, total: 0, currentCategoryName: "" });
    setDiscoverCategoryIds(fallbackCategoryId ? [fallbackCategoryId] : []);
    setOpenDiscover(true);
  };

  const updateDiscoverRun = useCallback((categoryIdToUpdate: string, patch: Partial<DiscoverRun>) => {
    setDiscoverRuns((current) =>
      current.map((run) =>
        run.categoryId === categoryIdToUpdate
          ? {
              ...run,
              ...patch,
            }
          : run
      )
    );
  }, []);

  const handleDiscoverCategoriesChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setDiscoverCategoryIds(typeof value === "string" ? value.split(",") : value);
  };

  const runDiscovery = async () => {
    if (selectedDiscoverCategories.length === 0) {
      setDiscoverFeedback("Selecione ao menos uma categoria para iniciar a descoberta.");
      return;
    }

    if (!discoverAfter || !discoverBefore) {
      setDiscoverFeedback("Selecione o período inicial e final.");
      return;
    }

    if (new Date(discoverAfter).getTime() >= new Date(discoverBefore).getTime()) {
      setDiscoverFeedback("A data final precisa ser maior que a data inicial.");
      return;
    }

    const initialRuns: DiscoverRun[] = selectedDiscoverCategories.map((category) => ({
      categoryId: category.id,
      categoryName: category.name,
      youtubeCategoryLabel: resolveYoutubeCategoryFromInternalCategory(category).youtubeCategoryLabel,
      status: "pending",
      topVideosFetched: 0,
      channelsDiscovered: 0,
      channelsImported: 0,
      errorsCount: 0,
    }));

    setDiscoverRunning(true);
    setDiscoverFeedback(null);
    setDiscoverRuns(initialRuns);
    setDiscoverProgress({
      completed: 0,
      total: initialRuns.length,
      currentCategoryName: initialRuns[0]?.categoryName || "",
    });

    let completed = 0;

    for (const category of selectedDiscoverCategories) {
      updateDiscoverRun(category.id, { status: "running" });
      setDiscoverProgress((current) => ({
        ...current,
        currentCategoryName: category.name,
      }));

      try {
        const response = await fetch("/api/youtube-analytics/discover-top-channels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ytCategoryId: category.id,
            regionCode: discoverRegionCode,
            publishedAfter: toIsoString(discoverAfter),
            publishedBefore: toIsoString(discoverBefore),
            maxChannels: discoverMaxChannels,
            maxVideos: discoverMaxVideos,
          }),
        });

        const json = await response.json();

        if (!response.ok) {
          updateDiscoverRun(category.id, {
            status: "error",
            message: json?.error || "Falha ao processar esta categoria.",
          });
        } else {
          const status: DiscoverStatus =
            json.channelsImported > 0
              ? "success"
              : json.errorsCount > 0 && json.channelsDiscovered === 0
                ? "error"
                : "empty";

          const message =
            status === "success"
              ? `Busca concluída com ${json.channelsImported} canais importados.`
              : status === "empty"
                ? `Nenhum canal foi importado. Procurei vídeos mais vistos em ${json.youtubeVideoCategoryLabel} para ${discoverRegionCode} no período informado.`
                : json?.error || "Não foi possível concluir a importação.";

          updateDiscoverRun(category.id, {
            status,
            topVideosFetched: Number(json.topVideosFetched) || 0,
            channelsDiscovered: Number(json.channelsDiscovered) || 0,
            channelsImported: Number(json.channelsImported) || 0,
            errorsCount: Number(json.errorsCount) || 0,
            note: json.note,
            message,
            youtubeCategoryLabel: json.youtubeVideoCategoryLabel || resolveYoutubeCategoryFromInternalCategory(category).youtubeCategoryLabel,
          });
        }
      } catch (error: any) {
        updateDiscoverRun(category.id, {
          status: "error",
          message: error?.message || "Falha inesperada durante a descoberta.",
        });
      } finally {
        completed += 1;
        setDiscoverProgress((current) => ({
          ...current,
          completed,
          currentCategoryName:
            completed < selectedDiscoverCategories.length
              ? selectedDiscoverCategories[completed].name
              : "",
        }));
      }
    }

    setDiscoverRunning(false);
    setDiscoverFeedback("Descoberta finalizada. Confira abaixo o resultado de cada categoria.");
    await fetchRanking();
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap", mb: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Ranking
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Top canais por métrica com variação por período com base nos snapshots coletados.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Button variant="contained" startIcon={<AutoAwesomeIcon />} onClick={openDiscoverDialog}>
            Descobrir top canais
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 2, borderRadius: 3, border: "1px solid #f1f5f9" }} elevation={0}>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          <ToggleButtonGroup
            value={metric}
            exclusive
            onChange={(_event, value) => {
              if (!value) return;
              setMetric(value);
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
              onChange={(_event, value) => {
                if (!value) return;
                setPeriod(value);
                setPage(0);
              }}
              size="small"
            >
              <ToggleButton value="7d">7 dias</ToggleButton>
              <ToggleButton value="30d">30 dias</ToggleButton>
              <ToggleButton value="90d">90 dias</ToggleButton>
            </ToggleButtonGroup>

            <FormControl size="small" sx={{ minWidth: 260 }}>
              <InputLabel>Categoria</InputLabel>
              <Select
                label="Categoria"
                value={categoryId}
                onChange={(event) => {
                  setCategoryId(String(event.target.value));
                  setPage(0);
                }}
              >
                <MenuItem value="">Todas</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>País</InputLabel>
              <Select
                label="País"
                value={country}
                onChange={(event) => {
                  setCountry(String(event.target.value).toUpperCase());
                  setPage(0);
                }}
              >
                <MenuItem value="">Todos</MenuItem>
                {COUNTRY_OPTIONS.map((countryOption) => (
                  <MenuItem key={countryOption} value={countryOption}>
                    {countryOption}
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
              <TableCell>Categoria</TableCell>
              <TableCell align="right">{metricLabel}</TableCell>
              <TableCell align="right">Variação</TableCell>
              <TableCell align="right">Likes</TableCell>
              <TableCell align="right">Comentários</TableCell>
              <TableCell align="center">País</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  Carregando ranking...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  Nenhum canal encontrado para os filtros selecionados.
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
                const delta = row[deltaField];
                const deltaLikes = row[deltaLikesField];
                const deltaComments = row[deltaCommentsField];

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
                            {formatNum(row.subscribers)} inscritos · {formatNum(row.totalViews)} views
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
          onPageChange={(_event, nextPage) => setPage(nextPage)}
          onRowsPerPageChange={(event) => {
            setPageSize(parseInt(event.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Linhas por página:"
        />
      </TableContainer>

      <Dialog open={openDiscover} onClose={() => !discoverRunning && setOpenDiscover(false)} maxWidth="md" fullWidth>
        <DialogTitle>Descobrir top canais por categoria</DialogTitle>

        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2 }}>
            Você escolhe apenas as categorias internas. O sistema faz o relacionamento com a categoria pública do YouTube,
            busca os vídeos mais vistos do período e tenta cadastrar os canais encontrados.
          </Alert>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.7fr 0.8fr" }, gap: 2, mb: 2 }}>
            <FormControl size="small">
              <InputLabel>Categorias</InputLabel>
              <Select
                multiple
                label="Categorias"
                value={discoverCategoryIds}
                onChange={handleDiscoverCategoriesChange}
                renderValue={(selected) =>
                  categories
                    .filter((category) => selected.includes(category.id))
                    .map((category) => category.name)
                    .join(", ")
                }
              >
                {categories.map((category) => {
                  const mapped = resolveYoutubeCategoryFromInternalCategory(category);
                  return (
                    <MenuItem key={category.id} value={category.id}>
                      <Checkbox checked={discoverCategoryIds.includes(category.id)} />
                      <ListItemText
                        primary={category.name}
                        secondary={`Categoria pública: ${mapped.youtubeCategoryLabel}`}
                      />
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>

            <FormControl size="small">
              <InputLabel>País</InputLabel>
              <Select
                label="País"
                value={discoverRegionCode}
                onChange={(event) => setDiscoverRegionCode(String(event.target.value))}
              >
                {COUNTRY_OPTIONS.map((countryOption) => (
                  <MenuItem key={countryOption} value={countryOption}>
                    {countryOption}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2, mb: 2 }}>
            <TextField
              size="small"
              type="datetime-local"
              label="Data e hora inicial"
              value={discoverAfter}
              onChange={(event) => setDiscoverAfter(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField
              size="small"
              type="datetime-local"
              label="Data e hora final"
              value={discoverBefore}
              onChange={(event) => setDiscoverBefore(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2, mb: 2 }}>
            <FormControl size="small">
              <InputLabel>Limite de canais</InputLabel>
              <Select
                label="Limite de canais"
                value={String(discoverMaxChannels)}
                onChange={(event) => setDiscoverMaxChannels(Number(event.target.value))}
              >
                {MAX_CHANNEL_OPTIONS.map((value) => (
                  <MenuItem key={value} value={value}>
                    Até {value} canais
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small">
              <InputLabel>Limite de vídeos</InputLabel>
              <Select
                label="Limite de vídeos"
                value={String(discoverMaxVideos)}
                onChange={(event) => setDiscoverMaxVideos(Number(event.target.value))}
              >
                {MAX_VIDEO_OPTIONS.map((value) => (
                  <MenuItem key={value} value={value}>
                    Até {value} vídeos
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {discoverRunning && (
            <Paper sx={{ p: 2, mb: 2, borderRadius: 3, border: "1px solid #fde68a", bgcolor: "#fffbeb" }} elevation={0}>
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, mb: 1, flexWrap: "wrap" }}>
                <Typography sx={{ fontWeight: 800 }}>
                  Processando {discoverProgress.completed}/{discoverProgress.total} categorias
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {discoverProgress.currentCategoryName
                    ? `Categoria atual: ${discoverProgress.currentCategoryName}`
                    : "Finalizando processamento"}
                </Typography>
              </Box>
              <LinearProgress variant="determinate" value={discoverProgressValue} sx={{ height: 10, borderRadius: 999 }} />
              <Typography variant="caption" sx={{ display: "block", mt: 1, color: "text.secondary" }}>
                {discoverProgressValue}% concluído
              </Typography>
            </Paper>
          )}

          {discoverFeedback && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {discoverFeedback}
            </Alert>
          )}

          {discoverRuns.length > 0 && (
            <Box sx={{ display: "grid", gap: 2 }}>
              <Paper sx={{ p: 2, borderRadius: 3, border: "1px solid #e2e8f0" }} elevation={0}>
                <Typography sx={{ fontWeight: 900, mb: 1 }}>Resumo da execução</Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
                  <Chip label={`${discoverSummary.successCount} concluídas`} color="success" variant="outlined" />
                  <Chip label={`${discoverSummary.emptyCount} sem resultados`} color="info" variant="outlined" />
                  <Chip label={`${discoverSummary.errorCount} com erro`} color="error" variant="outlined" />
                </Box>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Vídeos consultados: {discoverSummary.videoCount} · Canais encontrados: {discoverSummary.discoveredCount} ·
                  Canais importados: {discoverSummary.importedCount}
                </Typography>
              </Paper>

              {discoverRuns.map((run) => (
                <Paper
                  key={run.categoryId}
                  sx={{ p: 2, borderRadius: 3, border: "1px solid #e2e8f0" }}
                  elevation={0}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap", mb: 1 }}>
                    <Box>
                      <Typography sx={{ fontWeight: 900 }}>{run.categoryName}</Typography>
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        Busca pública usada: {run.youtubeCategoryLabel}
                      </Typography>
                    </Box>
                    <Chip label={getStatusLabel(run.status)} color={getStatusColor(run.status)} />
                  </Box>

                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
                    <Chip label={`Vídeos coletados: ${run.topVideosFetched}`} variant="outlined" />
                    <Chip label={`Canais encontrados: ${run.channelsDiscovered}`} variant="outlined" />
                    <Chip label={`Canais importados: ${run.channelsImported}`} variant="outlined" />
                    <Chip label={`Erros: ${run.errorsCount}`} variant="outlined" />
                  </Box>

                  {run.message && (
                    <Typography variant="body2" sx={{ color: "text.secondary", mb: run.note ? 1 : 0 }}>
                      {run.message}
                    </Typography>
                  )}

                  {run.note && (
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {run.note}
                    </Typography>
                  )}
                </Paper>
              ))}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenDiscover(false)} disabled={discoverRunning}>
            Fechar
          </Button>
          <Button variant="contained" onClick={runDiscovery} disabled={discoverRunning}>
            {discoverRunning ? "Processando..." : "Iniciar descoberta"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
