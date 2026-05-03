"use client";

import { usePathname } from "next/navigation";
import {
  AppBar,
  Box,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ArticleIcon from "@mui/icons-material/Article";
import LinkIcon from "@mui/icons-material/Link";
import LogoutIcon from "@mui/icons-material/Logout";
import WebhookIcon from "@mui/icons-material/Webhook";
import VideoCameraBackIcon from "@mui/icons-material/VideoCameraBack";
import SettingsIcon from "@mui/icons-material/Settings";
import CodeIcon from "@mui/icons-material/Code";
import QuizIcon from "@mui/icons-material/Quiz";
import YouTubeIcon from "@mui/icons-material/YouTube";
import CampaignIcon from "@mui/icons-material/Campaign";
import Link from "next/link";
import { signOut } from "next-auth/react";

const drawerWidth = 240;

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/admin/dashboard" },
    { text: "Posts", icon: <ArticleIcon />, path: "/admin/posts" },
    { text: "Fontes (Scraping)", icon: <LinkIcon />, path: "/admin/scrapers" },
    { text: "Integrações N8N", icon: <WebhookIcon />, path: "/admin/integrations" },
    { text: "Fila de Stories", icon: <VideoCameraBackIcon />, path: "/admin/social" },
    { text: "Calendário Social", icon: <VideoCameraBackIcon />, path: "/admin/social/calendar" },
    { text: "Vídeos com código", icon: <CodeIcon />, path: "/admin/video-code" },
    { text: "Propagandas", icon: <CampaignIcon />, path: "/admin/propagandas" },
    { text: "Perguntas → vídeos", icon: <QuizIcon />, path: "/admin/video-questions" },
    { text: "YT Analytics", icon: <YouTubeIcon />, path: "/admin/youtube-analytics" },
    { text: "Config. Scraper", icon: <SettingsIcon />, path: "/admin/scraper-config" },
    { text: "Config. Perguntas", icon: <SettingsIcon />, path: "/admin/video-questions-config" },
  ];

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Painel Gerencial AI
          </Typography>
          <Button
            color="inherit"
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            startIcon={<LogoutIcon />}
          >
            Sair
          </Button>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: "border-box" },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: "auto" }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton component={Link} href={item.path} selected={pathname === item.path}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
