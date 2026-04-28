"use client";

import React from "react";
import { Box, Button, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useRouter } from "next/navigation";
import YtBubbleChart from "@/components/youtube-analytics/YtBubbleChart";

export default function ClientBubblesPage({ categoryId }: { categoryId?: string }) {
  const router = useRouter();

  return (
    <Box sx={{ height: "calc(100vh - 120px)" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          mb: 2,
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Bolhas — Fullscreen
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Ajuste transparência/anel/glow e use a tela toda.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/admin/youtube-analytics")}
        >
          Voltar
        </Button>
      </Box>

      <YtBubbleChart categoryId={categoryId} startFullscreen />
    </Box>
  );
}

