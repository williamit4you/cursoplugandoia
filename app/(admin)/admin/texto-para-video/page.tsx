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

type UiStage =
  | "idle"
  | "creating"
  | "generating_audio"
  | "audio_done"
  | "generating_video"
  | "ready"
  | "failed";

function statusLabel(status: string) {
  if (status === "DRAFT") return "Pronto para gerar";
  if (status === "GENERATING_AUDIO") return "Gerando áudio";
  if (status === "AUDIO_READY") return "Áudio pronto";
  if (status === "GENERATING_VIDEO") return "Gerando vídeo";
  if (status === "READY") return "Vídeo pronto";
  if (status === "FAILED") return "Falhou";
  return status;
}

function stageLabel(stage: UiStage) {
  if (stage === "idle") return "Aguardando";
  if (stage === "creating") return "Criando item";
  if (stage === "generating_audio") return "Chamando API de áudio";
  if (stage === "audio_done") return "Áudio concluído";
  if (stage === "generating_video") return "Chamando API de vídeo";
  if (stage === "ready") return "Vídeo pronto";
  if (stage === "failed") return "Falhou";
  return stage;
}

function isRunningStatus(status: string) {
  return status === "GENERATING_AUDIO" || status === "GENERATING_VIDEO";
}

export default function TextoParaVideoPage() {
  const [narrationText, setNarrationText] = useState("");
  const [selectedCreatorImageUrl, setSelectedCreatorImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageSeverity, setMessageSeverity] = useState<"success" | "info" | "warning" | "error">("info");
  const [current, setCurrent] = useState<SimpleCreatorVideo | null>(null);
  const [recent, setRecent] = useState<SimpleCreatorVideo[]>([]);
  const [assets, setAssets] = useState<CreatorAsset[]>([]);
  const [uiStage, setUiStage] = useState<UiStage>("idle");
  const [progressNotes, setProgressNotes] = useState<string[]>([]);

  const canCreate = narrationText.trim().length > 0 && !loading;

  const addProgressNote = (note: string) => {
    setProgressNotes((prev) => {
      const timestamp = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      return [`${timestamp} - ${note}`, ...prev].slice(0, 12);
    });
  };

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
    if (res.ok) {
      setCurrent(data.item || null);
      return data.item as SimpleCreatorVideo;
    }
    return null;
  };

  useEffect(() => {
    loadInitial();
  }, []);

  useEffect(() => {
    if (!current?.id || !isRunningStatus(current.status)) return;

    const timer = window.setInterval(() => {
      refreshCurrent(current.id).catch(() => null);
    }, 2000);

    return () => window.clearInterval(timer);
  }, [current?.id, current?.status]);

  useEffect(() => {
    if (!current) return;
    if (current.status === "GENERATING_AUDIO") setUiStage("generating_audio");
    if (current.status === "AUDIO_READY") setUiStage((prev) => (prev === "generating_video" || prev === "ready" ? prev : "audio_done"));
    if (current.status === "GENERATING_VIDEO") setUiStage("generating_video");
    if (current.status === "READY") setUiStage("ready");
    if (current.status === "FAILED") setUiStage("failed");
  }, [current]);

  const currentStatusLabel = useMemo(() => {
    if (!current) return "";
    return statusLabel(current.status);
  }, [current]);

  const create = async () => {
    if (!canCreate) return;
    setLoading(true);
    setMessage(null);
    setUiStage("creating");
    setProgressNotes([]);
    addProgressNote("Criando o item de vídeo no sistema.");

    let createdItem: SimpleCreatorVideo | null = null;

    try {
      const createRes = await fetch("/api/texto-para-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          narrationText,
          creatorImageUrl: selectedCreatorImageUrl || null,
          autoGenerate: false,
        }),
      });
      const createData = await createRes.json().catch(() => ({}));
      if (!createRes.ok) throw new Error(createData?.error || "Falha ao criar item");

      createdItem = createData.item as SimpleCreatorVideo;
      setCurrent(createdItem);
      setNarrationText("");
      setUiStage("generating_audio");
      addProgressNote(`Item criado com ID ${createdItem.id}.`);
      addProgressNote("Chamando a API de áudio com a voz configurada.");
      setMessageSeverity("info");
      setMessage("Item criado. Agora estamos gerando o áudio.");

      const audioRes = await fetch(`/api/texto-para-video/${createdItem.id}/gerar-audio`, { method: "POST" });
      const audioData = await audioRes.json().catch(() => ({}));
      if (!audioRes.ok) throw new Error(audioData?.error || "Falha ao gerar áudio");

      const afterAudio = await refreshCurrent(createdItem.id);
      setUiStage("audio_done");
      addProgressNote("Áudio concluído com sucesso.");
      setMessageSeverity("info");
      setMessage("Áudio pronto. Agora estamos gerando o vídeo.");

      setUiStage("generating_video");
      addProgressNote("Chamando a API de vídeo com a foto do criador e o áudio gerado.");

      const videoRes = await fetch(`/api/texto-para-video/${createdItem.id}/gerar-video`, { method: "POST" });
      const videoData = await videoRes.json().catch(() => ({}));
      if (!videoRes.ok) throw new Error(videoData?.error || "Falha ao gerar vídeo");

      const finalItem = await refreshCurrent(createdItem.id);
      loadInitial();
      setUiStage("ready");
      addProgressNote("Vídeo concluído e salvo. Os links finais estão logo abaixo.");
      setMessageSeverity("success");
      setMessage("Vídeo pronto. Você pode abrir ou baixar o MP4 na seção de resultado.");
      if (!finalItem && afterAudio) setCurrent(afterAudio);
    } catch (error: any) {
      if (createdItem?.id) {
        await refreshCurrent(createdItem.id).catch(() => null);
      }
      setUiStage("failed");
      addProgressNote(`Fluxo interrompido: ${error?.message || "erro desconhecido"}`);
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
    setUiStage("generating_audio");
    addProgressNote("Regenerando o áudio manualmente.");
    try {
      const res = await fetch(`/api/texto-para-video/${current.id}/gerar-audio`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Falha ao gerar áudio");
      await refreshCurrent(current.id);
      loadInitial();
      setUiStage("audio_done");
      addProgressNote("Áudio regenerado com sucesso.");
      setMessageSeverity("success");
      setMessage("Áudio regenerado com sucesso.");
    } catch (error: any) {
      setUiStage("failed");
      setMessageSeverity("error");
      setMessage(error?.message || "Falha ao gerar áudio");
      await refreshCurrent(current.id);
    } finally {
      setLoading(false);
    }
  };

  const gerarVideo = async () => {
    if (!current || loading) return;
    setLoading(true);
    setMessage(null);
    setUiStage("generating_video");
    addProgressNote("Regenerando o vídeo manualmente.");
    try {
      const res = await fetch(`/api/texto-para-video/${current.id}/gerar-video`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Falha ao gerar vídeo");
      await refreshCurrent(current.id);
      loadInitial();
      setUiStage("ready");
      addProgressNote("Vídeo regenerado com sucesso.");
      setMessageSeverity("success");
      setMessage("Vídeo regenerado com sucesso.");
    } catch (error: any) {
      setUiStage("failed");
      setMessageSeverity("error");
      setMessage(error?.message || "Falha ao gerar vídeo");
      await refreshCurrent(current.id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          Texto para Vídeo
        </Typography>
        <Typography sx={{ opacity: 0.8, mt: 1 }}>
          Escreva o texto e acompanhe o fluxo completo: criação do item, geração do áudio, geração do vídeo e links finais.
        </Typography>
      </Box>

      {message ? <Alert severity={messageSeverity}>{message}</Alert> : null}

      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 2 }}>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 8" } }}>
            <TextField
              label="Texto para narração"
              value={narrationText}
              onChange={(event) => setNarrationText(event.target.value)}
              multiline
              rows={8}
              fullWidth
              placeholder="Digite o roteiro do vídeo..."
            />
          </Box>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
            <TextField
              select
              label="Imagem do criador"
              value={selectedCreatorImageUrl}
              onChange={(event) => setSelectedCreatorImageUrl(event.target.value)}
              fullWidth
              helperText="Se vazio, usa a imagem padrão da configuração."
            >
              <MenuItem value="">Usar imagem padrão da configuração</MenuItem>
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
                {loading ? "Processando..." : "Gerar vídeo pronto"}
              </button>
            </Box>

            <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, border: "1px solid rgba(0,0,0,0.08)", background: "rgba(255,255,255,0.55)" }}>
              <div style={{ fontWeight: 900 }}>Etapa atual: {stageLabel(uiStage)}</div>
              <div style={{ marginTop: 6, opacity: 0.78, fontSize: 13 }}>
                Status do backend: {current ? currentStatusLabel : "Nenhum item selecionado"}
              </div>
              <div style={{ marginTop: 6, opacity: 0.78, fontSize: 13 }}>
                {current?.id ? `ID atual: ${current.id}` : "O ID aparecerá aqui assim que o item for criado."}
              </div>
            </Box>
          </Box>
        </Box>
      </Paper>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.2fr 0.8fr" }, gap: 2 }}>
        <Paper sx={{ p: 2 }}>
          <Typography sx={{ fontWeight: 900, mb: 1 }}>Acompanhar geração</Typography>
          <Box sx={{ display: "grid", gap: 1 }}>
            <div style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)", background: "white" }}>
              <div style={{ fontWeight: 900 }}>1. Criar item</div>
              <div style={{ marginTop: 4, opacity: 0.78 }}>
                {current ? "Item criado e identificado." : uiStage === "creating" ? "Criando agora..." : "Ainda não iniciado."}
              </div>
            </div>
            <div style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)", background: "white" }}>
              <div style={{ fontWeight: 900 }}>2. Gerar áudio</div>
              <div style={{ marginTop: 4, opacity: 0.78 }}>
                {current?.status === "AUDIO_READY" || current?.status === "GENERATING_VIDEO" || current?.status === "READY"
                  ? "Áudio já foi gerado."
                  : current?.status === "GENERATING_AUDIO"
                    ? "Chamando a API de áudio e aguardando retorno."
                    : "Aguardando."}
              </div>
            </div>
            <div style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)", background: "white" }}>
              <div style={{ fontWeight: 900 }}>3. Gerar vídeo</div>
              <div style={{ marginTop: 4, opacity: 0.78 }}>
                {current?.status === "READY"
                  ? "Vídeo finalizado."
                  : current?.status === "GENERATING_VIDEO"
                    ? "Chamando a API de vídeo e aguardando renderização."
                    : "Aguardando."}
              </div>
            </div>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography sx={{ fontWeight: 900, mb: 1 }}>Log desta execução</Typography>
            <Box sx={{ display: "grid", gap: 1 }}>
              {progressNotes.length === 0 ? (
                <div style={{ opacity: 0.7 }}>Os eventos desta execução aparecerão aqui.</div>
              ) : (
                progressNotes.map((note) => (
                  <div
                    key={note}
                    style={{ padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.08)", background: "white", fontSize: 13 }}
                  >
                    {note}
                  </div>
                ))
              )}
            </Box>
          </Box>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography sx={{ fontWeight: 900, mb: 1 }}>Resultado</Typography>
          {!current ? (
            <div style={{ opacity: 0.7 }}>O vídeo, o áudio e as legendas aparecerão aqui depois que o item for criado.</div>
          ) : (
            <Box sx={{ display: "grid", gap: 1.5 }}>
              <div style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)", background: "white" }}>
                <div style={{ fontWeight: 900 }}>Status</div>
                <div style={{ marginTop: 4, opacity: 0.8 }}>{currentStatusLabel}</div>
                {current.errorMessage ? <div style={{ marginTop: 8, color: "#b91c1c" }}>{current.errorMessage}</div> : null}
              </div>

              <div style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)", background: "white" }}>
                <div style={{ fontWeight: 900 }}>Onde o vídeo vai aparecer</div>
                <div style={{ marginTop: 4, opacity: 0.8 }}>
                  Quando o status virar "Vídeo pronto", os links para abrir e baixar o MP4 ficam nesta mesma seção.
                </div>
              </div>

              {current.audioUrl ? (
                <a href={current.audioUrl} target="_blank" rel="noreferrer" style={{ padding: "10px 12px", borderRadius: 10, background: "white" }}>
                  Abrir áudio gerado
                </a>
              ) : null}

              {current.videoUrl ? (
                <a href={current.videoUrl} target="_blank" rel="noreferrer" style={{ padding: "10px 12px", borderRadius: 10, background: "white" }}>
                  Abrir vídeo pronto
                </a>
              ) : null}

              {current.videoUrl ? (
                <a href={current.videoUrl} download style={{ padding: "10px 12px", borderRadius: 10, background: "white" }}>
                  Baixar MP4
                </a>
              ) : null}

              {current.captionsUrl ? (
                <a href={current.captionsUrl} target="_blank" rel="noreferrer" style={{ padding: "10px 12px", borderRadius: 10, background: "white" }}>
                  Abrir legendas (VTT)
                </a>
              ) : null}

              <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                <button onClick={gerarAudio} disabled={!current || loading} style={{ padding: "10px 14px", borderRadius: 10, fontWeight: 900 }}>
                  Regenerar áudio
                </button>
                <button onClick={gerarVideo} disabled={!current?.audioUrl || loading} style={{ padding: "10px 14px", borderRadius: 10, fontWeight: 900 }}>
                  Regenerar vídeo
                </button>
              </Box>
            </Box>
          )}
        </Paper>
      </Box>

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
