"use client";

import { Grid, Card, CardContent, Typography, Box } from "@mui/material";
import PostAddIcon from '@mui/icons-material/PostAdd';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PeopleIcon from '@mui/icons-material/People';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import ShareIcon from '@mui/icons-material/Share';

type Stats = {
  posts: number;
  views: number;
  leads: number;
  totalQuestions: number;
  readyVideos: number;
  totalPosts: number;
  platforms: Record<string, number>;
};

export default function DashboardMetrics({ stats }: { stats: Stats }) {
  const cards = [
    { label: "Notícias", value: stats.posts, icon: <PostAddIcon />, color: "#4f46e5" },
    { label: "Visualizações", value: stats.views, icon: <VisibilityIcon />, color: "#8b5cf6" },
    { label: "Leads", value: stats.leads, icon: <PeopleIcon />, color: "#10b981" },
    { label: "Perguntas", value: stats.totalQuestions, icon: <QuestionAnswerIcon />, color: "#f59e0b" },
    { label: "Vídeos Prontos", value: stats.readyVideos, icon: <VideoLibraryIcon />, color: "#ec4899" },
    { label: "Postagens", value: stats.totalPosts, icon: <ShareIcon />, color: "#06b6d4" },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={3}>
        {cards.map((card, idx) => (
          <Grid key={idx} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card sx={{ 
              borderRadius: 4, 
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              border: '1px solid #f1f5f9',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' }
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
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                    {card.label}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: '#1e293b' }}>
                    {card.value.toLocaleString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {Object.keys(stats.platforms).length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 900, mb: 2, color: '#1e293b' }}>Postagens por Plataforma</Typography>
          <Grid container spacing={2}>
            {Object.entries(stats.platforms).map(([platform, count]) => (
              <Grid key={platform} size={{ xs: 6, sm: 3 }}>
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'white', 
                  borderRadius: 3, 
                  border: '1px solid #f1f5f9',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', mb: 0.5 }}>{platform}</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: '#4f46e5' }}>{count}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
}
