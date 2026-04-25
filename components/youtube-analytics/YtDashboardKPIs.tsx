"use client";

import { Grid, Card, CardContent, Typography, Box } from "@mui/material";
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import VisibilityIcon from '@mui/icons-material/Visibility';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import MovieIcon from '@mui/icons-material/Movie';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import BarChartIcon from '@mui/icons-material/BarChart';
import SpeedIcon from '@mui/icons-material/Speed';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

interface DashboardKPIs {
  totalChannels: number;
  totalViewsNiche: string;
  totalViewsShorts: string;
  totalViewsLongs: string;
  weeklyGrowth: number;
  monthlyGrowth: number;
  avgUploads: number;
  avgViewsPerVideo: number;
  avgViewsPerShort: number;
  avgSubsGained: number;
}

function formatNum(num: number | string) {
  if (typeof num === 'string') {
    if (num.endsWith('B') || num.endsWith('M') || num.endsWith('K')) return num;
    num = Number(num);
    if (isNaN(num)) return "0";
  }
  if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export default function YtDashboardKPIs({ data }: { data: DashboardKPIs }) {
  const cards = [
    { label: "Canais Monitorados", value: formatNum(data.totalChannels), icon: <MonitorHeartIcon />, color: "#6366f1" },
    { label: "Total Views Nicho", value: formatNum(data.totalViewsNiche), icon: <VisibilityIcon />, color: "#8b5cf6" },
    { label: "Views Shorts", value: formatNum(data.totalViewsShorts), icon: <OndemandVideoIcon />, color: "#f43f5e" },
    { label: "Views Longos", value: formatNum(data.totalViewsLongs), icon: <MovieIcon />, color: "#3b82f6" },
    { label: "Cresc. Semanal", value: `${data.weeklyGrowth}%`, icon: <TrendingUpIcon />, color: "#10b981", growth: data.weeklyGrowth },
    { label: "Cresc. Mensal", value: `${data.monthlyGrowth}%`, icon: <ShowChartIcon />, color: "#14b8a6", growth: data.monthlyGrowth },
    { label: "Média Uploads/sem", value: data.avgUploads, icon: <CloudUploadIcon />, color: "#f59e0b" },
    { label: "Média Views/vídeo", value: formatNum(data.avgViewsPerVideo), icon: <BarChartIcon />, color: "#ec4899" },
    { label: "Média Views/Short", value: formatNum(data.avgViewsPerShort), icon: <SpeedIcon />, color: "#ef4444" },
    { label: "Média Subs Ganhos", value: formatNum(data.avgSubsGained), icon: <PersonAddIcon />, color: "#06b6d4" },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={3}>
        {cards.map((card, idx) => (
          <Grid key={idx} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <Card sx={{ 
              borderRadius: 4, 
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              border: '1px solid #f1f5f9',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }
            }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ 
                  p: 1.5, 
                  borderRadius: 3, 
                  bgcolor: `${card.color}15`, 
                  color: card.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {card.icon}
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                    {card.label}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#1e293b' }}>
                      {card.value}
                    </Typography>
                    {card.growth !== undefined && (
                      card.growth >= 0 ? 
                      <ArrowUpwardIcon sx={{ fontSize: 16, color: 'success.main' }} /> : 
                      <ArrowDownwardIcon sx={{ fontSize: 16, color: 'error.main' }} />
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
