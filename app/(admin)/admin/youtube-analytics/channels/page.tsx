"use client";

export const dynamic = "force-dynamic";

import { Box } from "@mui/material";
import YtChannelsTable from "@/components/youtube-analytics/YtChannelsTable";

export default function ChannelsPage() {
  return (
    <Box>
      <YtChannelsTable />
    </Box>
  );
}
