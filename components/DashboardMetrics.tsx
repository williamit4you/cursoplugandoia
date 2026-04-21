"use client";

import { Grid, Card, CardContent, Typography } from "@mui/material";

export default function DashboardMetrics({ stats }: { stats: { posts: number, views: number, leads: number } }) {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, sm: 4 }}>
        <Card elevation={2}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>Notícias Publicadas</Typography>
            <Typography variant="h4" color="primary">{stats.posts}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <Card elevation={2}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>Total de Visualizações</Typography>
            <Typography variant="h4" color="secondary">{stats.views}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <Card elevation={2}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>Leads Capturados</Typography>
            <Typography variant="h4" color="success.main">{stats.leads}</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}
