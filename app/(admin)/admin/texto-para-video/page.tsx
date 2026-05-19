"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Paper, TextField, Typography } from "@mui/material";

type SimpleCreatorVideo = {
  id: string;
  narrationText: string;
  creatorImageUrl: string;
  audioUrl: string | null;
  videoUrl: string | null;
  captionsUrl: string | null;
  status: string;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function TextoParaVideoPage() {
  const [narrationText, setNarrationText] = useState("");
  const [creatorImageUrl, setCreatorImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [current, setCurrent] = useState<SimpleCreatorVideo | null>(null);
  const [recent, setRecent] = useState<SimpleCreatorVideo[]>([]);

  const canCreate = narrationText.trim().length > 0 && creatorImageUrl.trim().length > 0 && !loading;

  const loadRecent = async () => {
    try {
      const res = await fetch("/api/texto-para-video", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setRecent(data.items || []);
    } catch {
      // ignore
    }
  };

  const refreshCurrent = async (id: string) => {
    const res = await fetch(`/api/texto-para-video/${id}`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) setCurrent(data.item || null);
  };

  useEffect(() => {
    loadRecent();
  }, []);

  const statusLabel = useMemo(() => {
    if (!current) return "";
    const s = current.status;
    if (s === "DRAFT") return "Pronto para gerar";
    if (s === "GENERATING_AUDIO") return "Gerando áudio…";
    if (s === "AUDIO_READY") return "Áudio pronto";
    if (s === "GENERATING_VIDEO") return "Gerando vídeo…";
    if (s === "READY") return "Vídeo pronto";
    if (s === "FAILED") return "Falhou";
    return s;
  }, [current]);

  const create = async () => {
    if (!canCreate) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/texto-para-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ narrationText, creatorImageUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Falha ao criar");
      setCurrent(data.item);
      setNarrationText("");
      loadRecent();
    } catch (e: any) {
      setMessage(e?.message || "Falha ao criar");
    } finally {
      setLoading(false);
    }
  };

  const gerarAudio = async () => {
    if (!current || loading) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/texto-para-video/${current.id}/gerar-audio`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Falha ao gerar áudio");
      await refreshCurrent(current.id);
      loadRecent();
    } catch (e: any) {
      setMessage(e?.message || "Falha ao gerar áudio");
      await refreshCurrent(current.id);
    } finally {
      setLoading(false);
    }
  };

  const gerarVideo = async () => {
    if (!current || loading) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/texto-para-video/${current.id}/gerar-video`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Falha ao gerar vídeo");
      await refreshCurrent(current.id);
      loadRecent();
    } catch (e: any) {
      setMessage(e?.message || "Falha ao gerar vídeo");
      await refreshCurrent(current.id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          Texto → Vídeo
        </Typography>
        <Typography sx={{ opacity: 0.8, mt: 1 }}>
          Cole o texto, informe a imagem, gere áudio com sua voz e depois o vídeo. No final, baixe o MP4.
        </Typography>
      </Box>

      {message ? <Alert severity="error">{message}</Alert> : null}

      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 2 }}>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 8" } }}>
            <TextField
              label="Texto para narração"
              value={narrationText}
              onChange={(e) => setNarrationText(e.target.value)}
              multiline
              rows={6}
              fullWidth
              placeholder="Digite o texto do vídeo…"
            />
          </Box>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
            <TextField
              label="URL da sua imagem (foto)"
              value={creatorImageUrl}
              onChange={(e) => setCreatorImageUrl(e.target.value)}
              fullWidth
              placeholder="https://..."
              helperText="Use uma URL pública (ex.: MinIO)."
            />

            <Box sx={{ display: "flex", gap: 1.5, mt: 2, flexWrap: "wrap" }}>
              <button
                onClick={create}
                disabled={!canCreate}
                style={{ padding: "10px 14px", borderRadius: 10, fontWeight: 900, background: "#111827", color: "white" }}
              >
                {loading ? "..." : "Criar"}
              </button>
              <button
                onClick={gerarAudio}
                disabled={!current || loading}
                style={{ padding: "10px 14px", borderRadius: 10, fontWeight: 900 }}
              >
                Gerar áudio
              </button>
              <button
                onClick={gerarVideo}
                disabled={!current || !current.audioUrl || loading}
                style={{ padding: "10px 14px", borderRadius: 10, fontWeight: 900 }}
              >
                Gerar vídeo
              </button>
            </Box>

            {current ? (
              <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, border: "1px solid rgba(0,0,0,0.08)", background: "rgba(255,255,255,0.5)" }}>
                <div style={{ fontWeight: 900 }}>Status: {statusLabel}</div>
                {current.errorMessage ? <div style={{ marginTop: 6, color: "#b91c1c" }}>{current.errorMessage}</div> : null}

                {current.audioUrl ? (
                  <div style={{ marginTop: 10 }}>
                    <a href={current.audioUrl} target="_blank" rel="noreferrer">
                      Abrir áudio
                    </a>
                  </div>
                ) : null}

                {current.videoUrl ? (
                  <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                    <a href={current.videoUrl} target="_blank" rel="noreferrer">
                      Abrir vídeo
                    </a>
                    <a href={current.videoUrl} download>
                      Baixar MP4
                    </a>
                    {current.captionsUrl ? (
                      <a href={current.captionsUrl} target="_blank" rel="noreferrer">
                        Abrir legendas (VTT)
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </Box>
            ) : null}
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography sx={{ fontWeight: 900, mb: 1 }}>Recentes</Typography>
        <Box sx={{ display: "grid", gap: 1 }}>
          {recent.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrent(item)}
              style={{
                textAlign: "left",
                padding: 12,
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.08)",
                background: "white",
                cursor: "pointer",
              }}
            >
              <div style={{ fontWeight: 900 }}>{item.status}</div>
              <div style={{ opacity: 0.75, fontSize: 12, fontFamily: "monospace" }}>{item.id}</div>
              <div style={{ marginTop: 6, opacity: 0.85 }}>{item.narrationText.slice(0, 140)}{item.narrationText.length > 140 ? "…" : ""}</div>
            </button>
          ))}
          {recent.length === 0 ? <div style={{ opacity: 0.7 }}>Nenhum item ainda.</div> : null}
        </Box>
      </Paper>
    </Box>
  );
}

