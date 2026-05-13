"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
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
  IconButton,
  Paper,
  Stack,
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

function statusColor(status: string) {
  if (status === "FAILED") return "error";
  if (status === "PUBLISHED") return "success";
  if (status === "WAITING_POD") return "warning";
  if (status === "PENDING") return "default";
  if (status.endsWith("_READY")) return "info";
  if (status === "PAUSED") return "default";
  return "primary";
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
    setDetailOpen(true);
    setEvents([]);
    setEventsLoading(true);
    try {
      const res = await fetch(`/api/shopee-pipeline/items/${item.id}/events?take=200`, { cache: "no-store" });
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } finally {
      setEventsLoading(false);
    }
  };

  const patchItem = async (id: string, patch: any) => {
    await fetch(`/api/shopee-pipeline/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    await load();
  };

  return (
    <Box className="space-y-6">
      <div className="flex items-center justify-between gap-3">
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
          />
          <Tooltip title="Configurar pipeline">
            <span>
              <IconButton
                onClick={async () => {
                  setConfigOpen(true);
                  await loadConfig();
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
            sx={{ minWidth: 360 }}
          />
          <Tooltip title="Atualizar">
            <span>
              <IconButton onClick={load} disabled={loading}>
                {loading ? <CircularProgress size={18} /> : <RefreshIcon />}
              </IconButton>
            </span>
          </Tooltip>
        </div>
      </div>

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

      <Dialog open={configOpen} onClose={() => setConfigOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 900 }}>Configuração do Pipeline</DialogTitle>
        <DialogContent sx={{ pb: 3 }}>
          {configLoading || !configDraft ? (
            <div className="flex items-center gap-2">
              <CircularProgress size={18} />
              <Typography variant="caption" className="text-slate-400">
                Carregando configuração...
              </Typography>
            </div>
          ) : (
            <Box className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <TextField
                  label="Ativo (true/false)"
                  value={String(Boolean(configDraft.enabled))}
                  onChange={(e) => setConfigDraft((p: any) => ({ ...p, enabled: e.target.value === "true" }))}
                  size="small"
                />
                <TextField
                  label="Run a cada (min)"
                  value={String(configDraft.runEveryMinutes)}
                  onChange={(e) => setConfigDraft((p: any) => ({ ...p, runEveryMinutes: e.target.value }))}
                  size="small"
                />
                <TextField
                  label="Máx. itens por ciclo"
                  value={String(configDraft.maxItemsPerRun)}
                  onChange={(e) => setConfigDraft((p: any) => ({ ...p, maxItemsPerRun: e.target.value }))}
                  size="small"
                />
              </div>

              <TextField
                label="userVoiceRefUrl (MinIO/public URL)"
                value={configDraft.userVoiceRefUrl}
                onChange={(e) => setConfigDraft((p: any) => ({ ...p, userVoiceRefUrl: e.target.value }))}
                size="small"
                fullWidth
              />
              <TextField
                label="userBaseImageUrl (MinIO/public URL)"
                value={configDraft.userBaseImageUrl}
                onChange={(e) => setConfigDraft((p: any) => ({ ...p, userBaseImageUrl: e.target.value }))}
                size="small"
                fullWidth
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
