"use client";

import { useEffect, useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import YtChartsDashboard from "@/components/youtube-analytics/YtChartsDashboard";

export default function ChartsPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/youtube-analytics/dashboard')
      .then(res => res.json())
      .then(json => {
        if (json.categories) setCategories(json.categories);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><CircularProgress /></Box>;

  return (
    <Box>
      <YtChartsDashboard categories={categories} />
    </Box>
  );
}
