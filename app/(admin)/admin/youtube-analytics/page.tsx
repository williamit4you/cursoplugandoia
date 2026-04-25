"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { Box, CircularProgress, Alert } from "@mui/material";
import YtFilterBar from "@/components/youtube-analytics/YtFilterBar";
import YtDashboardKPIs from "@/components/youtube-analytics/YtDashboardKPIs";
import YtBubbleChart from "@/components/youtube-analytics/YtBubbleChart";

export default function DashboardPage() {
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/youtube-analytics/dashboard?categoryId=${categoryId}&period=${period}`);
      if (!res.ok) throw new Error("Falha ao carregar dados do dashboard.");
      const json = await res.json();
      setData(json);
      if (json.categories) setCategories(json.categories);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [categoryId, period]);

  useEffect(() => {
    fetchData();
  }, [categoryId, period, fetchData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/youtube-analytics/refresh', { method: 'POST' });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Erro ao atualizar dados.");
      alert(`Atualização concluída: ${result.channelsUpdated} canais processados.`);
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Box>
      <YtFilterBar 
        categories={categories}
        categoryId={categoryId}
        setCategoryId={setCategoryId}
        period={period}
        setPeriod={setPeriod}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading && !data ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        data && (
          <>
            <YtDashboardKPIs data={data} />
            <YtBubbleChart categoryId={categoryId} />
          </>
        )
      )}
    </Box>
  );
}
