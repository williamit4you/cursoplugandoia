"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  createdAt: string;
  updatedAt: string;
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
};

type PodSession = {
  id: string;
  status: string;
  lastOnlineCheckAt?: string | null;
  lastActivityAt?: string | null;
  updatedAt?: string | null;
  errorMessage?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("pt-BR");
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

const PIPELINE_STEPS: Array<{ stepName: string; label: string }> = [
  { stepName: "SCRAPE_MEDIA", label: "Scraping" },
  { stepName: "ENSURE_POD_ONLINE", label: "POD" },
  { stepName: "GENERATE_AUDIO", label: "Áudio" },
  { stepName: "GENERATE_COPY_VIDEO", label: "Vídeo Copy" },
  { stepName: "MERGE_VIDEOS", label: "Merge" },
  { stepName: "GENERATE_AFFILIATE_LINK", label: "Afiliado" },
  { stepName: "CREATE_BIO_PRODUCT", label: "Bio" },
  { stepName: "CREATE_STORY_AD", label: "Story" },
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

export default function ShopeePipelinePage() {
  const [items, setItems] = useState<ColetaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<ColetaItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [events, setEvents] = useState<PipelineEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [pod, setPod] = useState<{ online: boolean; session: PodSession | null } | null>(null);
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

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/shopee-pipeline/items?take=100", { cache: "no-store" });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);

      const podRes = await fetch("/api/shopee-pipeline/pod-session", { cache: "no-store" }).catch(() => null);
      const podData = podRes ? await podRes.json().catch(() => null) : null;
      if (podData && typeof podData === "object") {
        setPod({ online: Boolean((podData as any).online), session: ((podData as any).session as any) || null });
      }
    } finally {
      setLoading(false);
    }
  };

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
    load();
  }, []);

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
        message: `Item preparado para continuar. Etapa de retomada: ${String((data as any)?.resumeInfo?.resumedStatus || item.pipelineStatus)}. Agora clique em “Rodar agora”.`,
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
          ? `Próxima execução agendada para ${formatDate(new Date(selectedNextRunDraft).toISOString())}.`
          : "Agendamento removido. O item pode rodar assim que ficar elegível.",
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        severity: "error",
        message: error?.message || "Falha ao salvar horário.",
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
        message: "Agendamento removido. O item pode rodar assim que ficar elegível.",
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
              <b>Motivo:</b> {reason || "Nenhum item elegível no momento."}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.95 }}>
              <b>Regra:</b>{" "}
              {rule || "Escolhe 1 item elegível (active=true, status != PAUSED/PUBLISHED, nextRunAt <= agora, sem lock recente)."}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.95 }}>
              <b>Para rodar:</b>{" "}
              {howToFix || "Garanta um item elegível e clique em “Rodar agora” (raio verde)."}
            </Typography>
            {details?.counts ? (
              <Typography variant="caption" sx={{ opacity: 0.9, display: "block" }}>
                Diagnóstico: ativos={details.counts.totalActive}, excluídos(PAUSED/PUBLISHED)={details.counts.excludedByStatus},
                bloqueados(nextRunAt)={details.counts.blockedByNextRunAt}, bloqueados(lock)={details.counts.blockedByLock}.
              </Typography>
            ) : null}
            {details?.samples?.earliestFuture?.nextRunAt ? (
              <Typography variant="caption" sx={{ opacity: 0.9, display: "block" }}>
                Próximo agendado: {String(details.samples.earliestFuture.id)} em {String(details.samples.earliestFuture.nextRunAt)}.
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
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <div>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Shopee Pipeline
          </Typography>
          <Typography variant="body2" className="text-slate-400">
            Estado, logs e passos por URL (1 URL = 1 post).
          </Typography>
        </div>

        <div className="flex items-center gap-2">
          <Chip
            size="small"
            label={
              pod
                ? `POD: ${pod.online ? "ONLINE" : "OFFLINE"}${pod.session?.status ? ` (${pod.session.status})` : ""}`
                : "POD: -"
            }
            color={pod?.online ? "success" : "default"}
            variant="outlined"
            sx={{
              color: "#e2e8f0",
              borderColor: "rgba(255,255,255,0.18)",
              bgcolor: "rgba(255,255,255,0.06)",
              fontWeight: 800,
            }}
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
              color: "#e2e8f0",
              borderColor: "rgba(255,255,255,0.22)",
              bgcolor: "rgba(255,255,255,0.06)",
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
                  color: "#e2e8f0",
                  border: "1px solid rgba(255,255,255,0.18)",
                  bgcolor: "rgba(255,255,255,0.06)",
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
                color: "#e2e8f0",
                bgcolor: "rgba(255,255,255,0.06)",
                "& fieldset": { borderColor: "rgba(255,255,255,0.18)" },
                "&:hover fieldset": { borderColor: "rgba(255,255,255,0.28)" },
                "&.Mui-focused fieldset": { borderColor: "rgba(34,197,94,0.7)" },
              },
              "& input::placeholder": { color: "rgba(226,232,240,0.65)", opacity: 1 },
            }}
          />
          <Tooltip title="Atualizar">
            <span>
              <IconButton
                onClick={load}
                disabled={loading}
                sx={{
                  color: "#e2e8f0",
                  border: "1px solid rgba(255,255,255,0.18)",
                  bgcolor: "rgba(255,255,255,0.06)",
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
                  {status}
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
          <TableContainer component={Paper} sx={{ bgcolor: "transparent", backgroundImage: "none" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Produto</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Ativa</TableCell>
                  <TableCell>Próx. Execução</TableCell>
                  <TableCell>Lock</TableCell>
                  <TableCell>Tentativas</TableCell>
                  <TableCell>Último Erro</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell sx={{ maxWidth: 420 }}>
                      <div className="flex flex-col gap-0.5">
                        <Typography variant="body2" sx={{ fontWeight: 800 }} noWrap>
                          {item.titulo || "Produto Shopee"}
                        </Typography>
                        <Typography variant="caption" className="text-slate-400" noWrap>
                          {item.url}
                        </Typography>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={item.pipelineStatus} color={statusColor(item.pipelineStatus) as any} />
                    </TableCell>
                    <TableCell>{item.active ? "Sim" : "Não"}</TableCell>
                    <TableCell>{formatDate(item.nextRunAt)}</TableCell>
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
                    <TableCell align="right">
                      <Stack direction="row" sx={{ justifyContent: "flex-end" }} spacing={1}>
                        <Tooltip title="Detalhes">
                          <IconButton onClick={() => openDetail(item)}>
                            <InfoOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Preparar para continuar agora">
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
                  </TableRow>
                ))}
                {filtered.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={8}>
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
              <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                {selected.titulo || "Produto Shopee"}
              </Typography>
              <Typography variant="caption" className="text-slate-400">
                {selected.url}
              </Typography>

              <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

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
                    <Stepper alternativeLabel nonLinear activeStep={Math.max(0, PIPELINE_STEPS.findIndex((s) => s.stepName === focusedStepName))}>
                      {PIPELINE_STEPS.map((s) => {
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
                      Etapa: {focusedStepName}
                    </Typography>
                    {(() => {
                      const step = (selected.pipelineSteps || []).find((p) => p.stepName === focusedStepName) as any;
                      if (!step) {
                        return (
                          <Typography variant="caption" className="text-slate-400">
                            Nenhuma execução registrada para esta etapa ainda.
                          </Typography>
                        );
                      }
                      return (
                        <div className="mt-2 grid grid-cols-2 gap-3">
                          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                            <div className="text-xs text-slate-400">Status</div>
                            <div className="mt-1 text-sm font-bold text-slate-100">{step.status}</div>
                            <div className="mt-2 text-xs text-slate-400">Tentativa</div>
                            <div className="mt-1 text-sm text-slate-200">{step.attempt}</div>
                            <div className="mt-2 text-xs text-slate-400">Início</div>
                            <div className="mt-1 text-sm text-slate-200">{formatDate(step.startedAt)}</div>
                            <div className="mt-2 text-xs text-slate-400">Fim</div>
                            <div className="mt-1 text-sm text-slate-200">{formatDate(step.finishedAt)}</div>
                            <div className="mt-2 text-xs text-slate-400">Duração</div>
                            <div className="mt-1 text-sm text-slate-200">{step.durationMs ? `${step.durationMs} ms` : "-"}</div>
                            <div className="mt-2 text-xs text-slate-400">Próx. retry</div>
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
                      <Chip size="small" label={selected.pipelineStatus} color={statusColor(selected.pipelineStatus) as any} />
                    </div>
                    <Typography variant="caption" className="text-slate-400 block mt-2">
                      Próx. Execução: {formatDate(selected.nextRunAt)}
                    </Typography>
                    <Typography variant="caption" className="text-slate-400 block mt-2">
                      Lock: {selected.lockedAt ? formatDate(selected.lockedAt) : "-"}
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
                    Controle manual
                  </Typography>
                  <Typography variant="caption" className="text-slate-400 block mt-1">
                    Use “Continuar agora” para limpar o agendamento, destravar o item e retomar do ponto mais próximo possível com base nos artefatos já gerados.
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
                      label="Agendar próxima execução"
                      type="datetime-local"
                      value={selectedNextRunDraft}
                      onChange={(e) => setSelectedNextRunDraft(e.target.value)}
                      size="small"
                      sx={darkFieldSx}
                      slotProps={{ inputLabel: { shrink: true } }}
                      helperText="Defina manualmente quando este item volta a ficar elegível."
                    />
                    <Button size="small" variant="outlined" onClick={saveNextRunForSelected}>
                      Salvar horário
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
                        <Typography variant="caption" className="text-slate-300" noWrap>
                          {step.stepName}
                        </Typography>
                        <Chip size="small" label={step.status} />
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
                            <Typography variant="caption" className="text-slate-300">
                              [{ev.level}] {ev.stepName ? `${ev.stepName}: ` : ""}
                              {ev.message}
                            </Typography>
                          </div>
                          <Typography variant="caption" className="text-slate-500 whitespace-nowrap">
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
        <DialogTitle sx={{ fontWeight: 900, color: "#e2e8f0" }}>Configuração do Pipeline</DialogTitle>
        <DialogContent sx={{ pb: 3, color: "#e2e8f0" }}>
          {configLoading || !configDraft ? (
            <div className="flex items-center gap-2">
              <CircularProgress size={18} />
              <Typography variant="caption" className="text-slate-400">
                Carregando configuração...
              </Typography>
            </div>
          ) : (
            <Box className="space-y-3">
              <Typography variant="body2" className="text-slate-300">
                “Rodar agora” roda <b>1 item elegível</b> por clique (independente do cron).
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
                  label="Máx. itens por ciclo (cron)"
                  value={String(configDraft.maxItemsPerRun)}
                  onChange={(e) => setConfigDraft((p: any) => ({ ...p, maxItemsPerRun: e.target.value }))}
                  helperText="Limite por execução automática. (Manual sempre tenta 1)."
                  size="small"
                  sx={darkFieldSx}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </div>

              <TextField
                label="URL pública do áudio de referência (voz)"
                value={configDraft.userVoiceRefUrl}
                onChange={(e) => setConfigDraft((p: any) => ({ ...p, userVoiceRefUrl: e.target.value }))}
                helperText="Pasta/URL pública do MinIO onde ficam os áudios de referência do usuário (voice clone)."
                size="small"
                fullWidth
                sx={darkFieldSx}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="URL pública da imagem base (avatar/foto)"
                value={configDraft.userBaseImageUrl}
                onChange={(e) => setConfigDraft((p: any) => ({ ...p, userBaseImageUrl: e.target.value }))}
                helperText="Pasta/URL pública do MinIO onde ficam as imagens base do usuário (usado no vídeo)."
                size="small"
                fullWidth
                sx={darkFieldSx}
                slotProps={{ inputLabel: { shrink: true } }}
              />

              <TextField
                label="ComfyUI Audio Template (JSON)"
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
                label="ComfyUI Video Template (JSON - Infinite Talk prompt API)"
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
              />

              <div className="flex justify-end gap-2 pt-1">
                <Button onClick={() => setConfigOpen(false)} color="inherit">
                  Fechar
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
