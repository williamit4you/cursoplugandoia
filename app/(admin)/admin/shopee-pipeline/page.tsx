"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Switch,
  Step,
  StepButton,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  Tooltip,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SettingsIcon from "@mui/icons-material/Settings";
import BoltIcon from "@mui/icons-material/Bolt";
import PublishIcon from "@mui/icons-material/Publish";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import AutorenewIcon from "@mui/icons-material/Autorenew";

type ColetaItem = {
  id: string;
  url: string;
  inputMode?: "SCRAPE_SOURCE" | "MANUAL_VIDEO" | string;
  titulo?: string | null;
  descricao?: string | null;
  detalhes?: string | null;
  aiPromptVendas?: string | null;
  pipelineStatus: string;
  active: boolean;
  priority: number;
  nextRunAt?: string | null;
  lockedAt?: string | null;
  lockedBy?: string | null;
  attemptCount: number;
  lastError?: string | null;
  audioUrl?: string | null;
  copyVideoUrl?: string | null;
  videoFinalUrl?: string | null;
  affiliateUrl?: string | null;
  platformMetadata?: any;
  createdAt: string;
  updatedAt: string;
  relatedArticles?: Array<{
    briefId: string;
    angle: string;
    briefStatus: string;
    briefTitle: string;
    postId?: string | null;
    postTitle?: string | null;
    postStatus?: string | null;
    slug?: string | null;
    publishedAt?: string | null;
    adminUrl?: string | null;
    publicUrl?: string | null;
  }>;
  pipelineSteps?: Array<{
    id: string;
    stepName: string;
    status: string;
    attempt: number;
    errorMessage?: string | null;
    startedAt?: string | null;
    finishedAt?: string | null;
    durationMs?: number | null;
    nextRetryAt?: string | null;
    requestPayload?: any;
    responsePayload?: any;
    updatedAt: string;
  }>;
};

type PipelineEvent = {
  id: string;
  createdAt: string;
  level: string;
  stepName?: string | null;
  message: string;
  metadata?: any;
};

type InternalCronStatus = {
  enabled: boolean;
  started: boolean;
  running: boolean;
  tickMs: number;
  lastTickAt?: string | null;
  lastResult?: any;
  lastError?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("pt-BR");
}

function lockAgeMinutes(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
}

function toDateTimeLocalValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (num: number) => String(num).padStart(2, "0");
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}T${pad(local.getHours())}:${pad(local.getMinutes())}`;
}

function statusColor(status: string) {
  if (status === "FAILED") return "error";
  if (status === "PUBLISHED") return "success";
  if (status === "WAITING_POD") return "warning";
  if (status === "PENDING") return "default";
  if (status.endsWith("_READY")) return "info";
  if (status === "PAUSED") return "default";
  return "primary";
}

function shortId(id: string) {
  const value = String(id || "");
  if (!value) return "-";
  return value.length <= 8 ? value : value.slice(-8);
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  GENERATING_COPY: "Gerando roteiro",
  COPY_READY: "Roteiro pronto",
  PAUSED: "Pausado",
  WAITING_POD: "Legado: aguardando worker",
  GENERATING_AUDIO: "Gerando audio",
  AUDIO_READY: "Audio pronto",
  GENERATING_COPY_VIDEO: "Gerando video da copy",
  COPY_VIDEO_READY: "Video da copy pronto",
  MERGING_VIDEOS: "Juntando videos",
  FINAL_VIDEO_READY: "Video final pronto",
  GENERATING_PLATFORM_METADATA: "Gerando textos das redes",
  READY_FOR_SCHEDULING: "Pronto para agendar",
  FAILED: "Falhou",
  PUBLISHED: "Publicado",
  SUCCESS: "Sucesso",
  RUNNING: "Executando",
  RETRY_SCHEDULED: "Nova tentativa agendada",
};

const STEP_LABELS: Record<string, string> = {
  SCRAPE_MEDIA: "Coletar midias",
  GENERATE_SALES_COPY: "Gerar roteiro",
  GENERATE_AUDIO: "Gerar audio",
  GENERATE_COPY_VIDEO: "Gerar video da copy",
  MERGE_VIDEOS: "Juntar videos",
  GENERATE_PLATFORM_METADATA: "Gerar textos das redes",
  GENERATE_AFFILIATE_LINK: "Gerar link afiliado",
  CREATE_BIO_PRODUCT: "Criar produto na bio",
  CREATE_STORY_AD: "Agendar publicacoes",
  CREATE_CONTENT_ARTICLES: "Criar artigos SEO",
};

const STEP_DETAILS: Record<
  string,
  {
    title: string;
    summary: string;
    actions: string[];
    waits?: string;
    saves?: string;
    application?: string[];
    modal?: string[];
    minio?: string[];
  }
> = {
  SCRAPE_MEDIA: {
    title: "Coletar midias e texto do produto",
    summary: "Busca a pagina da Shopee, extrai titulo, descricao, imagens, video original e prepara o roteiro de venda.",
    actions: ["Chama o servico de scraping/render", "Guarda URLs de imagens e videos encontrados", "Salva o roteiro no banco"],
    application: ["Coordena a coleta", "Salva titulo, descricao, roteiro e URLs no banco"],
    modal: ["Nao participa desta etapa"],
    minio: ["Nao grava arquivo novo nesta etapa"],
  },
  GENERATE_AUDIO: {
    title: "Gerar audio",
    summary: "Envia o roteiro salvo e a voz de referencia para o worker Modal gerar o MP3.",
    actions: ["Chama o endpoint de audio da Modal", "A Modal executa o workflow de voz", "Recebe a URL publica do MP3"],
    saves: "A Modal salva o MP3 no MinIO e o app grava `audioUrl` no item.",
    application: ["Pega o roteiro salvo do produto", "Envia texto e URL da voz para a Modal", "Salva a URL devolvida"],
    modal: ["Executa o workflow de clonagem de voz", "Gera e publica o MP3"],
    minio: ["Recebe e guarda o MP3 final gerado", "Fornece a URL publica `audioUrl`"],
  },
  GENERATE_COPY_VIDEO: {
    title: "Gerar video com imagem + audio",
    summary: "Envia a imagem base e o MP3 para o worker Modal gerar o video falado da copy.",
    actions: ["Chama o endpoint de video da Modal", "A Modal executa o workflow Infinite Talk", "Recebe a URL publica do MP4"],
    waits: "Pode demorar alguns minutos enquanto a GPU da Modal processa o workflow.",
    saves: "A Modal salva o MP4 no MinIO e o app grava `copyVideoUrl`.",
    application: ["Envia as URLs de imagem e audio para a Modal", "Salva a URL devolvida"],
    modal: ["Executa o workflow de imagem + audio", "Gera o video da foto falando"],
    minio: ["Entrega a imagem/audio se estiverem la", "Guarda o MP4 gerado como `copyVideoUrl`"],
  },
  MERGE_VIDEOS: {
    title: "Composicao PiP: produto + voce comentando",
    summary: "O video original do produto fica no fundo (sem audio). O video IA com sua voz aparece como PiP no canto inferior direito, com cantos arredondados. Apenas o audio do video IA e mantido.",
    actions: [
      "Chama o worker `/merge-videos`",
      "Worker baixa o video original (fundo) e o video copy/IA (PiP)",
      "Compoe os dois: produto no fundo, voce comentando no quadradinho",
      "Audio do produto removido - apenas sua voz e mantida",
    ],
    saves: "O MP4 final (1080x1920) volta para o Next, e o Next salva no MinIO como `videoFinalUrl`.",
    application: ["Envia para o worker as URLs do video original e do video copy/IA", "Recebe o MP4 composto", "Salva o resultado"],
    modal: ["Nao participa desta etapa"],
    minio: ["Fornece o video copy/IA", "Guarda o video final com PiP"],
  },
  GENERATE_AFFILIATE_LINK: {
    title: "Gerar link afiliado",
    summary: "Converte a URL original da Shopee em link afiliado curto.",
    actions: ["Usa a configuracao da conta Shopee afiliados", "Chama a API de link afiliado", "Salva `affiliateUrl`"],
    application: ["Chama a API de afiliados e guarda o resultado"],
    modal: ["Nao participa desta etapa"],
    minio: ["Nao participa desta etapa"],
  },
  CREATE_BIO_PRODUCT: {
    title: "Criar produto na bio",
    summary: "Monta a pagina de produto da bio usando titulo, descricao, imagem, video final e link afiliado.",
    actions: ["Cria slug", "Salva produto da bio", "Mantem link para compra"],
    application: ["Cria o registro da bio no banco"],
    modal: ["Nao participa desta etapa"],
    minio: ["Usa URLs ja existentes de imagem/video, mas nao gera arquivo novo"],
  },
  CREATE_STORY_AD: {
    title: "Agendar publicacoes",
    summary: "Cria a campanha e agenda publicacoes individuais nas redes configuradas.",
    actions: ["Cria a campanha", "Agenda TikTok, YouTube e Instagram", "Calcula o horario individual de cada plataforma"],
    application: ["Cria a campanha e os agendamentos"],
    modal: ["Nao participa desta etapa"],
    minio: ["Usa o video final ja salvo"],
  },
  CREATE_CONTENT_ARTICLES: {
    title: "Criar artigos SEO",
    summary: "Gera tres artigos ligados ao produto, com angulos diferentes para atrair buscas, apoiar a venda e permitir rastreio futuro dentro do portal.",
    actions: ["Cria ou atualiza o produto SEO", "Gera os artigos de dor, demonstracao e venda", "Liga cada artigo ao item da Shopee", "Mantem a secao de links sociais sincronizada"],
    application: ["Cria artigos no portal", "Liga os artigos ao produto e ao item do pipeline"],
    modal: ["Nao participa desta etapa"],
    minio: ["Usa apenas as URLs ja existentes do produto/video"],
  },
};

function statusLabel(status: string) {
  return STATUS_LABELS[status] || status;
}

function stepLabel(stepName: string) {
  return STEP_LABELS[stepName] || stepName;
}

function secondsUntil(value?: string | null, nowMs = Date.now()) {
  if (!value) return null;
  const diff = Math.ceil((new Date(value).getTime() - nowMs) / 1000);
  return Number.isFinite(diff) ? Math.max(0, diff) : null;
}

const LEGACY_PIPELINE_STEPS: Array<{ stepName: string; label: string }> = [
  { stepName: "SCRAPE_MEDIA", label: "Scraping" },
  { stepName: "GENERATE_AUDIO", label: "Audio" },
  { stepName: "GENERATE_COPY_VIDEO", label: "Video Copy" },
  { stepName: "MERGE_VIDEOS", label: "Merge" },
  { stepName: "GENERATE_AFFILIATE_LINK", label: "Afiliado" },
  { stepName: "CREATE_BIO_PRODUCT", label: "Bio" },
  { stepName: "CREATE_STORY_AD", label: "Story" },
];

const MANUAL_PIPELINE_STEPS: Array<{ stepName: string; label: string }> = [
  { stepName: "GENERATE_SALES_COPY", label: "Roteiro" },
  { stepName: "GENERATE_AUDIO", label: "Audio" },
  { stepName: "GENERATE_COPY_VIDEO", label: "Avatar falado" },
  { stepName: "MERGE_VIDEOS", label: "PiP final" },
  { stepName: "GENERATE_PLATFORM_METADATA", label: "Textos das redes" },
  { stepName: "CREATE_STORY_AD", label: "Agendamento" },
  { stepName: "CREATE_CONTENT_ARTICLES", label: "Artigos SEO" },
];

function stepIcon(status?: string | null) {
  if (status === "SUCCESS") return <CheckCircleIcon fontSize="small" />;
  if (status === "FAILED") return <ErrorIcon fontSize="small" />;
  if (status === "RUNNING") return <AutorenewIcon fontSize="small" />;
  if (status === "RETRY_SCHEDULED") return <AutorenewIcon fontSize="small" />;
  return <HourglassEmptyIcon fontSize="small" />;
}

function stepColor(status?: string | null) {
  if (status === "SUCCESS") return "#22c55e";
  if (status === "FAILED") return "#ef4444";
  if (status === "RUNNING") return "#38bdf8";
  if (status === "RETRY_SCHEDULED") return "#f59e0b";
  return "rgba(226,232,240,0.55)";
}

function truncateJson(value: unknown, maxLen = 900) {
  if (value === null || value === undefined) return "";
  let text = "";
  try {
    text = JSON.stringify(value, null, 2);
  } catch {
    text = String(value);
  }
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen)}\n...(truncado)`;
}

function articleAngleLabel(angle?: string | null) {
  if (angle === "PAIN") return "Dor";
  if (angle === "PRODUCT") return "Demonstracao";
  if (angle === "SALES") return "Venda";
  return angle || "-";
}

function buildManualPostDescription(item?: Partial<ColetaItem> | null) {
  const preferred = [item?.aiPromptVendas, item?.descricao, item?.detalhes];
  for (const value of preferred) {
    const text = String(value || "").trim();
    if (text) return text;
  }
  return "";
}

function renderProviderEvents(metadata: any) {
  const events = metadata?.events;
  if (!Array.isArray(events) || events.length === 0) return null;

  return (
    <div className="mt-2 space-y-2">
      {events.map((evt: any, idx: number) => {
        const http = evt?.details?.http || null;
        const request = http?.request || null;
        const response = http?.response || null;
        const title = `${evt?.step || "?"} | ${evt?.message || ""}`.trim();
        const subtitle = `${typeof evt?.elapsedMs === "number" ? `${evt.elapsedMs}ms` : ""}${evt?.podId ? ` | podId=${evt.podId}` : ""}`.trim();

        return (
          <details key={`${evt?.at || "evt"}-${idx}`} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">
            <summary className="cursor-pointer select-none text-[11px] text-slate-800 hover:text-slate-900">
              {title}
              {subtitle ? <span className="ml-2 text-slate-600">{subtitle}</span> : null}
            </summary>
            <div className="mt-2 space-y-2">
              {request ? (
                <details>
                  <summary className="cursor-pointer select-none text-[11px] text-slate-700 hover:text-slate-900">Envio (request)</summary>
                  <pre className="mt-1 whitespace-pre-wrap text-[11px] text-slate-700">{truncateJson(request, 2400)}</pre>
                </details>
              ) : null}
              {response ? (
                <details>
                  <summary className="cursor-pointer select-none text-[11px] text-slate-700 hover:text-slate-900">Retorno (response)</summary>
                  <pre className="mt-1 whitespace-pre-wrap text-[11px] text-slate-700">{truncateJson(response, 2400)}</pre>
                </details>
              ) : null}
              {!request && !response ? (
                <pre className="whitespace-pre-wrap text-[11px] text-slate-700">{truncateJson(evt, 2400)}</pre>
              ) : null}
            </div>
          </details>
        );
      })}
    </div>
  );
}

export default function ShopeePipelinePage() {
  const [items, setItems] = useState<ColetaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<ColetaItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [events, setEvents] = useState<PipelineEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [cronConfig, setCronConfig] = useState<any>(null);
  const [internalCron, setInternalCron] = useState<InternalCronStatus | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());
  const [configOpen, setConfigOpen] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [configDraft, setConfigDraft] = useState<any>(null);
  const [manualRunning, setManualRunning] = useState(false);
  const [manualPublishing, setManualPublishing] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    severity: "success" | "info" | "warning" | "error";
    message: React.ReactNode;
  } | null>(null);
  const [focusedStepName, setFocusedStepName] = useState<string | null>(null);
  const [selectedNextRunDraft, setSelectedNextRunDraft] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [order, setOrder] = useState<string>("priority_desc_updatedAt_desc");

  const darkFieldSx = {
    "& .MuiInputLabel-root": { color: "rgba(226,232,240,0.75)" },
    "& .MuiInputLabel-root.Mui-focused": { color: "rgba(34,197,94,0.9)" },
    "& .MuiOutlinedInput-root": {
      color: "#e2e8f0",
      bgcolor: "rgba(255,255,255,0.06)",
      "& fieldset": { borderColor: "rgba(255,255,255,0.18)" },
      "&:hover fieldset": { borderColor: "rgba(255,255,255,0.28)" },
      "&.Mui-focused fieldset": { borderColor: "rgba(34,197,94,0.7)" },
    },
    "& textarea": { color: "#e2e8f0" },
  } as const;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      qs.set("take", "100");
      if (statusFilter) qs.set("status", statusFilter);
      if (activeFilter === "true") qs.set("active", "true");
      if (activeFilter === "false") qs.set("active", "false");
      if (order) qs.set("order", order);

      const res = await fetch(`/api/shopee-pipeline/items?${qs.toString()}`, { cache: "no-store" });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);


      const cfgRes = await fetch("/api/shopee-pipeline/config", { cache: "no-store" }).catch(() => null);
      const cfgData = cfgRes ? await cfgRes.json().catch(() => null) : null;
      setCronConfig(cfgData && typeof cfgData === "object" ? cfgData : null);

      const cronRes = await fetch("/api/shopee-pipeline/internal-cron", { cache: "no-store" }).catch(() => null);
      const cronData = cronRes?.ok ? await cronRes.json().catch(() => null) : null;
      setInternalCron(cronData && typeof cronData === "object" ? cronData : null);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, activeFilter, order]);

  const loadConfig = async () => {
    setConfigLoading(true);
    try {
      const res = await fetch("/api/shopee-pipeline/config", { cache: "no-store" });
      const data = await res.json();
      setConfig(data);
      setConfigDraft({
        enabled: Boolean(data?.enabled),
        runEveryMinutes: Number(data?.runEveryMinutes || 5),
        maxItemsPerRun: Number(data?.maxItemsPerRun || 1),
        processOneAtATime: data?.processOneAtATime !== false,
        userBaseImageUrl: data?.userBaseImageUrl || "",
        userVoiceRefUrl: data?.userVoiceRefUrl || "",
        comfyAudioPromptTemplate: data?.comfyAudioPromptTemplate || null,
        comfyVideoPromptTemplate: data?.comfyVideoPromptTemplate || null,
      });
    } finally {
      setConfigLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!configDraft) return;
    const payload: any = {
      enabled: Boolean(configDraft.enabled),
      runEveryMinutes: Number(configDraft.runEveryMinutes || 5),
      maxItemsPerRun: Number(configDraft.maxItemsPerRun || 1),
      processOneAtATime: Boolean(configDraft.processOneAtATime),
      userBaseImageUrl: String(configDraft.userBaseImageUrl || "").trim() || null,
      userVoiceRefUrl: String(configDraft.userVoiceRefUrl || "").trim() || null,
      comfyAudioPromptTemplate: configDraft.comfyAudioPromptTemplate || null,
      comfyVideoPromptTemplate: configDraft.comfyVideoPromptTemplate || null,
    };
    setConfigLoading(true);
    try {
      const res = await fetch("/api/shopee-pipeline/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setConfig(data);
      setConfigOpen(false);
    } finally {
      setConfigLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const clock = window.setInterval(() => setNowMs(Date.now()), 1000);
    const refresh = window.setInterval(() => void load(), 15000);
    return () => {
      window.clearInterval(clock);
      window.clearInterval(refresh);
    };
  }, [load]);

  const toggleCron = async (enabled: boolean) => {
    const source = cronConfig || config || {};
    const payload = {
      enabled,
      runEveryMinutes: Number(source.runEveryMinutes || 1),
      maxItemsPerRun: Number(source.maxItemsPerRun || 1),
      processOneAtATime: source.processOneAtATime !== false,
      userBaseImageUrl: source.userBaseImageUrl || null,
      userVoiceRefUrl: source.userVoiceRefUrl || null,
      comfyAudioPromptTemplate: source.comfyAudioPromptTemplate || null,
      comfyVideoPromptTemplate: source.comfyVideoPromptTemplate || null,
    };
    await fetch("/api/shopee-pipeline/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await load();
  };

  const resetCronSchedule = async () => {
    const source = configDraft || cronConfig || config || {};
    const payload = {
      enabled: Boolean(source.enabled),
      runEveryMinutes: Number(source.runEveryMinutes || 1),
      maxItemsPerRun: Number(source.maxItemsPerRun || 1),
      processOneAtATime: source.processOneAtATime !== false,
      userBaseImageUrl: source.userBaseImageUrl || null,
      userVoiceRefUrl: source.userVoiceRefUrl || null,
      comfyAudioPromptTemplate: source.comfyAudioPromptTemplate || null,
      comfyVideoPromptTemplate: source.comfyVideoPromptTemplate || null,
      resetSchedule: true,
    };

    await fetch("/api/shopee-pipeline/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSnackbar({
      open: true,
      severity: "info",
      message: "Agenda do cron resetada (lastCronRunAt/nextCronRunAt limpos).",
    });

    await load();
  };

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      return (
        item.url.toLowerCase().includes(q) ||
        String(item.titulo || "").toLowerCase().includes(q) ||
        item.pipelineStatus.toLowerCase().includes(q)
      );
    });
  }, [items, filter]);

  const lastCronRun = useMemo(() => {
    const last = internalCron?.lastResult;
    const run = last?.runs && Array.isArray(last.runs) ? last.runs[0] : null;
    return {
      skipped: Boolean(last?.skipped),
      reason: last?.reason ? String(last.reason) : "",
      runSkipped: Boolean(run?.skipped),
      runReason: run?.reason ? String(run.reason) : "",
      itemId: run?.itemId ? String(run.itemId) : null,
      step: run?.ran ? String(run.ran) : null,
      ok: typeof run?.ok === "boolean" ? Boolean(run.ok) : null,
    };
  }, [internalCron]);

  const stats = useMemo(() => {
    const total = items.length;
    const byStatus = new Map<string, number>();
    for (const item of items) byStatus.set(item.pipelineStatus, (byStatus.get(item.pipelineStatus) || 0) + 1);
    return { total, byStatus };
  }, [items]);

  const openDetail = async (item: ColetaItem) => {
    setSelected(item);
    setSelectedNextRunDraft(toDateTimeLocalValue(item.nextRunAt));
    setDetailOpen(true);
    setEvents([]);
    setEventsLoading(true);
    try {
      const full = await fetch(`/api/shopee-pipeline/items/${item.id}`, { cache: "no-store" })
        .then((r) => r.json())
        .catch(() => null);
      if (full && typeof full === "object") {
        setSelected(full as any);
        setSelectedNextRunDraft(toDateTimeLocalValue((full as any)?.nextRunAt));
      }

      const res = await fetch(`/api/shopee-pipeline/items/${item.id}/events?take=200`, { cache: "no-store" });
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } finally {
      setEventsLoading(false);
    }
  };

  const cronUrl = useMemo(() => {
    // Secret is never shown here; user must configure it in the scheduler platform.
    return "/api/shopee-pipeline/cron";
  }, []);

  const openCronInNewTab = () => {
    try {
      window.open(cronUrl, "_blank", "noopener,noreferrer");
    } catch {
      // ignore
    }
  };

  const copyToClipboard = useCallback(async (label: string, value?: string | null) => {
    const text = String(value || "").trim();
    if (!text) {
      setSnackbar({
        open: true,
        severity: "warning",
        message: `${label} ainda nao esta disponivel neste item.`, 
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setSnackbar({
        open: true,
        severity: "success",
        message: `${label} copiado.`,
      });
    } catch {
      setSnackbar({
        open: true,
        severity: "error",
        message: `Nao foi possivel copiar ${label.toLowerCase()}.`, 
      });
    }
  }, []);

  const openExternalUrl = useCallback((url?: string | null) => {
    const text = String(url || "").trim();
    if (!text) {
      setSnackbar({
        open: true,
        severity: "warning",
        message: "Link ainda nao esta disponivel neste item.",
      });
      return;
    }

    try {
      window.open(text, "_blank", "noopener,noreferrer");
    } catch {
      setSnackbar({
        open: true,
        severity: "error",
        message: "Nao foi possivel abrir o link.",
      });
    }
  }, []);

  const focusStep = async (stepName: string) => {
    if (!selected?.id) return;
    setFocusedStepName(stepName);
    setEventsLoading(true);
    try {
      const res = await fetch(`/api/shopee-pipeline/items/${selected.id}/events?take=200&stepName=${encodeURIComponent(stepName)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } finally {
      setEventsLoading(false);
    }
  };

  const patchItem = async (id: string, patch: any) => {
    const res = await fetch(`/api/shopee-pipeline/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error((data as any)?.error ? String((data as any).error) : `Falha ao atualizar item (HTTP ${res.status})`);
    }
    await load();
    if (detailOpen && selected?.id === id) {
      await openDetail((data as any) || ({ id } as any));
    }
    return data;
  };

  const continueNow = async (item: ColetaItem) => {
    try {
      const data = await patchItem(item.id, { forceResumeNow: true });
      setSnackbar({
        open: true,
        severity: "success",
        message: `Item liberado para continuar em: ${statusLabel(String((data as any)?.resumeInfo?.resumedStatus || item.pipelineStatus))}. A automacao pega sozinha no proximo ciclo; "Rodar agora" apenas antecipa.`,
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        severity: "error",
        message: error?.message || "Falha ao preparar retomada.",
      });
    }
  };

  const saveNextRunForSelected = async () => {
    if (!selected?.id) return;
    try {
      await patchItem(selected.id, {
        nextRunAt: selectedNextRunDraft ? new Date(selectedNextRunDraft).toISOString() : null,
      });
      setSnackbar({
        open: true,
        severity: "success",
        message: selectedNextRunDraft
          ? `Proxima execucao agendada para ${formatDate(new Date(selectedNextRunDraft).toISOString())}.`
          : "Agendamento removido. O item pode rodar assim que ficar elegivel.",
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        severity: "error",
        message: error?.message || "Falha ao salvar horario.",
      });
    }
  };

  const clearNextRunForSelected = async () => {
    if (!selected?.id) return;
    setSelectedNextRunDraft("");
    try {
      await patchItem(selected.id, { nextRunAt: null });
      setSnackbar({
        open: true,
        severity: "success",
        message: "Agendamento removido. O item pode rodar assim que ficar elegivel.",
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        severity: "error",
        message: error?.message || "Falha ao limpar agendamento.",
      });
    }
  };

  const runManualOnce = async () => {
    if (manualRunning) return;
    setManualRunning(true);
    try {
      const res = await fetch("/api/shopee-pipeline/manual-run", { method: "POST", cache: "no-store" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || (data as any)?.ok === false) {
        setSnackbar({
          open: true,
          severity: res.status === 401 ? "warning" : "error",
          message: (data as any)?.error ? String((data as any).error) : `Falha ao rodar (HTTP ${res.status})`,
        });
        return;
      }

      const result = (data as any)?.result || {};
      const itemId = result?.itemId ? String(result.itemId) : null;
      const ran = result?.ran ? String(result.ran) : null;
      const skipped = Boolean(result?.skipped);
      const reason = result?.reason ? String(result.reason) : "";
      const rule = result?.rule ? String(result.rule) : "";
      const howToFix = result?.howToFix ? String(result.howToFix) : "";
      const details = result?.details && typeof result.details === "object" ? (result.details as any) : null;

      setSnackbar({
        open: true,
        severity: skipped ? "info" : "success",
        message: skipped ? (
          <Box className="space-y-1" sx={{ maxWidth: 780 }}>
            <Typography sx={{ fontWeight: 950, lineHeight: 1.15 }}>Nada para rodar</Typography>
            <Typography variant="body2" sx={{ opacity: 0.95 }}>
              <b>Motivo:</b> {reason || "Nenhum item elegivel no momento."}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.95 }}>
              <b>Regra:</b>{" "}
              {rule || "Escolhe 1 item elegivel (active=true, status != PAUSED/PUBLISHED, nextRunAt <= agora, sem lock recente)."}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.95 }}>
              <b>Para rodar:</b>{" "}
              {howToFix || "Garanta um item elegivel e clique em \"Rodar agora\" (raio verde)."}
            </Typography>
            {details?.counts ? (
              <Typography variant="caption" sx={{ opacity: 0.9, display: "block" }}>
                Diagnostico: ativos={details.counts.totalActive}, excluidos(PAUSED/PUBLISHED)={details.counts.excludedByStatus},
                bloqueados(nextRunAt)={details.counts.blockedByNextRunAt}, bloqueados(lock)={details.counts.blockedByLock}.
              </Typography>
            ) : null}
            {details?.samples?.earliestFuture?.nextRunAt ? (
              <Typography variant="caption" sx={{ opacity: 0.9, display: "block" }}>
                Proximo agendado: {String(details.samples.earliestFuture.id)} em {String(details.samples.earliestFuture.nextRunAt)}.
              </Typography>
            ) : null}
            {details?.samples?.locked?.lockedAt ? (
              <Typography variant="caption" sx={{ opacity: 0.9, display: "block" }}>
                Exemplo travado: {String(details.samples.locked.id)} (lockedAt {String(details.samples.locked.lockedAt)}
                {details.samples.locked.lockedBy ? ` por ${String(details.samples.locked.lockedBy)}` : ""}).
              </Typography>
            ) : null}
          </Box>
        ) : (
          `Rodou: ${ran || "ok"}${itemId ? ` (${itemId})` : ""}`
        ),
      });

      await load();

      if (itemId) {
        const latest = await fetch(`/api/shopee-pipeline/items/${itemId}`, { cache: "no-store" })
          .then((r) => r.json())
          .catch(() => null);
        if (latest && typeof latest === "object") {
          await openDetail(latest as any);
        }
      }
    } finally {
      setManualRunning(false);
    }
  };

  const runManualPublisher = async () => {
    if (manualPublishing) return;
    setManualPublishing(true);
    try {
      const res = await fetch("/api/shopee-pipeline/manual-publisher", { method: "POST", cache: "no-store" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || (data as any)?.ok === false) {
        setSnackbar({
          open: true,
          severity: res.status === 401 ? "warning" : "error",
          message: (data as any)?.error ? String((data as any).error) : `Falha ao publicar (HTTP ${res.status})`,
        });
        return;
      }

      const checked = (data as any)?.data?.checked;
      setSnackbar({
        open: true,
        severity: "info",
        message: typeof checked === "number" ? `Publisher rodou. StoryAds checados: ${checked}` : "Publisher rodou.",
      });

      await load();
    } finally {
      setManualPublishing(false);
    }
  };

  return (
    <Box className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Shopee Pipeline
          </Typography>
          <Typography variant="body2" sx={{ color: "#475569" }}>
            Estado, logs e passos por URL (1 URL = 1 post).
          </Typography>
        </div>

        <div className="flex items-center gap-2">
          <Chip
            size="small"
            label="Workers: Modal"
            color="success"
            variant="outlined"
            sx={{ color: "#166534", borderColor: "#86efac", bgcolor: "#dcfce7", fontWeight: 800 }}
          />
          <Button
            variant="contained"
            size="small"
            onClick={runManualOnce}
            disabled={manualRunning}
            startIcon={manualRunning ? <CircularProgress size={16} /> : <BoltIcon />}
            sx={{
              bgcolor: "rgba(34,197,94,0.9)",
              color: "#0b0c10",
              fontWeight: 900,
              "&:hover": { bgcolor: "rgba(34,197,94,1)" },
            }}
          >
            Rodar agora
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={runManualPublisher}
            disabled={manualPublishing}
            startIcon={manualPublishing ? <CircularProgress size={16} /> : <PublishIcon />}
            sx={{
              color: "#0f172a",
              borderColor: "#cbd5e1",
              bgcolor: "#fff",
              fontWeight: 900,
              "&:hover": { bgcolor: "rgba(255,255,255,0.10)", borderColor: "rgba(255,255,255,0.30)" },
            }}
          >
            Publicar
          </Button>
          <Tooltip title="Configurar pipeline">
            <span>
              <IconButton
                onClick={async () => {
                  setConfigOpen(true);
                  await loadConfig();
                }}
                sx={{
                  color: "#0f172a",
                  border: "1px solid #cbd5e1",
                  bgcolor: "#fff",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.10)" },
                }}
              >
                <SettingsIcon />
              </IconButton>
            </span>
          </Tooltip>
          <TextField
            size="small"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Buscar por URL, titulo, status"
            sx={{
              minWidth: 360,
              "& .MuiOutlinedInput-root": {
                color: "#0f172a",
                bgcolor: "#fff",
                "& fieldset": { borderColor: "#cbd5e1" },
                "&:hover fieldset": { borderColor: "#94a3b8" },
                "&.Mui-focused fieldset": { borderColor: "rgba(34,197,94,0.7)" },
              },
              "& input::placeholder": { color: "#64748b", opacity: 1 },
            }}
          />
          <TextField
            select
            size="small"
            value={statusFilter}
            onChange={(e) => setStatusFilter(String(e.target.value))}
            sx={{
              minWidth: 180,
              "& .MuiOutlinedInput-root": {
                color: "#0f172a",
                bgcolor: "#fff",
                "& fieldset": { borderColor: "#cbd5e1" },
                "&:hover fieldset": { borderColor: "#94a3b8" },
                "&.Mui-focused fieldset": { borderColor: "rgba(34,197,94,0.7)" },
              },
            }}
          >
            <MenuItem value="">Todos os status</MenuItem>
            {Object.keys(STATUS_LABELS).map((key) => (
              <MenuItem key={key} value={key}>
                {STATUS_LABELS[key]}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            value={activeFilter}
            onChange={(e) => setActiveFilter(String(e.target.value))}
            sx={{
              minWidth: 140,
              "& .MuiOutlinedInput-root": {
                color: "#0f172a",
                bgcolor: "#fff",
                "& fieldset": { borderColor: "#cbd5e1" },
                "&:hover fieldset": { borderColor: "#94a3b8" },
                "&.Mui-focused fieldset": { borderColor: "rgba(34,197,94,0.7)" },
              },
            }}
          >
            <MenuItem value="all">Ativas + pausadas</MenuItem>
            <MenuItem value="true">So ativas</MenuItem>
            <MenuItem value="false">So pausadas</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            value={order}
            onChange={(e) => setOrder(String(e.target.value))}
            sx={{
              minWidth: 200,
              "& .MuiOutlinedInput-root": {
                color: "#0f172a",
                bgcolor: "#fff",
                "& fieldset": { borderColor: "#cbd5e1" },
                "&:hover fieldset": { borderColor: "#94a3b8" },
                "&.Mui-focused fieldset": { borderColor: "rgba(34,197,94,0.7)" },
              },
            }}
          >
            <MenuItem value="priority_desc_updatedAt_desc">Ordenar: prioridade</MenuItem>
            <MenuItem value="createdAt_asc">Ordenar: criacao (antigos)</MenuItem>
            <MenuItem value="createdAt_desc">Ordenar: criacao (novos)</MenuItem>
            <MenuItem value="updatedAt_desc">Ordenar: atualizado (recentes)</MenuItem>
            <MenuItem value="nextRunAt_asc">Ordenar: proximo agendamento</MenuItem>
            <MenuItem value="status_asc">Ordenar: status</MenuItem>
          </TextField>
          <Tooltip title="Atualizar">
            <span>
              <IconButton
                onClick={load}
                disabled={loading}
                sx={{
                  color: "#0f172a",
                  border: "1px solid #cbd5e1",
                  bgcolor: "#fff",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.10)" },
                }}
              >
                {loading ? <CircularProgress size={18} /> : <RefreshIcon />}
              </IconButton>
            </span>
          </Tooltip>
        </div>
      </div>

      <Snackbar
        open={Boolean(snackbar?.open)}
        autoHideDuration={6000}
        onClose={() => setSnackbar((p) => (p ? { ...p, open: false } : p))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((p) => (p ? { ...p, open: false } : p))}
          severity={snackbar?.severity || "info"}
          variant="filled"
          sx={{ fontWeight: 900 }}
        >
          {snackbar?.message || ""}
        </Alert>
      </Snackbar>

      <Card sx={{ border: "1px solid #cbd5e1", bgcolor: "#ffffff", boxShadow: "0 1px 2px rgba(15,23,42,0.06)" }}>
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, color: "#0f172a" }}>
                Automacao do pipeline
              </Typography>
              <Typography variant="body2" sx={{ color: "#475569" }}>
                Cron interno: {internalCron?.started ? "iniciado" : "nao iniciado"} | verifica a cada{" "}
                {Math.round((internalCron?.tickMs || 60000) / 1000)}s | pipeline {cronConfig?.enabled ? "ligado" : "desligado"}
              </Typography>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant={cronConfig?.enabled ? "outlined" : "contained"} color={cronConfig?.enabled ? "inherit" : "success"} onClick={() => toggleCron(true)}>
                Ligar automacao
              </Button>
              <Button variant={!cronConfig?.enabled ? "outlined" : "contained"} color={!cronConfig?.enabled ? "inherit" : "warning"} onClick={() => toggleCron(false)}>
                Desligar automacao
              </Button>
            </div>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-xs font-bold text-slate-500">Ultima verificacao interna</div>
              <div className="mt-1 font-bold text-slate-900">{formatDate(internalCron?.lastTickAt)}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-xs font-bold text-slate-500">Proximo ciclo permitido</div>
              <div className="mt-1 font-bold text-slate-900">{formatDate(cronConfig?.nextCronRunAt)}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-xs font-bold text-slate-500">Contador ate o proximo ciclo</div>
              <div className="mt-1 font-bold text-slate-900">
                {secondsUntil(cronConfig?.nextCronRunAt, nowMs) === null ? "pronto agora" : `${secondsUntil(cronConfig?.nextCronRunAt, nowMs)}s`}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-xs font-bold text-slate-500">Ultimo resultado do cron</div>
              <div className="mt-1 font-bold text-slate-900">
                {internalCron?.lastError
                  ? `Erro: ${internalCron.lastError}`
                  : internalCron?.lastResult?.skipped
                    ? `Pulou: ${internalCron.lastResult.reason || "sem item elegivel"}`
                    : internalCron?.lastResult
                      ? "Executou"
                      : "Ainda sem execucao"}
              </div>
              {lastCronRun.itemId ? (
                <div className="mt-1 text-xs font-semibold text-slate-600">
                  Item: {shortId(lastCronRun.itemId)}
                  {lastCronRun.step ? ` | etapa: ${String(lastCronRun.step)}` : ""}
                  {lastCronRun.ok === false ? " | falhou" : ""}
                </div>
              ) : lastCronRun.runSkipped ? (
                <div className="mt-1 text-xs font-semibold text-slate-600">
                  Sem item: {lastCronRun.runReason || lastCronRun.reason || "nenhum elegivel"}
                </div>
              ) : null}
            </div>
          </div>
          <Typography variant="caption" sx={{ mt: 1.5, display: "block", color: "#475569" }}>
            Endpoint de diagnostico: <code>/api/shopee-pipeline/internal-cron</code> | endpoint manual: <code>/api/shopee-pipeline/cron</code>
          </Typography>
        </CardContent>
      </Card>

      <div className="grid grid-cols-4 gap-3">
        <Card className="glass-panel border border-white/10">
          <CardContent>
            <Typography variant="caption" className="text-slate-400">
              Total
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              {stats.total}
            </Typography>
          </CardContent>
        </Card>
        {Array.from(stats.byStatus.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([status, count]) => (
            <Card key={status} className="glass-panel border border-white/10">
              <CardContent>
                <Typography variant="caption" className="text-slate-400">
                  {statusLabel(status)}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                  {count}
                </Typography>
              </CardContent>
            </Card>
          ))}
      </div>

      <Card className="glass-panel border border-white/10">
        <CardContent>
          <TableContainer component={Paper} sx={{ bgcolor: "transparent", backgroundImage: "none", overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>ID</TableCell>
                  <TableCell>Criado</TableCell>
                  <TableCell align="left">Acoes</TableCell>
                  <TableCell>Produto</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Ativa</TableCell>
                  <TableCell>Prox. Execucao</TableCell>
                  <TableCell>Lock</TableCell>
                  <TableCell>Tentativas</TableCell>
                  <TableCell>Ultimo Erro</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((item, index) => (
                  <TableRow key={item.id} hover>
                    <TableCell sx={{ width: 50 }}>
                      <Typography variant="caption" className="text-slate-400">
                        {index + 1}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ width: 90 }}>
                      <Tooltip title={item.id}>
                        <Chip size="small" label={shortId(item.id)} />
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ width: 170 }}>
                      <Typography variant="caption" className="text-slate-400" noWrap>
                        {formatDate(item.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="left" sx={{ minWidth: 200 }}>
                      <Stack direction="row" sx={{ justifyContent: "flex-start", flexWrap: "wrap" }} spacing={1}>
                        <Tooltip title="Detalhes">
                          <IconButton onClick={() => openDetail(item)}>
                            <InfoOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Retomar agora: limpa agendamento e mantem a etapa atual quando ela ja esta em andamento">
                          <IconButton onClick={() => continueNow(item)}>
                            <BoltIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={item.active ? "Pausar" : "Ativar"}>
                          <IconButton onClick={() => patchItem(item.id, { active: !item.active, pipelineStatus: item.active ? "PAUSED" : "PENDING" })}>
                            {item.active ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Destravar (unlock)">
                          <IconButton onClick={() => patchItem(item.id, { unlock: true })}>
                            <LockOpenIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {item.videoFinalUrl && (
                          <Tooltip title="Abrir video final">
                            <IconButton href={item.videoFinalUrl} target="_blank">
                              <OpenInNewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 420 }}>
                      <div className="flex flex-col gap-0.5">
                        <Typography variant="body2" sx={{ fontWeight: 800 }} noWrap>
                          {item.titulo || "Produto Shopee"}
                        </Typography>
                        <Typography variant="caption" className="text-slate-400 break-all">
                          {item.url}
                        </Typography>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={statusLabel(item.pipelineStatus)} color={statusColor(item.pipelineStatus) as any} />
                    </TableCell>
                    <TableCell>{item.active ? "Sim" : "Nao"}</TableCell>
                    <TableCell>
                      {item.lockedAt
                        ? lockAgeMinutes(item.lockedAt) != null && lockAgeMinutes(item.lockedAt)! >= 2 && item.pipelineStatus === "GENERATING_COPY_VIDEO"
                          ? `Lock antigo; cron pode retomar`
                          : `Em execucao desde ${formatDate(item.lockedAt)}`
                        : item.nextRunAt
                          ? formatDate(item.nextRunAt)
                          : item.active
                            ? "Proximo ciclo"
                            : "-"}
                    </TableCell>
                    <TableCell>
                      {item.lockedAt ? (
                        <Tooltip title={`LockedBy: ${item.lockedBy || "-"}`}>
                          <Chip size="small" label={formatDate(item.lockedAt)} />
                        </Tooltip>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{item.attemptCount}</TableCell>
                    <TableCell sx={{ maxWidth: 320 }}>
                      <Typography variant="caption" className="text-slate-400" noWrap>
                        {item.lastError || "-"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={11}>
                      <Typography variant="body2" className="text-slate-400">
                        Nenhum item encontrado.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 900 }}>Detalhes do Pipeline</DialogTitle>
        <DialogContent sx={{ pb: 3 }}>
          {!selected ? null : (
            <Box className="space-y-3">
              <Alert
                severity="info"
                sx={{
                  border: "1px solid rgba(15, 23, 42, 0.10)",
                  bgcolor: "rgba(255,255,255,0.75)",
                  color: "#0f172a",
                  "& .MuiAlert-message": { width: "100%" },
                }}
              >
                <div className="flex flex-col gap-2">
                  <div className="font-extrabold">Como funciona</div>
                  <div className="text-sm">
                    Este pipeline executa <b>1 etapa por ciclo</b> (por cron ou por "Rodar agora"). Se a proxima etapa depende de servicos externos, ela pode virar{" "}
                    <b>RETRY_SCHEDULED</b> e agendar <b>nextRunAt</b>.
                  </div>
                  <div className="text-sm text-slate-700">
                    Proxima execucao deste item: <b>{selected.nextRunAt ? formatDate(selected.nextRunAt) : "assim que o cron rodar (sem nextRunAt)"}</b>
                    {cronConfig?.enabled ? (
                      <>
                        {" "}
                        • Cron configurado: <b>a cada {Number(cronConfig.runEveryMinutes || 5)} min</b>
                      </>
                    ) : (
                      ""
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="small" variant="outlined" startIcon={<OpenInNewIcon />} onClick={openCronInNewTab}>
                      Abrir endpoint do cron
                    </Button>
                    <Typography variant="caption" className="text-slate-600">
                      URL: {cronUrl} (se houver `CRON_SECRET`, a plataforma deve chamar com `?secret=...`)
                    </Typography>
                  </div>
                </div>
              </Alert>

              <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                {selected.titulo || "Produto Shopee"}
              </Typography>
              <Typography variant="caption" className="text-slate-400">
                {selected.url}
              </Typography>

              <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

              {(() => {
                const title = String(selected.titulo || "").trim();
                const description = buildManualPostDescription(selected);
                const videoUrl = String(selected.videoFinalUrl || "").trim();
                const affiliateUrl = String(selected.affiliateUrl || "").trim();
                const packageText = [
                  `Titulo: ${title || "-"}`,
                  `Descricao: ${description || "-"}`,
                  `Video: ${videoUrl || "-"}`,
                  `Afiliado: ${affiliateUrl || "-"}`,
                ].join("\n\n");

                const fields = [
                  { label: "Titulo", value: title, multiline: false },
                  { label: "Descricao", value: description, multiline: true },
                  { label: "Link do video", value: videoUrl, multiline: true, isUrl: true },
                  { label: "Link de afiliado", value: affiliateUrl, multiline: true, isUrl: true },
                ];

                return (
                  <Card variant="outlined" sx={{ borderColor: "rgba(34,197,94,0.25)", bgcolor: "rgba(34,197,94,0.07)" }}>
                    <CardContent>
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                            Postagem manual
                          </Typography>
                          <Typography variant="caption" className="text-slate-300">
                            Copie daqui e cole no TikTok, sem depender da API.
                          </Typography>
                        </div>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => copyToClipboard("pacote completo", packageText)}
                          sx={{ textTransform: "none", fontWeight: 800 }}
                        >
                          Copiar tudo
                        </Button>
                      </div>

                      <div className="mt-4 grid gap-3">
                        {fields.map((field) => (
                          <div key={field.label} className="rounded-xl border border-white/10 bg-black/10 p-3">
                            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-extrabold uppercase tracking-wide text-emerald-300">
                                  {field.label}
                                </div>
                                <pre className={`mt-2 whitespace-pre-wrap break-words rounded-lg bg-black/20 p-3 text-sm text-slate-100 ${field.multiline ? "min-h-[84px]" : ""}`}>
{field.value || "-"}
                                </pre>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="success"
                                  onClick={() => copyToClipboard(field.label, field.value)}
                                  sx={{ textTransform: "none" }}
                                >
                                  Copiar
                                </Button>
                                {field.isUrl ? (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="inherit"
                                    startIcon={<OpenInNewIcon fontSize="small" />}
                                    onClick={() => openExternalUrl(field.value)}
                                    sx={{ textTransform: "none" }}
                                  >
                                    Abrir
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

              <Card variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.10)", bgcolor: "rgba(255,255,255,0.04)" }}>
                <CardContent>
                  <div className="flex items-center justify-between gap-3">
                    <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                      Linha do tempo
                    </Typography>
                    <Typography variant="caption" className="text-slate-400">
                      Clique em uma etapa para ver logs e payloads.
                    </Typography>
                  </div>

                  <div className="mt-3">
                    <Stepper alternativeLabel nonLinear activeStep={Math.max(0, (selected.inputMode === "MANUAL_VIDEO" ? MANUAL_PIPELINE_STEPS : LEGACY_PIPELINE_STEPS).findIndex((s) => s.stepName === focusedStepName))}>
                      {(selected.inputMode === "MANUAL_VIDEO" ? MANUAL_PIPELINE_STEPS : LEGACY_PIPELINE_STEPS).map((s) => {
                        const step = (selected.pipelineSteps || []).find((p) => p.stepName === s.stepName);
                        const status = step?.status || null;
                        const ts = (step as any)?.finishedAt || (step as any)?.updatedAt || null;
                        return (
                          <Step key={s.stepName}>
                            <StepButton onClick={() => focusStep(s.stepName)} sx={{ color: "#e2e8f0" }}>
                              <div className="flex flex-col items-center">
                                <div style={{ color: stepColor(status) }}>{stepIcon(status)}</div>
                                <div className="mt-1 text-xs font-bold text-slate-200">{s.label}</div>
                                <div className="mt-1 text-[11px] text-slate-400">{formatDate(ts)}</div>
                              </div>
                            </StepButton>
                          </Step>
                        );
                      })}
                    </Stepper>
                  </div>
                </CardContent>
              </Card>

              {focusedStepName && (
                <Card variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.10)", bgcolor: "transparent" }}>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                      Etapa: {stepLabel(focusedStepName)}
                    </Typography>
                    {STEP_DETAILS[focusedStepName] ? (
                      <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3 text-slate-900">
                        <div className="text-sm font-extrabold">{STEP_DETAILS[focusedStepName].title}</div>
                        <div className="mt-1 text-sm text-slate-700">{STEP_DETAILS[focusedStepName].summary}</div>
                        <div className="mt-2 text-xs font-bold text-slate-500">O que faz</div>
                        <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
                          {STEP_DETAILS[focusedStepName].actions.map((action) => (
                            <li key={action}>{action}</li>
                          ))}
                        </ul>
                        {STEP_DETAILS[focusedStepName].waits ? (
                          <div className="mt-2 text-sm text-slate-700">
                            <b>Espera:</b> {STEP_DETAILS[focusedStepName].waits}
                          </div>
                        ) : null}
                        {STEP_DETAILS[focusedStepName].saves ? (
                          <div className="mt-1 text-sm text-slate-700">
                            <b>Salva:</b> {STEP_DETAILS[focusedStepName].saves}
                          </div>
                        ) : null}
                        <div className="mt-3 grid gap-2 md:grid-cols-3">
                          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                            <div className="text-xs font-extrabold text-slate-500">Na aplicacao</div>
                            <ul className="mt-1 list-disc pl-4 text-sm text-slate-700">
                              {(STEP_DETAILS[focusedStepName].application || []).map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                            <div className="text-xs font-extrabold text-slate-500">Na Modal</div>
                            <ul className="mt-1 list-disc pl-4 text-sm text-slate-700">
                              {(STEP_DETAILS[focusedStepName].modal || []).map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                            <div className="text-xs font-extrabold text-slate-500">No MinIO</div>
                            <ul className="mt-1 list-disc pl-4 text-sm text-slate-700">
                              {(STEP_DETAILS[focusedStepName].minio || []).map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {focusedStepName === "CREATE_STORY_AD" ? (
                      <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-slate-900">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="text-sm font-extrabold">Acompanhar postagem</div>
                            <div className="mt-1 text-xs text-slate-600">
                              O agendamento cria um <b>StoryAd</b> e os <b>SocialPosts</b> imediatamente. Quando o horario (<code>scheduledAt</code>) chega, o publisher apenas consome esses posts e publica em YouTube, Meta e TikTok.
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {selected?.videoFinalUrl ? (
                              <Button
                                size="small"
                                variant="contained"
                                href={`/admin/social?q=${encodeURIComponent(String(selected.videoFinalUrl))}`}
                                target="_blank"
                                rel="noreferrer"
                                sx={{ textTransform: "none" }}
                              >
                                Abrir na Fila Social
                              </Button>
                            ) : null}
                          </div>
                        </div>

                        {(() => {
                          const storyAd = (selected as any)?.storyAd;
                          if (!storyAd?.id) {
                            return (
                              <div className="mt-3 text-xs text-slate-500">
                                StoryAd ainda nao esta carregado neste item.
                              </div>
                            );
                          }

                          const publications = Array.isArray(storyAd.publications) ? storyAd.publications : [];
                          const readSocialPostId = (payload: any) => {
                            try {
                              const id = payload?.socialPostId;
                              return id ? String(id) : null;
                            } catch {
                              return null;
                            }
                          };

                          return (
                            <div className="mt-3 grid gap-3 md:grid-cols-3">
                              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                                <div className="text-xs font-extrabold text-slate-500">StoryAd</div>
                                <div className="mt-1 text-xs text-slate-700">
                                  <b>ID:</b> <code>{storyAd.id}</code>
                                </div>
                                <div className="mt-1 text-xs text-slate-700">
                                  <b>Status:</b> {String(storyAd.status || "-")}
                                </div>
                                <div className="mt-1 text-xs text-slate-700">
                                  <b>scheduledAt:</b> {formatDate(storyAd.scheduledAt)}
                                </div>
                              </div>

                              <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                                <div className="text-xs font-extrabold text-slate-500">Publicacoes</div>
                                {publications.length ? (
                                  <div className="mt-2 overflow-auto">
                                    <table className="min-w-full text-xs">
                                      <thead>
                                        <tr className="text-left text-slate-500">
                                          <th className="py-1 pr-3">Plataforma</th>
                                          <th className="py-1 pr-3">Status</th>
                                          <th className="py-1 pr-3">Link</th>
                                        </tr>
                                      </thead>
                                      <tbody className="text-slate-700">
                                        {publications.map((p: any) => {
                                          const socialPostId = readSocialPostId(p?.responsePayload);
                                          return (
                                            <tr key={p.id} className="border-t border-slate-200">
                                              <td className="py-1 pr-3 font-bold">{String(p.platform || "-")}</td>
                                              <td className="py-1 pr-3">{String(p.status || "-")}</td>
                                              <td className="py-1 pr-3">
                                                <div className="flex flex-wrap items-center gap-2">
                                                  {socialPostId ? (
                                                    <a
                                                      href={`/admin/social?q=${encodeURIComponent(socialPostId)}`}
                                                      target="_blank"
                                                      rel="noreferrer"
                                                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 font-bold text-slate-700 hover:bg-slate-50"
                                                    >
                                                      Fila Social
                                                      <OpenInNewIcon sx={{ fontSize: 14 }} />
                                                    </a>
                                                  ) : (
                                                    <span className="text-slate-400">SocialPost ainda nao vinculado</span>
                                                  )}
                                                  {p?.publishedUrl ? (
                                                    <a
                                                      href={String(p.publishedUrl)}
                                                      target="_blank"
                                                      rel="noreferrer"
                                                      className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700 hover:bg-emerald-100"
                                                    >
                                                      Abrir publicado
                                                      <OpenInNewIcon sx={{ fontSize: 14 }} />
                                                    </a>
                                                  ) : null}
                                                  {p?.errorMessage ? (
                                                    <span className="text-rose-700 font-bold">{String(p.errorMessage)}</span>
                                                  ) : null}
                                                </div>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <div className="mt-2 text-xs text-slate-400">Nenhuma publicacao cadastrada.</div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ) : null}

                    {(() => {
                      const step = (selected.pipelineSteps || []).find((p) => p.stepName === focusedStepName) as any;
                      if (!step) {
                        return (
                          <Typography variant="caption" className="text-slate-400">
                            Nenhuma execucao registrada para esta etapa ainda.
                          </Typography>
                        );
                      }
                      return (
                        <div className="mt-2 grid grid-cols-2 gap-3">
                          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                            <div className="text-xs text-slate-400">Status</div>
                            <div className="mt-1 text-sm font-bold text-slate-100">{statusLabel(step.status)}</div>
                            <div className="mt-2 text-xs text-slate-400">Tentativa</div>
                            <div className="mt-1 text-sm text-slate-200">{step.attempt}</div>
                            <div className="mt-2 text-xs text-slate-400">Inicio</div>
                            <div className="mt-1 text-sm text-slate-200">{formatDate(step.startedAt)}</div>
                            <div className="mt-2 text-xs text-slate-400">Fim</div>
                            <div className="mt-1 text-sm text-slate-200">{formatDate(step.finishedAt)}</div>
                            <div className="mt-2 text-xs text-slate-400">Duracao</div>
                            <div className="mt-1 text-sm text-slate-200">{step.durationMs ? `${step.durationMs} ms` : "-"}</div>
                            <div className="mt-2 text-xs text-slate-400">Prox. retry</div>
                            <div className="mt-1 text-sm text-slate-200">{formatDate(step.nextRetryAt)}</div>
                            {step.errorMessage ? (
                              <>
                                <div className="mt-2 text-xs text-slate-400">Erro</div>
                                <div className="mt-1 text-sm text-rose-200">{step.errorMessage}</div>
                              </>
                            ) : null}
                          </div>
                          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                            <div className="text-xs text-slate-400">Payloads</div>
                            <div className="mt-2 text-xs font-bold text-slate-200">Request</div>
                            <pre className="mt-1 max-h-44 overflow-auto rounded-lg bg-black/30 p-2 text-[11px] text-slate-200">
{step.requestPayload ? JSON.stringify(step.requestPayload, null, 2) : "-"}
                            </pre>
                            <div className="mt-3 text-xs font-bold text-slate-200">Response</div>
                            <pre className="mt-1 max-h-44 overflow-auto rounded-lg bg-black/30 p-2 text-[11px] text-slate-200">
{step.responsePayload ? JSON.stringify(step.responsePayload, null, 2) : "-"}
                            </pre>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Card variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.08)", bgcolor: "transparent" }}>
                  <CardContent>
                    <Typography variant="caption" className="text-slate-400">
                      Status
                    </Typography>
                    <div className="mt-1">
                      <Chip size="small" label={statusLabel(selected.pipelineStatus)} color={statusColor(selected.pipelineStatus) as any} />
                    </div>
                    <Typography variant="caption" className="text-slate-400 block mt-2">
                      Prox. Execucao:{" "}
                      {selected.lockedAt
                        ? lockAgeMinutes(selected.lockedAt) != null &&
                          lockAgeMinutes(selected.lockedAt)! >= 2 &&
                          selected.pipelineStatus === "GENERATING_COPY_VIDEO"
                          ? `Lock antigo; cron pode retomar`
                          : `Em execucao desde ${formatDate(selected.lockedAt)}`
                        : selected.nextRunAt
                          ? formatDate(selected.nextRunAt)
                          : selected.active
                            ? "Proximo ciclo do cron"
                            : "-"}
                    </Typography>
                    <Typography variant="caption" className="text-slate-400 block mt-2">
                      Lock: {selected.lockedAt ? `reservado desde ${formatDate(selected.lockedAt)}` : "-"}
                    </Typography>
                  </CardContent>
                </Card>
                <Card variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.08)", bgcolor: "transparent" }}>
                  <CardContent>
                    <Typography variant="caption" className="text-slate-400">
                      Artefatos
                    </Typography>
                    <Typography variant="caption" className="text-slate-400 block mt-2">
                      Audio: {selected.audioUrl ? "OK" : "-"} | Video Copy: {selected.copyVideoUrl ? "OK" : "-"} | Video Final:{" "}
                      {selected.videoFinalUrl ? "OK" : "-"}
                    </Typography>
                    <Typography variant="caption" className="text-slate-400 block mt-2">
                      Afiliado: {selected.affiliateUrl ? "OK" : "-"}
                    </Typography>
                  </CardContent>
                </Card>
              </div>

              <Card variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.08)", bgcolor: "transparent" }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                    Artigos SEO relacionados
                  </Typography>
                  <Typography variant="caption" className="text-slate-400 block mt-1">
                    Os artigos sao criados a partir deste item e continuam mostrando os links das redes quando as publicacoes ficarem prontas.
                  </Typography>
                  <div className="mt-3 space-y-2">
                    {(selected.relatedArticles || []).length === 0 && (
                      <Typography variant="caption" className="text-slate-400">
                        Nenhum artigo vinculado ainda.
                      </Typography>
                    )}
                    {(selected.relatedArticles || []).map((article) => (
                      <div key={article.briefId} className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <Typography variant="caption" className="text-slate-400">
                              {articleAngleLabel(article.angle)}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: "#e2e8f0" }}>
                              {article.postTitle || article.briefTitle}
                            </Typography>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            <Chip size="small" label={`Brief: ${article.briefStatus || "-"}`} />
                            {article.postStatus ? <Chip size="small" color={article.postStatus === "PUBLISHED" ? "success" : "default"} label={`Post: ${article.postStatus}`} /> : null}
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {article.adminUrl ? (
                            <Button size="small" variant="outlined" href={article.adminUrl}>
                              Abrir no sistema
                            </Button>
                          ) : null}
                          {article.publicUrl ? (
                            <Button size="small" variant="outlined" href={article.publicUrl} target="_blank" rel="noreferrer">
                              Abrir publicado
                            </Button>
                          ) : null}
                        </div>
                        {article.publishedAt ? (
                          <Typography variant="caption" className="text-slate-500 block mt-2">
                            Publicado em {formatDate(article.publishedAt)}
                          </Typography>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.08)", bgcolor: "transparent" }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                    Controle manual
                  </Typography>
                  <Typography variant="caption" className="text-slate-400 block mt-1">
                    Use "Continuar agora" para deixar o item elegivel no proximo ciclo, destravar e retomar do ponto mais proximo possivel com base nos artefatos ja gerados.
                  </Typography>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button size="small" variant="contained" startIcon={<BoltIcon />} onClick={() => continueNow(selected)}>
                      Continuar agora
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => clearNextRunForSelected()}
                    >
                      Limpar agendamento
                    </Button>
                    <Button size="small" variant="outlined" startIcon={<LockOpenIcon />} onClick={() => patchItem(selected.id, { unlock: true })}>
                      Destravar
                    </Button>
                  </div>

                  <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
                    <TextField
                      label="Agendar proxima execucao"
                      type="datetime-local"
                      value={selectedNextRunDraft}
                      onChange={(e) => setSelectedNextRunDraft(e.target.value)}
                      size="small"
                      sx={darkFieldSx}
                      slotProps={{ inputLabel: { shrink: true } }}
                      helperText="Se ficar vazio, roda no proximo ciclo do cron. Se preencher uma data futura, espera ate esse horario."
                    />
                    <Button size="small" variant="outlined" onClick={saveNextRunForSelected}>
                      Salvar horario
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.08)", bgcolor: "transparent" }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                    Steps
                  </Typography>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {(selected.pipelineSteps || []).slice(0, 12).map((step) => (
                      <div key={step.id} className="flex items-center justify-between gap-2 border border-white/10 rounded-lg px-2 py-1">
                        <Typography variant="caption" className="text-slate-900" noWrap>
                          {stepLabel(step.stepName)}
                        </Typography>
                        <Chip size="small" label={statusLabel(step.status)} />
                      </div>
                    ))}
                    {(selected.pipelineSteps || []).length === 0 && (
                      <Typography variant="caption" className="text-slate-400">
                        Nenhuma etapa registrada ainda.
                      </Typography>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.08)", bgcolor: "transparent" }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                    Logs
                  </Typography>
                  <div className="mt-2 space-y-1 max-h-[340px] overflow-auto">
                    {eventsLoading ? (
                      <div className="flex items-center gap-2">
                        <CircularProgress size={18} />
                        <Typography variant="caption" className="text-slate-400">
                          Carregando logs...
                        </Typography>
                      </div>
                    ) : (
                      events.map((ev) => (
                        <div key={ev.id} className="flex items-start justify-between gap-3 border-b border-white/5 py-1">
                          <div className="min-w-0">
                            <Typography variant="caption" className="text-slate-900">
                              [{ev.level}] {ev.stepName ? `${stepLabel(ev.stepName)}: ` : ""}
                              {ev.message}
                            </Typography>
                            {ev.metadata ? (
                              <details className="mt-1">
                                <summary className="cursor-pointer select-none text-[11px] text-slate-700 hover:text-slate-900">
                                  Ver detalhes (envio/retorno)
                                </summary>
                                {renderProviderEvents(ev.metadata)}
                                <details className="mt-2">
                                  <summary className="cursor-pointer select-none text-[11px] text-slate-700 hover:text-slate-900">Ver JSON bruto</summary>
                                  <pre className="mt-1 whitespace-pre-wrap text-[11px] text-slate-700">{truncateJson(ev.metadata, 2400)}</pre>
                                </details>
                              </details>
                            ) : null}
                          </div>
                          <Typography variant="caption" className="text-slate-600 whitespace-nowrap">
                            {formatDate(ev.createdAt)}
                          </Typography>
                        </div>
                      ))
                    )}
                    {!eventsLoading && events.length === 0 && (
                      <Typography variant="caption" className="text-slate-400">
                        Nenhum log encontrado.
                      </Typography>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        fullWidth
        maxWidth="md"
        slotProps={{
          paper: {
            sx: {
              bgcolor: "#0b0c10",
              color: "#e2e8f0",
              border: "1px solid rgba(255,255,255,0.12)",
              backgroundImage: "none",
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: "#e2e8f0" }}>Configuracao do Pipeline</DialogTitle>
        <DialogContent sx={{ pb: 3, color: "#e2e8f0" }}>
          {configLoading || !configDraft ? (
            <div className="flex items-center gap-2">
              <CircularProgress size={18} />
              <Typography variant="caption" className="text-slate-400">
                Carregando configuracao...
              </Typography>
            </div>
          ) : (
            <Box className="space-y-3">
              <Typography variant="body2" className="text-slate-300">
                "Rodar agora" roda <b>1 item elegivel</b> por clique (independente do cron).
              </Typography>

              <div className="grid grid-cols-3 gap-3">
                <Box className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={Boolean(configDraft.enabled)}
                        onChange={(_, checked) => setConfigDraft((p: any) => ({ ...p, enabled: checked }))}
                      />
                    }
                    label={<Typography sx={{ fontWeight: 900 }}>Pipeline ativo</Typography>}
                  />
                  <Typography variant="caption" className="text-slate-400">
                    Desligado = nada roda (cron e manual).
                  </Typography>
                </Box>
                <TextField
                  label="Rodar automaticamente a cada (min)"
                  value={String(configDraft.runEveryMinutes)}
                  onChange={(e) => setConfigDraft((p: any) => ({ ...p, runEveryMinutes: e.target.value }))}
                  helperText="Intervalo do cron /api/shopee-pipeline/cron."
                  size="small"
                  sx={darkFieldSx}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  label="Max. itens por ciclo (cron)"
                  value={String(configDraft.maxItemsPerRun)}
                  onChange={(e) => setConfigDraft((p: any) => ({ ...p, maxItemsPerRun: e.target.value }))}
                  helperText="Limite por execucao automatica. (Manual sempre tenta 1)."
                  size="small"
                  sx={darkFieldSx}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </div>

              <Box className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <Typography variant="caption" className="text-slate-300">
                  Cron real: o Next.js nao dispara sozinho; a plataforma precisa chamar o endpoint. Quando chamado antes da hora, agora ele pula.
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 800, color: "#e2e8f0" }}>
                  Proxima chamada aceita: {configDraft.nextCronRunAt ? formatDate(configDraft.nextCronRunAt) : "na proxima chamada externa"}
                  {configDraft.lastCronRunAt ? ` | ultima: ${formatDate(configDraft.lastCronRunAt)}` : ""}
                </Typography>
              </Box>

              <TextField
                label="URL publica do audio de referencia (voz)"
                value={configDraft.userVoiceRefUrl}
                onChange={(e) => setConfigDraft((p: any) => ({ ...p, userVoiceRefUrl: e.target.value }))}
                helperText="Pasta/URL publica do MinIO onde ficam os audios de referencia do usuario (voice clone)."
                size="small"
                fullWidth
                sx={darkFieldSx}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="URL publica da imagem base (avatar/foto)"
                value={configDraft.userBaseImageUrl}
                onChange={(e) => setConfigDraft((p: any) => ({ ...p, userBaseImageUrl: e.target.value }))}
                helperText="Pasta/URL publica do MinIO onde ficam as imagens base do usuario (usado no video)."
                size="small"
                fullWidth
                sx={darkFieldSx}
                slotProps={{ inputLabel: { shrink: true } }}
              />

              <TextField
                label="Template de audio legado (nao usado pela Modal)"
                value={configDraft.comfyAudioPromptTemplate ? JSON.stringify(configDraft.comfyAudioPromptTemplate, null, 2) : ""}
                onChange={(e) => {
                  const text = e.target.value;
                  try {
                    const parsed = text.trim() ? JSON.parse(text) : null;
                    setConfigDraft((p: any) => ({ ...p, comfyAudioPromptTemplate: parsed }));
                  } catch {
                    // deixa como string invalida, mas nao quebra a tela
                    setConfigDraft((p: any) => ({ ...p, comfyAudioPromptTemplate: p.comfyAudioPromptTemplate }));
                  }
                }}
                size="small"
                fullWidth
                multiline
                minRows={6}
                sx={darkFieldSx}
              />
              <TextField
                label="Template de video legado (nao usado pela Modal)"
                value={configDraft.comfyVideoPromptTemplate ? JSON.stringify(configDraft.comfyVideoPromptTemplate, null, 2) : ""}
                onChange={(e) => {
                  const text = e.target.value;
                  try {
                    const parsed = text.trim() ? JSON.parse(text) : null;
                    setConfigDraft((p: any) => ({ ...p, comfyVideoPromptTemplate: parsed }));
                  } catch {
                    setConfigDraft((p: any) => ({ ...p, comfyVideoPromptTemplate: p.comfyVideoPromptTemplate }));
                  }
                }}
                size="small"
                fullWidth
                multiline
                minRows={8}
                sx={darkFieldSx}
                helperText="Mantido apenas para compatibilidade historica. O workflow ativo agora fica versionado dentro do worker Modal."
              />

              <div className="flex justify-end gap-2 pt-1">
                <Button onClick={() => setConfigOpen(false)} color="inherit">
                  Fechar
                </Button>
                <Button variant="outlined" color="warning" onClick={resetCronSchedule} disabled={configLoading}>
                  Resetar agenda
                </Button>
                <Button variant="contained" onClick={saveConfig} disabled={configLoading}>
                  Salvar
                </Button>
              </div>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
