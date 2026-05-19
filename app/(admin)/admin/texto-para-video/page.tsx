"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Box, MenuItem, Paper, TextField, Typography } from "@mui/material";

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

type CreatorAsset = {
  id: string;
  url: string;
  label: string | null;
  active: boolean;
};

function statusLabel(status: string) {
  if (status === "DRAFT") return "Pronto para gerar";
  if (status === "GENERATING_AUDIO") return "Gerando audio";
  if (status === "AUDIO_READY") return "Audio pronto";
  if (status === "GENERATING_VIDEO") return "Gerando video";
  if (status === "READY") return "Video pronto";
  if (status === "FAILED") return "Falhou";
  return status;
}

export default function TextoParaVideoPage() {
  const [narrationText, setNarrationText] = useState("");
  const [selectedCreatorImageUrl, setSelectedCreatorImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageSeverity, setMessageSeverity] = useState<"success" | "warning" | "error">("error");
  const [current, setCurrent] = useState<SimpleCreatorVideo | null>(null);
  const [recent, setRecent] = useState<SimpleCreatorVideo[]>([]);
  const [assets, setAssets] = useState<CreatorAsset[]>([]);

  const canCreate = narrationText.trim().length > 0 && !loading;

  const loadInitial = async () => {
    try {
      const [recentRes, assetsRes] = await Promise.all([
        fetch("/api/texto-para-video", { cache: "no-store" }),
        fetch("/api/creator-assets?active=true", { cache: "no-store" }),
      ]);
      const recentData = await recentRes.json().catch(() => ({}));
      const assetsData = await assetsRes.json().catch(() => ({}));
      if (recentRes.ok) setRecent(recentData.items || []);
      if (assetsRes.ok) setAssets(assetsData.items || []);
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
    loadInitial();
  }, []);

  const currentStatusLabel = useMemo(() => {
    if (!current) return "";
    return statusLabel(current.status);
  }, [current]);

  const create = async () => {
    if (!canCreate) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/texto-para-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          narrationText,
          creatorImageUrl: selectedCreatorImageUrl || null,
          autoGenerate: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Falha ao gerar");
      setCurrent(data.item);
      setNarrationText("");
      setMessageSeverity("success");
      setMessage("Video gerado com sucesso.");
      loadInitial();
    } catch (error: any) {
      setMessageSeverity("error");
      setMessage(error?.message || "Falha ao gerar");
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
      if (!res.ok) throw new Error(data?.error || "Falha ao gerar audio");
      await refreshCurrent(current.id);
      loadInitial();
      setMessageSeverity("success");
      setMessage("Audio regenerado com sucesso.");
    } catch (error: any) {
      setMessageSeverity("error");
      setMessage(error?.message || "Falha ao gerar audio");
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
      if (!res.ok) throw new Error(data?.error || "Falha ao gerar video");
      await refreshCurrent(current.id);
      loadInitial();
      setMessageSeverity("success");
      setMessage("Video regenerado com sucesso.");
    } catch (error: any) {
      setMessageSeverity("error");
      setMessage(error?.message || "Falha ao gerar video");
      await refreshCurrent(current.id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          Texto para Video
        </Typography>
        <Typography sx={{ opacity: 0.8, mt: 1 }}>
          Escreva o texto e gere o video pronto com sua voz clonada e sua foto falando. Se voce nao escolher uma imagem,
          o sistema usa a configuracao padrao do pipeline.
        </Typography>
      </Box>

      {message ? <Alert severity={messageSeverity}>{message}</Alert> : null}

      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 2 }}>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 8" } }}>
            <TextField
              label="Texto para narracao"
              value={narrationText}
              onChange={(event) => setNarrationText(event.target.value)}
              multiline
              rows={8}
              fullWidth
              placeholder="Digite o roteiro do video..."
            />
          </Box>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
            <TextField
              select
              label="Imagem do criador"
              value={selectedCreatorImageUrl}
              onChange={(event) => setSelectedCreatorImageUrl(event.target.value)}
              fullWidth
              helperText="Se vazio, usa a imagem padrao da configuracao."
            >
              <MenuItem value="">Usar imagem padrao da configuracao</MenuItem>
              {assets.map((asset) => (
                <MenuItem key={asset.id} value={asset.url}>
                  {asset.label ? `${asset.label} - ${asset.url}` : asset.url}
                </MenuItem>
              ))}
            </TextField>

            <Box sx={{ display: "flex", gap: 1.5, mt: 2, flexWrap: "wrap" }}>
              <button
                onClick={create}
                disabled={!canCreate}
                style={{ padding: "10px 14px", borderRadius: 10, fontWeight: 900, background: "#111827", color: "white" }}
              >
                {loading ? "Gerando..." : "Gerar video pronto"}
              </button>
            </Box>

            {current ? (
              <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, border: "1px solid rgba(0,0,0,0.08)", background: "rgba(255,255,255,0.5)" }}>
                <div style={{ fontWeight: 900 }}>Status: {currentStatusLabel}</div>
                {current.errorMessage ? <div style={{ marginTop: 6, color: "#b91c1c" }}>{current.errorMessage}</div> : null}

                {current.audioUrl ? (
                  <div style={{ marginTop: 10 }}>
                    <a href={current.audioUrl} target="_blank" rel="noreferrer">
                      Abrir audio
                    </a>
                  </div>
                ) : null}

                {current.videoUrl ? (
                  <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                    <a href={current.videoUrl} target="_blank" rel="noreferrer">
                      Abrir video
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

                <Box sx={{ display: "flex", gap: 1.5, mt: 2, flexWrap: "wrap" }}>
                  <button onClick={gerarAudio} disabled={loading} style={{ padding: "10px 14px", borderRadius: 10, fontWeight: 900 }}>
                    Regenerar audio
                  </button>
                  <button
                    onClick={gerarVideo}
                    disabled={!current.audioUrl || loading}
                    style={{ padding: "10px 14px", borderRadius: 10, fontWeight: 900 }}
                  >
                    Regenerar video
                  </button>
                </Box>
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
              <div style={{ fontWeight: 900 }}>{statusLabel(item.status)}</div>
              <div style={{ opacity: 0.75, fontSize: 12, fontFamily: "monospace" }}>{item.id}</div>
              <div style={{ marginTop: 6, opacity: 0.85 }}>
                {item.narrationText.slice(0, 140)}
                {item.narrationText.length > 140 ? "..." : ""}
              </div>
            </button>
          ))}
          {recent.length === 0 ? <div style={{ opacity: 0.7 }}>Nenhum item ainda.</div> : null}
        </Box>
      </Paper>
    </Box>
  );
}
