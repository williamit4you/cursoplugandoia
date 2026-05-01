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
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

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

  const formatDateTime = (value?: string | null) =>
    value ? new Date(value).toLocaleString("pt-BR") : "—";

  const describeFlow = (post: any) => {
    if (post.status === "POSTED") return "Publicado com sucesso";
    if (post.status === "PROCESSING_MEDIA") return "Na fila da Meta processando mídia";
    if (post.status === "PUBLISHING") return "Enviado para publicação";
    if (post.status === "FAILED") return "Falhou e precisa de ação";
    if (post.status === "SCHEDULED" && post.scheduledTo) return "Na fila aguardando horário";
    if (post.status === "DRAFT") return "Gerado e aguardando envio";
    return "Em processamento";
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
            📱 Fila Social
          </h1>
          <p style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>
            {total} item(ns) · a tela mostra o que foi apenas enfileirado, o que está agendado e o que já foi publicado
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <a
            href="/admin/social/calendar"
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              border: "1px solid #2563eb",
              background: "#eff6ff",
              color: "#1d4ed8",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 900,
              textDecoration: "none",
            }}
          >
            🗓️ Ver calendário
          </a>
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
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          color: "#334155",
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: "#0f172a" }}>Como ler esta fila:</strong> `Rascunho` significa que o vídeo foi gerado e ainda não foi enviado. `Agendado` significa que já está na fila com horário definido. `Publicado` significa que a rede social já devolveu o link final.
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
                  <th style={thStyle}>Item</th>
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
                      onClick={() => goSort("scheduledTo")}
                      style={{ all: "unset", cursor: "pointer" }}
                    >
                      Agendado {sortIcon("scheduledTo")}
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
                    Fluxo
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
                  <th style={thStyle}>Detalhes</th>
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
                      <td style={{ ...tdStyle, minWidth: 260, maxWidth: 320 }}>
                        <div style={{ fontWeight: 800, color: "#111827", lineHeight: 1.4 }}>
                          {String(p.summary || "").slice(0, 110) || "Sem resumo"}
                        </div>
                        <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
                          {p.videoUrl ? "Vídeo gerado" : "Sem vídeo"} · {p.platform || "META"} · {p.postType || "REEL"}
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
                      <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                        {formatDateTime(p.scheduledTo)}
                      </td>
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
                      <td style={{ ...tdStyle, minWidth: 180, color: "#475569" }}>
                        {describeFlow(p)}
                      </td>
                      <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                        {formatDateTime(p.createdAt)}
                      </td>
                      <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                        {formatDateTime(p.postedAt)}
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
                      <td style={tdStyle}>
                        <button
                          onClick={() => setSelectedPost(p)}
                          style={{
                            padding: "8px 12px",
                            borderRadius: 10,
                            border: "1px solid #cbd5e1",
                            background: "white",
                            color: "#1e293b",
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: 900,
                          }}
                        >
                          Ver detalhes
                        </button>
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

      {selectedPost && (
        <div
          onClick={() => setSelectedPost(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            display: "flex",
            justifyContent: "flex-end",
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(520px, 100%)",
              height: "100%",
              background: "white",
              padding: 24,
              overflowY: "auto",
              boxShadow: "-12px 0 32px rgba(15, 23, 42, 0.18)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#0f172a" }}>Detalhes do item</h2>
                <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 13 }}>
                  Aqui fica claro se o conteúdo está só na fila, agendado ou já publicado.
                </p>
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 999,
                  border: "1px solid #e2e8f0",
                  background: "white",
                  cursor: "pointer",
                  fontWeight: 900,
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ padding: 14, borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Resumo</div>
                <div style={{ color: "#0f172a", lineHeight: 1.6 }}>{selectedPost.summary || "Sem resumo"}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ padding: 14, borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Status</div>
                  <div style={{ marginTop: 8 }}><StatusBadge status={selectedPost.status} /></div>
                </div>
                <div style={{ padding: 14, borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Fluxo</div>
                  <div style={{ marginTop: 8, color: "#0f172a", fontWeight: 700 }}>{describeFlow(selectedPost)}</div>
                </div>
                <div style={{ padding: 14, borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Plataforma</div>
                  <div style={{ marginTop: 8, color: "#0f172a", fontWeight: 700 }}>{selectedPost.platform || "META"}</div>
                </div>
                <div style={{ padding: 14, borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Tipo</div>
                  <div style={{ marginTop: 8, color: "#0f172a", fontWeight: 700 }}>{selectedPost.postType || "REEL"}</div>
                </div>
                <div style={{ padding: 14, borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Criado em</div>
                  <div style={{ marginTop: 8, color: "#0f172a", fontWeight: 700 }}>{formatDateTime(selectedPost.createdAt)}</div>
                </div>
                <div style={{ padding: 14, borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Agendado para</div>
                  <div style={{ marginTop: 8, color: "#0f172a", fontWeight: 700 }}>{formatDateTime(selectedPost.scheduledTo)}</div>
                </div>
                <div style={{ padding: 14, borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Publicado em</div>
                  <div style={{ marginTop: 8, color: "#0f172a", fontWeight: 700 }}>{formatDateTime(selectedPost.postedAt)}</div>
                </div>
                <div style={{ padding: 14, borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Views</div>
                  <div style={{ marginTop: 8, color: "#0f172a", fontWeight: 700 }}>{Number(selectedPost.views || 0).toLocaleString("pt-BR")}</div>
                </div>
              </div>

              {selectedPost.postUrl && (
                <a href={selectedPost.postUrl} target="_blank" rel="noreferrer" style={{ color: "#1d4ed8", fontWeight: 800, textDecoration: "none" }}>
                  Abrir link publicado
                </a>
              )}
              {selectedPost.videoUrl && (
                <a href={selectedPost.videoUrl} target="_blank" rel="noreferrer" style={{ color: "#1d4ed8", fontWeight: 800, textDecoration: "none" }}>
                  Abrir vídeo final
                </a>
              )}

              <div style={{ padding: 14, borderRadius: 12, background: "#0f172a", border: "1px solid #1e293b" }}>
                <div style={{ fontSize: 12, color: "#cbd5e1", marginBottom: 8 }}>Log técnico</div>
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    color: "#e2e8f0",
                    fontSize: 12,
                    lineHeight: 1.6,
                    margin: 0,
                    fontFamily: "Consolas, Monaco, monospace",
                  }}
                >
                  {selectedPost.log || "Sem log registrado."}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
