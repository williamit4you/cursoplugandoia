"use client";

import { usePathname } from "next/navigation";
import {
  Box,
  Button,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
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
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ChecklistIcon from "@mui/icons-material/Checklist";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import EventIcon from "@mui/icons-material/Event";
import Link from "next/link";
import { signOut } from "next-auth/react";
import React, { useEffect, useState } from "react";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const apply = () => {
      const mobile = mq.matches;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };
    apply();
    const onChange = () => apply();
    if ("addEventListener" in mq) mq.addEventListener("change", onChange);
    else (mq as any).addListener(onChange);
    return () => {
      if ("removeEventListener" in mq) mq.removeEventListener("change", onChange);
      else (mq as any).removeListener(onChange);
    };
  }, []);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon className="text-indigo-400" />, path: "/admin/dashboard" },
    { text: "Posts", icon: <ArticleIcon />, path: "/admin/posts" },
    { text: "Fontes (Scraping)", icon: <LinkIcon />, path: "/admin/scrapers" },
    { text: "Integrações N8N", icon: <WebhookIcon />, path: "/admin/integrations" },
    { text: "Fila de Stories", icon: <VideoCameraBackIcon />, path: "/admin/social" },
    { text: "Calendário Social", icon: <VideoCameraBackIcon />, path: "/admin/social/calendar" },
    { text: "Vídeos com código", icon: <CodeIcon />, path: "/admin/video-code" },
    { text: "Propagandas", icon: <CampaignIcon />, path: "/admin/propagandas" },
    { text: "Mercado Livre", icon: <ShoppingCartIcon />, path: "/admin/mercado-livre" },
    { text: "Perguntas → vídeos", icon: <QuizIcon />, path: "/admin/video-questions" },
    { text: "YT Analytics", icon: <YouTubeIcon />, path: "/admin/youtube-analytics" },
    { text: "Config. Scraper", icon: <SettingsIcon />, path: "/admin/scraper-config" },
    { text: "Config. Perguntas", icon: <SettingsIcon />, path: "/admin/video-questions-config" },
    { text: "Shopee", icon: <StorefrontIcon />, path: "/admin/shopee" },
    { text: "Coleta Shopee", icon: <StorefrontIcon />, path: "/admin/coleta-shopee" },
    { text: "Shopee Pipeline", icon: <StorefrontIcon />, path: "/admin/shopee-pipeline" },
    { text: "Tasks", icon: <ChecklistIcon />, path: "/admin/tasks" },
    { text: "Execuções", icon: <PlayArrowIcon />, path: "/admin/task-runs" },
    { text: "Agendamentos", icon: <EventIcon />, path: "/admin/schedules" },
  ];

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900 flex overflow-hidden">
      {/* Subtle background decoration */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute top-24 -right-24 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      {/* Mobile overlay */}
      {isMobile && isSidebarOpen && (
        <button
          aria-label="Fechar menu"
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Light Sidebar */}
      <aside
        className={`fixed lg:relative z-50 h-full bg-white border-r border-slate-200/70 transition-all duration-300 ease-in-out
          ${isSidebarOpen ? "w-72 translate-x-0" : isMobile ? "w-72 -translate-x-full" : "w-20 translate-x-0"}`}
        style={{ boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)" }}
      >
        <div className="flex flex-col h-full overflow-hidden">
          <div className="p-6 flex items-center gap-3 border-b border-slate-200/70">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="font-black text-white">P</span>
            </div>
            {isSidebarOpen && (
              <div className="leading-tight">
                <div className="font-black text-slate-900 tracking-tight">Portal IA</div>
                <div className="text-xs text-slate-500">Admin</div>
              </div>
            )}
          </div>

          <nav className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.text}
                  href={item.path}
                  onClick={() => {
                    if (isMobile) setIsSidebarOpen(false);
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200
                    ${isActive ? "bg-indigo-50 text-indigo-700 border border-indigo-100" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                >
                  <span className={`${isActive ? "text-indigo-600" : "text-slate-500"} transition-colors`}>
                    {React.cloneElement(item.icon as React.ReactElement, { fontSize: "small" })}
                  </span>
                  {isSidebarOpen && <span className="text-sm font-semibold whitespace-nowrap overflow-hidden">{item.text}</span>}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-200/70">
            <button
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-2xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogoutIcon fontSize="small" />
              {isSidebarOpen && <span className="text-sm font-semibold">Sair</span>}
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 relative h-screen overflow-hidden">
        <header className="h-16 bg-white/80 backdrop-blur border-b border-slate-200/70 flex items-center justify-between px-6 z-40 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen((v) => !v)}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
              aria-label="Alternar menu"
            >
              {isMobile ? <MenuIcon fontSize="small" /> : <DashboardIcon fontSize="small" />}
            </button>
            <h1 className="text-lg font-black text-slate-900 capitalize">
              {pathname.split("/").pop()?.replace("-", " ") || "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full">
              <span className="text-xs font-black text-indigo-700">PLUGANDO IA</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </div>
      </main>
    </div>
  );
}
