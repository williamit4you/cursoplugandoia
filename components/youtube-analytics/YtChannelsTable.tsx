"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
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
  TableSortLabel,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import BlockIcon from "@mui/icons-material/Block";

interface Channel {
  id: string;
  youtubeChannelId: string;
  name: string;
  thumbnailUrl: string | null;
  customUrl: string | null;
  country?: string | null;
  subscribers: string;
  totalViews: string;
  viewsShorts: string;
  viewsLongs: string;
  weeklyGrowth: number;
  uploadsThisMonth: number;
  rankPosition: number;
  category: {
    name: string;
    color: string;
    slug: string;
  };
}

type Category = { id: string; name: string; color: string; slug: string };

export default function YtChannelsTable() {
  const [data, setData] = useState<Channel[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [country, setCountry] = useState("");
  const [sortBy, setSortBy] = useState("rankPosition");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [openAdd, setOpenAdd] = useState(false);
  const [addInputs, setAddInputs] = useState("");
  const [addCategoryId, setAddCategoryId] = useState("");
  const [addCountry, setAddCountry] = useState("BR");
  const [info, setInfo] = useState<string | null>(null);

  const fetchChannels = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: (page + 1).toString(),
        pageSize: pageSize.toString(),
        search,
        categoryId,
        country,
        sortBy,
        sortOrder,
      });
      const res = await fetch(
        `/api/youtube-analytics/channels?${query.toString()}`
      );
      const json = await res.json();
      setData(json.data || []);
      setTotal(json.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, categoryId, country, sortBy, sortOrder]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/youtube-analytics/categories");
      if (!res.ok) return;
      const json = await res.json();
      setCategories(Array.isArray(json?.categories) ? json.categories : []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchChannels();
  }, [page, pageSize, search, categoryId, country, sortBy, sortOrder, fetchChannels]);

  const handleSort = (property: string) => {
    const isAsc = sortBy === property && sortOrder === "asc";
    setSortOrder(isAsc ? "desc" : "asc");
    setSortBy(property);
    setPage(0);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatNum = (numStr: string) => {
    const num = Number(numStr);
    if (isNaN(num)) return "0";
    if (num >= 1e9) return (num / 1e9).toFixed(1) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
    return num.toString();
  };

  const handleExport = () => {
    window.open("/api/youtube-analytics/export?format=csv", "_blank");
  };

  const deactivateChannel = async (id: string) => {
    try {
      const ok = confirm("Desativar este canal do ranking/coleta?");
      if (!ok) return;
      const res = await fetch(`/api/youtube-analytics/channel/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: false }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setInfo(json?.error || "Falha ao desativar");
        return;
      }
      setInfo("Canal desativado.");
      await fetchChannels();
    } catch (e: any) {
      setInfo(e?.message || "Falha ao desativar");
    }
  };

  const openAddDialog = () => {
    setInfo(null);
    setAddInputs("");
    setAddCategoryId(categoryId || "");
    setAddCountry(country || "BR");
    setOpenAdd(true);
  };

  const parsedTokens = useMemo(() => {
    return addInputs
      .split(/[\n,;]+/g)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [addInputs]);

  const submitAdd = async () => {
    setInfo(null);
    if (parsedTokens.length === 0) {
      setInfo("Informe ao menos 1 canal (UC… / @handle / URL).");
      return;
    }

    try {
      const res = await fetch("/api/youtube-analytics/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputs: parsedTokens,
          categoryId: addCategoryId || undefined,
          country: addCountry || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setInfo(json?.error || "Erro ao cadastrar canais.");
        return;
      }

      const errCount = Array.isArray(json?.errors) ? json.errors.length : 0;
      setInfo(`OK: ${json.createdOrUpdated || 0} cadastrados/atualizados. Erros: ${errCount}.`);
      setOpenAdd(false);
      await fetchChannels();
    } catch (e: any) {
      setInfo(e?.message || "Erro ao cadastrar.");
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: 2,
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField
            size="small"
            placeholder="Buscar canal..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ bgcolor: "#fff", width: { xs: "100%", sm: 280 } }}
          />

          <FormControl size="small" sx={{ bgcolor: "#fff", minWidth: 240 }}>
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

          <TextField
            size="small"
            label="País"
            placeholder="BR"
            value={country}
            onChange={(e) => {
              setCountry(e.target.value.toUpperCase());
              setPage(0);
            }}
            sx={{ bgcolor: "#fff", width: 110 }}
          />
        </Box>

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button variant="contained" onClick={openAddDialog}>
            + Cadastrar canais
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExport}
          >
            Exportar CSV
          </Button>
        </Box>
      </Box>

      {info && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {info}
        </Alert>
      )}

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 3,
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          border: "1px solid #f1f5f9",
        }}
      >
        <Table sx={{ minWidth: 980 }}>
          <TableHead sx={{ bgcolor: "#f8fafc" }}>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortBy === "rankPosition"}
                  direction={sortBy === "rankPosition" ? sortOrder : "asc"}
                  onClick={() => handleSort("rankPosition")}
                >
                  Rank
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === "name"}
                  direction={sortBy === "name" ? sortOrder : "asc"}
                  onClick={() => handleSort("name")}
                >
                  Canal
                </TableSortLabel>
              </TableCell>
              <TableCell>Nicho</TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortBy === "subscribers"}
                  direction={sortBy === "subscribers" ? sortOrder : "asc"}
                  onClick={() => handleSort("subscribers")}
                >
                  Inscritos
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortBy === "totalViews"}
                  direction={sortBy === "totalViews" ? sortOrder : "asc"}
                  onClick={() => handleSort("totalViews")}
                >
                  Views (total)
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortBy === "viewsLongs"}
                  direction={sortBy === "viewsLongs" ? sortOrder : "asc"}
                  onClick={() => handleSort("viewsLongs")}
                >
                  Views (long)
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortBy === "viewsShorts"}
                  direction={sortBy === "viewsShorts" ? sortOrder : "asc"}
                  onClick={() => handleSort("viewsShorts")}
                >
                  Views (short)
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortBy === "weeklyGrowth"}
                  direction={sortBy === "weeklyGrowth" ? sortOrder : "asc"}
                  onClick={() => handleSort("weeklyGrowth")}
                >
                  Cresc. Semanal
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">Vídeos/mês</TableCell>
              <TableCell align="center">País</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ py: 3 }}>
                  Carregando...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ py: 3 }}>
                  Nenhum canal encontrado
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography sx={{ fontWeight: "bold", color: "text.secondary" }}>
                      #{row.rankPosition}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Avatar
                        src={row.thumbnailUrl || undefined}
                        alt={row.name}
                        sx={{ width: 40, height: 40 }}
                      />
                      <Typography sx={{ fontWeight: 700 }}>{row.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={row.category.name}
                      sx={{
                        bgcolor: `${row.category.color}15`,
                        color: row.category.color,
                        fontWeight: "bold",
                      }}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: "bold" }}>
                    {formatNum(row.subscribers)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: "bold" }}>
                    {formatNum(row.totalViews)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: "bold" }}>
                    {formatNum(row.viewsLongs)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: "bold" }}>
                    {formatNum(row.viewsShorts)}
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      sx={{
                        fontWeight: "bold",
                        color: row.weeklyGrowth >= 0 ? "success.main" : "error.main",
                      }}
                    >
                      {row.weeklyGrowth >= 0 ? "+" : ""}
                      {row.weeklyGrowth}%
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{row.uploadsThisMonth}</TableCell>
                  <TableCell align="center">{row.country || "-"}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Abrir no YouTube">
                      <IconButton
                        size="small"
                        component="a"
                        href={
                          row.customUrl ||
                          `https://youtube.com/channel/${row.youtubeChannelId}`
                        }
                        target="_blank"
                      >
                        <OpenInNewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Desativar canal (não coletar mais)">
                      <IconButton size="small" onClick={() => deactivateChannel(row.id)}>
                        <BlockIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 20, 50, 100]}
          component="div"
          count={total}
          rowsPerPage={pageSize}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Linhas por página:"
        />
      </TableContainer>

      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="md" fullWidth>
        <DialogTitle>Cadastrar canais</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
            Cole um por linha: <strong>UC…</strong> (channelId), <strong>@handle</strong> ou URL do canal.
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 260px 140px" },
              gap: 2,
            }}
          >
            <TextField
              label="Canais"
              value={addInputs}
              onChange={(e) => setAddInputs(e.target.value)}
              multiline
              minRows={8}
              placeholder={"@canal1\nUCxxxxxxxxxxxxxxxxxxxx\nhttps://youtube.com/@canal2"}
            />

            <FormControl>
              <InputLabel>Nicho</InputLabel>
              <Select
                label="Nicho"
                value={addCategoryId}
                onChange={(e) => setAddCategoryId(String(e.target.value))}
              >
                <MenuItem value="">(Padrão)</MenuItem>
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="País"
              value={addCountry}
              onChange={(e) => setAddCountry(e.target.value.toUpperCase())}
              placeholder="BR"
            />
          </Box>

          <Typography variant="caption" sx={{ display: "block", mt: 2, color: "text.secondary" }}>
            Itens detectados: {parsedTokens.length}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Cancelar</Button>
          <Button variant="contained" onClick={submitAdd}>
            Cadastrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
