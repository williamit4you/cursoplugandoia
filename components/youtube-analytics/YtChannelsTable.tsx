"use client";

import React, { useEffect, useState } from "react";
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TablePagination, TableSortLabel, Typography, Avatar, Link, Chip,
  TextField, InputAdornment, Button, IconButton, Tooltip
} from "@mui/material";
import { useCallback } from "react";
import SearchIcon from '@mui/icons-material/Search';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

interface Channel {
  id: string;
  youtubeChannelId: string;
  name: string;
  thumbnailUrl: string | null;
  customUrl: string | null;
  subscribers: string;
  totalViews: string;
  viewsShorts: string;
  viewsLongs: string;
  weeklyGrowth: number;
  monthlyGrowth: number;
  uploadsThisMonth: number;
  lastVideoAt: string | null;
  rankPosition: number;
  category: {
    name: string;
    color: string;
    slug: string;
  };
}

export default function YtChannelsTable() {
  const [data, setData] = useState<Channel[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("rankPosition");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(false);

  const fetchChannels = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: (page + 1).toString(),
        pageSize: pageSize.toString(),
        search,
        sortBy,
        sortOrder
      });
      const res = await fetch(`/api/youtube-analytics/channels?${query.toString()}`);
      const json = await res.json();
      setData(json.data || []);
      setTotal(json.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, sortBy, sortOrder]);

  useEffect(() => {
    fetchChannels();
  }, [page, pageSize, search, sortBy, sortOrder, fetchChannels]);

  const handleSort = (property: string) => {
    const isAsc = sortBy === property && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortBy(property);
    setPage(0);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
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
    window.open('/api/youtube-analytics/export?format=csv', '_blank');
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Buscar canal..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
            }
          }}
          sx={{ bgcolor: '#fff', width: { xs: '100%', sm: 300 } }}
        />
        <Button 
          variant="outlined" 
          startIcon={<FileDownloadIcon />}
          onClick={handleExport}
        >
          Exportar CSV
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
        <Table sx={{ minWidth: 800 }}>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell>
                <TableSortLabel active={sortBy === 'rankPosition'} direction={sortBy === 'rankPosition' ? sortOrder : 'asc'} onClick={() => handleSort('rankPosition')}>
                  Rank
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel active={sortBy === 'name'} direction={sortBy === 'name' ? sortOrder : 'asc'} onClick={() => handleSort('name')}>
                  Canal
                </TableSortLabel>
              </TableCell>
              <TableCell>Nicho</TableCell>
              <TableCell align="right">
                <TableSortLabel active={sortBy === 'subscribers'} direction={sortBy === 'subscribers' ? sortOrder : 'asc'} onClick={() => handleSort('subscribers')}>
                  Inscritos
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel active={sortBy === 'totalViews'} direction={sortBy === 'totalViews' ? sortOrder : 'asc'} onClick={() => handleSort('totalViews')}>
                  Visualizações
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel active={sortBy === 'weeklyGrowth'} direction={sortBy === 'weeklyGrowth' ? sortOrder : 'asc'} onClick={() => handleSort('weeklyGrowth')}>
                  Cresc. Semanal
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">Vídeos/Mês</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} align="center" sx={{ py: 3 }}>Carregando...</TableCell></TableRow>
            ) : data.length === 0 ? (
              <TableRow><TableCell colSpan={8} align="center" sx={{ py: 3 }}>Nenhum canal encontrado</TableCell></TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography sx={{ fontWeight: "bold", color: "text.secondary" }}>#{row.rankPosition}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar src={row.thumbnailUrl || undefined} alt={row.name} sx={{ width: 40, height: 40 }} />
                      <Typography sx={{ fontWeight: "600" }}>{row.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={row.category.name} sx={{ bgcolor: `${row.category.color}15`, color: row.category.color, fontWeight: 'bold' }} />
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatNum(row.subscribers)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatNum(row.totalViews)}</TableCell>
                  <TableCell align="right">
                    <Typography sx={{ fontWeight: "bold", color: row.weeklyGrowth >= 0 ? "success.main" : "error.main" }}>
                      {row.weeklyGrowth >= 0 ? '+' : ''}{row.weeklyGrowth}%
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{row.uploadsThisMonth}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Abrir no YouTube">
                      <IconButton size="small" component="a" href={row.customUrl || `https://youtube.com/channel/${row.youtubeChannelId}`} target="_blank">
                        <OpenInNewIcon fontSize="small" />
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
    </Box>
  );
}
