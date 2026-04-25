"use client";

import { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import YtNavigation from "@/components/youtube-analytics/YtNavigation";

export default function YoutubeAnalyticsLayout({ children }: { children: ReactNode }) {
  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
        YouTube Analytics
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
        Módulo de inteligência de dados e tracking de canais.
      </Typography>

      <YtNavigation />

      {children}
    </Box>
  );
}
