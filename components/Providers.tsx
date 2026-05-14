"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";

const theme = createTheme({
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"].join(","),
    h5: { fontWeight: 800 },
    h6: { fontWeight: 800 },
    button: { textTransform: "none", fontWeight: 700 },
  },
  palette: {
    mode: "light",
    primary: {
      main: "#5b5cff",
    },
    secondary: {
      main: "#22c55e",
    },
    background: {
      default: "#f5f7fb",
      paper: "#ffffff",
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          border: "1px solid rgba(15, 23, 42, 0.08)",
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid rgba(15, 23, 42, 0.08)",
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 10, fontWeight: 700 },
      },
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AppRouterCacheProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </AppRouterCacheProvider>
    </SessionProvider>
  );
}
