"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  LinearProgress,
  MenuItem,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { MixedCreatorVideoTab } from "@/components/MixedCreatorVideoTab";

type SimpleCreatorVideo = {
  id: string;
  narrationText: string;
  creatorImageUrl: string;
  voiceRefUrl: string | null;
  audioUrl: string | null;
  videoUrl: string | null;
  captionsUrl: string | null;
  status: string;
  audioLanguage: string;
  speechRate: number;
  formatPreset: string;
  videoWidth: number;
  videoHeight: number;
  videoFps: number;
  audioPromptId: string | null;
  videoPromptId: string | null;
  startedAt: string | null;
  audioStartedAt: string | null;
  audioCompletedAt: string | null;
  videoStartedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

type CreatorConfig = {
  defaults: {
    creatorImageUrl: string | null;
    voiceRefUrl: string | null;
  };
  audioSettings: {
    language: "Portuguese" | "English";
    speechRate: number;
    maxNewTokens: number;
    topP: number;
    topK: number;
    temperature: number;
    repetitionPenalty: number;
    quality: "V0" | "V2" | "320k";
  };
  renderSettings: {
    formatPreset: "TIKTOK" | "INSTAGRAM_REEL";
    width: number;
    height: number;
    fps: number;
    steps: number;
    cfg: number;
    shift: number;
    crf: number;
  };
  formatPresets: Array<{ value: "TIKTOK" | "INSTAGRAM_REEL"; label: string; width: number; height: number }>;
  comfyObservedParams: {
    audio: { adjustableFields: string[] };
    video: { adjustableFields: string[] };
    expectedDurations: { audioSeconds: [number, number]; videoSeconds: [number, number] };
  };
};

type ManualForm = {
  narrationText: string;
  audioLanguage: "Portuguese" | "English";
  speechRate: number;
  formatPreset: "TIKTOK" | "INSTAGRAM_REEL";
  maxNewTokens: number;
  topP: number;
  topK: number;
  temperature: number;
  repetitionPenalty: number;
  quality: "V0" | "V2" | "320k";
  videoWidth: number;
  videoHeight: number;
  videoFps: number;
  steps: number;
  cfg: number;
  shift: number;
  crf: number;
};

type StepStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

type StepItem = {
  id: string;
  title: string;
  description: string;
  status: StepStatus;
  eta: string;
};

function statusLabel(status: string) {
  if (status === "DRAFT") return "Pendente";
  if (status === "GENERATING_AUDIO") return "Gerando audio";
  if (status === "AUDIO_READY") return "Audio concluido";
  if (status === "GENERATING_VIDEO") return "Gerando video";
  if (status === "READY") return "Video pronto";
  if (status === "FAILED") return "Falhou";
  return status;
}

function stepChipColor(status: StepStatus): "default" | "warning" | "success" | "error" {
  if (status === "PROCESSING") return "warning";
  if (status === "COMPLETED") return "success";
  if (status === "FAILED") return "error";
  return "default";
}

function formatDurationSeconds(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes === 0) return `${remainingSeconds}s`;
  return `${minutes}m ${String(remainingSeconds).padStart(2, "0")}s`;
}

function uploadSourceLabel(customSelected: boolean, defaultValue: string | null, kind: string) {
  if (customSelected) return `Upload manual de ${kind}`;
  return defaultValue ? `Configuracao da Shopee (${kind})` : `Sem ${kind} configurado`;
}

function computeSteps(current: SimpleCreatorVideo | null, config: CreatorConfig | null): StepItem[] {
  const audioEta = config ? `${formatDurationSeconds(config.comfyObservedParams.expectedDurations.audioSeconds[0])} a ${formatDurationSeconds(config.comfyObservedParams.expectedDurations.audioSeconds[1])}` : "2 a 10 min";
  const videoEta = config ? `${formatDurationSeconds(config.comfyObservedParams.expectedDurations.videoSeconds[0])} a ${formatDurationSeconds(config.comfyObservedParams.expectedDurations.videoSeconds[1])}` : "10 a 60 min";

  const isFailed = current?.status === "FAILED";
  const isReady = current?.status === "READY";
  const hasAudio = Boolean(current?.audioUrl || current?.audioCompletedAt);

  return [
    {
      id: "draft",
      title: "Preparar entrada",
      description: "Texto, foto e audio de referencia sao validados e o item e criado.",
      status: current ? "COMPLETED" : "PENDING",
      eta: "alguns segundos",
    },
    {
      id: "audio",
      title: "Gerar audio",
      description: "O ComfyUI clona a voz de referencia e produz a narracao com os parametros escolhidos.",
      status: isFailed && !hasAudio ? "FAILED" : current?.status === "GENERATING_AUDIO" ? "PROCESSING" : hasAudio || isReady ? "COMPLETED" : "PENDING",
      eta: audioEta,
    },
    {
      id: "video",
      title: "Gerar video",
      description: "A foto e animada no workflow Infinite Talk e sai pronta em formato vertical.",
      status: isFailed && hasAudio && !isReady ? "FAILED" : current?.status === "GENERATING_VIDEO" ? "PROCESSING" : isReady ? "COMPLETED" : "PENDING",
      eta: videoEta,
    },
    {
      id: "final",
      title: "Entregar links",
      description: "A aplicacao publica o MP4, o audio e as legendas e atualiza o status final.",
      status: isFailed ? "FAILED" : isReady ? "COMPLETED" : current ? "PROCESSING" : "PENDING",
      eta: "automatico",
    },
  ];
}

export default function TextoParaVideoPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageSeverity, setMessageSeverity] = useState<"success" | "info" | "warning" | "error">("info");
  const [config, setConfig] = useState<CreatorConfig | null>(null);
  const [current, setCurrent] = useState<SimpleCreatorVideo | null>(null);
  const [recent, setRecent] = useState<SimpleCreatorVideo[]>([]);
  const [progressNotes, setProgressNotes] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [form, setForm] = useState<ManualForm>({
    narrationText: "",
    audioLanguage: "Portuguese",
    speechRate: 1,
    formatPreset: "TIKTOK",
    maxNewTokens: 2048,
    topP: 0.8,
    topK: 20,
    temperature: 1,
    repetitionPenalty: 1.05,
    quality: "V0",
    videoWidth: 432,
    videoHeight: 768,
    videoFps: 25,
    steps: 4,
    cfg: 1,
    shift: 11,
    crf: 19,
  });

  const canCreate = form.narrationText.trim().length > 0 && !loading;

  const addProgressNote = (note: string) => {
    const stamp = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setProgressNotes((prev) => [`${stamp} - ${note}`, ...prev].slice(0, 16));
  };

  const loadInitial = async () => {
    try {
      const [recentRes, configRes] = await Promise.all([
        fetch("/api/texto-para-video", { cache: "no-store" }),
        fetch("/api/texto-para-video?view=config", { cache: "no-store" }),
      ]);
      const recentData = await recentRes.json().catch(() => ({}));
      const configData = await configRes.json().catch(() => ({}));
      if (recentRes.ok) setRecent(recentData.items || []);
      if (configRes.ok) {
        setConfig(configData);
        setForm((prev) => ({
          ...prev,
          audioLanguage: configData.audioSettings?.language || prev.audioLanguage,
          speechRate: configData.audioSettings?.speechRate || prev.speechRate,
          formatPreset: configData.renderSettings?.formatPreset || prev.formatPreset,
          maxNewTokens: configData.audioSettings?.maxNewTokens || prev.maxNewTokens,
          topP: configData.audioSettings?.topP || prev.topP,
          topK: configData.audioSettings?.topK || prev.topK,
          temperature: configData.audioSettings?.temperature || prev.temperature,
          repetitionPenalty: configData.audioSettings?.repetitionPenalty || prev.repetitionPenalty,
          quality: configData.audioSettings?.quality || prev.quality,
          videoWidth: configData.renderSettings?.width || prev.videoWidth,
          videoHeight: configData.renderSettings?.height || prev.videoHeight,
          videoFps: configData.renderSettings?.fps || prev.videoFps,
          steps: configData.renderSettings?.steps || prev.steps,
          cfg: configData.renderSettings?.cfg || prev.cfg,
          shift: configData.renderSettings?.shift || prev.shift,
          crf: configData.renderSettings?.crf || prev.crf,
        }));
      }
    } catch {
      // ignore load failures
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
    if (!current?.id) return;
    if (current.status !== "GENERATING_AUDIO" && current.status !== "GENERATING_VIDEO") return;
    const timer = window.setInterval(() => {
      refreshCurrent(current.id).catch(() => null);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [current?.id, current?.status]);

  const steps = useMemo(() => computeSteps(current, config), [current, config]);

  const completedSteps = steps.filter((step) => step.status === "COMPLETED").length;
  const progressPercent = Math.round((completedSteps / steps.length) * 100);

  const elapsedTime = useMemo(() => {
    if (!current?.startedAt) return null;
    const start = new Date(current.startedAt).getTime();
    const end = current.completedAt ? new Date(current.completedAt).getTime() : Date.now();
    return formatDurationSeconds((end - start) / 1000);
  }, [current?.startedAt, current?.completedAt, current?.updatedAt]);

  const handleFileChange =
    (setter: (file: File | null) => void) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setter(event.target.files?.[0] || null);
    };

  const uploadFileToMinio = async (file: File, kind: "imagem" | "audio") => {
    addProgressNote(`Enviando ${kind} manual para o MinIO.`);
    const data = new FormData();
    data.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: data });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok || !payload?.url) throw new Error(payload?.error || `Falha ao enviar ${kind}`);
    addProgressNote(`${kind === "imagem" ? "Imagem" : "Audio"} enviada com sucesso.`);
    return String(payload.url);
  };

  const syncPresetDimensions = (formatPreset: "TIKTOK" | "INSTAGRAM_REEL") => {
    const preset = config?.formatPresets?.find((item) => item.value === formatPreset);
    if (!preset) return;
    setForm((prev) => ({
      ...prev,
      formatPreset,
      videoWidth: preset.width,
      videoHeight: preset.height,
    }));
  };

  const create = async () => {
    if (!canCreate) return;

    setLoading(true);
    setMessage(null);
    setProgressNotes([]);
    addProgressNote("Preparando a execucao manual.");

    let creatorImageUrl: string | null = null;
    let voiceRefUrl: string | null = null;
    let createdItem: SimpleCreatorVideo | null = null;

    try {
      creatorImageUrl = imageFile ? await uploadFileToMinio(imageFile, "imagem") : null;
      voiceRefUrl = audioFile ? await uploadFileToMinio(audioFile, "audio") : null;

      addProgressNote("Criando o item e iniciando a pipeline.");
      const createRes = await fetch("/api/texto-para-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          narrationText: form.narrationText,
          creatorImageUrl,
          voiceRefUrl,
          audioLanguage: form.audioLanguage,
          speechRate: form.speechRate,
          formatPreset: form.formatPreset,
          maxNewTokens: form.maxNewTokens,
          topP: form.topP,
          topK: form.topK,
          temperature: form.temperature,
          repetitionPenalty: form.repetitionPenalty,
          quality: form.quality,
          videoWidth: form.videoWidth,
          videoHeight: form.videoHeight,
          videoFps: form.videoFps,
          steps: form.steps,
          cfg: form.cfg,
          shift: form.shift,
          crf: form.crf,
          autoGenerate: true,
        }),
      });
      const createData = await createRes.json().catch(() => ({}));
      if (!createRes.ok) throw new Error(createData?.error || "Falha ao iniciar o processo");

      createdItem = createData.item as SimpleCreatorVideo;
      setCurrent(createdItem);
      setRecent((prev) => [createdItem as SimpleCreatorVideo, ...prev.filter((item) => item.id !== createdItem!.id)].slice(0, 40));
      setMessageSeverity("success");
      setMessage("Processo iniciado com sucesso. O status completo esta sendo acompanhado abaixo.");
      addProgressNote("Item criado, audio gerado e video enfileirado conforme o fluxo padrão.");
      setForm((prev) => ({ ...prev, narrationText: "" }));
      setImageFile(null);
      setAudioFile(null);
      await loadInitial();
    } catch (error: any) {
      if (createdItem?.id) {
        await refreshCurrent(createdItem.id).catch(() => null);
      }
      setMessageSeverity("error");
      setMessage(error?.message || "Falha ao gerar o video");
      addProgressNote(`Execucao interrompida: ${error?.message || "erro desconhecido"}`);
    } finally {
      setLoading(false);
    }
  };

  const regenerateAudio = async () => {
    if (!current || loading) return;
    setLoading(true);
    setMessage(null);
    addProgressNote("Regenerando o audio.");
    try {
      const res = await fetch(`/api/texto-para-video/${current.id}/gerar-audio`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Falha ao gerar audio");
      await refreshCurrent(current.id);
      await loadInitial();
      setMessageSeverity("success");
      setMessage("Audio regenerado com sucesso.");
    } catch (error: any) {
      setMessageSeverity("error");
      setMessage(error?.message || "Falha ao gerar audio");
    } finally {
      setLoading(false);
    }
  };

  const regenerateVideo = async () => {
    if (!current || loading) return;
    setLoading(true);
    setMessage(null);
    addProgressNote("Regenerando o video.");
    try {
      const res = await fetch(`/api/texto-para-video/${current.id}/gerar-video`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Falha ao gerar video");
      await refreshCurrent(current.id);
      await loadInitial();
      setMessageSeverity("success");
      setMessage("Video regenerado com sucesso.");
    } catch (error: any) {
      setMessageSeverity("error");
      setMessage(error?.message || "Falha ao gerar video");
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
        <Typography sx={{ opacity: 0.78, mt: 1 }}>
          Suba uma foto e um audio de referencia opcionais. Se nada for enviado, o fluxo reaproveita a configuracao padrao da Shopee.
        </Typography>
      </Box>

      {message ? <Alert severity={messageSeverity}>{message}</Alert> : null}

      <Paper sx={{ p: 1 }}>
        <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
          <Tab label="Gerador manual" />
          <Tab label="Com imagens" />
          <Tab label="Historico" />
        </Tabs>
      </Paper>

      {activeTab === 0 ? (
        <>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 2 }}>
              <Box sx={{ gridColumn: { xs: "span 12", lg: "span 7" } }}>
                <TextField
                  label="Texto manual"
                  value={form.narrationText}
                  onChange={(event) => setForm((prev) => ({ ...prev, narrationText: event.target.value }))}
                  fullWidth
                  multiline
                  rows={10}
                  placeholder="Digite exatamente o que a foto deve falar..."
                />
              </Box>

              <Box sx={{ gridColumn: { xs: "span 12", lg: "span 5" }, display: "grid", gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 2, border: "1px solid rgba(15,23,42,0.08)" }}>
                  <Typography sx={{ fontWeight: 900 }}>Imagem do avatar</Typography>
                  <Typography sx={{ fontSize: 13, opacity: 0.7, mt: 0.5 }}>
                    {uploadSourceLabel(Boolean(imageFile), config?.defaults.creatorImageUrl || null, "imagem")}
                  </Typography>
                  <input style={{ marginTop: 12 }} type="file" accept="image/*" onChange={handleFileChange(setImageFile)} />
                </Box>

                <Box sx={{ p: 1.5, borderRadius: 2, border: "1px solid rgba(15,23,42,0.08)" }}>
                  <Typography sx={{ fontWeight: 900 }}>Audio de referencia</Typography>
                  <Typography sx={{ fontSize: 13, opacity: 0.7, mt: 0.5 }}>
                    {uploadSourceLabel(Boolean(audioFile), config?.defaults.voiceRefUrl || null, "audio")}
                  </Typography>
                  <input style={{ marginTop: 12 }} type="file" accept="audio/*" onChange={handleFileChange(setAudioFile)} />
                </Box>

                <TextField
                  select
                  label="Idioma"
                  value={form.audioLanguage}
                  onChange={(event) => setForm((prev) => ({ ...prev, audioLanguage: event.target.value as ManualForm["audioLanguage"] }))}
                  fullWidth
                >
                  <MenuItem value="Portuguese">Portugues</MenuItem>
                  <MenuItem value="English">English</MenuItem>
                </TextField>

                <TextField
                  select
                  label="Velocidade da fala"
                  value={String(form.speechRate)}
                  onChange={(event) => setForm((prev) => ({ ...prev, speechRate: Number(event.target.value) }))}
                  fullWidth
                >
                  <MenuItem value="0.9">Falar devagar</MenuItem>
                  <MenuItem value="1">Normal</MenuItem>
                  <MenuItem value="1.1">Falar rapido</MenuItem>
                </TextField>

                <TextField
                  select
                  label="Formato do video"
                  value={form.formatPreset}
                  onChange={(event) => syncPresetDimensions(event.target.value as ManualForm["formatPreset"])}
                  fullWidth
                >
                  {(config?.formatPresets || []).map((preset) => (
                    <MenuItem key={preset.value} value={preset.value}>
                      {preset.label}
                    </MenuItem>
                  ))}
                </TextField>

                <button
                  onClick={create}
                  disabled={!canCreate}
                  style={{ padding: "12px 16px", borderRadius: 10, fontWeight: 900, background: "#111827", color: "#fff" }}
                >
                  {loading ? "Processando..." : "Iniciar processo"}
                </button>
              </Box>
            </Box>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography sx={{ fontWeight: 900, mb: 1 }}>Parametros observados do ComfyUI</Typography>
            <Typography sx={{ fontSize: 13, opacity: 0.72, mb: 2 }}>
              Estes campos foram mapeados a partir do workflow real usado pela Modal/ComfyUI e ja entram na execucao.
            </Typography>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2 }}>
              <Box sx={{ display: "grid", gap: 1.5 }}>
                <Typography sx={{ fontWeight: 900 }}>Audio / Voice Clone</Typography>
                <TextField label="Max new tokens" type="number" value={form.maxNewTokens} onChange={(event) => setForm((prev) => ({ ...prev, maxNewTokens: Number(event.target.value || 0) }))} />
                <TextField label="Top P" type="number" value={form.topP} onChange={(event) => setForm((prev) => ({ ...prev, topP: Number(event.target.value || 0) }))} />
                <TextField label="Top K" type="number" value={form.topK} onChange={(event) => setForm((prev) => ({ ...prev, topK: Number(event.target.value || 0) }))} />
                <TextField label="Temperature" type="number" value={form.temperature} onChange={(event) => setForm((prev) => ({ ...prev, temperature: Number(event.target.value || 0) }))} />
                <TextField
                  label="Repetition penalty"
                  type="number"
                  value={form.repetitionPenalty}
                  onChange={(event) => setForm((prev) => ({ ...prev, repetitionPenalty: Number(event.target.value || 0) }))}
                />
                <TextField
                  select
                  label="Qualidade MP3"
                  value={form.quality}
                  onChange={(event) => setForm((prev) => ({ ...prev, quality: event.target.value as ManualForm["quality"] }))}
                >
                  <MenuItem value="V0">V0</MenuItem>
                  <MenuItem value="V2">V2</MenuItem>
                  <MenuItem value="320k">320k</MenuItem>
                </TextField>
              </Box>

              <Box sx={{ display: "grid", gap: 1.5 }}>
                <Typography sx={{ fontWeight: 900 }}>Video / Infinite Talk</Typography>
                <TextField label="Largura" type="number" value={form.videoWidth} onChange={(event) => setForm((prev) => ({ ...prev, videoWidth: Number(event.target.value || 0) }))} />
                <TextField label="Altura" type="number" value={form.videoHeight} onChange={(event) => setForm((prev) => ({ ...prev, videoHeight: Number(event.target.value || 0) }))} />
                <TextField label="FPS" type="number" value={form.videoFps} onChange={(event) => setForm((prev) => ({ ...prev, videoFps: Number(event.target.value || 0) }))} />
                <TextField label="Steps" type="number" value={form.steps} onChange={(event) => setForm((prev) => ({ ...prev, steps: Number(event.target.value || 0) }))} />
                <TextField label="CFG" type="number" value={form.cfg} onChange={(event) => setForm((prev) => ({ ...prev, cfg: Number(event.target.value || 0) }))} />
                <TextField label="Shift" type="number" value={form.shift} onChange={(event) => setForm((prev) => ({ ...prev, shift: Number(event.target.value || 0) }))} />
                <TextField label="CRF" type="number" value={form.crf} onChange={(event) => setForm((prev) => ({ ...prev, crf: Number(event.target.value || 0) }))} />
              </Box>
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
                      <Chip size="small" label={step.status} color={stepChipColor(step.status)} />
                    </Box>
                    <Typography sx={{ mt: 0.8, fontSize: 13, opacity: 0.75 }}>{step.description}</Typography>
                    <Typography sx={{ mt: 0.8, fontSize: 12, opacity: 0.62 }}>Tempo esperado: {step.eta}</Typography>
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
                <Typography sx={{ opacity: 0.72 }}>O link do video e os demais artefatos aparecerao aqui assim que a primeira execucao for criada.</Typography>
              ) : (
                <Box sx={{ display: "grid", gap: 1.5 }}>
                  <Box sx={{ p: 1.5, borderRadius: 2, border: "1px solid rgba(15,23,42,0.08)" }}>
                    <Typography sx={{ fontWeight: 900 }}>Resumo</Typography>
                    <Typography sx={{ mt: 0.8, fontSize: 13, opacity: 0.78 }}>ID: {current.id}</Typography>
                    <Typography sx={{ mt: 0.4, fontSize: 13, opacity: 0.78 }}>Status: {statusLabel(current.status)}</Typography>
                    <Typography sx={{ mt: 0.4, fontSize: 13, opacity: 0.78 }}>
                      Formato: {current.formatPreset} ({current.videoWidth}x{current.videoHeight} @ {current.videoFps}fps)
                    </Typography>
                    <Typography sx={{ mt: 0.4, fontSize: 13, opacity: 0.78 }}>
                      Voz: {current.audioLanguage} / velocidade {current.speechRate}x
                    </Typography>
                    {current.errorMessage ? <Typography sx={{ mt: 1, color: "#b91c1c" }}>{current.errorMessage}</Typography> : null}
                  </Box>

                  {current.audioUrl ? (
                    <a href={current.audioUrl} target="_blank" rel="noreferrer" style={{ padding: "12px", borderRadius: 10, background: "#fff" }}>
                      Abrir audio gerado
                    </a>
                  ) : null}

                  {current.videoUrl ? (
                    <a href={current.videoUrl} target="_blank" rel="noreferrer" style={{ padding: "12px", borderRadius: 10, background: "#fff" }}>
                      Abrir link do video
                    </a>
                  ) : null}

                  {current.captionsUrl ? (
                    <a href={current.captionsUrl} target="_blank" rel="noreferrer" style={{ padding: "12px", borderRadius: 10, background: "#fff" }}>
                      Abrir legendas
                    </a>
                  ) : null}

                  <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                    <button onClick={regenerateAudio} disabled={!current || loading} style={{ padding: "10px 14px", borderRadius: 10, fontWeight: 900 }}>
                      Regenerar audio
                    </button>
                    <button onClick={regenerateVideo} disabled={!current?.audioUrl || loading} style={{ padding: "10px 14px", borderRadius: 10, fontWeight: 900 }}>
                      Regenerar video
                    </button>
                  </Box>
                </Box>
              )}
            </Paper>
          </Box>
        </>
      ) : activeTab === 1 ? (
        <MixedCreatorVideoTab />
      ) : (
        <Paper sx={{ p: 2 }}>
          <Typography sx={{ fontWeight: 900, mb: 1 }}>Execucoes recentes</Typography>
          <Box sx={{ display: "grid", gap: 1 }}>
            {recent.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrent(item);
                  setActiveTab(0);
                }}
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
      )}
    </Box>
  );
}
