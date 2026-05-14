"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  AppBar,
  Box,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";

const drawerWidth = 240;

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/crm/login") {
    return <>{children}</>;
  }

  const items = [
    { text: "Dashboard", path: "/crm/dashboard" },
    { text: "Configurações", path: "/crm/settings" },
  ];

  return (
    <Box sx={{ display: "flex", bgcolor: "#f5f7fb", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: "rgba(255,255,255,0.85)",
          color: "#0f172a",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(15, 23, 42, 0.08)",
        }}
      >
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 800 }}>
            CRM Plugando IA
          </Typography>
          <Button variant="outlined" onClick={() => signOut({ callbackUrl: "/crm/login" })}>
            Sair
          </Button>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
            bgcolor: "#ffffff",
            borderRight: "1px solid rgba(15, 23, 42, 0.08)",
          },
        }}
      >
        <Toolbar />
        <List>
          {items.map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton component={Link} href={item.path} selected={pathname === item.path}>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: "#f5f7fb" }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
