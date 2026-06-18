"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type SocialPost = {
  id: string;
  platform: string;
  postType: string;
  status: string;
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
  errorMessage?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
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

const STEP_ORDER = [
  { key: "QUEUE_FROM_POST", label: "Fila do artigo" },
  { key: "AUTO_START", label: "Disparo" },
  { key: "GENERATE_SCRIPT", label: "Roteiro IA" },
  { key: "RENDER_VIDEO", label: "Renderizacao" },
  { key: "ENQUEUE_SOCIAL", label: "Fila social" },
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
    if (isStepSuccess(status)) {
      completed += 1;
    } else if (isStepRunning(status)) {
      completed += 0.5;
    }
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
  if (status === "FAILED") return "bg-rose-50 text-rose-700 border-rose-200";
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

export default function VideoEngajamentoPage() {
  const [items, setItems] = useState<VideoEngagementItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<VideoEngagementItem | null>(null);
  const [events, setEvents] = useState<PipelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [runningPostId, setRunningPostId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [error, setError] = useState<string | null>(null);
  const [streamState, setStreamState] = useState<"idle" | "connecting" | "live" | "reconnecting" | "closed">("idle");
  const [lastStreamEventAt, setLastStreamEventAt] = useState<string | null>(null);
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
    if (!selectedId) return;
    loadSelected(selectedId).catch(() => null);
  }, [selectedId]);

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
  const liveTailEvents = useMemo(() => events.slice(-5).reverse(), [events]);
  const streamBadge = useMemo(() => {
    if (streamState === "live") return { label: "Log ao vivo conectado", cls: "border-emerald-200 bg-emerald-50 text-emerald-700" };
    if (streamState === "connecting") return { label: "Conectando ao log ao vivo...", cls: "border-sky-200 bg-sky-50 text-sky-700" };
    if (streamState === "reconnecting") return { label: "Reconectando log ao vivo...", cls: "border-amber-200 bg-amber-50 text-amber-700" };
    return { label: "Log ao vivo inativo", cls: "border-slate-200 bg-slate-50 text-slate-600" };
  }, [streamState]);

  return (
    <div className="space-y-6">
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
              <div className="min-w-[180px]">
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
              </div>
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
                <div className="text-[11px] font-black uppercase tracking-wide text-slate-300">Terminal ao vivo</div>
                <div className="text-[10px] font-bold text-slate-500">ultimas 5 linhas</div>
              </div>
              <div className="space-y-2 px-4 py-3 font-mono text-[11px]">
                {liveTailEvents.length === 0 && (
                  <div className="text-slate-500">Aguardando eventos do fluxo...</div>
                )}
                {liveTailEvents.map((event) => (
                  <div key={event.id} className="flex gap-3 text-slate-200">
                    <span className="shrink-0 text-slate-500">{fmtDate(event.createdAt)}</span>
                    <span
                      className={`shrink-0 font-black uppercase ${
                        event.level === "ERROR"
                          ? "text-rose-400"
                          : event.level === "WARN"
                            ? "text-amber-300"
                            : "text-emerald-400"
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

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex flex-1 gap-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por titulo do artigo, slug ou id"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-300 focus:bg-white"
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none"
              >
                <option value="ALL">Todos</option>
                <option value="DONE">Prontos</option>
                <option value="RENDERING">Renderizando</option>
                <option value="READY">Com roteiro</option>
                <option value="FAILED">Falhou</option>
              </select>
            </div>
            <button
              onClick={() => loadItems(true)}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-black text-white"
            >
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
                  className={`w-full cursor-pointer text-left bg-white rounded-2xl border shadow-sm p-4 transition-all ${
                    selectedId === item.id ? "border-indigo-300 ring-2 ring-indigo-100" : "border-slate-200/60 hover:border-slate-300"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="min-w-0 space-y-2">
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
                      <div className="text-lg font-black text-slate-800 truncate">
                        {item.linkedPost?.title || item.title || "Video sem titulo"}
                      </div>
                    <div className="text-xs text-slate-500">
                      Projeto {item.id} • Atualizado em {fmtDate(item.updatedAt)}
                    </div>
                    <div className="text-xs font-semibold text-slate-600">
                      {currentStageLabel(item)}
                    </div>
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

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      {item.videoUrl && (
                        <a
                          href={item.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Ver video
                        </a>
                      )}
                      {articleUrl && (
                        <Link
                          href={articleUrl}
                          target="_blank"
                          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700"
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
                          className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-black text-indigo-700"
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

        <div className="space-y-4">
          {selected ? (
            <>
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase font-black text-slate-400">Detalhe</div>
                    <div className="text-xl font-black text-slate-800 mt-1">
                      {selected.linkedPost?.title || selected.title || "Video sem titulo"}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Projeto {selected.id} • Criado em {fmtDate(selected.createdAt)}
                    </div>
                  </div>
                  <a
                    href={`/admin/video-code/${selected.id}`}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700"
                  >
                    Abrir projeto
                  </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {STEP_ORDER.map((step) => {
                    const stepState = stepStatus(selected, step.key);
                    const err = stepError(selected, step.key);
                    return (
                      <div key={step.key} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-black text-slate-800">{step.label}</div>
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${statusBadge(stepState)}`}>
                            {stepState}
                          </span>
                        </div>
                        {isStepRunning(stepState) && (
                          <div className="mt-2 text-xs font-semibold text-sky-700">
                            Esta etapa esta rodando agora.
                          </div>
                        )}
                        {err && <div className="mt-2 text-xs text-rose-700">{err}</div>}
                      </div>
                    );
                  })}
                </div>

                {selected.errorMessage && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {selected.errorMessage}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
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

              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 space-y-3">
                <div className="text-sm font-black text-slate-800">Publicacao nas redes</div>
                {selected.socialPosts.length === 0 && (
                  <div className="text-sm text-slate-400">Nenhum item social criado ainda.</div>
                )}
                {selected.socialPosts.map((social) => {
                  const publishedUrl = socialPublishedUrl(social);
                  return (
                    <div key={social.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="font-black text-slate-800">{social.platform} • {social.postType}</div>
                          <div className="text-xs text-slate-500">
                            Agendado: {fmtDate(social.scheduledTo)} • Publicado: {fmtDate(social.postedAt)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${statusBadge(social.status)}`}>
                            {social.status}
                          </span>
                          {publishedUrl && (
                            <a href={publishedUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
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

              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm font-black text-slate-800">Log do fluxo</div>
                  <div className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black ${streamBadge.cls}`}>
                    {streamBadge.label}
                  </div>
                </div>
                <div className="max-h-[420px] overflow-y-auto space-y-2">
                  {events.length === 0 && <div className="text-sm text-slate-400">Sem eventos registrados ainda.</div>}
                  {events.map((event) => (
                    <div key={event.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${statusBadge(event.level)}`}>
                          {event.level}
                        </span>
                        {event.stepName && (
                          <span className="text-[10px] font-black uppercase text-slate-500">{event.stepName}</span>
                        )}
                        <span className="text-[11px] text-slate-400">{fmtDate(event.createdAt)}</span>
                      </div>
                      <div className="mt-2 text-sm font-medium text-slate-700">{event.message}</div>
                      {event.metadata && (
                        <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-900/95 p-3 text-[11px] text-slate-100">
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
    </div>
  );
}
