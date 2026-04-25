"use client";

import { Box, FormControl, InputLabel, Select, MenuItem, Button } from "@mui/material";
import RefreshIcon from '@mui/icons-material/Refresh';

interface YtFilterBarProps {
  categories: { id: string; name: string }[];
  categoryId: string;
  setCategoryId: (id: string) => void;
  period: string;
  setPeriod: (period: string) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export default function YtFilterBar({
  categories,
  categoryId,
  setCategoryId,
  period,
  setPeriod,
  onRefresh,
  isRefreshing,
}: YtFilterBarProps) {
  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel>Nicho</InputLabel>
        <Select
          value={categoryId}
          label="Nicho"
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <MenuItem value="">Todos os Nichos</MenuItem>
          {categories.map((c) => (
            <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Período</InputLabel>
        <Select
          value={period}
          label="Período"
          onChange={(e) => setPeriod(e.target.value)}
        >
          <MenuItem value="7d">Últimos 7 dias</MenuItem>
          <MenuItem value="30d">Últimos 30 dias</MenuItem>
          <MenuItem value="90d">Últimos 90 dias</MenuItem>
          <MenuItem value="1y">1 ano</MenuItem>
          <MenuItem value="all">Todo o período</MenuItem>
        </Select>
      </FormControl>

      <Box sx={{ flexGrow: 1 }} />

      <Button
        variant="outlined"
        color="primary"
        startIcon={<RefreshIcon />}
        onClick={onRefresh}
        disabled={isRefreshing}
        sx={{ borderRadius: 2 }}
      >
        {isRefreshing ? 'Atualizando...' : 'Atualizar Dados'}
      </Button>
    </Box>
  );
}
