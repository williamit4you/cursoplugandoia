"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; color: string; pulse?: boolean }
> = {
  DRAFT: { label: "Rascunho", bg: "#f3f4f6", color: "#374151" },
  SCHEDULED: { label: "Agendado", bg: "#dbeafe", color: "#1d4ed8" },
  PROCESSING_MEDIA: {
    label: "Meta Processando",
    bg: "#fef3c7",
    color: "#92400e",
    pulse: true,
  },
  PUBLISHING: {
    label: "Publicando",
    bg: "#fef3c7",
    color: "#92400e",
    pulse: true,
  },
  POSTED: { label: "Publicado", bg: "#d1fae5", color: "#065f46" },
  FAILED: { label: "Falhou", bg: "#fee2e2", color: "#991b1b" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        background: cfg.bg,
        color: cfg.color,
        animation: cfg.pulse ? "pulse 1.5s infinite" : "none",
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: cfg.color,
          flexShrink: 0,
          animation: cfg.pulse ? "pulse-dot 1.5s infinite" : "none",
        }}
      />
      {cfg.label}
    </span>
  );
}

export default function SocialPostsDashboard() {
  const [posts, setPosts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [platformFilter, setPlatformFilter] = useState("ALL");
  const [postTypeFilter, setPostTypeFilter] = useState("ALL");
  const [q, setQ] = useState("");

  const retryTimers = useRef<Record<string, NodeJS.Timeout>>({});

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  const fetchPosts = async () => {
    const qs = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      sortBy,
      sortDir,
      status: statusFilter,
      platform: platformFilter,
      postType: postTypeFilter,
      q: q.trim(),
    });

    const res = await fetch(`/api/social/posts?${qs.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) return;
    const data = await res.json();
    setPosts(Array.isArray(data?.items) ? data.items : []);
    setTotal(Number(data?.total) || 0);
  };

  useEffect(() => {
    fetchPosts();
    const interval = setInterval(fetchPosts, 15000);
    const timers = retryTimers.current;
    return () => {
      clearInterval(interval);
      Object.values(timers).forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, sortBy, sortDir, statusFilter, platformFilter, postTypeFilter, q]);

  const clearRetry = (id: string) => {
    if (retryTimers.current[id]) {
      clearTimeout(retryTimers.current[id]);
      delete retryTimers.current[id];
    }
  };

  const scheduleRetry = (id: string, delayMs: number) => {
    clearRetry(id);
    retryTimers.current[id] = setTimeout(() => {
      handlePublish(id, true);
    }, delayMs);
  };

  const handlePublish = async (
    id: string,
    isRetry = false,
    bypassTimeCheck = false
  ) => {
    if (!isRetry) setLoadingId(id + "-reels");
    try {
      const res = await fetch("/api/social/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socialPostId: id, bypassTimeCheck }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.timeLimit && !bypassTimeCheck) {
          const ok = confirm(
            "⚠️ Limite de 1h não atingido! Postar AGORA e assumir risco de shadowban?"
          );
          if (ok) handlePublish(id, false, true);
          else setLoadingId(null);
          return;
        }
        toast.error(data.error || "Erro ao publicar");
        setLoadingId(null);
        return;
      }

      if (data.phase === 1 || data.stillProcessing) {
        await fetchPosts();
        if (!isRetry) {
          toast.info(
            "📦 Container criado! Meta processando o vídeo. Verificando automaticamente a cada 30s...",
            { autoClose: 8000 }
          );
        }
        setLoadingId(null);
        scheduleRetry(id, 30000);
        return;
      }

      if (data.success) {
        clearRetry(id);
        toast.success("✅ Reels publicado no Instagram e Facebook!");
      } else if (data.errors?.length > 0) {
        clearRetry(id);
        toast.warning(`⚠️ Publicado parcialmente: ${data.errors.join(" | ")}`);
      }

      setLoadingId(null);
      await fetchPosts();
    } catch {
      toast.error("Erro de conexão");
      setLoadingId(null);
    }
  };

  const handlePublishStory = async (id: string, isRetry = false) => {
    if (!isRetry) setLoadingId(id + "-story");
    try {
      const res = await fetch("/api/social/publish-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socialPostId: id }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erro ao publicar Story");
        setLoadingId(null);
        return;
      }

      if (data.phase === 1 || data.stillProcessing) {
        await fetchPosts();
        if (!isRetry) {
          toast.info(
            "📦 Container criado! Meta processando o Story. Verificando automaticamente a cada 30s...",
            { autoClose: 8000 }
          );
        }
        setLoadingId(null);
        scheduleRetry(id, 30000);
        return;
      }

      if (data.success) toast.success("✅ Story de 24h publicado no Instagram e Facebook!");
      else if (data.errors?.length > 0)
        toast.warning(`⚠️ Story parcialmente publicado: ${data.errors.join(" | ")}`);

      setLoadingId(null);
      await fetchPosts();
    } catch {
      toast.error("Erro de conexão ao publicar Story");
      setLoadingId(null);
    }
  };

  const handlePublishTikTok = async (id: string) => {
    setLoadingId(id + "-tiktok");
    try {
      const res = await fetch("/api/social/publish-tiktok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socialPostId: id }),
      });
      const data = await res.json();
      if (!res.ok) toast.error(data.error || "Erro ao publicar no TikTok");
      else toast.success("✅ Vídeo enviado ao TikTok com sucesso!");
    } catch {
      toast.error("Erro de conexão ao publicar no TikTok");
    } finally {
      setLoadingId(null);
      await fetchPosts();
    }
  };

  const handlePublishYouTube = async (id: string) => {
    setLoadingId(id + "-youtube");
    try {
      const res = await fetch("/api/social/publish-youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socialPostId: id }),
      });
      const data = await res.json();
      if (!res.ok) toast.error(data.error || "Erro ao publicar no YouTube");
      else toast.success("✅ Vídeo enviado ao YouTube com sucesso!");
    } catch {
      toast.error("Erro de conexão ao publicar no YouTube");
    } finally {
      setLoadingId(null);
      await fetchPosts();
    }
  };

  const handleRefreshStats = async () => {
    setLoadingId("refresh-stats");
    try {
      const res = await fetch("/api/social/refresh-stats", { method: "POST" });
      if (res.ok) {
        toast.success("📈 Estatísticas atualizadas com sucesso!");
        await fetchPosts();
      } else {
        toast.error("Erro ao atualizar estatísticas");
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setLoadingId(null);
    }
  };

  const handlePublishSite = async (id: string) => {
    setLoadingId(id + "-site");
    try {
      const res = await fetch("/api/social/publish-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socialPostId: id, publishNow: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao publicar no site");
        return;
      }
      toast.success("✅ Publicado no site!");
      if (data?.slug) window.open(`/noticias/${data.slug}`, "_blank");
      await fetchPosts();
    } catch {
      toast.error("Erro de conexão ao publicar no site");
    } finally {
      setLoadingId(null);
    }
  };

  const goSort = (field: string) => {
    if (sortBy === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(field);
      setSortDir("desc");
    }
    setPage(1);
  };

  const sortIcon = (field: string) => {
    if (sortBy !== field) return "↕";
    return sortDir === "asc" ? "↑" : "↓";
  };

  const thStyle: React.CSSProperties = {
    padding: "10px 12px",
    textAlign: "left",
    fontSize: 12,
    color: "#6b7280",
    fontWeight: 800,
    borderBottom: "1px solid #e5e7eb",
    whiteSpace: "nowrap",
  };

  const tdStyle: React.CSSProperties = {
    padding: "10px 12px",
    borderBottom: "1px solid #f3f4f6",
    verticalAlign: "top",
    fontSize: 13,
    color: "#111827",
  };

  return (
    <div style={{ padding: 24, maxWidth: 1300, margin: "0 auto" }}>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        @keyframes pulse-dot { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.4); } }
      `}</style>
      <ToastContainer position="top-right" autoClose={4000} />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>
            📱 Fila de Publicações — Meta, TikTok & YouTube
          </h1>
          <p style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>
            {total} item(ns) · atualiza automaticamente a cada 15s
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={handleRefreshStats}
            disabled={loadingId === "refresh-stats"}
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              border: "1px solid #10b981",
              background: "#ecfdf5",
              color: "#047857",
              cursor: loadingId === "refresh-stats" ? "not-allowed" : "pointer",
              fontSize: 13,
              fontWeight: 900,
            }}
          >
            {loadingId === "refresh-stats" ? "⏳..." : "📈 Atualizar Views"}
          </button>
          <button
            onClick={fetchPosts}
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              border: "1px solid #d1d5db",
              background: "white",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            🔄 Atualizar Lista
          </button>
        </div>
      </div>

      <div
        style={{
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 16,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 160px 160px 160px",
            gap: 12,
          }}
        >
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar (summary / link)…"
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #d1d5db",
              fontSize: 13,
            }}
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #d1d5db",
              fontSize: 13,
            }}
          >
            <option value="ALL">Status (todos)</option>
            {Object.keys(STATUS_CONFIG).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={platformFilter}
            onChange={(e) => {
              setPlatformFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #d1d5db",
              fontSize: 13,
            }}
          >
            <option value="ALL">Plataforma (todas)</option>
            <option value="META">META</option>
            <option value="TIKTOK">TIKTOK</option>
            <option value="YOUTUBE">YOUTUBE</option>
            <option value="LINKEDIN">LINKEDIN</option>
          </select>
          <select
            value={postTypeFilter}
            onChange={(e) => {
              setPostTypeFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #d1d5db",
              fontSize: 13,
            }}
          >
            <option value="ALL">Tipo (todos)</option>
            <option value="REEL">REEL</option>
            <option value="STORY">STORY</option>
          </select>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              color: "#6b7280",
              fontSize: 12,
            }}
          >
            <span>
              Página <strong style={{ color: "#111827" }}>{page}</strong> /{" "}
              {totalPages}
            </span>
            <span>·</span>
            <span>
              Total: <strong style={{ color: "#111827" }}>{total}</strong>
            </span>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              style={{
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid #d1d5db",
                fontSize: 13,
              }}
            >
              {[10, 20, 30, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}/página
                </option>
              ))}
            </select>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                border: "1px solid #d1d5db",
                background: page <= 1 ? "#f3f4f6" : "white",
                cursor: page <= 1 ? "not-allowed" : "pointer",
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              ← Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                border: "1px solid #d1d5db",
                background: page >= totalPages ? "#f3f4f6" : "white",
                cursor: page >= totalPages ? "not-allowed" : "pointer",
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              Próxima →
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
            Nenhum item encontrado com os filtros atuais.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  <th style={thStyle}>Preview</th>
                  <th style={thStyle}>
                    <button
                      onClick={() => goSort("status")}
                      style={{ all: "unset", cursor: "pointer" }}
                    >
                      Status {sortIcon("status")}
                    </button>
                  </th>
                  <th style={thStyle}>
                    <button
                      onClick={() => goSort("postType")}
                      style={{ all: "unset", cursor: "pointer" }}
                    >
                      Tipo {sortIcon("postType")}
                    </button>
                  </th>
                  <th style={thStyle}>
                    <button
                      onClick={() => goSort("platform")}
                      style={{ all: "unset", cursor: "pointer" }}
                    >
                      Plataforma {sortIcon("platform")}
                    </button>
                  </th>
                  <th style={thStyle}>
                    <button
                      onClick={() => goSort("views")}
                      style={{ all: "unset", cursor: "pointer" }}
                    >
                      Views {sortIcon("views")}
                    </button>
                  </th>
                  <th style={thStyle}>
                    <button
                      onClick={() => goSort("createdAt")}
                      style={{ all: "unset", cursor: "pointer" }}
                    >
                      Criado {sortIcon("createdAt")}
                    </button>
                  </th>
                  <th style={thStyle}>
                    <button
                      onClick={() => goSort("postedAt")}
                      style={{ all: "unset", cursor: "pointer" }}
                    >
                      Publicado {sortIcon("postedAt")}
                    </button>
                  </th>
                  <th style={thStyle}>Links</th>
                  <th style={thStyle}>Resumo</th>
                  <th style={thStyle}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => {
                  const isProcessing =
                    p.status === "PROCESSING_MEDIA" || p.status === "PUBLISHING";
                  const hasRetryPending = !!retryTimers.current[p.id];

                  return (
                    <tr
                      key={p.id}
                      style={{ background: isProcessing ? "#fffbeb" : "white" }}
                    >
                      <td style={{ ...tdStyle, width: 120 }}>
                        <div
                          style={{
                            width: 96,
                            aspectRatio: "9/16",
                            borderRadius: 10,
                            overflow: "hidden",
                            background: "#111",
                          }}
                        >
                          {p.videoUrl ? (
                            <video
                              src={p.videoUrl}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                              muted
                              playsInline
                              onMouseEnter={(e) =>
                                (e.currentTarget as HTMLVideoElement).play()
                              }
                              onMouseLeave={(e) => {
                                const v = e.currentTarget as HTMLVideoElement;
                                v.pause();
                                v.currentTime = 0;
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#9ca3af",
                                fontSize: 11,
                              }}
                            >
                              Sem vídeo
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                          }}
                        >
                          <StatusBadge status={p.status} />
                          {hasRetryPending && (
                            <span
                              style={{
                                fontSize: 11,
                                color: "#1d4ed8",
                                fontWeight: 800,
                              }}
                            >
                              ↻ retry agendado
                            </span>
                          )}
                          {p.metaContainerId && (
                            <span
                              style={{
                                fontSize: 11,
                                color: "#9ca3af",
                                fontFamily: "monospace",
                              }}
                            >
                              {String(p.metaContainerId).slice(0, 10)}…
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={tdStyle}>{p.postType || "REEL"}</td>
                      <td style={tdStyle}>{p.platform || "META"}</td>
                      <td
                        style={{
                          ...tdStyle,
                          fontFamily: "monospace",
                          color: "#065f46",
                          fontWeight: 900,
                        }}
                      >
                        {p.views !== undefined
                          ? Number(p.views).toLocaleString("pt-BR")
                          : "-"}
                      </td>
                      <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                        {p.createdAt
                          ? new Date(p.createdAt).toLocaleString("pt-BR")
                          : "-"}
                      </td>
                      <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                        {p.postedAt
                          ? new Date(p.postedAt).toLocaleString("pt-BR")
                          : "-"}
                      </td>
                      <td style={tdStyle}>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                          }}
                        >
                          {p.postUrl && (
                            <a
                              href={p.postUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                fontSize: 12,
                                color: "#4f46e5",
                                fontWeight: 900,
                                textDecoration: "none",
                              }}
                            >
                              Abrir post
                            </a>
                          )}
                          {p.videoUrl && (
                            <a
                              href={p.videoUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                fontSize: 12,
                                color: "#4f46e5",
                                fontWeight: 900,
                                textDecoration: "none",
                              }}
                            >
                              Abrir vídeo
                            </a>
                          )}
                        </div>
                      </td>
                      <td style={{ ...tdStyle, maxWidth: 420 }}>
                        <div style={{ color: "#374151", lineHeight: 1.45 }}>
                          {String(p.summary || "").slice(0, 220)}
                          {String(p.summary || "").length > 220 ? "…" : ""}
                        </div>
                        {p.log && (
                          <div style={{ marginTop: 8 }}>
                            <button
                              onClick={() =>
                                setExpandedLog(expandedLog === p.id ? null : p.id)
                              }
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "#4f46e5",
                                cursor: "pointer",
                                fontSize: 12,
                                fontWeight: 900,
                                padding: 0,
                              }}
                            >
                              {expandedLog === p.id ? "Ocultar log" : "Ver log"}
                            </button>
                            {expandedLog === p.id && (
                              <pre
                                style={{
                                  marginTop: 8,
                                  whiteSpace: "pre-wrap",
                                  background: "#111827",
                                  color: "#e5e7eb",
                                  borderRadius: 10,
                                  padding: 12,
                                  fontSize: 11,
                                  maxHeight: 220,
                                  overflow: "auto",
                                }}
                              >
                                {p.log}
                              </pre>
                            )}
                          </div>
                        )}
                      </td>
                      <td style={{ ...tdStyle, width: 230 }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {isProcessing && (
                            <button
                              onClick={() => handlePublish(p.id)}
                              disabled={loadingId === p.id + "-reels"}
                              style={{
                                padding: "8px 12px",
                                borderRadius: 10,
                                border: "1px solid #d97706",
                                background: "white",
                                color: "#b45309",
                                cursor: "pointer",
                                fontSize: 12,
                                fontWeight: 900,
                              }}
                            >
                              Checar Meta agora
                            </button>
                          )}

                          {!isProcessing && p.status !== "POSTED" && (
                            <button
                              onClick={() => handlePublish(p.id)}
                              disabled={loadingId === p.id + "-reels"}
                              style={{
                                padding: "8px 12px",
                                borderRadius: 10,
                                border: "none",
                                background:
                                  loadingId === p.id + "-reels" ? "#d1d5db" : "#4f46e5",
                                color: "white",
                                cursor:
                                  loadingId === p.id + "-reels" ? "not-allowed" : "pointer",
                                fontSize: 12,
                                fontWeight: 900,
                              }}
                            >
                              {loadingId === p.id + "-reels" ? "Aguarde…" : "Meta Reels"}
                            </button>
                          )}

                          {!isProcessing && p.status !== "POSTED" && (
                            <button
                              onClick={() => handlePublishStory(p.id)}
                              disabled={loadingId === p.id + "-story"}
                              style={{
                                padding: "8px 12px",
                                borderRadius: 10,
                                border: "1px solid #7c3aed",
                                background: "white",
                                color: "#7c3aed",
                                cursor:
                                  loadingId === p.id + "-story" ? "not-allowed" : "pointer",
                                fontSize: 12,
                                fontWeight: 900,
                              }}
                            >
                              {loadingId === p.id + "-story" ? "Aguarde…" : "Meta Story"}
                            </button>
                          )}

                          {!isProcessing && (
                            <button
                              onClick={() => handlePublishTikTok(p.id)}
                              disabled={loadingId === p.id + "-tiktok"}
                              style={{
                                padding: "8px 12px",
                                borderRadius: 10,
                                border: "none",
                                background:
                                  loadingId === p.id + "-tiktok" ? "#d1d5db" : "#111827",
                                color: "white",
                                cursor:
                                  loadingId === p.id + "-tiktok" ? "not-allowed" : "pointer",
                                fontSize: 12,
                                fontWeight: 900,
                              }}
                            >
                              {loadingId === p.id + "-tiktok" ? "Enviando…" : "TikTok"}
                            </button>
                          )}

                          {!isProcessing && (
                            <button
                              onClick={() => handlePublishYouTube(p.id)}
                              disabled={loadingId === p.id + "-youtube"}
                              style={{
                                padding: "8px 12px",
                                borderRadius: 10,
                                border: "none",
                                background:
                                  loadingId === p.id + "-youtube" ? "#d1d5db" : "#ef4444",
                                color: "white",
                                cursor:
                                  loadingId === p.id + "-youtube" ? "not-allowed" : "pointer",
                                fontSize: 12,
                                fontWeight: 900,
                              }}
                            >
                              {loadingId === p.id + "-youtube" ? "Enviando…" : "YouTube"}
                            </button>
                          )}

                          {!isProcessing && (
                            <button
                              onClick={() => handlePublishSite(p.id)}
                              disabled={loadingId === p.id + "-site"}
                              style={{
                                padding: "8px 12px",
                                borderRadius: 10,
                                border: "1px solid #111827",
                                background: loadingId === p.id + "-site" ? "#f3f4f6" : "white",
                                color: "#111827",
                                cursor: loadingId === p.id + "-site" ? "not-allowed" : "pointer",
                                fontSize: 12,
                                fontWeight: 900,
                              }}
                            >
                              {loadingId === p.id + "-site" ? "Publicando…" : "Publicar no site"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
