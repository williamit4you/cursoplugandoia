"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type SocialPost = {
  id: string;
  platform: string;
  postType: string;
  status: string;
  videoUrl?: string | null;
  scheduledTo?: string | null;
  postedAt?: string | null;
  postUrl?: string | null;
  youtubePostUrl?: string | null;
  metaReelPostUrl?: string | null;
  metaStoryPostUrl?: string | null;
  tiktokPostUrl?: string | null;
  linkedinPostUrl?: string | null;
  log?: string | null;
};

type PipelineStep = {
  id: string;
  stepName: string;
  status: string;
  attempt?: number | null;
  errorMessage?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  durationMs?: number | null;
  nextRetryAt?: string | null;
  requestPayload?: unknown;
  responsePayload?: unknown;
  updatedAt: string;
};

type LinkedPost = {
  id: string;
  title: string;
  status: string;
  slug: string;
  summary?: string | null;
};

type VideoEngagementItem = {
  id: string;
  status: string;
  title?: string | null;
  description?: string | null;
  videoUrl?: string | null;
  audioUrl?: string | null;
  captionsUrl?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
  socialPosts: SocialPost[];
  pipelineSteps: PipelineStep[];
  linkedPost?: LinkedPost | null;
  metadata?: any;
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
  enabled?: boolean;
  started?: boolean;
  running?: boolean;
  tickMs?: number;
  lastTickAt?: string | null;
  lastResult?: any;
  lastError?: string | null;
};

const STEP_ORDER = [
  { key: "QUEUE_FROM_POST", label: "Fila do artigo", description: "O post entrou na fila para ganhar video automaticamente." },
  { key: "AUTO_START", label: "Disparo", description: "O cron ou o botao manual acordou o projeto e iniciou a execucao." },
  { key: "GENERATE_SCRIPT", label: "Resumo IA", description: "A IA resume o artigo e prepara o texto curto da narracao." },
  { key: "RENDER_VIDEO", label: "Audio + video", description: "Gera o audio da sua voz, sobe no MinIO e depois monta o video falado." },
  { key: "ENQUEUE_SOCIAL", label: "Fila social", description: "Quando o MP4 fica pronto, o sistema cria os agendamentos nas redes." },
] as const;

const SOCIAL_TRACKED_PLATFORMS = [
  { platform: "TIKTOK", label: "TikTok" },
  { platform: "YOUTUBE", label: "YouTube" },
  { platform: "META", label: "Instagram" },
] as const;

function isStepSuccess(status: string) {
  return status === "SUCCESS" || status === "DONE";
}

function isStepRunning(status: string) {
  return status === "RUNNING" || status === "GENERATING" || status === "RENDERING" || status === "READY";
}

function isProjectActivelyProcessing(item: VideoEngagementItem | null) {
  if (!item) return false;
  if (item.status === "FAILED" || item.status === "DONE") return false;
  if (item.videoUrl) return false;
  return true;
}

function computeProgress(item: VideoEngagementItem | null) {
  if (!item) return 0;
  let completed = 0;

  for (const step of STEP_ORDER) {
    const status = stepStatus(item, step.key);
    if (isStepSuccess(status)) completed += 1;
    else if (isStepRunning(status)) completed += 0.5;
  }

  return Math.max(0, Math.min(100, Math.round((completed / STEP_ORDER.length) * 100)));
}

function currentStageLabel(item: VideoEngagementItem | null) {
  if (!item) return "Nenhum projeto selecionado.";
  if (item.status === "FAILED") return "Falhou. Veja o erro e o log abaixo.";
  if (item.status === "DONE") return "Video finalizado. Agora o foco e a fila social/publicacao.";

  for (const step of STEP_ORDER) {
    const status = stepStatus(item, step.key);
    if (status === "FAILED") return `${step.label} falhou. Veja o log abaixo.`;
    if (isStepRunning(status)) return `${step.label} em andamento...`;
  }

  const firstPending = STEP_ORDER.find((step) => stepStatus(item, step.key) === "PENDING");
  if (firstPending) return `Aguardando inicio de ${firstPending.label}...`;
  return "Aguardando atualizacao do projeto...";
}

function fmtDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("pt-BR");
}

function statusBadge(status: string) {
  if (status === "DONE" || status === "SUCCESS" || status === "POSTED" || status === "PUBLISHED") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (status === "FAILED" || status === "ERROR") return "bg-rose-50 text-rose-700 border-rose-200";
  if (status === "RENDERING" || status === "RUNNING" || status === "GENERATING" || status === "READY") {
    return "bg-sky-50 text-sky-700 border-sky-200";
  }
  if (status === "SCHEDULED" || status === "RETRY_SCHEDULED") {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  return "bg-slate-50 text-slate-600 border-slate-200";
}

function stepStatus(item: VideoEngagementItem, key: string) {
  const step = item.pipelineSteps.find((entry) => entry.stepName === key);
  return step?.status || "PENDING";
}

function stepError(item: VideoEngagementItem, key: string) {
  return item.pipelineSteps.find((entry) => entry.stepName === key)?.errorMessage || null;
}

function socialPublishedUrl(post: SocialPost) {
  return post.postUrl || post.youtubePostUrl || post.metaReelPostUrl || post.metaStoryPostUrl || post.tiktokPostUrl || post.linkedinPostUrl || null;
}

function socialLabel(platform: string) {
  if (platform === "META") return "Instagram";
  if (platform === "YOUTUBE") return "YouTube";
  if (platform === "TIKTOK") return "TikTok";
  return platform;
}

function truncateJson(value: unknown, maxLen = 2400) {
  if (value === null || value === undefined) return "-";
  let text = "";
  try {
    text = JSON.stringify(value, null, 2);
  } catch {
    text = String(value);
  }
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen)}\n...(truncado)`;
}

function stepTone(status: string) {
  if (isStepSuccess(status)) {
    return {
      border: "border-emerald-200",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      line: "bg-emerald-400",
      dot: "bg-emerald-500 ring-emerald-100",
      symbol: "✓",
    };
  }
  if (status === "FAILED") {
    return {
      border: "border-rose-200",
      bg: "bg-rose-50",
      text: "text-rose-700",
      line: "bg-rose-400",
      dot: "bg-rose-500 ring-rose-100",
      symbol: "!",
    };
  }
  if (isStepRunning(status)) {
    return {
      border: "border-sky-200",
      bg: "bg-sky-50",
      text: "text-sky-700",
      line: "bg-sky-400",
      dot: "bg-sky-500 ring-sky-100",
      symbol: "•",
    };
  }
  if (status === "RETRY_SCHEDULED" || status === "SCHEDULED") {
    return {
      border: "border-amber-200",
      bg: "bg-amber-50",
      text: "text-amber-700",
      line: "bg-amber-400",
      dot: "bg-amber-500 ring-amber-100",
      symbol: "↺",
    };
  }
  return {
    border: "border-slate-200",
    bg: "bg-white",
    text: "text-slate-500",
    line: "bg-slate-200",
    dot: "bg-slate-300 ring-slate-100",
    symbol: "·",
  };
}

export default function VideoEngajamentoPage() {
  const [items, setItems] = useState<VideoEngagementItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<VideoEngagementItem | null>(null);
  const [events, setEvents] = useState<PipelineEvent[]>([]);
  const [internalCron, setInternalCron] = useState<InternalCronStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [runningPostId, setRunningPostId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [error, setError] = useState<string | null>(null);
  const [streamState, setStreamState] = useState<"idle" | "connecting" | "live" | "reconnecting" | "closed">("idle");
  const [lastStreamEventAt, setLastStreamEventAt] = useState<string | null>(null);
  const [logLimit, setLogLimit] = useState<5 | 50 | 9999>(50);
  const [detailOpen, setDetailOpen] = useState(false);
  const [focusedStepKey, setFocusedStepKey] = useState<string | null>(STEP_ORDER[0].key);
  const eventSourceRef = useRef<EventSource | null>(null);

  const loadItems = async (keepSelection = true) => {
    setRefreshing(true);
    try {
      const qs = new URLSearchParams();
      if (query.trim()) qs.set("q", query.trim());
      if (status !== "ALL") qs.set("status", status);
      const res = await fetch(`/api/video-engagement/items?${qs.toString()}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Falha ao carregar videos");
      const cronRes = await fetch("/api/video-engagement/internal-cron", { cache: "no-store" }).catch(() => null);
      const cronData = cronRes?.ok ? await cronRes.json().catch(() => null) : null;
      setInternalCron(cronData && typeof cronData === "object" ? cronData : null);
      const nextItems = Array.isArray(data.items) ? data.items : [];
      setItems(nextItems);
      if (!keepSelection) return;
      if (selectedId) {
        const fresh = nextItems.find((item: VideoEngagementItem) => item.id === selectedId) || null;
        setSelected(fresh);
      } else if (nextItems[0]) {
        setSelectedId(nextItems[0].id);
        setSelected(nextItems[0]);
      }
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Falha ao carregar");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadSelected = async (id: string) => {
    const [itemRes, eventsRes] = await Promise.all([
      fetch(`/api/video-engagement/items/${id}`, { cache: "no-store" }),
      fetch(`/api/video-code/projects/${id}/events?take=200`, { cache: "no-store" }),
    ]);
    const itemData = await itemRes.json().catch(() => ({}));
    const eventsData = await eventsRes.json().catch(() => []);
    if (itemRes.ok) setSelected(itemData);
    if (eventsRes.ok) setEvents(Array.isArray(eventsData) ? eventsData : []);
  };

  useEffect(() => {
    loadItems(false);
  }, [query, status]);

  useEffect(() => {
    fetch("/api/video-engagement/internal-cron", { cache: "no-store" }).catch(() => null);
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    loadSelected(selectedId).catch(() => null);
  }, [selectedId]);

  useEffect(() => {
    if (!selected) return;
    const firstInteresting =
      STEP_ORDER.find((step) => {
        const state = stepStatus(selected, step.key);
        return state !== "PENDING";
      })?.key || STEP_ORDER[0].key;
    setFocusedStepKey((current) => current || firstInteresting);
  }, [selected]);

  useEffect(() => {
    if (!selectedId) return;

    eventSourceRef.current?.close();
    setStreamState("connecting");

    const since = new Date().toISOString();
    const source = new EventSource(`/api/video-code/projects/${selectedId}/events/stream?since=${encodeURIComponent(since)}`);
    eventSourceRef.current = source;

    source.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed?.type === "connected") {
          setStreamState("live");
          return;
        }
        if (parsed?.type === "error") {
          setStreamState("reconnecting");
          return;
        }
        if (parsed?.type === "event" && parsed.payload) {
          const nextEvent = parsed.payload as PipelineEvent;
          setEvents((prev) => {
            if (prev.some((item) => item.id === nextEvent.id)) return prev;
            return [...prev, nextEvent];
          });
          setLastStreamEventAt(new Date().toISOString());
          loadSelected(selectedId).catch(() => null);
          loadItems(true).catch(() => null);
        }
      } catch {
        setStreamState("reconnecting");
      }
    };

    source.onerror = () => {
      setStreamState("reconnecting");
    };

    return () => {
      source.close();
      eventSourceRef.current = null;
      setStreamState("closed");
    };
  }, [selectedId]);

  useEffect(() => {
    const intervalMs = isProjectActivelyProcessing(selected) ? 2500 : 10000;
    const timer = window.setInterval(() => {
      loadItems(true).catch(() => null);
      if (selectedId) loadSelected(selectedId).catch(() => null);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [selectedId, query, status, selected]);

  useEffect(() => {
    if (!detailOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDetailOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [detailOpen]);

  const counts = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.total += 1;
        if (item.status === "DONE") acc.done += 1;
        else if (item.status === "FAILED") acc.failed += 1;
        else acc.running += 1;
        return acc;
      },
      { total: 0, done: 0, failed: 0, running: 0 }
    );
  }, [items]);

  const triggerManual = async (postId: string) => {
    setRunningPostId(postId);
    try {
      const res = await fetch(`/api/posts/${postId}/generate-video`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trigger: "manual_video_engagement" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Falha ao iniciar video");
      await loadItems(true);
      if (data?.projectId) {
        setSelectedId(String(data.projectId));
        await loadSelected(String(data.projectId));
        setDetailOpen(true);
      }
    } catch (err: any) {
      setError(err?.message || "Falha ao iniciar");
    } finally {
      setRunningPostId(null);
    }
  };

  const selectedProgress = useMemo(() => computeProgress(selected), [selected]);
  const selectedStageLabel = useMemo(() => currentStageLabel(selected), [selected]);
  const selectedIsRunning = useMemo(() => isProjectActivelyProcessing(selected), [selected]);
  const orderedEvents = useMemo(
    () =>
      [...events].sort((a, b) => {
        const at = new Date(a.createdAt).getTime();
        const bt = new Date(b.createdAt).getTime();
        return bt - at;
      }),
    [events]
  );
  const visibleEvents = useMemo(() => orderedEvents.slice(0, logLimit), [orderedEvents, logLimit]);
  const liveTailEvents = useMemo(() => orderedEvents.slice(0, 5), [orderedEvents]);
  const cronSummary = useMemo(() => {
    if (!internalCron) return "Cron ainda nao consultado.";
    if (internalCron.lastError) return `Erro: ${internalCron.lastError}`;
    if (internalCron.lastResult?.skipped) return `Pulou: ${internalCron.lastResult.reason || "sem item elegivel"}`;
    if (internalCron.lastResult?.runs?.length) return `Ultimo ciclo processou ${internalCron.lastResult.runs.length} item(ns).`;
    return internalCron.running ? "Cron em execucao agora." : "Cron ativo aguardando proximo ciclo.";
  }, [internalCron]);
  const streamBadge = useMemo(() => {
    if (streamState === "live") return { label: "Log ao vivo conectado", cls: "border-emerald-200 bg-emerald-50 text-emerald-700" };
    if (streamState === "connecting") return { label: "Conectando ao log ao vivo...", cls: "border-sky-200 bg-sky-50 text-sky-700" };
    if (streamState === "reconnecting") return { label: "Reconectando log ao vivo...", cls: "border-amber-200 bg-amber-50 text-amber-700" };
    return { label: "Log ao vivo inativo", cls: "border-slate-200 bg-slate-50 text-slate-600" };
  }, [streamState]);

  const focusedStepDef = useMemo(
    () => STEP_ORDER.find((step) => step.key === focusedStepKey) || STEP_ORDER[0],
    [focusedStepKey]
  );
  const focusedStepRecord = useMemo(
    () => selected?.pipelineSteps.find((step) => step.stepName === focusedStepDef.key) || null,
    [selected, focusedStepDef]
  );
  const focusedStepEvents = useMemo(
    () => orderedEvents.filter((event) => (focusedStepDef.key ? event.stepName === focusedStepDef.key : true)),
    [orderedEvents, focusedStepDef]
  );
  const selectedSocialSlots = useMemo(() => {
    if (!selected) return [];
    return SOCIAL_TRACKED_PLATFORMS.map((slot) => ({
      ...slot,
      post: selected.socialPosts.find((item) => item.platform === slot.platform) || null,
    }));
  }, [selected]);

  return (
    <div className="space-y-6 overflow-x-hidden">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Video Engajamento</h1>
        <p className="text-slate-500 text-sm font-medium mt-1">
          Acompanha os videos gerados a partir de artigos. O automatico tenta criar o video assim que o post nasce, mesmo em rascunho.
        </p>
        {selected && (
          <div className={`mt-4 rounded-2xl border px-4 py-4 ${selectedIsRunning ? "border-sky-200 bg-sky-50" : "border-slate-200 bg-slate-50"}`}>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs uppercase font-black tracking-wide text-slate-400">Status atual</div>
                <div className="mt-1 text-lg font-black text-slate-800">{selectedStageLabel}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {selectedIsRunning ? "Auto-refresh acelerado ativo enquanto este projeto estiver processando." : "Projeto parado, pronto ou com falha."}
                </div>
                <div className={`mt-3 inline-flex rounded-full border px-3 py-1 text-[11px] font-black ${streamBadge.cls}`}>
                  {streamBadge.label}
                  {lastStreamEventAt ? ` • ultimo evento ${fmtDate(lastStreamEventAt)}` : ""}
                </div>
              </div>
              <div className="min-w-[220px]">
                <div className="flex items-center justify-between text-xs font-black text-slate-500">
                  <span>Progresso estimado</span>
                  <span>{selectedProgress}%</span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${selectedIsRunning ? "bg-sky-500" : selected?.status === "DONE" ? "bg-emerald-500" : selected?.status === "FAILED" ? "bg-rose-500" : "bg-slate-400"}`}
                    style={{ width: `${selectedProgress}%` }}
                  />
                </div>
                <button
                  onClick={() => setDetailOpen(true)}
                  className="mt-3 w-full rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-black text-indigo-700"
                >
                  Abrir pipeline detalhada
                </button>
              </div>
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
                <div className="text-[11px] font-black uppercase tracking-wide text-slate-300">Terminal ao vivo</div>
                <div className="text-[10px] font-bold text-slate-500">mais recentes no topo</div>
              </div>
              <div className="space-y-2 px-4 py-3 font-mono text-[11px]">
                {liveTailEvents.length === 0 && <div className="text-slate-500">Aguardando eventos do fluxo...</div>}
                {liveTailEvents.map((event) => (
                  <div key={event.id} className="flex gap-3 text-slate-200">
                    <span className="shrink-0 text-slate-500">{fmtDate(event.createdAt)}</span>
                    <span
                      className={`shrink-0 font-black uppercase ${
                        event.level === "ERROR" ? "text-rose-400" : event.level === "WARN" ? "text-amber-300" : "text-emerald-400"
                      }`}
                    >
                      {event.level}
                    </span>
                    <span className="shrink-0 text-sky-300">{event.stepName || "FLOW"}</span>
                    <span className="min-w-0 flex-1 break-words text-slate-100">{event.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm">
          <div className="text-xs uppercase font-black text-slate-400">Total</div>
          <div className="text-2xl font-black text-slate-800 mt-1">{counts.total}</div>
        </div>
        <div className="bg-white rounded-2xl border border-emerald-200/60 p-4 shadow-sm">
          <div className="text-xs uppercase font-black text-emerald-500">Prontos</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{counts.done}</div>
        </div>
        <div className="bg-white rounded-2xl border border-sky-200/60 p-4 shadow-sm">
          <div className="text-xs uppercase font-black text-sky-500">Processando</div>
          <div className="text-2xl font-black text-sky-700 mt-1">{counts.running}</div>
        </div>
        <div className="bg-white rounded-2xl border border-rose-200/60 p-4 shadow-sm">
          <div className="text-xs uppercase font-black text-rose-500">Falhas</div>
          <div className="text-2xl font-black text-rose-700 mt-1">{counts.failed}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm">
          <div className="text-xs uppercase font-black text-slate-400">Cron</div>
          <div className="text-sm font-black text-slate-800 mt-1">
            {internalCron?.enabled ? (internalCron?.started ? "Ativo" : "Habilitado") : "Desativado"}
          </div>
          <div className="text-xs text-slate-500 mt-1">{internalCron?.running ? "Rodando agora" : "Em espera"}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm">
          <div className="text-xs uppercase font-black text-slate-400">Ultimo Tick</div>
          <div className="text-sm font-black text-slate-800 mt-1">{fmtDate(internalCron?.lastTickAt)}</div>
          <div className="text-xs text-slate-500 mt-1">
            Intervalo: {internalCron?.tickMs ? `${Math.round(internalCron.tickMs / 1000)}s` : "-"}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm md:col-span-2">
          <div className="text-xs uppercase font-black text-slate-400">Resumo do Cron</div>
          <div className="text-sm font-black text-slate-800 mt-1">{cronSummary}</div>
          <div className="text-xs text-slate-500 mt-1">
            Diagnostico: <code>/api/video-engagement/internal-cron</code> • manual: <code>/api/video-engagement/cron</code>
          </div>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
        <div className="min-w-0 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-1 min-w-0 flex-col gap-3 md:flex-row">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por titulo do artigo, slug ou id"
                className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-300 focus:bg-white"
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none md:w-[180px]"
              >
                <option value="ALL">Todos</option>
                <option value="DONE">Prontos</option>
                <option value="RENDERING">Renderizando</option>
                <option value="READY">Com roteiro</option>
                <option value="FAILED">Falhou</option>
              </select>
            </div>
            <button onClick={() => loadItems(true)} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-black text-white xl:self-auto">
              {refreshing ? "Atualizando..." : "Atualizar"}
            </button>
          </div>

          <div className="space-y-3">
            {loading && (
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-10 text-center text-slate-500">
                Carregando videos...
              </div>
            )}

            {!loading && items.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-10 text-center text-slate-500">
                Nenhum video-engajamento encontrado ainda.
              </div>
            )}

            {items.map((item) => {
              const articleUrl = item.linkedPost?.slug ? `/noticias/${item.linkedPost.slug}` : null;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full min-w-0 cursor-pointer text-left bg-white rounded-2xl border shadow-sm p-4 transition-all ${
                    selectedId === item.id ? "border-indigo-300 ring-2 ring-indigo-100" : "border-slate-200/60 hover:border-slate-300"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${statusBadge(item.status)}`}>
                          {item.status}
                        </span>
                        {item.linkedPost && (
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${statusBadge(item.linkedPost.status)}`}>
                            Artigo {item.linkedPost.status}
                          </span>
                        )}
                      </div>
                      <div className="text-lg font-black text-slate-800 truncate">{item.linkedPost?.title || item.title || "Video sem titulo"}</div>
                      <div className="text-xs text-slate-500">Projeto {item.id} • Atualizado em {fmtDate(item.updatedAt)}</div>
                      <div className="text-xs font-semibold text-slate-600">{currentStageLabel(item)}</div>
                      <div className="pt-1">
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${isProjectActivelyProcessing(item) ? "bg-sky-500" : item.status === "DONE" ? "bg-emerald-500" : item.status === "FAILED" ? "bg-rose-500" : "bg-slate-400"}`}
                            style={{ width: `${computeProgress(item)}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {item.socialPosts.map((social) => (
                          <span
                            key={social.id}
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${statusBadge(social.status)}`}
                          >
                            {social.platform}: {social.status}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex w-full flex-wrap gap-2 lg:w-auto lg:justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(item.id);
                          setDetailOpen(true);
                        }}
                        className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700 sm:flex-none"
                      >
                        Abrir pipeline
                      </button>
                      {item.videoUrl && (
                        <a
                          href={item.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-xs font-black text-emerald-700 sm:flex-none"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Ver video
                        </a>
                      )}
                      {articleUrl && (
                        <Link
                          href={articleUrl}
                          target="_blank"
                          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-black text-slate-700 sm:flex-none"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Ver artigo
                        </Link>
                      )}
                      {item.linkedPost && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerManual(item.linkedPost!.id);
                          }}
                          className="flex-1 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-center text-xs font-black text-indigo-700 sm:flex-none"
                        >
                          {runningPostId === item.linkedPost.id ? "Rodando..." : "Rodar agora"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          {selected ? (
            <>
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 space-y-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="text-xs uppercase font-black text-slate-400">Detalhe</div>
                    <div className="mt-1 break-words text-xl font-black text-slate-800">{selected.linkedPost?.title || selected.title || "Video sem titulo"}</div>
                    <div className="text-xs text-slate-500 mt-1">Projeto {selected.id} • Criado em {fmtDate(selected.createdAt)}</div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <a
                      href={`/admin/video-code/${selected.id}`}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-black text-slate-700"
                    >
                      Abrir projeto
                    </a>
                    <button
                      onClick={() => setDetailOpen(true)}
                      className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-center text-xs font-black text-indigo-700"
                    >
                      Abrir pipeline
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-black text-slate-800">Linha do tempo</div>
                      <div className="text-xs text-slate-500 mt-1">Clique numa etapa para focar os logs e os detalhes dela.</div>
                    </div>
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${statusBadge(selected.status)}`}>
                      {selected.status}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3">
                    {STEP_ORDER.map((step, index) => {
                      const state = stepStatus(selected, step.key);
                      const tone = stepTone(state);
                      const stepRecord = selected.pipelineSteps.find((entry) => entry.stepName === step.key);
                      const isFocused = focusedStepKey === step.key;
                      return (
                        <button
                          key={step.key}
                          onClick={() => setFocusedStepKey(step.key)}
                          className={`group grid min-w-0 grid-cols-[42px_minmax(0,1fr)] gap-3 rounded-2xl border p-3 text-left transition ${
                            isFocused ? `${tone.border} ${tone.bg} ring-2 ring-indigo-100` : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <div className="flex flex-col items-center">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-black text-white ring-4 ${tone.dot}`}>
                              {index + 1}
                            </div>
                            {index < STEP_ORDER.length - 1 && <div className={`mt-2 h-8 w-1 rounded-full ${tone.line}`} />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-black text-slate-800">{step.label}</div>
                              <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${statusBadge(state)}`}>
                                {state}
                              </span>
                            </div>
                            <div className="mt-1 text-xs text-slate-500">{step.description}</div>
                            <div className="mt-2 text-[11px] text-slate-400">
                              {stepRecord?.updatedAt ? `Atualizada em ${fmtDate(stepRecord.updatedAt)}` : "Sem execucao registrada ainda."}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selected.errorMessage && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{selected.errorMessage}</div>}

                <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 p-3">
                    <div className="text-xs uppercase font-black text-slate-400">Audio</div>
                    <div className="mt-2">
                      {selected.audioUrl ? (
                        <a href={selected.audioUrl} target="_blank" rel="noreferrer" className="text-sky-700 font-bold">
                          Abrir audio
                        </a>
                      ) : (
                        <span className="text-slate-400">Nao gerado</span>
                      )}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-3">
                    <div className="text-xs uppercase font-black text-slate-400">Legenda</div>
                    <div className="mt-2">
                      {selected.captionsUrl ? (
                        <a href={selected.captionsUrl} target="_blank" rel="noreferrer" className="text-sky-700 font-bold">
                          Abrir VTT
                        </a>
                      ) : (
                        <span className="text-slate-400">Nao gerada</span>
                      )}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-3">
                    <div className="text-xs uppercase font-black text-slate-400">Video</div>
                    <div className="mt-2">
                      {selected.videoUrl ? (
                        <a href={selected.videoUrl} target="_blank" rel="noreferrer" className="text-emerald-700 font-bold">
                          Abrir MP4
                        </a>
                      ) : (
                        <span className="text-slate-400">Nao finalizado</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="min-w-0 bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 space-y-3">
                <div className="text-sm font-black text-slate-800">Acompanhamento das plataformas</div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {selectedSocialSlots.map((slot) => {
                    const publishedUrl = slot.post ? socialPublishedUrl(slot.post) : null;
                    return (
                      <div key={slot.platform} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-black text-slate-900">{slot.label}</div>
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${
                              slot.post ? statusBadge(slot.post.status) : "border-slate-200 bg-white text-slate-500"
                            }`}
                          >
                            {slot.post ? slot.post.status : "NAO CRIADO"}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                          {slot.post
                            ? `Agendado: ${fmtDate(slot.post.scheduledTo)} • Publicado: ${fmtDate(slot.post.postedAt)}`
                            : "O pipeline ainda nao criou este item social para acompanhar/publicar."}
                        </div>
                        {publishedUrl ? (
                          <a
                            href={publishedUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700"
                          >
                            Ver publicacao
                          </a>
                        ) : slot.post?.videoUrl ? (
                          <a
                            href={slot.post.videoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-black text-sky-700"
                          >
                            Ver video da fila
                          </a>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="min-w-0 bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 space-y-3">
                <div className="text-sm font-black text-slate-800">Publicacao nas redes</div>
                {selected.socialPosts.length === 0 && <div className="text-sm text-slate-400">Nenhum item social criado ainda.</div>}
                {selected.socialPosts.map((social) => {
                  const publishedUrl = socialPublishedUrl(social);
                  return (
                    <div key={social.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="font-black text-slate-800">
                            {social.platform} • {social.postType}
                          </div>
                          <div className="text-xs text-slate-500">
                            Agendado: {fmtDate(social.scheduledTo)} • Publicado: {fmtDate(social.postedAt)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${statusBadge(social.status)}`}>
                            {social.status}
                          </span>
                          {publishedUrl && (
                            <a
                              href={publishedUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700"
                            >
                              Ver publicacao
                            </a>
                          )}
                        </div>
                      </div>
                      {social.log && <pre className="mt-3 whitespace-pre-wrap text-[11px] text-slate-600">{social.log}</pre>}
                    </div>
                  );
                })}
              </div>

              <div className="min-w-0 bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm font-black text-slate-800">Log do fluxo</div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setLogLimit(5)}
                      className={`rounded-lg border px-2.5 py-1 text-[11px] font-black ${logLimit === 5 ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-slate-50 text-slate-600"}`}
                    >
                      5
                    </button>
                    <button
                      onClick={() => setLogLimit(50)}
                      className={`rounded-lg border px-2.5 py-1 text-[11px] font-black ${logLimit === 50 ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-slate-50 text-slate-600"}`}
                    >
                      50
                    </button>
                    <button
                      onClick={() => setLogLimit(9999)}
                      className={`rounded-lg border px-2.5 py-1 text-[11px] font-black ${logLimit === 9999 ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-slate-50 text-slate-600"}`}
                    >
                      Todas
                    </button>
                    <div className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black ${streamBadge.cls}`}>{streamBadge.label}</div>
                  </div>
                </div>
                <div className="max-h-[420px] overflow-y-auto space-y-2">
                  {events.length === 0 && <div className="text-sm text-slate-400">Sem eventos registrados ainda.</div>}
                  {visibleEvents.map((event) => (
                    <div key={event.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${statusBadge(event.level)}`}>{event.level}</span>
                        {event.stepName && <span className="text-[10px] font-black uppercase text-slate-500">{event.stepName}</span>}
                        <span className="text-[11px] text-slate-400">{fmtDate(event.createdAt)}</span>
                      </div>
                      <div className="mt-2 text-sm font-medium text-slate-700">{event.message}</div>
                      {event.metadata && (
                        <pre className="mt-3 max-w-full overflow-x-auto rounded-xl bg-slate-900/95 p-3 text-[11px] text-slate-100">
                          {JSON.stringify(event.metadata, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-10 text-center text-slate-500">
              Selecione um video para ver o fluxo completo.
            </div>
          )}
        </div>
      </div>

      {detailOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6">
          <div className="relative flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div className="min-w-0">
                <div className="text-3xl font-black tracking-tight text-slate-900">Detalhes do Pipeline</div>
                <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="text-xl font-black text-slate-900">{selected.linkedPost?.title || selected.title || "Video sem titulo"}</div>
                      <div className="mt-2 text-xs text-slate-500">
                        Projeto {selected.id} • Criado em {fmtDate(selected.createdAt)} • Atualizado em {fmtDate(selected.updatedAt)}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase ${statusBadge(selected.status)}`}>
                        {selected.status}
                      </span>
                      <button
                        onClick={() => loadSelected(selected.id)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700"
                      >
                        Atualizar detalhe
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 text-sm font-semibold text-slate-700">{selectedStageLabel}</div>
                  <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                    <span>Progresso estimado: {selectedProgress}%</span>
                    <span>Próximo ciclo depende do cron interno/externo ou de "Rodar agora".</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setDetailOpen(false)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-600"
              >
                Fechar
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-5">
              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-xl font-black text-slate-900">Como funciona</div>
                    <div className="mt-2 max-w-3xl text-sm text-slate-600">
                      Este pipeline executa 1 etapa por ciclo. Quando a etapa depende de servico externo, ela pode ficar em andamento e soltar logs ate a proxima atualizacao.
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    Proxima execucao observada: <span className="font-black">{fmtDate(internalCron?.lastTickAt)}</span>
                    <div className="mt-1 text-xs text-slate-500">Cron configurado para verificar a cada {internalCron?.tickMs ? Math.round(internalCron.tickMs / 1000) : "-"}s</div>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-xl font-black text-slate-900">Linha do tempo</div>
                  <div className="text-xs text-slate-500">Clique numa etapa para ver os logs e payloads dela.</div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-5">
                  {STEP_ORDER.map((step, index) => {
                    const state = stepStatus(selected, step.key);
                    const tone = stepTone(state);
                    const stepRecord = selected.pipelineSteps.find((entry) => entry.stepName === step.key) || null;
                    const isFocused = focusedStepKey === step.key;
                    return (
                      <button
                        key={step.key}
                        onClick={() => setFocusedStepKey(step.key)}
                        className={`relative min-w-0 rounded-3xl border p-4 text-left transition ${isFocused ? `${tone.border} ${tone.bg} ring-2 ring-indigo-100` : "border-slate-200 bg-slate-50 hover:border-slate-300"}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-black text-white ring-4 ${tone.dot}`}>
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <div className={`text-xs font-black uppercase ${tone.text}`}>{state}</div>
                            <div className="text-base font-black text-slate-900">{step.label}</div>
                          </div>
                        </div>
                        <div className="mt-3 text-sm text-slate-600">{step.description}</div>
                        <div className="mt-3 text-[11px] text-slate-500">
                          {stepRecord?.updatedAt ? fmtDate(stepRecord.updatedAt) : "Sem execucao ainda"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                <div className="min-w-0 space-y-5">
                  <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xl font-black text-slate-900">{focusedStepDef.label}</div>
                        <div className="mt-1 text-sm text-slate-600">{focusedStepDef.description}</div>
                      </div>
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${statusBadge(
                          focusedStepRecord?.status || "PENDING"
                        )}`}
                      >
                        {focusedStepRecord?.status || "PENDING"}
                      </span>
                    </div>

                    {!focusedStepRecord ? (
                      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                        Esta etapa ainda nao registrou execucao.
                      </div>
                    ) : (
                      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                          <div className="text-xs uppercase font-black text-slate-400">Execucao</div>
                          <div className="mt-3 grid grid-cols-2 gap-3">
                            <div>
                              <div className="text-[11px] font-black uppercase text-slate-400">Tentativa</div>
                              <div className="mt-1 font-bold text-slate-800">{focusedStepRecord.attempt ?? "-"}</div>
                            </div>
                            <div>
                              <div className="text-[11px] font-black uppercase text-slate-400">Duracao</div>
                              <div className="mt-1 font-bold text-slate-800">
                                {focusedStepRecord.durationMs ? `${focusedStepRecord.durationMs} ms` : "-"}
                              </div>
                            </div>
                            <div>
                              <div className="text-[11px] font-black uppercase text-slate-400">Inicio</div>
                              <div className="mt-1 font-bold text-slate-800">{fmtDate(focusedStepRecord.startedAt)}</div>
                            </div>
                            <div>
                              <div className="text-[11px] font-black uppercase text-slate-400">Fim</div>
                              <div className="mt-1 font-bold text-slate-800">{fmtDate(focusedStepRecord.finishedAt)}</div>
                            </div>
                            <div className="col-span-2">
                              <div className="text-[11px] font-black uppercase text-slate-400">Proximo retry</div>
                              <div className="mt-1 font-bold text-slate-800">{fmtDate(focusedStepRecord.nextRetryAt)}</div>
                            </div>
                          </div>
                          {focusedStepRecord.errorMessage && (
                            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-700">
                              {focusedStepRecord.errorMessage}
                            </div>
                          )}
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                          <div className="text-xs uppercase font-black text-slate-400">Payloads</div>
                          <div className="mt-3">
                            <div className="text-[11px] font-black uppercase text-slate-400">Request</div>
                            <pre className="mt-2 max-h-40 max-w-full overflow-auto rounded-xl bg-slate-950 p-3 text-[11px] text-slate-100">
                              {truncateJson(focusedStepRecord.requestPayload)}
                            </pre>
                          </div>
                          <div className="mt-3">
                            <div className="text-[11px] font-black uppercase text-slate-400">Response</div>
                            <pre className="mt-2 max-h-40 max-w-full overflow-auto rounded-xl bg-slate-950 p-3 text-[11px] text-slate-100">
                              {truncateJson(focusedStepRecord.responsePayload)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="text-xl font-black text-slate-900">Logs da etapa</div>
                    <div className="mt-2 text-sm text-slate-500">Mostra somente os eventos da etapa selecionada, do mais novo para o mais antigo.</div>
                    <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto">
                      {focusedStepEvents.length === 0 && <div className="text-sm text-slate-400">Nenhum log encontrado para esta etapa ainda.</div>}
                      {focusedStepEvents.map((event) => (
                        <div key={event.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${statusBadge(event.level)}`}>
                              {event.level}
                            </span>
                            <span className="text-[11px] font-black uppercase text-slate-500">{event.stepName || "FLOW"}</span>
                            <span className="text-[11px] text-slate-400">{fmtDate(event.createdAt)}</span>
                          </div>
                          <div className="mt-2 text-sm font-medium text-slate-700">{event.message}</div>
                          {event.metadata && (
                            <details className="mt-3">
                              <summary className="cursor-pointer text-[11px] font-black uppercase text-slate-500">Ver detalhes</summary>
                              <pre className="mt-2 overflow-x-auto rounded-xl bg-slate-950 p-3 text-[11px] text-slate-100">
                                {truncateJson(event.metadata, 6000)}
                              </pre>
                            </details>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="min-w-0 space-y-5">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="text-xs uppercase font-black text-slate-400">Status</div>
                      <div className="mt-3">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase ${statusBadge(selected.status)}`}>
                          {selected.status}
                        </span>
                      </div>
                      <div className="mt-3 text-sm text-slate-600">
                        Ultimo refresh: <span className="font-black text-slate-800">{fmtDate(selected.updatedAt)}</span>
                      </div>
                    </div>
                    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="text-xs uppercase font-black text-slate-400">Artefatos</div>
                      <div className="mt-3 space-y-2 text-sm text-slate-600">
                        <div>Audio: <span className="font-black text-slate-800">{selected.audioUrl ? "OK" : "-"}</span></div>
                        <div>Legenda: <span className="font-black text-slate-800">{selected.captionsUrl ? "OK" : "-"}</span></div>
                        <div>Video final: <span className="font-black text-slate-800">{selected.videoUrl ? "OK" : "-"}</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="text-xl font-black text-slate-900">Artefatos</div>
                    <div className="mt-4 space-y-3">
                      <a
                        href={selected.audioUrl || "#"}
                        target={selected.audioUrl ? "_blank" : undefined}
                        rel="noreferrer"
                        className={`block rounded-2xl border px-4 py-3 text-sm font-bold ${selected.audioUrl ? "border-sky-200 bg-sky-50 text-sky-700" : "border-slate-200 bg-slate-50 text-slate-400 pointer-events-none"}`}
                      >
                        Audio {selected.audioUrl ? "disponivel para abrir" : "ainda nao gerado"}
                      </a>
                      <a
                        href={selected.captionsUrl || "#"}
                        target={selected.captionsUrl ? "_blank" : undefined}
                        rel="noreferrer"
                        className={`block rounded-2xl border px-4 py-3 text-sm font-bold ${selected.captionsUrl ? "border-sky-200 bg-sky-50 text-sky-700" : "border-slate-200 bg-slate-50 text-slate-400 pointer-events-none"}`}
                      >
                        Legenda {selected.captionsUrl ? "disponivel para abrir" : "ainda nao gerada"}
                      </a>
                      <a
                        href={selected.videoUrl || "#"}
                        target={selected.videoUrl ? "_blank" : undefined}
                        rel="noreferrer"
                        className={`block rounded-2xl border px-4 py-3 text-sm font-bold ${selected.videoUrl ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-400 pointer-events-none"}`}
                      >
                        Video {selected.videoUrl ? "final pronto para abrir" : "ainda nao finalizado"}
                      </a>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="text-xl font-black text-slate-900">Distribuicao social</div>
                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                      {selectedSocialSlots.map((slot) => {
                        const publishedUrl = slot.post ? socialPublishedUrl(slot.post) : null;
                        return (
                          <div key={slot.platform} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-sm font-black text-slate-900">{slot.label}</div>
                              <span
                                className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${
                                  slot.post ? statusBadge(slot.post.status) : "border-slate-200 bg-white text-slate-500"
                                }`}
                              >
                                {slot.post ? slot.post.status : "NAO CRIADO"}
                              </span>
                            </div>
                            <div className="mt-2 text-xs text-slate-500">
                              {slot.post
                                ? `Agendado: ${fmtDate(slot.post.scheduledTo)} • Publicado: ${fmtDate(slot.post.postedAt)}`
                                : "Este canal ainda nao recebeu item social deste video."}
                            </div>
                            {publishedUrl ? (
                              <a
                                href={publishedUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-3 inline-flex rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700"
                              >
                                Ver publicacao
                              </a>
                            ) : slot.post?.videoUrl ? (
                              <a
                                href={slot.post.videoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-3 inline-flex rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-black text-sky-700"
                              >
                                Ver video da fila
                              </a>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="text-xl font-black text-slate-900">Publicacao nas redes</div>
                    <div className="mt-4 space-y-3">
                      {selected.socialPosts.length === 0 && <div className="text-sm text-slate-400">Nenhum item social criado ainda.</div>}
                      {selected.socialPosts.map((social) => {
                        const publishedUrl = socialPublishedUrl(social);
                        return (
                          <div key={social.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-black text-slate-900">
                                  {socialLabel(social.platform)} • {social.postType}
                                </div>
                                <div className="mt-1 text-xs text-slate-500">
                                  Agendado: {fmtDate(social.scheduledTo)} • Publicado: {fmtDate(social.postedAt)}
                                </div>
                              </div>
                              <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${statusBadge(social.status)}`}>
                                {social.status}
                              </span>
                            </div>
                            {publishedUrl && (
                              <a
                                href={publishedUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-3 inline-flex rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700"
                              >
                                Ver publicacao
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xl font-black text-slate-900">Log completo</div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setLogLimit(50)}
                          className={`rounded-lg border px-2.5 py-1 text-[11px] font-black ${logLimit === 50 ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-slate-50 text-slate-600"}`}
                        >
                          50
                        </button>
                        <button
                          onClick={() => setLogLimit(9999)}
                          className={`rounded-lg border px-2.5 py-1 text-[11px] font-black ${logLimit === 9999 ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-slate-50 text-slate-600"}`}
                        >
                          Todas
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 max-h-[360px] space-y-3 overflow-y-auto">
                      {visibleEvents.map((event) => (
                        <div key={event.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${statusBadge(event.level)}`}>
                              {event.level}
                            </span>
                            {event.stepName && <span className="text-[10px] font-black uppercase text-slate-500">{event.stepName}</span>}
                            <span className="text-[11px] text-slate-400">{fmtDate(event.createdAt)}</span>
                          </div>
                          <div className="mt-2 text-sm font-medium text-slate-700">{event.message}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
