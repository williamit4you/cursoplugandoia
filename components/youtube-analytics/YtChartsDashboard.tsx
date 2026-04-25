"use client";

import React, { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis, Legend,
  ComposedChart
} from "recharts";
import { Box, Card, CardContent, Typography, Grid, CircularProgress, Alert, MenuItem, Select, FormControl, InputLabel } from "@mui/material";

const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

interface YtChartsDashboardProps {
  categories: { id: string; name: string }[];
}

export default function YtChartsDashboard({ categories }: YtChartsDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("30d");
  const [categoryId, setCategoryId] = useState("");
  
  const [data, setData] = useState<any>({});

  useEffect(() => {
    fetchAllCharts();
  }, [period, categoryId]);

  const fetchAllCharts = async () => {
    setLoading(true);
    setError("");
    try {
      const types = ["evolution", "subscribers", "types", "weekday", "niche", "format"];
      const promises = types.map(t => 
        fetch(`/api/youtube-analytics/charts?type=${t}&period=${period}${categoryId ? `&categoryId=${categoryId}` : ''}`)
          .then(res => res.json())
          .then(json => ({ [t]: json }))
      );
      const results = await Promise.all(promises);
      let combined = {};
      results.forEach(r => { combined = { ...combined, ...r }; });
      setData(combined);
    } catch (err: any) {
      setError("Falha ao carregar gráficos: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatViews = (val: number) => {
    if (val >= 1e9) return (val / 1e9).toFixed(1) + "B";
    if (val >= 1e6) return (val / 1e6).toFixed(1) + "M";
    if (val >= 1e3) return (val / 1e3).toFixed(1) + "K";
    return val;
  };

  const renderChartCard = (title: string, children: React.ReactNode, height = 350) => (
    <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', height: '100%' }}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, color: '#1e293b' }}>{title}</Typography>
        <Box sx={{ width: '100%', height }}>
          {children}
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <FormControl size="small" sx={{ minWidth: 200, bgcolor: '#fff' }}>
          <InputLabel>Nicho</InputLabel>
          <Select value={categoryId} label="Nicho" onChange={e => setCategoryId(e.target.value)}>
            <MenuItem value="">Todos os Nichos</MenuItem>
            {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150, bgcolor: '#fff' }}>
          <InputLabel>Período</InputLabel>
          <Select value={period} label="Período" onChange={e => setPeriod(e.target.value)}>
            <MenuItem value="7d">7 dias</MenuItem>
            <MenuItem value="30d">30 dias</MenuItem>
            <MenuItem value="90d">90 dias</MenuItem>
            <MenuItem value="1y">1 ano</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={3}>
          {/* 1. Evolução Views */}
          <Grid item xs={12} md={6}>
            {renderChartCard("Evolução de Visualizações", (
              <ResponsiveContainer>
                <AreaChart data={data.evolution || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={formatViews} tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                  <RechartsTooltip formatter={(val: number) => formatViews(val)} />
                  <Area type="monotone" dataKey="views" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                </AreaChart>
              </ResponsiveContainer>
            ))}
          </Grid>

          {/* 2. Evolução Inscritos */}
          <Grid item xs={12} md={6}>
            {renderChartCard("Evolução de Inscritos", (
              <ResponsiveContainer>
                <LineChart data={data.subscribers || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={formatViews} tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                  <RechartsTooltip formatter={(val: number) => formatViews(val)} />
                  <Line type="monotone" dataKey="subscribers" stroke="#f43f5e" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ))}
          </Grid>

          {/* 3. Distribuição por Formato (Pie) */}
          <Grid item xs={12} md={4}>
            {renderChartCard("Views por Formato", (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={data.types || []} dataKey="views" nameKey="type" cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={5}>
                    {(data.types || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(val: number) => formatViews(val)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ))}
          </Grid>

          {/* 4. Uploads por Dia da Semana */}
          <Grid item xs={12} md={4}>
            {renderChartCard("Uploads por Dia da Semana", (
              <ResponsiveContainer>
                <BarChart data={data.weekday || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                  <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                  <RechartsTooltip />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ))}
          </Grid>

          {/* 5. Comparativo de Formatos Mês a Mês */}
          <Grid item xs={12} md={4}>
            {renderChartCard("Uploads por Formato (Mês)", (
              <ResponsiveContainer>
                <BarChart data={data.format || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                  <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="SHORT" stackId="a" fill="#f43f5e" />
                  <Bar dataKey="LONG" stackId="a" fill="#6366f1" />
                  <Bar dataKey="LIVE" stackId="a" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            ))}
          </Grid>

          {/* 6. Crescimento por Nicho */}
          <Grid item xs={12} md={12}>
            {renderChartCard("Crescimento Semanal Médio por Nicho (%)", (
              <ResponsiveContainer>
                <BarChart data={data.niche || []} layout="vertical" margin={{ left: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                  <YAxis dataKey="niche" type="category" tick={{fontSize: 12}} tickLine={false} axisLine={false} width={150} />
                  <RechartsTooltip formatter={(val: number) => val + '%'} />
                  <Bar dataKey="growth" radius={[0, 4, 4, 0]}>
                    {(data.niche || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ), 500)}
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
