"use client";
import { useEffect, useRef, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; pulse?: boolean }> = {
  DRAFT:            { label: "Rascunho",        bg: "#f3f4f6", color: "#374151" },
  SCHEDULED:        { label: "Agendado",         bg: "#dbeafe", color: "#1d4ed8" },
  PROCESSING_MEDIA: { label: "Meta Processando", bg: "#fef3c7", color: "#92400e", pulse: true },
  PUBLISHING:       { label: "Publicando",       bg: "#fef3c7", color: "#92400e", pulse: true },
  POSTED:           { label: "Publicado",        bg: "#d1fae5", color: "#065f46" },
  FAILED:           { label: "Falhou",           bg: "#fee2e2", color: "#991b1b" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 999,
      fontSize: 12, fontWeight: 700,
      background: cfg.bg, color: cfg.color,
      animation: cfg.pulse ? "pulse 1.5s infinite" : "none",
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: "50%", background: cfg.color, flexShrink: 0,
        animation: cfg.pulse ? "pulse-dot 1.5s infinite" : "none",
      }} />
      {cfg.label}
    </span>
  );
}

export default function SocialPostsDashboard() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const retryTimers = useRef<Record<string, NodeJS.Timeout>>({});

  const fetchPosts = async () => {
    const res = await fetch("/api/social/posts", { cache: "no-store" });
    if (res.ok) setPosts(await res.json());
  };

  useEffect(() => {
    fetchPosts();
    const interval = setInterval(fetchPosts, 15000);
    return () => {
      clearInterval(interval);
      Object.values(retryTimers.current).forEach(clearTimeout);
    };
  }, []);

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

  // ── Publicar como Reels (comportamento original) ──────────────────────────
  const handlePublish = async (id: string, isRetry = false, bypassTimeCheck = false) => {
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
          const ok = confirm("⚠️ Limite de 1h não atingido! Postar AGORA e assumir risco de shadowban?");
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
          toast.info("📦 Container criado! Meta processando o vídeo. Verificando automaticamente a cada 30s...", { autoClose: 8000 });
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

  // ── Publicar como Story 24h ───────────────────────────────────────────────
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
          toast.info("📦 Container Story criado! Meta processando. Verificando em 30s...", { autoClose: 8000 });
        }
        setLoadingId(null);
        // Retry automático para Story
        retryTimers.current[id + "-story"] = setTimeout(() => handlePublishStory(id, true), 30000);
        return;
      }

      if (data.success) toast.success("✅ Story de 24h publicado no Instagram e Facebook!");
      else if (data.errors?.length > 0) toast.warning(`⚠️ Story parcialmente publicado: ${data.errors.join(" | ")}`);

      setLoadingId(null);
      await fetchPosts();
    } catch {
      toast.error("Erro de conexão ao publicar Story");
      setLoadingId(null);
    }
  };

  // ── Publicar no TikTok ────────────────────────────────────────────────────
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
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        @keyframes pulse-dot { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.4); } }
      `}</style>
      <ToastContainer position="top-right" />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
            📱 Fila de Publicações — Instagram, Facebook & TikTok
          </h1>
          <p style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>
            {posts.length} vídeo(s) na fila · atualiza automaticamente a cada 15s
          </p>
        </div>
        <button
          onClick={fetchPosts}
          style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #d1d5db", background: "white", cursor: "pointer", fontSize: 13 }}
        >
          🔄 Atualizar
        </button>
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        {posts.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "#9ca3af", border: "1px dashed #d1d5db", borderRadius: 12 }}>
            Nenhum vídeo na fila de publicações.
          </div>
        )}

        {posts.map((p) => {
          const isProcessing = p.status === "PROCESSING_MEDIA" || p.status === "PUBLISHING";
          const hasRetryPending = !!retryTimers.current[p.id];

          return (
            <div key={p.id} style={{
              display: "grid",
              gridTemplateColumns: "140px 1fr auto",
              gap: 16,
              background: "white",
              borderRadius: 12,
              padding: 16,
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              border: isProcessing ? "1px solid #fbbf24" : "1px solid #e5e7eb",
              alignItems: "start",
            }}>

              {/* Preview de vídeo */}
              <div style={{ borderRadius: 8, overflow: "hidden", background: "#111", aspectRatio: "9/16", maxHeight: 200 }}>
                {p.videoUrl ? (
                  <video
                    src={p.videoUrl}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    muted loop controls={false}
                    onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play()}
                    onMouseLeave={(e) => { const v = e.currentTarget as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
                  />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#555", fontSize: 12 }}>
                    Sem vídeo
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <StatusBadge status={p.status} />
                  {p.postType && p.postType !== "REEL" && (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: "#ede9fe", color: "#7c3aed" }}>
                      📸 Story
                    </span>
                  )}
                  {p.postedAt && (
                    <span style={{ fontSize: 12, color: "#6b7280" }}>
                      Publicado: {new Date(p.postedAt).toLocaleString("pt-BR")}
                    </span>
                  )}
                  {p.metaContainerId && (
                    <span style={{ fontSize: 11, color: "#9ca3af", fontFamily: "monospace" }}>
                      Container: {p.metaContainerId}
                    </span>
                  )}
                </div>

                <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.5 }}>
                  {p.summary}
                </p>

                {p.videoUrl && (
                  <a href={p.videoUrl} target="_blank" rel="noreferrer"
                    style={{ fontSize: 12, color: "#6366f1", textDecoration: "underline" }}>
                    🔗 Ver vídeo completo
                  </a>
                )}

                {isProcessing && hasRetryPending && (
                  <div style={{ padding: "6px 10px", borderRadius: 6, background: "#fef3c7", color: "#92400e", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ animation: "pulse 1.5s infinite" }}>⏱️</span>
                    Verificação automática agendada em ~30 segundos...
                  </div>
                )}

                {p.log && (
                  <div>
                    <button
                      onClick={() => setExpandedLog(expandedLog === p.id ? null : p.id)}
                      style={{ fontSize: 12, color: "#6b7280", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    >
                      {expandedLog === p.id ? "▲ Ocultar log" : "▼ Ver log de publicação"}
                    </button>
                    {expandedLog === p.id && (
                      <pre style={{
                        marginTop: 8, padding: "10px 12px",
                        background: "#0d0d1a", color: "#e0e0e0",
                        borderRadius: 8, fontSize: 11,
                        fontFamily: "Fira Code, Courier New, monospace",
                        whiteSpace: "pre-wrap", wordBreak: "break-word",
                        maxHeight: 200, overflowY: "auto"
                      }}>
                        {p.log}
                      </pre>
                    )}
                  </div>
                )}
              </div>

              {/* Ações */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 140 }}>
                {p.status === "POSTED" && (
                  <div style={{ padding: "8px 14px", borderRadius: 8, background: "#d1fae5", color: "#065f46", fontSize: 12, fontWeight: 700 }}>
                    ✅ Publicado
                  </div>
                )}

                {isProcessing && (
                  <>
                    <div style={{ padding: "8px 14px", borderRadius: 8, background: "#fef3c7", color: "#92400e", fontSize: 12, fontWeight: 700, animation: "pulse 1.5s infinite", textAlign: "center" }}>
                      ⏳ Aguardando Meta...
                    </div>
                    <button
                      onClick={() => handlePublish(p.id)}
                      disabled={loadingId === p.id + "-reels"}
                      style={{
                        padding: "6px 14px", borderRadius: 8, border: "1px solid #d97706",
                        cursor: "pointer", fontWeight: 600, fontSize: 11,
                        background: "white", color: "#d97706",
                      }}
                    >
                      🔍 Checar agora
                    </button>
                  </>
                )}

                {/* Botão Reels (Meta) */}
                {!isProcessing && p.status !== "POSTED" && (
                  <button
                    onClick={() => handlePublish(p.id)}
                    disabled={loadingId === p.id + "-reels"}
                    style={{
                      padding: "8px 14px", borderRadius: 8, border: "none",
                      cursor: loadingId === p.id + "-reels" ? "not-allowed" : "pointer",
                      fontWeight: 700, fontSize: 12,
                      background: loadingId === p.id + "-reels" ? "#d1d5db" : "#4f46e5",
                      color: loadingId === p.id + "-reels" ? "#9ca3af" : "white",
                      transition: "all 0.2s",
                    }}
                  >
                    {loadingId === p.id + "-reels" ? "⏳ Aguarde..." : "📹 Reels (Meta)"}
                  </button>
                )}

                {/* Botão Story 24h */}
                {!isProcessing && p.status !== "POSTED" && (
                  <button
                    onClick={() => handlePublishStory(p.id)}
                    disabled={loadingId === p.id + "-story"}
                    style={{
                      padding: "8px 14px", borderRadius: 8,
                      border: "1px solid #7c3aed",
                      cursor: loadingId === p.id + "-story" ? "not-allowed" : "pointer",
                      fontWeight: 700, fontSize: 12,
                      background: loadingId === p.id + "-story" ? "#d1d5db" : "white",
                      color: loadingId === p.id + "-story" ? "#9ca3af" : "#7c3aed",
                      transition: "all 0.2s",
                    }}
                  >
                    {loadingId === p.id + "-story" ? "⏳ Aguarde..." : "📸 Story 24h"}
                  </button>
                )}

                {/* Botão TikTok */}
                {!isProcessing && (
                  <button
                    onClick={() => handlePublishTikTok(p.id)}
                    disabled={loadingId === p.id + "-tiktok"}
                    style={{
                      padding: "8px 14px", borderRadius: 8, border: "none",
                      cursor: loadingId === p.id + "-tiktok" ? "not-allowed" : "pointer",
                      fontWeight: 700, fontSize: 12,
                      background: loadingId === p.id + "-tiktok" ? "#d1d5db" : "#010101",
                      color: loadingId === p.id + "-tiktok" ? "#6b7280" : "white",
                      transition: "all 0.2s",
                    }}
                  >
                    {loadingId === p.id + "-tiktok" ? "⏳ Enviando..." : "🎵 TikTok"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
