"use client";

import React from "react";
import PostAddIcon from '@mui/icons-material/PostAdd';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PeopleIcon from '@mui/icons-material/People';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import ShareIcon from '@mui/icons-material/Share';

type Stats = {
  posts: number;
  views: number;
  leads: number;
  totalQuestions: number;
  readyVideos: number;
  totalPosts: number;
  platforms: Record<string, number>;
};

export default function DashboardMetrics({ stats }: { stats: Stats }) {
  const cards = [
    { label: "Notícias", value: stats.posts, icon: <PostAddIcon />, color: "from-blue-500 to-indigo-600", shadow: "shadow-indigo-500/20" },
    { label: "Visualizações", value: stats.views, icon: <VisibilityIcon />, color: "from-purple-500 to-violet-600", shadow: "shadow-violet-500/20" },
    { label: "Leads", value: stats.leads, icon: <PeopleIcon />, color: "from-emerald-500 to-teal-600", shadow: "shadow-emerald-500/20" },
    { label: "Perguntas", value: stats.totalQuestions, icon: <QuestionAnswerIcon />, color: "from-amber-500 to-orange-600", shadow: "shadow-amber-500/20" },
    { label: "Vídeos Prontos", value: stats.readyVideos, icon: <VideoLibraryIcon />, color: "from-pink-500 to-rose-600", shadow: "shadow-rose-500/20" },
    { label: "Postagens", value: stats.totalPosts, icon: <ShareIcon />, color: "from-cyan-500 to-sky-600", shadow: "shadow-cyan-500/20" },
  ];

  return (
    <div className="space-y-8 animate-in relative z-10">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, idx) => (
          <div 
            key={idx}
            className={`group relative p-6 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 shadow-xl hover:shadow-2xl ${card.shadow}`}
          >
            {/* Background Glow on Hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-[0.05] rounded-3xl transition-opacity duration-500`} />
            
            <div className="relative flex items-center gap-5">
              {/* Icon Container */}
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                {React.cloneElement(card.icon as React.ReactElement, { fontSize: "medium" })}
              </div>

              {/* Text Content */}
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                  {card.label}
                </p>
                <h3 className="text-3xl font-black text-white tracking-tighter">
                  {card.value.toLocaleString('pt-BR')}
                </h3>
              </div>
            </div>
            
            {/* Decorative element */}
            <div className="absolute top-4 right-4 w-12 h-12 bg-white/5 rounded-full blur-xl pointer-events-none group-hover:bg-white/10 transition-colors duration-500" />
          </div>
        ))}
      </div>

      {/* Platform Stats Section */}
      {Object.keys(stats.platforms).length > 0 && (
        <div className="space-y-5 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 shadow-2xl relative overflow-hidden">
          {/* Subtle glow */}
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />

          <div className="flex items-center gap-3 relative z-10">
            <div className="w-1.5 h-6 bg-cyan-500 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.6)]" />
            <h2 className="text-xl font-black text-white tracking-tight">
              Postagens por Plataforma
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 relative z-10">
            {Object.entries(stats.platforms).map(([platform, count]) => (
              <div 
                key={platform}
                className="group border border-white/5 bg-black/20 p-5 rounded-2xl flex flex-col items-center justify-center text-center hover:bg-white/5 hover:border-white/10 transition-all duration-300"
              >
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 group-hover:text-cyan-400 transition-colors">
                  {platform}
                </span>
                <span className="text-3xl font-black text-white group-hover:scale-110 transition-transform duration-300">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
