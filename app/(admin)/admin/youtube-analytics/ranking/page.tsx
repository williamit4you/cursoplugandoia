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
  IconButton,
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
  TableSortLabel,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { resolveYoutubeCategoryFromInternalCategory } from "@/lib/youtubeCategoryMapping";

type SortOrder = "asc" | "desc";
type RankingSortBy =
  | "subscribers"
  | "totalViewsCurrent"
  | "currentPeriodVideosTotal"
  | "currentPeriodViewsLongs"
  | "currentPeriodViewsShorts"
  | "currentPeriodViewsTotal";

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
  totalViewsCurrent: string;
  totalViewsPrevious: string | null;
  totalViewsDelta: string | null;
  currentPeriodVideosTotal: number;
  currentPeriodVideosLongs: number;
  currentPeriodVideosShorts: number;
  previousPeriodVideosTotal: number;
  previousPeriodVideosLongs: number;
  previousPeriodVideosShorts: number;
  currentPeriodViewsLongs: string;
  currentPeriodViewsShorts: string;
  currentPeriodViewsTotal: string;
  previousPeriodViewsLongs: string;
  previousPeriodViewsShorts: string;
  previousPeriodViewsTotal: string;
  currentRank: number;
  previousRank: number | null;
  rankDelta: number | null;
  percentChange: number | null;
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
  channelsWithCountryMatch: number;
  channelsWithMissingCountry: number;
  skippedMissingCountryCount: number;
  skippedCountryMismatchCount: number;
  errorsCount: number;
  note?: string;
  message?: string;
};

const COUNTRY_OPTIONS = ["BR", "US", "PT", "AR", "MX", "ES"];
const MAX_CHANNEL_OPTIONS = [20, 50, 100, 150, 200];
const MAX_VIDEO_OPTIONS = [100, 200, 300, 400, 500];
const TOP_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function formatNum(value: string | number | null) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "—";
  if (numericValue >= 1e9) return `${(numericValue / 1e9).toFixed(1)}B`;
  if (numericValue >= 1e6) return `${(numericValue / 1e6).toFixed(1)}M`;
  if (numericValue >= 1e3) return `${(numericValue / 1e3).toFixed(1)}K`;
  return numericValue.toString();
}

function formatPercent(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "—";
  return `${value > 0 ? "+" : ""}${value}%`;
}

function formatRankDelta(value: number | null) {
  if (value === null || value === 0) return "—";
  return value > 0 ? `▲ ${value}` : `▼ ${Math.abs(value)}`;
}

function getRankDeltaColor(value: number | null) {
  if (value === null || value === 0) return "text.secondary";
  return value > 0 ? "success.main" : "error.main";
}

function getPercentColor(value: number | null) {
  if (value === null || value === 0) return "text.secondary";
  return value > 0 ? "success.main" : "error.main";
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

function formatShortDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR");
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
  const [channelCountry, setChannelCountry] = useState("");
  const [dateFrom, setDateFrom] = useState(defaultDateRange.start);
  const [dateTo, setDateTo] = useState(defaultDateRange.end);
  const [sortBy, setSortBy] = useState<RankingSortBy>("currentPeriodViewsTotal");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const [data, setData] = useState<RankingRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [loading, setLoading] = useState(false);
  const [previousDateFrom, setPreviousDateFrom] = useState("");
  const [previousDateTo, setPreviousDateTo] = useState("");

  const [openDiscover, setOpenDiscover] = useState(false);
  const [discoverCategoryIds, setDiscoverCategoryIds] = useState<string[]>([]);
  const [discoverRegionCode, setDiscoverRegionCode] = useState("BR");
  const [discoverAfter, setDiscoverAfter] = useState(defaultDateRange.start);
  const [discoverBefore, setDiscoverBefore] = useState(defaultDateRange.end);
  const [discoverMaxChannels, setDiscoverMaxChannels] = useState(100);
  const [discoverMaxVideos, setDiscoverMaxVideos] = useState(300);
  const [discoverRequireCountryMatch, setDiscoverRequireCountryMatch] = useState(true);
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
        page: String(page + 1),
        pageSize: String(pageSize),
        categoryId,
        country: channelCountry,
        dateFrom: toIsoString(dateFrom),
        dateTo: toIsoString(dateTo),
        sortBy,
        sortOrder,
      });
      const res = await fetch(`/api/youtube-analytics/ranking?${qs.toString()}`);
      const json = await res.json();
      setData(Array.isArray(json?.data) ? json.data : []);
      setTotal(Number(json?.total) || 0);
      setPreviousDateFrom(String(json?.previousDateFrom || ""));
      setPreviousDateTo(String(json?.previousDateTo || ""));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, categoryId, channelCountry, dateFrom, dateTo, sortBy, sortOrder]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchRanking();
  }, [fetchRanking]);

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
    return { successCount, emptyCount, errorCount, importedCount, discoveredCount, videoCount };
  }, [discoverRuns]);

  const currentPeriodLabel = useMemo(() => {
    return `${formatShortDate(toIsoString(dateFrom))} a ${formatShortDate(toIsoString(dateTo))}`;
  }, [dateFrom, dateTo]);

  const previousPeriodLabel = useMemo(() => {
    if (!previousDateFrom || !previousDateTo) return "Período anterior";
    return `${formatShortDate(previousDateFrom)} a ${formatShortDate(previousDateTo)}`;
  }, [previousDateFrom, previousDateTo]);

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
      current.map((run) => (run.categoryId === categoryIdToUpdate ? { ...run, ...patch } : run))
    );
  }, []);

  const handleDiscoverCategoriesChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setDiscoverCategoryIds(typeof value === "string" ? value.split(",") : value);
  };

  const applyQuickRange = (days: number) => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 0, 0);
    setDateFrom(formatLocalDateTimeInput(start));
    setDateTo(formatLocalDateTimeInput(end));
    setPage(0);
  };

  const handleSort = (nextSortBy: RankingSortBy) => {
    const isSameColumn = sortBy === nextSortBy;
    setSortOrder(isSameColumn && sortOrder === "desc" ? "asc" : "desc");
    setSortBy(nextSortBy);
    setPage(0);
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
      channelsWithCountryMatch: 0,
      channelsWithMissingCountry: 0,
      skippedMissingCountryCount: 0,
      skippedCountryMismatchCount: 0,
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
      setDiscoverProgress((current) => ({ ...current, currentCategoryName: category.name }));

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
            requireChannelCountryMatch: discoverRequireCountryMatch,
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
                ? `Nenhum canal foi importado. Procurei vídeos na região ${discoverRegionCode} e filtrei pelo país público do canal conforme as opções escolhidas.`
                : json?.error || "Não foi possível concluir a importação.";

          updateDiscoverRun(category.id, {
            status,
            topVideosFetched: Number(json.topVideosFetched) || 0,
            channelsDiscovered: Number(json.channelsDiscovered) || 0,
            channelsImported: Number(json.channelsImported) || 0,
            channelsWithCountryMatch: Number(json.channelsWithCountryMatch) || 0,
            channelsWithMissingCountry: Number(json.channelsWithMissingCountry) || 0,
            skippedMissingCountryCount: Number(json.skippedMissingCountryCount) || 0,
            skippedCountryMismatchCount: Number(json.skippedCountryMismatchCount) || 0,
            errorsCount: Number(json.errorsCount) || 0,
            note: json.note,
            message,
            youtubeCategoryLabel:
              json.youtubeVideoCategoryLabel ||
              resolveYoutubeCategoryFromInternalCategory(category).youtubeCategoryLabel,
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
            Ranking Comparativo
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Compare período atual versus período anterior equivalente, com posições, variação percentual e métricas separadas para long e short.
          </Typography>
        </Box>

        <Button variant="contained" startIcon={<AutoAwesomeIcon />} onClick={openDiscoverDialog}>
          Descobrir top canais
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 2, borderRadius: 3, border: "1px solid #f1f5f9" }} elevation={0}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.1fr 1fr 1fr 0.8fr" }, gap: 2, mb: 2 }}>
          <FormControl size="small">
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

          <TextField
            size="small"
            type="datetime-local"
            label="Período atual inicial"
            value={dateFrom}
            onChange={(event) => {
              setDateFrom(event.target.value);
              setPage(0);
            }}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <TextField
            size="small"
            type="datetime-local"
            label="Período atual final"
            value={dateTo}
            onChange={(event) => {
              setDateTo(event.target.value);
              setPage(0);
            }}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <FormControl size="small">
            <InputLabel>País do canal</InputLabel>
            <Select
              label="País do canal"
              value={channelCountry}
              onChange={(event) => {
                setChannelCountry(String(event.target.value).toUpperCase());
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

        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button size="small" variant="outlined" onClick={() => applyQuickRange(7)}>
              Últimos 7 dias
            </Button>
            <Button size="small" variant="outlined" onClick={() => applyQuickRange(30)}>
              Últimos 30 dias
            </Button>
            <Button size="small" variant="outlined" onClick={() => applyQuickRange(90)}>
              Últimos 90 dias
            </Button>
          </Box>

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip label={`Atual: ${currentPeriodLabel}`} color="primary" variant="outlined" />
            <Chip label={`Anterior: ${previousPeriodLabel}`} color="default" variant="outlined" />
          </Box>
        </Box>
      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius: 3, border: "1px solid #f1f5f9" }} elevation={0}>
        <Table sx={{ minWidth: 1580 }}>
          <TableHead sx={{ bgcolor: "#f8fafc" }}>
            <TableRow>
              <TableCell rowSpan={2}>Pos.</TableCell>
              <TableCell rowSpan={2}>Canal</TableCell>
              <TableCell rowSpan={2}>Categoria</TableCell>
              <TableCell colSpan={3} align="center">Views Totais</TableCell>
              <TableCell colSpan={3} align="center">{previousPeriodLabel}</TableCell>
              <TableCell colSpan={4} align="center">{currentPeriodLabel}</TableCell>
              <TableCell colSpan={2} align="center">Posições</TableCell>
              <TableCell rowSpan={2} align="center">% </TableCell>
              <TableCell rowSpan={2} align="center">País</TableCell>
              <TableCell rowSpan={2} align="center">Ações</TableCell>
            </TableRow>

            <TableRow>
              <TableCell sortDirection={sortBy === "totalViewsCurrent" ? sortOrder : false} align="right">
                <TableSortLabel
                  active={sortBy === "totalViewsCurrent"}
                  direction={sortBy === "totalViewsCurrent" ? sortOrder : "desc"}
                  onClick={() => handleSort("totalViewsCurrent")}
                >
                  Atual
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">Ant</TableCell>
              <TableCell align="right">Δ</TableCell>

              <TableCell align="right">Long</TableCell>
              <TableCell align="right">Short</TableCell>
              <TableCell align="right">Total</TableCell>

              <TableCell sortDirection={sortBy === "currentPeriodViewsLongs" ? sortOrder : false} align="right">
                <TableSortLabel
                  active={sortBy === "currentPeriodViewsLongs"}
                  direction={sortBy === "currentPeriodViewsLongs" ? sortOrder : "desc"}
                  onClick={() => handleSort("currentPeriodViewsLongs")}
                >
                  Long
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={sortBy === "currentPeriodViewsShorts" ? sortOrder : false} align="right">
                <TableSortLabel
                  active={sortBy === "currentPeriodViewsShorts"}
                  direction={sortBy === "currentPeriodViewsShorts" ? sortOrder : "desc"}
                  onClick={() => handleSort("currentPeriodViewsShorts")}
                >
                  Short
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={sortBy === "currentPeriodViewsTotal" ? sortOrder : false} align="right">
                <TableSortLabel
                  active={sortBy === "currentPeriodViewsTotal"}
                  direction={sortBy === "currentPeriodViewsTotal" ? sortOrder : "desc"}
                  onClick={() => handleSort("currentPeriodViewsTotal")}
                >
                  Total
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={sortBy === "currentPeriodVideosTotal" ? sortOrder : false} align="right">
                <TableSortLabel
                  active={sortBy === "currentPeriodVideosTotal"}
                  direction={sortBy === "currentPeriodVideosTotal" ? sortOrder : "desc"}
                  onClick={() => handleSort("currentPeriodVideosTotal")}
                >
                  Vídeos
                </TableSortLabel>
              </TableCell>

              <TableCell align="right">Atual</TableCell>
              <TableCell align="right">Δ</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={18} align="center" sx={{ py: 4 }}>
                  Carregando ranking comparativo...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={18} align="center" sx={{ py: 4 }}>
                  Nenhum canal encontrado para os filtros selecionados.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => {
                const url = row.customUrl || `https://youtube.com/channel/${row.youtubeChannelId}`;
                return (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ fontWeight: 900, color: "text.secondary" }}>#{row.currentRank}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Avatar src={row.thumbnailUrl || undefined} alt={row.name} />
                        <Box>
                          <Typography sx={{ fontWeight: 800 }}>{row.name}</Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            {formatNum(row.subscribers)} inscritos
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

                    <TableCell align="right" sx={{ fontWeight: 900, color: "#ef4444" }}>
                      {formatNum(row.totalViewsCurrent)}
                    </TableCell>
                    <TableCell align="right" sx={{ color: "text.secondary" }}>
                      {formatNum(row.totalViewsPrevious)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900, color: "primary.main" }}>
                      {formatNum(row.totalViewsDelta)}
                    </TableCell>

                    <TableCell align="right">{formatNum(row.previousPeriodViewsLongs)}</TableCell>
                    <TableCell align="right">{formatNum(row.previousPeriodViewsShorts)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900 }}>
                      {formatNum(row.previousPeriodViewsTotal)}
                    </TableCell>

                    <TableCell align="right" sx={{ color: "#a855f7", fontWeight: 900 }}>
                      {formatNum(row.currentPeriodViewsLongs)}
                    </TableCell>
                    <TableCell align="right" sx={{ color: "#3b82f6", fontWeight: 900 }}>
                      {formatNum(row.currentPeriodViewsShorts)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900 }}>
                      {formatNum(row.currentPeriodViewsTotal)}
                    </TableCell>
                    <TableCell align="right">
                      {row.currentPeriodVideosTotal}
                    </TableCell>

                    <TableCell align="right" sx={{ fontWeight: 900 }}>
                      {row.previousRank || "—"} → {row.currentRank}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900, color: getRankDeltaColor(row.rankDelta) }}>
                      {formatRankDelta(row.rankDelta)}
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 900, color: getPercentColor(row.percentChange) }}>
                      {formatPercent(row.percentChange)}
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
          rowsPerPageOptions={TOP_PAGE_SIZE_OPTIONS}
          component="div"
          count={total}
          rowsPerPage={pageSize}
          page={page}
          onPageChange={(_event, nextPage) => setPage(nextPage)}
          onRowsPerPageChange={(event) => {
            setPageSize(parseInt(event.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Top por página:"
        />
      </TableContainer>

      <Dialog open={openDiscover} onClose={() => !discoverRunning && setOpenDiscover(false)} maxWidth="md" fullWidth>
        <DialogTitle>Descobrir top canais por categoria</DialogTitle>

        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2 }}>
            A descoberta separa país da busca e país público do canal. Assim fica mais claro quando você está buscando na região BR e quando está exigindo que o canal seja realmente marcado como BR.
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
                        secondary={`Categoria pública usada: ${mapped.youtubeCategoryLabel}`}
                      />
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>

            <FormControl size="small">
              <InputLabel>País da busca</InputLabel>
              <Select
                label="País da busca"
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

          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Checkbox
                checked={discoverRequireCountryMatch}
                onChange={(event) => setDiscoverRequireCountryMatch(event.target.checked)}
              />
              <Box>
                <Typography sx={{ fontWeight: 700 }}>
                  Exigir que o país público do canal seja igual ao país da busca
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Marcado: só importa canais cujo `country` público do YouTube bate com o país da busca. Desmarcado: usa a região da busca, mas aceita canais sem esse match.
                </Typography>
              </Box>
            </Box>
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
                  Vídeos consultados: {discoverSummary.videoCount} · Canais encontrados: {discoverSummary.discoveredCount} · Canais importados: {discoverSummary.importedCount}
                </Typography>
              </Paper>

              {discoverRuns.map((run) => (
                <Paper key={run.categoryId} sx={{ p: 2, borderRadius: 3, border: "1px solid #e2e8f0" }} elevation={0}>
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
                    <Chip label={`Country compatível: ${run.channelsWithCountryMatch}`} variant="outlined" />
                    <Chip label={`Sem country público: ${run.channelsWithMissingCountry}`} variant="outlined" />
                    <Chip label={`Descartados por país: ${run.skippedCountryMismatchCount}`} variant="outlined" />
                    <Chip label={`Descartados sem country: ${run.skippedMissingCountryCount}`} variant="outlined" />
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
