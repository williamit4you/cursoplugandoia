"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Alert, Box, Chip, LinearProgress, MenuItem, Paper, TextField, Typography } from "@mui/material";

type MixedAssetDraft = {
  file: File;
  label: string;
  kind: "IMAGE" | "VIDEO";
};

type MixedCreatorVideoAsset = {
  id: string;
  url: string;
  kind: string;
  originalName: string | null;
  userLabel: string | null;
  autoLabel: string | null;
  sortOrder: number;
};

type MixedCreatorVideo = {
  id: string;
  narrationText: string;
  voiceRefUrl: string | null;
  audioUrl: string | null;
  finalVideoUrl: string | null;
  captionsUrl: string | null;
  status: string;
  aspectRatio: string;
  audioLanguage: string;
  speechRate: number;
  assetPlanJson: string;
  renderSpecJson: string;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  assets: MixedCreatorVideoAsset[];
};

type CreatorConfig = {
  defaults: {
    voiceRefUrl: string | null;
  };
};

type StepStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

function formatDurationSeconds(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes === 0) return `${remainingSeconds}s`;
  return `${minutes}m ${String(remainingSeconds).padStart(2, "0")}s`;
}

function statusLabel(status: string) {
  if (status === "DRAFT") return "Pendente";
  if (status === "PLANNING_VISUALS") return "Planejando visuais";
  if (status === "GENERATING_AUDIO") return "Gerando audio";
  if (status === "COMPOSING_VIDEO") return "Compondo video final";
  if (status === "READY") return "Video pronto";
  if (status === "FAILED") return "Falhou";
  return status;
}

function chipColor(status: StepStatus): "default" | "warning" | "success" | "error" {
  if (status === "PROCESSING") return "warning";
  if (status === "COMPLETED") return "success";
  if (status === "FAILED") return "error";
  return "default";
}

function buildSteps(current: MixedCreatorVideo | null) {
  const failed = current?.status === "FAILED";
  const hasPlan = Boolean(current?.assetPlanJson && current.assetPlanJson !== "{}");
  const hasAudio = Boolean(current?.audioUrl);
  const isReady = current?.status === "READY";

  const steps = [
    {
      id: "draft",
      title: "Preparar uploads",
      status: current ? "COMPLETED" : "PENDING",
      eta: "alguns segundos",
    },
    {
      id: "plan",
      title: "Planejar visuais com IA",
      status: failed && !hasPlan ? "FAILED" : current?.status === "PLANNING_VISUALS" ? "PROCESSING" : hasPlan || hasAudio || isReady ? "COMPLETED" : "PENDING",
      eta: "30s a 2m",
    },
    {
      id: "audio",
      title: "Gerar audio",
      status: failed && !hasAudio ? "FAILED" : current?.status === "GENERATING_AUDIO" ? "PROCESSING" : hasAudio || isReady ? "COMPLETED" : "PENDING",
      eta: "2m a 10m",
    },
    {
      id: "compose",
      title: "Compor video final",
      status: failed && hasAudio && !isReady ? "FAILED" : current?.status === "COMPOSING_VIDEO" ? "PROCESSING" : isReady ? "COMPLETED" : "PENDING",
      eta: "2m a 12m",
    },
  ] as Array<{ id: string; title: string; status: StepStatus; eta: string }>;

  return steps;
}

export function MixedCreatorVideoTab() {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<CreatorConfig | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageSeverity, setMessageSeverity] = useState<"success" | "info" | "warning" | "error">("info");
  const [current, setCurrent] = useState<MixedCreatorVideo | null>(null);
  const [recent, setRecent] = useState<MixedCreatorVideo[]>([]);
  const [progressNotes, setProgressNotes] = useState<string[]>([]);
  const [narrationText, setNarrationText] = useState("");
  const [aspectRatio, setAspectRatio] = useState<"PORTRAIT_9_16" | "LANDSCAPE_16_9">("PORTRAIT_9_16");
  const [audioLanguage, setAudioLanguage] = useState<"Portuguese" | "English">("Portuguese");
  const [speechRate, setSpeechRate] = useState(1);
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [assetDrafts, setAssetDrafts] = useState<MixedAssetDraft[]>([]);

  const canCreate = narrationText.trim().length > 0 && assetDrafts.length > 0 && !loading;

  const addProgressNote = (note: string) => {
    const stamp = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setProgressNotes((prev) => [`${stamp} - ${note}`, ...prev].slice(0, 20));
  };

  const loadInitial = async () => {
    try {
      const [recentRes, configRes] = await Promise.all([
        fetch("/api/texto-para-video?mode=mixed", { cache: "no-store" }),
        fetch("/api/texto-para-video?view=config", { cache: "no-store" }),
      ]);
      const recentData = await recentRes.json().catch(() => ({}));
      const configData = await configRes.json().catch(() => ({}));
      if (recentRes.ok) setRecent(recentData.items || []);
      if (configRes.ok) setConfig(configData);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadInitial();
  }, []);

  const refreshCurrent = async (id: string) => {
    const res = await fetch(`/api/texto-para-video/${id}?mode=mixed`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setCurrent(data.item || null);
      return data.item as MixedCreatorVideo;
    }
    return null;
  };

  const handleSupportFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const drafts = files.map((file) => ({
      file,
      label: "",
      kind: file.type.startsWith("video/") ? "VIDEO" as const : "IMAGE" as const,
    }));
    setAssetDrafts(drafts);
  };

  const uploadFileToMinio = async (file: File, kind: string) => {
    addProgressNote(`Enviando ${kind} para o MinIO.`);
    const data = new FormData();
    data.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: data });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok || !payload?.url) throw new Error(payload?.error || `Falha ao enviar ${kind}`);
    return String(payload.url);
  };

  const runAction = async (id: string, action: string, note: string) => {
    addProgressNote(note);
    const res = await fetch(`/api/texto-para-video/${id}?mode=mixed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `Falha na etapa ${action}`);
    if (data?.item) setCurrent(data.item);
    return data.item as MixedCreatorVideo;
  };

  const create = async () => {
    if (!canCreate) return;
    setLoading(true);
    setMessage(null);
    setProgressNotes([]);

    try {
      const voiceRefUrl = voiceFile ? await uploadFileToMinio(voiceFile, "audio de referencia") : null;
      const uploadedAssets = [];
      for (const draft of assetDrafts) {
        const url = await uploadFileToMinio(draft.file, draft.kind === "VIDEO" ? "video de apoio" : "imagem de apoio");
        uploadedAssets.push({
          url,
          kind: draft.kind,
          originalName: draft.file.name,
          userLabel: draft.label.trim() || null,
        });
      }

      addProgressNote("Criando o item do video com imagens.");
      const createRes = await fetch("/api/texto-para-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "mixed",
          narrationText,
          voiceRefUrl,
          audioLanguage,
          speechRate,
          aspectRatio,
          assets: uploadedAssets,
        }),
      });
      const createData = await createRes.json().catch(() => ({}));
      if (!createRes.ok) throw new Error(createData?.error || "Falha ao criar o item");

      let item = createData.item as MixedCreatorVideo;
      setCurrent(item);
      setRecent((prev) => [item, ...prev.filter((entry) => entry.id !== item.id)].slice(0, 20));

      item = (await runAction(item.id, "plan", "A IA esta planejando quando cada imagem/video entra.")) || item;
      item = (await runAction(item.id, "generate_audio", "Gerando o audio da narracao.")) || item;
      item = (await runAction(item.id, "compose", "Compondo o video final com apoio visual.")) || item;

      await refreshCurrent(item.id);
      await loadInitial();
      setMessageSeverity("success");
      setMessage("Video com imagens pronto. Os links finais ja estao disponiveis.");
      setNarrationText("");
      setAssetDrafts([]);
      setVoiceFile(null);
    } catch (error: any) {
      setMessageSeverity("error");
      setMessage(error?.message || "Falha ao gerar o video com imagens.");
      addProgressNote(`Execucao interrompida: ${error?.message || "erro desconhecido"}`);
      if (current?.id) await refreshCurrent(current.id).catch(() => null);
    } finally {
      setLoading(false);
    }
  };

  const steps = useMemo(() => buildSteps(current), [current]);
  const progressPercent = Math.round((steps.filter((step) => step.status === "COMPLETED").length / steps.length) * 100);
  const elapsedTime = useMemo(() => {
    if (!current?.startedAt) return null;
    const start = new Date(current.startedAt).getTime();
    const end = current.completedAt ? new Date(current.completedAt).getTime() : Date.now();
    return formatDurationSeconds((end - start) / 1000);
  }, [current?.startedAt, current?.completedAt, current?.updatedAt]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {message ? <Alert severity={messageSeverity}>{message}</Alert> : null}

      <Paper sx={{ p: 2 }}>
        <Typography sx={{ fontWeight: 900, mb: 1 }}>Texto para Video com Imagens</Typography>
        <Typography sx={{ fontSize: 13, opacity: 0.74, mb: 2 }}>
          MVP focado em VSL narrada com imagens e videos do usuario. Aqui nao usamos avatar: a narracao conduz a VSL e os assets entram na timeline.
        </Typography>

        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 2 }}>
          <Box sx={{ gridColumn: { xs: "span 12", lg: "span 7" } }}>
            <TextField
              label="Texto manual"
              value={narrationText}
              onChange={(event) => setNarrationText(event.target.value)}
              fullWidth
              multiline
              rows={10}
              placeholder="Digite o texto completo que a pessoa vai falar..."
            />
          </Box>

          <Box sx={{ gridColumn: { xs: "span 12", lg: "span 5" }, display: "grid", gap: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, border: "1px solid rgba(15,23,42,0.08)" }}>
              <Typography sx={{ fontWeight: 900 }}>Audio de referencia opcional</Typography>
              <Typography sx={{ fontSize: 13, opacity: 0.7, mt: 0.5 }}>
                {voiceFile ? "Upload manual de audio" : config?.defaults.voiceRefUrl ? "Se vazio, usa o audio da Shopee" : "Nenhum audio default encontrado"}
              </Typography>
              <input style={{ marginTop: 12 }} type="file" accept="audio/*" onChange={(event) => setVoiceFile(event.target.files?.[0] || null)} />
            </Box>

            <TextField
              select
              label="Formato"
              value={aspectRatio}
              onChange={(event) => setAspectRatio(event.target.value as "PORTRAIT_9_16" | "LANDSCAPE_16_9")}
              fullWidth
              helperText="Horizontal e o formato recomendado para VSL em landing page."
            >
              <MenuItem value="PORTRAIT_9_16">Vertical 9:16</MenuItem>
              <MenuItem value="LANDSCAPE_16_9">Horizontal 16:9</MenuItem>
            </TextField>

            <TextField select label="Idioma" value={audioLanguage} onChange={(event) => setAudioLanguage(event.target.value as "Portuguese" | "English")} fullWidth>
              <MenuItem value="Portuguese">Portugues</MenuItem>
              <MenuItem value="English">English</MenuItem>
            </TextField>

            <TextField select label="Velocidade da fala" value={String(speechRate)} onChange={(event) => setSpeechRate(Number(event.target.value))} fullWidth>
              <MenuItem value="0.9">Falar devagar</MenuItem>
              <MenuItem value="1">Normal</MenuItem>
              <MenuItem value="1.1">Falar rapido</MenuItem>
            </TextField>
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography sx={{ fontWeight: 900, mb: 1 }}>Uploads de apoio</Typography>
        <Typography sx={{ fontSize: 13, opacity: 0.72, mb: 2 }}>
          Envie imagens e videos que devem aparecer ao longo da fala. O nome do arquivo ajuda, mas a IA tambem tenta entender o conteudo. Para VSL longa, prefira assets organizados por blocos de oferta, prova e CTA.
        </Typography>
        <input type="file" accept="image/*,video/*" multiple onChange={handleSupportFilesChange} />
        <Box sx={{ display: "grid", gap: 1.5, mt: 2 }}>
          {assetDrafts.map((draft, index) => (
            <Box key={`${draft.file.name}-${index}`} sx={{ p: 1.5, borderRadius: 2, border: "1px solid rgba(15,23,42,0.08)" }}>
              <Typography sx={{ fontWeight: 900, fontSize: 13 }}>
                {draft.kind === "VIDEO" ? "Video" : "Imagem"}: {draft.file.name}
              </Typography>
              <TextField
                label="Descricao opcional"
                value={draft.label}
                onChange={(event) =>
                  setAssetDrafts((prev) =>
                    prev.map((item, itemIndex) => (itemIndex === index ? { ...item, label: event.target.value } : item))
                  )
                }
                fullWidth
                size="small"
                sx={{ mt: 1.2 }}
                helperText="Se voce quiser, descreva o que esta na midia. Se deixar vazio, a IA tenta inferir."
              />
            </Box>
          ))}
          {assetDrafts.length === 0 ? <Typography sx={{ opacity: 0.7 }}>Nenhum asset selecionado ainda.</Typography> : null}
        </Box>

        <Box sx={{ mt: 2 }}>
          <button
            onClick={create}
            disabled={!canCreate}
            style={{ padding: "12px 16px", borderRadius: 10, fontWeight: 900, background: "#111827", color: "#fff" }}
          >
            {loading ? "Processando..." : "Planejar e gerar video"}
          </button>
        </Box>
      </Paper>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.2fr 0.8fr" }, gap: 2 }}>
        <Paper sx={{ p: 2 }}>
          <Typography sx={{ fontWeight: 900, mb: 1 }}>Status completo</Typography>
          <Typography sx={{ fontSize: 13, opacity: 0.75 }}>
            {current ? `Status atual: ${statusLabel(current.status)}` : "Nenhuma execucao iniciada ainda."}
          </Typography>
          <Box sx={{ mt: 2 }}>
            <LinearProgress variant="determinate" value={progressPercent} sx={{ height: 10, borderRadius: 999 }} />
            <Typography sx={{ mt: 1, fontSize: 13, opacity: 0.75 }}>
              {progressPercent}% concluido{elapsedTime ? ` - tempo decorrido: ${elapsedTime}` : ""}
            </Typography>
          </Box>

          <Box sx={{ display: "grid", gap: 1.5, mt: 2 }}>
            {steps.map((step) => (
              <Box key={step.id} sx={{ p: 1.5, borderRadius: 2, border: "1px solid rgba(15,23,42,0.08)" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "center" }}>
                  <Typography sx={{ fontWeight: 900 }}>{step.title}</Typography>
                  <Chip size="small" label={step.status} color={chipColor(step.status)} />
                </Box>
                <Typography sx={{ mt: 0.6, fontSize: 12, opacity: 0.62 }}>Tempo esperado: {step.eta}</Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography sx={{ fontWeight: 900, mb: 1 }}>Log desta execucao</Typography>
            <Box sx={{ display: "grid", gap: 1 }}>
              {progressNotes.length === 0 ? (
                <Typography sx={{ opacity: 0.7 }}>Os passos aparecem aqui conforme o processo roda.</Typography>
              ) : (
                progressNotes.map((note) => (
                  <Box key={note} sx={{ p: 1.2, borderRadius: 2, border: "1px solid rgba(15,23,42,0.08)", fontSize: 13 }}>
                    {note}
                  </Box>
                ))
              )}
            </Box>
          </Box>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography sx={{ fontWeight: 900, mb: 1 }}>Resultado</Typography>
          {!current ? (
            <Typography sx={{ opacity: 0.72 }}>O video final, o audio e as legendas aparecerao aqui assim que a primeira execucao terminar.</Typography>
          ) : (
            <Box sx={{ display: "grid", gap: 1.5 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, border: "1px solid rgba(15,23,42,0.08)" }}>
                <Typography sx={{ fontWeight: 900 }}>Resumo</Typography>
                <Typography sx={{ mt: 0.8, fontSize: 13, opacity: 0.78 }}>ID: {current.id}</Typography>
                <Typography sx={{ mt: 0.4, fontSize: 13, opacity: 0.78 }}>Status: {statusLabel(current.status)}</Typography>
                <Typography sx={{ mt: 0.4, fontSize: 13, opacity: 0.78 }}>Assets: {current.assets?.length || 0}</Typography>
                <Typography sx={{ mt: 0.4, fontSize: 13, opacity: 0.78 }}>Formato: {current.aspectRatio === "LANDSCAPE_16_9" ? "Horizontal 16:9" : "Vertical 9:16"}</Typography>
                {current.errorMessage ? <Typography sx={{ mt: 1, color: "#b91c1c" }}>{current.errorMessage}</Typography> : null}
              </Box>

              {current.audioUrl ? <a href={current.audioUrl} target="_blank" rel="noreferrer" style={{ padding: "12px", borderRadius: 10, background: "#fff" }}>Abrir audio</a> : null}
              {current.finalVideoUrl ? <a href={current.finalVideoUrl} target="_blank" rel="noreferrer" style={{ padding: "12px", borderRadius: 10, background: "#fff" }}>Abrir video final</a> : null}
              {current.captionsUrl ? <a href={current.captionsUrl} target="_blank" rel="noreferrer" style={{ padding: "12px", borderRadius: 10, background: "#fff" }}>Abrir legendas</a> : null}
            </Box>
          )}
        </Paper>
      </Box>

      <Paper sx={{ p: 2 }}>
        <Typography sx={{ fontWeight: 900, mb: 1 }}>Recentes desta aba</Typography>
        <Box sx={{ display: "grid", gap: 1 }}>
          {recent.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrent(item)}
              style={{
                textAlign: "left",
                padding: 12,
                borderRadius: 12,
                border: "1px solid rgba(15,23,42,0.08)",
                background: "white",
                cursor: "pointer",
              }}
            >
              <div style={{ fontWeight: 900 }}>{statusLabel(item.status)}</div>
              <div style={{ opacity: 0.7, fontSize: 12, fontFamily: "monospace", marginTop: 4 }}>{item.id}</div>
              <div style={{ opacity: 0.8, marginTop: 8 }}>
                {item.narrationText.slice(0, 180)}
                {item.narrationText.length > 180 ? "..." : ""}
              </div>
            </button>
          ))}
          {recent.length === 0 ? <Typography sx={{ opacity: 0.7 }}>Nenhuma execucao ainda.</Typography> : null}
        </Box>
      </Paper>
    </Box>
  );
}
