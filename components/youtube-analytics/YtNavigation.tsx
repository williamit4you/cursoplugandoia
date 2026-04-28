"use client";

import { Box, Tabs, Tab } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";

export default function YtNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  let activeTab = "/admin/youtube-analytics";
  if (pathname.includes("/admin/youtube-analytics/ai-analyst"))
    activeTab = "/admin/youtube-analytics/ai-analyst";
  else if (pathname.includes("/admin/youtube-analytics/charts"))
    activeTab = "/admin/youtube-analytics/charts";
  else if (pathname.includes("/admin/youtube-analytics/channels"))
    activeTab = "/admin/youtube-analytics/channels";
  else if (pathname.includes("/admin/youtube-analytics/ranking"))
    activeTab = "/admin/youtube-analytics/ranking";

  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    router.push(newValue);
  };

  return (
    <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
      <Tabs
        value={activeTab}
        onChange={handleChange}
        aria-label="YT Analytics Tabs"
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="Dashboard" value="/admin/youtube-analytics" />
        <Tab label="Canais" value="/admin/youtube-analytics/channels" />
        <Tab label="Ranking" value="/admin/youtube-analytics/ranking" />
        <Tab label="Gráficos" value="/admin/youtube-analytics/charts" />
        <Tab label="Analista IA" value="/admin/youtube-analytics/ai-analyst" />
      </Tabs>
    </Box>
  );
}

