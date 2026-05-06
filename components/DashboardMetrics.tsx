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
    { label: "Notícias", value: stats.posts, icon: <PostAddIcon />, color: "from-blue-500 to-indigo-600" },
    { label: "Visualizações", value: stats.views, icon: <VisibilityIcon />, color: "from-purple-500 to-violet-600" },
    { label: "Leads", value: stats.leads, icon: <PeopleIcon />, color: "from-emerald-500 to-teal-600" },
    { label: "Perguntas", value: stats.totalQuestions, icon: <QuestionAnswerIcon />, color: "from-amber-500 to-orange-600" },
    { label: "Vídeos Prontos", value: stats.readyVideos, icon: <VideoLibraryIcon />, color: "from-pink-500 to-rose-600" },
    { label: "Postagens", value: stats.totalPosts, icon: <ShareIcon />, color: "from-cyan-500 to-sky-600" },
  ];

  return (
    <div className="space-y-8 animate-in">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, idx) => (
          <div 
            key={idx}
            className="group relative glass-panel p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-300 hover:scale-[1.02]"
          >
            {/* Background Glow */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-[0.03] rounded-2xl transition-opacity duration-500`} />
            
            <div className="relative flex items-center gap-5">
              {/* Icon Container */}
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-lg shadow-black/20`}>
                {React.cloneElement(card.icon as React.ReactElement, { fontSize: "medium" })}
              </div>

              {/* Text Content */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                  {card.label}
                </p>
                <h3 className="text-3xl font-black text-white tracking-tight">
                  {card.value.toLocaleString()}
                </h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Platform Stats Section */}
      {Object.keys(stats.platforms).length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/50" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Postagens por Plataforma
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(stats.platforms).map(([platform, count]) => (
              <div 
                key={platform}
                className="glass border border-white/5 p-4 rounded-xl flex flex-col items-center justify-center text-center hover:bg-white/[0.03] transition-colors"
              >
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter mb-1">
                  {platform}
                </span>
                <span className="text-2xl font-black text-white">
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

