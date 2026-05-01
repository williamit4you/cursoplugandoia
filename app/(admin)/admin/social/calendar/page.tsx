"use client";

import React, { useEffect, useMemo, useState } from "react";

type SocialPost = {
  id: string;
  summary: string;
  platform: string;
  postType: string;
  status: string;
  scheduledTo?: string | null;
  postedAt?: string | null;
};

const EVENT_COLORS: Record<string, { bg: string; color: string }> = {
  META: { bg: "#ede9fe", color: "#6d28d9" },
  YOUTUBE: { bg: "#fee2e2", color: "#b91c1c" },
  TIKTOK: { bg: "#e2e8f0", color: "#0f172a" },
  LINKEDIN: { bg: "#dbeafe", color: "#1d4ed8" },
};

function monthLabel(date: Date) {
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function startOfGrid(base: Date) {
  const first = new Date(base.getFullYear(), base.getMonth(), 1);
  const day = first.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  first.setDate(first.getDate() + diff);
  return first;
}

export default function SocialCalendarPage() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [cursor, setCursor] = useState(() => new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/social/posts?page=1&pageSize=200&sortBy=scheduledTo&sortDir=asc", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        setPosts((data?.items || []).filter((item: SocialPost) => item.scheduledTo));
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const days = useMemo(() => {
    const start = startOfGrid(cursor);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [cursor]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, SocialPost[]>();
    for (const post of posts) {
      if (!post.scheduledTo) continue;
      const key = new Date(post.scheduledTo).toISOString().slice(0, 10);
      const list = map.get(key) || [];
      list.push(post);
      map.set(key, list);
    }
    return map;
  }, [posts]);

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#0f172a" }}>🗓️ Calendário Social</h1>
          <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 14 }}>
            Visualize quando cada vídeo está programado para publicação.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setCursor((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
            style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid #cbd5e1", background: "white", cursor: "pointer", fontWeight: 800 }}
          >
            ← Mês anterior
          </button>
          <button
            onClick={() => setCursor((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
            style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid #cbd5e1", background: "white", cursor: "pointer", fontWeight: 800 }}
          >
            Próximo mês →
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 16, padding: 16, borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
        <strong style={{ color: "#0f172a" }}>{monthLabel(cursor)}</strong>
        <span style={{ marginLeft: 10, color: "#64748b", fontSize: 13 }}>
          {loading ? "Carregando agenda..." : `${posts.length} item(ns) com horário definido`}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10 }}>
        {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((label) => (
          <div key={label} style={{ fontSize: 12, fontWeight: 900, color: "#475569", textTransform: "uppercase", padding: "0 4px" }}>
            {label}
          </div>
        ))}

        {days.map((day) => {
          const key = day.toISOString().slice(0, 10);
          const items = eventsByDay.get(key) || [];
          const isCurrentMonth = day.getMonth() === cursor.getMonth();
          return (
            <div
              key={key}
              style={{
                minHeight: 180,
                padding: 12,
                borderRadius: 14,
                border: "1px solid #e2e8f0",
                background: isCurrentMonth ? "white" : "#f8fafc",
                opacity: isCurrentMonth ? 1 : 0.65,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 900, color: "#0f172a", marginBottom: 10 }}>{day.getDate()}</div>
              <div style={{ display: "grid", gap: 8 }}>
                {items.length === 0 && (
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>Sem publicações</div>
                )}
                {items.map((item) => {
                  const colors = EVENT_COLORS[item.platform] || { bg: "#eef2ff", color: "#3730a3" };
                  return (
                    <div
                      key={item.id}
                      style={{
                        borderRadius: 10,
                        padding: 10,
                        background: colors.bg,
                        color: colors.color,
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>
                        {item.platform} · {item.postType}
                      </div>
                      <div style={{ marginTop: 4, fontSize: 12, fontWeight: 700 }}>
                        {new Date(item.scheduledTo!).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.4 }}>
                        {String(item.summary || "").slice(0, 74)}
                        {String(item.summary || "").length > 74 ? "…" : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
