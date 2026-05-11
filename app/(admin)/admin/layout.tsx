"use client";

import { usePathname } from "next/navigation";
import {
  Box,
  Button,
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
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ChecklistIcon from "@mui/icons-material/Checklist";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import EventIcon from "@mui/icons-material/Event";
import Link from "next/link";
import { signOut } from "next-auth/react";
import React, { useState } from "react";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
    { text: "Tasks", icon: <ChecklistIcon />, path: "/admin/tasks" },
    { text: "Execuções", icon: <PlayArrowIcon />, path: "/admin/task-runs" },
    { text: "Agendamentos", icon: <EventIcon />, path: "/admin/schedules" },
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 flex overflow-hidden">
      {/* Background Grid Decoration */}
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-20" />
      <div className="fixed inset-0 bg-gradient-to-tr from-indigo-500/5 via-transparent to-emerald-500/5 pointer-events-none" />

      {/* Modern Glass Sidebar */}
      <aside 
        className={`fixed lg:relative z-50 h-full glass transition-all duration-500 ease-in-out border-r border-white/5
          ${isSidebarOpen ? "w-64 translate-x-0" : "w-0 lg:w-20 -translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo Section */}
          <div className="p-6 flex items-center gap-3 border-b border-white/5">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="font-bold text-white">P</span>
            </div>
            {isSidebarOpen && (
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Portal IA
              </span>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-1 custom-scrollbar">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.text}
                  href={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group
                    ${isActive 
                      ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/5" 
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-100"}`}
                >
                  <span className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? "scale-110" : ""}`}>
                    {React.cloneElement(item.icon as React.ReactElement, { 
                      fontSize: "small",
                      className: isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-100"
                    })}
                  </span>
                  {isSidebarOpen && (
                    <span className="text-sm font-medium whitespace-nowrap overflow-hidden">
                      {item.text}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer / User Section */}
          <div className="p-4 border-t border-white/5">
            <button
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors group"
            >
              <LogoutIcon fontSize="small" />
              {isSidebarOpen && <span className="text-sm font-medium">Sair do Sistema</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative h-screen overflow-hidden">
        {/* Modern Header */}
        <header className="h-16 glass-panel border-b border-white/5 flex items-center justify-between px-6 z-40 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <DashboardIcon fontSize="small" />
            </button>
            <h1 className="text-lg font-semibold text-slate-100 capitalize">
              {pathname.split("/").pop()?.replace("-", " ") || "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
             <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                <span className="text-xs font-bold text-indigo-400">PRO PLAN</span>
             </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar animate-in relative">
          {children}
        </div>
      </main>
    </div>
  );
}
