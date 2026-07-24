"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  ArrowDownUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Grid2X2,
  Hash,
  ImageIcon,
  Info,
  ListChecks,
  Loader2,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  RefreshCcw,
  RotateCcw,
  Search,
  Send,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type SocialPost = {
  id: string;
  platform: string;
  postType?: string | null;
  status?: string | null;
  title?: string | null;
  summary?: string | null;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  imageUrl?: string | null;
  accountName?: string | null;
  integrationAccountName?: string | null;
  origin?: string | null;
  source?: string | null;
  scheduledTo?: string | null;
  postedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  error?: string | null;
  lastError?: string | null;
  externalPostUrl?: string | null;
  postUrl?: string | null;
  publishedUrl?: string | null;
  youtubeUrl?: string | null;
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
  facebookUrl?: string | null;
  linkedinUrl?: string | null;
  apiResponse?: unknown;
  payload?: unknown;
};

type PublicationGroup = {
  id: string;
  title: string;
  caption: string;
  thumbnail?: string | null;
  videoUrl?: string | null;
  scheduledTo?: string | null;
  postedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  accountName: string;
  origin: string;
  postType: string;
  posts: SocialPost[];
};

type Filters = {
  q: string;
  period: "all" | "today" | "week" | "month" | "custom";
  dateFrom: string;
  dateTo: string;
  platform: string;
  postType: string;
  status: string;
  platformStatus: string;
  account: string;
  origin: string;
  media: string;
  errors: string;
  sortBy: "scheduledTo" | "updatedAt" | "createdAt" | "status";
  sortDir: "asc" | "desc";
};

const DEFAULT_FILTERS: Filters = {
  q: "",
  period: "all",
  dateFrom: "",
  dateTo: "",
  platform: "",
  postType: "",
  status: "",
  platformStatus: "",
  account: "",
  origin: "",
  media: "",
  errors: "",
  sortBy: "scheduledTo",
  sortDir: "desc",
};

const PLATFORM_LABEL: Record<string, string> = {
  YOUTUBE: "YouTube",
  INSTAGRAM: "Instagram",
  TIKTOK: "TikTok",
  FACEBOOK: "Facebook",
  LINKEDIN: "LinkedIn",
};

const PLATFORM_STYLE: Record<string, string> = {
  YOUTUBE: "bg-red-50 text-red-700 ring-red-100",
  INSTAGRAM: "bg-pink-50 text-pink-700 ring-pink-100",
  TIKTOK: "bg-slate-50 text-slate-900 ring-slate-200",
  FACEBOOK: "bg-blue-50 text-blue-700 ring-blue-100",
  LINKEDIN: "bg-sky-50 text-sky-700 ring-sky-100",
};

const STATUS_META: Record<string, { label: string; className: string; priority: number }> = {
  DRAFT: { label: "Rascunho", className: "bg-slate-100 text-slate-700 ring-slate-200", priority: 2 },
  SCHEDULED: { label: "Agendado", className: "bg-amber-50 text-amber-700 ring-amber-100", priority: 3 },
  QUEUED: { label: "Em fila", className: "bg-blue-50 text-blue-700 ring-blue-100", priority: 4 },
  PROCESSING: { label: "Processando", className: "bg-indigo-50 text-indigo-700 ring-indigo-100", priority: 5 },
  PROCESSING_MEDIA: { label: "Processando", className: "bg-indigo-50 text-indigo-700 ring-indigo-100", priority: 5 },
  PUBLISHING: { label: "Enviando", className: "bg-violet-50 text-violet-700 ring-violet-100", priority: 6 },
  AWAITING_API: { label: "Aguardando API", className: "bg-cyan-50 text-cyan-700 ring-cyan-100", priority: 6 },
  PUBLISHED: { label: "Publicado", className: "bg-emerald-50 text-emerald-700 ring-emerald-100", priority: 1 },
  PAUSED: { label: "Pausado", className: "bg-slate-100 text-slate-700 ring-slate-200", priority: 7 },
  CANCELLED: { label: "Cancelado", className: "bg-slate-100 text-slate-500 ring-slate-200", priority: 8 },
  FAILED: { label: "Falhou", className: "bg-rose-50 text-rose-700 ring-rose-100", priority: 9 },
  ERROR: { label: "Falhou", className: "bg-rose-50 text-rose-700 ring-rose-100", priority: 9 },
  NEEDS_ATTENTION: { label: "Requer intervenção", className: "bg-orange-50 text-orange-700 ring-orange-100", priority: 10 },
};

function statusMeta(status?: string | null) {
  return STATUS_META[(status || "").toUpperCase()] || {
    label: status || "Sem status",
    className: "bg-slate-100 text-slate-600 ring-slate-200",
    priority: 2,
  };
}

function StatusBadge({ status }: { status?: string | null }) {
  const meta = statusMeta(status);
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${meta.className}`}>{meta.label}</span>;
}

function PlatformMark({ platform }: { platform: string }) {
  const label = PLATFORM_LABEL[platform] || platform;
  const short = platform === "YOUTUBE" ? "YT" : platform === "INSTAGRAM" ? "IG" : platform === "TIKTOK" ? "TK" : label.slice(0, 2).toUpperCase();
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black ring-1 ${PLATFORM_STYLE[platform] || "bg-slate-50 text-slate-700 ring-slate-200"}`} title={label}>
      <Video className="h-3 w-3" />
      {short}
    </span>
  );
}

function publishedUrl(post: SocialPost) {
  return post.publishedUrl || post.externalPostUrl || post.postUrl || post.youtubeUrl || post.instagramUrl || post.tiktokUrl || post.facebookUrl || post.linkedinUrl || null;
}

function formatDate(value?: string | null, includeTime = true) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

function formatAgo(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return "Agora";
  if (minutes < 60) return `Há ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Há ${hours}h`;
  return formatDate(value, false);
}

function toInputDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function periodRange(period: Filters["period"], from: string, to: string) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  if (period === "today") {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { from: toInputDate(start), to: toInputDate(end) };
  }
  if (period === "week") {
    start.setDate(now.getDate() - 7);
    return { from: toInputDate(start), to: toInputDate(end) };
  }
  if (period === "month") {
    start.setMonth(now.getMonth() - 1);
    return { from: toInputDate(start), to: toInputDate(end) };
  }
  if (period === "custom") return { from, to };
  return { from: "", to: "" };
}

function firstLine(value?: string | null) {
  return (value || "").split("\n").find(Boolean)?.trim() || "Publicação sem legenda";
}

function hashtagsFrom(value: string) {
  return Array.from(new Set((value.match(/#[\p{L}\p{N}_]+/gu) || []).slice(0, 12)));
}

function groupKey(post: SocialPost) {
  const media = post.videoUrl || post.thumbnailUrl || post.imageUrl || "";
  const schedule = post.scheduledTo || post.postedAt || "";
  const title = post.title || firstLine(post.summary);
  return `${media}|${schedule.slice(0, 16)}|${title.slice(0, 80)}`;
}

function groupPosts(posts: SocialPost[]): PublicationGroup[] {
  const groups = new Map<string, SocialPost[]>();
  for (const post of posts) groups.set(groupKey(post), [...(groups.get(groupKey(post)) || []), post]);
  return Array.from(groups.entries()).map(([key, groupedPosts]) => {
    const primary = groupedPosts[0];
    return {
      id: key,
      title: primary.title || firstLine(primary.summary),
      caption: primary.summary || primary.title || "",
      thumbnail: primary.thumbnailUrl || primary.imageUrl,
      videoUrl: primary.videoUrl,
      scheduledTo: primary.scheduledTo,
      postedAt: primary.postedAt,
      createdAt: primary.createdAt,
      updatedAt: groupedPosts.map((post) => post.updatedAt || post.createdAt).filter(Boolean).sort().pop(),
      accountName: primary.accountName || primary.integrationAccountName || "Conta principal",
      origin: primary.origin || primary.source || "Sistema",
      postType: primary.postType || "REEL",
      posts: groupedPosts.sort((a, b) => String(a.platform).localeCompare(String(b.platform))),
    };
  });
}

function overallStatus(group: PublicationGroup) {
  const statuses = group.posts.map((post) => (post.status || "").toUpperCase());
  if (statuses.some((status) => ["FAILED", "ERROR", "NEEDS_ATTENTION"].includes(status))) return "FAILED";
  if (statuses.some((status) => ["PUBLISHING", "PROCESSING", "PROCESSING_MEDIA", "AWAITING_API"].includes(status))) return "PROCESSING";
  if (statuses.every((status) => status === "PUBLISHED")) return "PUBLISHED";
  if (statuses.some((status) => status === "SCHEDULED")) return "SCHEDULED";
  if (statuses.some((status) => status === "QUEUED")) return "QUEUED";
  return statuses[0] || "DRAFT";
}

function sortGroups(groups: PublicationGroup[], filters: Filters) {
  return [...groups].sort((a, b) => {
    const dir = filters.sortDir === "asc" ? 1 : -1;
    const valueA = filters.sortBy === "status" ? statusMeta(overallStatus(a)).priority : new Date(String(a[filters.sortBy] || 0)).getTime();
    const valueB = filters.sortBy === "status" ? statusMeta(overallStatus(b)).priority : new Date(String(b[filters.sortBy] || 0)).getTime();
    return valueA > valueB ? dir : valueA < valueB ? -dir : 0;
  });
}

function publisherPath(platform?: string | null, postType?: string | null) {
  const normalizedPlatform = (platform || "").toUpperCase();
  const normalizedType = (postType || "").toUpperCase();
  if (normalizedPlatform === "YOUTUBE") return "/api/social/publish-youtube";
  if (normalizedPlatform === "TIKTOK") return "/api/social/publish-tiktok";
  if (normalizedPlatform === "INSTAGRAM" && normalizedType.includes("STORY")) return "/api/social/publish-story";
  return "/api/social/publish";
}

function actionButtonClass(tone: "default" | "danger" | "primary" = "default") {
  if (tone === "primary") return "rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60";
  if (tone === "danger") return "rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-60";
  return "rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60";
}

export default function PublicationsDashboard() {
  const pathname = usePathname();
  const lockedPlatform = useMemo(() => {
    if (pathname?.endsWith("/youtube")) return "YOUTUBE";
    if (pathname?.endsWith("/instagram")) return "INSTAGRAM";
    if (pathname?.endsWith("/tiktok")) return "TIKTOK";
    return "";
  }, [pathname]);

  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [runningId, setRunningId] = useState<string | null>(null);
  const [cronStatus, setCronStatus] = useState<any>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [savedFilters, setSavedFilters] = useState<{ name: string; filters: Filters }[]>([]);
  const [filters, setFilters] = useState<Filters>({ ...DEFAULT_FILTERS, platform: lockedPlatform });
  const [detailsTab, setDetailsTab] = useState<"summary" | "timeline" | "logs" | "media" | "info">("summary");

  useEffect(() => setFilters((current) => ({ ...current, platform: lockedPlatform || current.platform })), [lockedPlatform]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("social-publications-saved-filters");
      if (saved) setSavedFilters(JSON.parse(saved));
    } catch {
      setSavedFilters([]);
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), sortBy: filters.sortBy, sortDir: filters.sortDir });
      if (filters.q.trim()) params.set("q", filters.q.trim());
      if (filters.status) params.set("status", filters.status);
      if (filters.platform) params.set("platform", filters.platform);
      if (filters.postType) params.set("postType", filters.postType);
      const res = await fetch(`/api/social/posts?${params.toString()}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Não foi possível carregar as publicações.");
      setPosts(Array.isArray(data?.items) ? data.items : []);
      setTotal(Number(data?.total || 0));
    } catch (err: any) {
      setError(err?.message || "Erro ao carregar publicações.");
      setPosts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters.platform, filters.postType, filters.q, filters.sortBy, filters.sortDir, filters.status, page, pageSize]);

  const fetchCronStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/social/cron-status", { cache: "no-store" });
      if (res.ok) setCronStatus(await res.json());
    } catch {
      setCronStatus(null);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    fetchCronStatus();
    const id = window.setInterval(fetchCronStatus, 30000);
    return () => window.clearInterval(id);
  }, [fetchCronStatus]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.tagName === "SELECT";
      if (typing) return;
      if (event.key === "/") {
        event.preventDefault();
        document.getElementById("publication-search")?.focus();
      }
      if (event.key.toLowerCase() === "r") fetchPosts();
      if (event.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [fetchPosts]);

  const filteredPosts = useMemo(() => {
    const range = periodRange(filters.period, filters.dateFrom, filters.dateTo);
    return posts.filter((post) => {
      const text = `${post.title || ""} ${post.summary || ""} ${post.id} ${post.platform}`.toLowerCase();
      const status = (post.status || "").toUpperCase();
      const hasError = Boolean(post.error || post.lastError || ["FAILED", "ERROR", "NEEDS_ATTENTION"].includes(status));
      const hasMedia = Boolean(post.videoUrl || post.thumbnailUrl || post.imageUrl);
      const dateValue = post.scheduledTo || post.postedAt || post.createdAt;
      if (filters.q && !text.includes(filters.q.toLowerCase())) return false;
      if (filters.platformStatus && status !== filters.platformStatus) return false;
      if (filters.account && !(post.accountName || post.integrationAccountName || "").toLowerCase().includes(filters.account.toLowerCase())) return false;
      if (filters.origin && !(post.origin || post.source || "").toLowerCase().includes(filters.origin.toLowerCase())) return false;
      if (filters.media === "with" && !hasMedia) return false;
      if (filters.media === "without" && hasMedia) return false;
      if (filters.errors === "with" && !hasError) return false;
      if (filters.errors === "without" && hasError) return false;
      if (range.from && dateValue && new Date(dateValue) < new Date(`${range.from}T00:00:00`)) return false;
      if (range.to && dateValue && new Date(dateValue) > new Date(`${range.to}T23:59:59`)) return false;
      return true;
    });
  }, [filters, posts]);

  const groups = useMemo(() => sortGroups(groupPosts(filteredPosts), filters), [filteredPosts, filters]);
  const selectedGroup = useMemo(() => groups.find((group) => group.id === selectedId) || groups[0] || null, [groups, selectedId]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const kpis = useMemo(() => {
    const statuses = posts.map((post) => (post.status || "").toUpperCase());
    return {
      scheduled: statuses.filter((status) => status === "SCHEDULED").length,
      queue: statuses.filter((status) => ["QUEUED", "DRAFT"].includes(status)).length,
      processing: statuses.filter((status) => ["PROCESSING", "PROCESSING_MEDIA", "PUBLISHING", "AWAITING_API"].includes(status)).length,
      failed: statuses.filter((status) => ["FAILED", "ERROR", "NEEDS_ATTENTION"].includes(status)).length,
      published: statuses.filter((status) => status === "PUBLISHED").length,
    };
  }, [posts]);

  async function updatePost(post: SocialPost, changes: Partial<SocialPost>, success: string) {
    setRunningId(post.id);
    try {
      const res = await fetch(`/api/social/posts/${post.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(changes) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Ação não concluída.");
      toast.success(success);
      await fetchPosts();
    } catch (err: any) {
      toast.error(err?.message || "Ação não concluída.");
    } finally {
      setRunningId(null);
    }
  }

  async function publishNow(post: SocialPost) {
    setRunningId(post.id);
    try {
      const res = await fetch(publisherPath(post.platform, post.postType), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ socialPostId: post.id, bypassTimeCheck: true }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Falha ao publicar agora.");
      toast.success("Publicação enviada para processamento.");
      await fetchPosts();
    } catch (err: any) {
      toast.error(err?.message || "Falha ao publicar agora.");
    } finally {
      setRunningId(null);
    }
  }

  async function duplicatePost(post: SocialPost) {
    setRunningId(post.id);
    try {
      const res = await fetch("/api/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: post.platform, postType: post.postType, summary: post.summary, title: post.title, videoUrl: post.videoUrl, thumbnailUrl: post.thumbnailUrl, status: "DRAFT", scheduledTo: null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Falha ao duplicar.");
      toast.success("Publicação duplicada como rascunho.");
      await fetchPosts();
    } catch (err: any) {
      toast.error(err?.message || "Falha ao duplicar.");
    } finally {
      setRunningId(null);
    }
  }

  async function deletePost(post: SocialPost) {
    if (!window.confirm("Excluir esta publicação? Esta ação remove apenas o item selecionado.")) return;
    setRunningId(post.id);
    try {
      const res = await fetch(`/api/social/posts/${post.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Falha ao excluir.");
      toast.success("Publicação excluída.");
      await fetchPosts();
    } catch (err: any) {
      toast.error(err?.message || "Falha ao excluir.");
    } finally {
      setRunningId(null);
    }
  }

  async function runSocialCron() {
    setRunningId("cron");
    try {
      const res = await fetch("/api/social/cron", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Cron social não executou.");
      toast.success(data?.message || "Cron executado.");
      await Promise.all([fetchPosts(), fetchCronStatus()]);
    } catch (err: any) {
      toast.error(err?.message || "Cron social não executou.");
    } finally {
      setRunningId(null);
    }
  }

  async function requeueOldPosts() {
    setRunningId("requeue");
    try {
      const res = await fetch("/api/social/posts/requeue", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Não foi possível reagendar antigos.");
      toast.success(data?.message || "Reagendamento solicitado.");
      await fetchPosts();
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível reagendar antigos.");
    } finally {
      setRunningId(null);
    }
  }

  function saveFilter() {
    const name = window.prompt("Nome para este filtro salvo:");
    if (!name?.trim()) return;
    const next = [...savedFilters.filter((item) => item.name !== name.trim()), { name: name.trim(), filters }];
    setSavedFilters(next);
    localStorage.setItem("social-publications-saved-filters", JSON.stringify(next));
    toast.success("Filtro salvo.");
  }

  function toggleSelection(id: string) {
    setSelectedRows((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function applyBulk(action: "pause" | "cancel" | "publish") {
    const selectedPosts = posts.filter((post) => selectedRows.includes(post.id));
    if (!selectedPosts.length) return;
    for (const post of selectedPosts) {
      if (action === "pause") await updatePost(post, { status: "PAUSED" }, "Publicações pausadas.");
      if (action === "cancel") await updatePost(post, { status: "CANCELLED" }, "Publicações canceladas.");
      if (action === "publish") await publishNow(post);
    }
    setSelectedRows([]);
  }

  return (
    <main className="min-h-screen bg-[#f6f8fc] px-5 py-6 text-slate-900 lg:px-8">
      <ToastContainer position="top-right" autoClose={3000} />
      <section className="mx-auto grid max-w-[1720px] gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-5">
          <div className="rounded-[24px] border border-slate-200 bg-white/90 p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm">
                  <ListChecks className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight">Publicações</h1>
                  <p className="text-sm font-medium text-slate-500">Gerencie YouTube, Instagram, TikTok e demais destinos em uma única fila.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button className={actionButtonClass()} onClick={fetchPosts} disabled={loading}>
                  <RefreshCcw className={`mr-2 inline h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  Atualizar
                </button>
                <button className={actionButtonClass()} onClick={runSocialCron} disabled={runningId === "cron"}>
                  <Play className="mr-2 inline h-4 w-4" />
                  Rodar agora
                </button>
                <button className={actionButtonClass("primary")} onClick={requeueOldPosts} disabled={runningId === "requeue"}>
                  <Calendar className="mr-2 inline h-4 w-4" />
                  Reagendar antigos
                </button>
                <button className={actionButtonClass("primary")} onClick={() => toast.info("Use o gerador de vídeos ou o editor existente para criar uma nova publicação.")}>
                  <Plus className="mr-2 inline h-4 w-4" />
                  Nova publicação
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {[
                ["Agendados", kpis.scheduled, Calendar, "text-indigo-600 bg-indigo-50"],
                ["Em fila", kpis.queue, Clock3, "text-amber-600 bg-amber-50"],
                ["Processando", kpis.processing, Loader2, "text-blue-600 bg-blue-50"],
                ["Falhas", kpis.failed, AlertTriangle, "text-rose-600 bg-rose-50"],
                ["Publicados", kpis.published, Send, "text-emerald-600 bg-emerald-50"],
              ].map(([label, value, Icon, color]) => (
                <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${color}`}>
                      {React.createElement(Icon as any, { className: "h-5 w-5" })}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-500">{label as string}</p>
                      <p className="text-2xl font-black">{value as number}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 xl:grid-cols-[minmax(220px,1.2fr)_repeat(7,minmax(120px,0.7fr))]">
              <label className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="publication-search"
                  value={filters.q}
                  onChange={(event) => {
                    setPage(1);
                    setFilters((current) => ({ ...current, q: event.target.value }));
                  }}
                  placeholder="Buscar publicações..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-medium outline-none focus:border-indigo-300 focus:bg-white"
                />
              </label>

              <select className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold" value={filters.period} onChange={(event) => setFilters((current) => ({ ...current, period: event.target.value as Filters["period"] }))}>
                <option value="all">Todo período</option>
                <option value="today">Hoje</option>
                <option value="week">Últimos 7 dias</option>
                <option value="month">Último mês</option>
                <option value="custom">Personalizado</option>
              </select>

              <select className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold" value={filters.platform} disabled={Boolean(lockedPlatform)} onChange={(event) => setFilters((current) => ({ ...current, platform: event.target.value }))}>
                <option value="">Plataforma</option>
                <option value="YOUTUBE">YouTube</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="TIKTOK">TikTok</option>
                <option value="FACEBOOK">Facebook</option>
                <option value="LINKEDIN">LinkedIn</option>
              </select>

              <select className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
                <option value="">Status geral</option>
                <option value="DRAFT">Rascunho</option>
                <option value="SCHEDULED">Agendado</option>
                <option value="QUEUED">Em fila</option>
                <option value="PROCESSING">Processando</option>
                <option value="PUBLISHING">Enviando</option>
                <option value="PUBLISHED">Publicado</option>
                <option value="PAUSED">Pausado</option>
                <option value="FAILED">Falhou</option>
              </select>

              <select className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold" value={filters.platformStatus} onChange={(event) => setFilters((current) => ({ ...current, platformStatus: event.target.value }))}>
                <option value="">Status plataforma</option>
                <option value="SCHEDULED">Agendado</option>
                <option value="PROCESSING">Processando</option>
                <option value="PUBLISHED">Publicado</option>
                <option value="FAILED">Falhou</option>
              </select>

              <select className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold" value={filters.postType} onChange={(event) => setFilters((current) => ({ ...current, postType: event.target.value }))}>
                <option value="">Tipo</option>
                <option value="REEL">Reel/Short</option>
                <option value="STORY">Story</option>
                <option value="POST">Post</option>
              </select>

              <select className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold" value={filters.media} onChange={(event) => setFilters((current) => ({ ...current, media: event.target.value }))}>
                <option value="">Mídia</option>
                <option value="with">Com mídia</option>
                <option value="without">Sem mídia</option>
              </select>

              <select className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold" value={filters.errors} onChange={(event) => setFilters((current) => ({ ...current, errors: event.target.value }))}>
                <option value="">Erros</option>
                <option value="with">Com erro</option>
                <option value="without">Sem erro</option>
              </select>
            </div>

            {filters.period === "custom" ? (
              <div className="mt-3 flex flex-wrap gap-3">
                <input type="date" value={filters.dateFrom} onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))} className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-bold" />
                <input type="date" value={filters.dateTo} onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))} className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-bold" />
              </div>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
              <button className={actionButtonClass()} onClick={saveFilter}>
                <Filter className="mr-2 inline h-4 w-4" />
                Salvar filtro
              </button>
              {savedFilters.map((item) => (
                <button key={item.name} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700 hover:bg-white" onClick={() => setFilters(item.filters)}>
                  {item.name}
                </button>
              ))}
              <button className="ml-auto text-indigo-600 hover:text-indigo-800" onClick={() => setFilters({ ...DEFAULT_FILTERS, platform: lockedPlatform })}>
                Limpar filtros
              </button>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-black">{total.toLocaleString("pt-BR")} publicações encontradas</p>
                <p className="text-xs font-medium text-slate-500">Atalhos: “/” busca, “R” atualiza, “Esc” fecha detalhes.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className={actionButtonClass()} onClick={() => applyBulk("pause")} disabled={!selectedRows.length}>
                  <Pause className="mr-2 inline h-4 w-4" />
                  Pausar
                </button>
                <button className={actionButtonClass()} onClick={() => applyBulk("publish")} disabled={!selectedRows.length}>
                  <Send className="mr-2 inline h-4 w-4" />
                  Publicar agora
                </button>
                <button className={actionButtonClass("danger")} onClick={() => applyBulk("cancel")} disabled={!selectedRows.length}>
                  Cancelar selecionadas
                </button>
              </div>
            </div>

            {error ? <div className="m-4 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-bold text-rose-700">{error}</div> : null}

            <div className="overflow-x-auto">
              <table className="min-w-[1050px] w-full text-left text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="w-10 px-4 py-3">
                      <input type="checkbox" checked={posts.length > 0 && selectedRows.length === posts.length} onChange={(event) => setSelectedRows(event.target.checked ? posts.map((post) => post.id) : [])} />
                    </th>
                    <th className="px-4 py-3">Publicação</th>
                    <th className="px-4 py-3">Plataformas</th>
                    <th className="px-4 py-3">Status geral</th>
                    <th className="px-4 py-3">
                      <button className="inline-flex items-center gap-1" onClick={() => setFilters((current) => ({ ...current, sortBy: "scheduledTo", sortDir: current.sortDir === "asc" ? "desc" : "asc" }))}>
                        Data agendada <ArrowDownUp className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3">Atualizado em</th>
                    <th className="px-4 py-3">Conta</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, index) => (
                      <tr key={index} className="border-t border-slate-100">
                        <td colSpan={8} className="px-4 py-4">
                          <div className="h-14 animate-pulse rounded-2xl bg-slate-100" />
                        </td>
                      </tr>
                    ))
                  ) : groups.length ? (
                    groups.map((group) => {
                      const selected = selectedGroup?.id === group.id;
                      return (
                        <tr key={group.id} className={`cursor-pointer border-t border-slate-100 hover:bg-indigo-50/40 ${selected ? "bg-indigo-50/70" : "bg-white"}`} onClick={() => setSelectedId(group.id)}>
                          <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                            <input type="checkbox" checked={group.posts.every((post) => selectedRows.includes(post.id))} onChange={() => group.posts.forEach((post) => toggleSelection(post.id))} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200">
                                {group.thumbnail ? <Image src={group.thumbnail} alt="" fill className="object-cover" unoptimized /> : <Video className="h-5 w-5 text-slate-400" />}
                              </div>
                              <div className="min-w-0">
                                <p className="line-clamp-1 font-black text-slate-900">{group.title}</p>
                                <p className="line-clamp-2 max-w-xl text-xs font-medium text-slate-500">{group.caption}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1.5">{group.posts.map((post) => <PlatformMark key={post.id} platform={String(post.platform)} />)}</div>
                          </td>
                          <td className="px-4 py-3"><StatusBadge status={overallStatus(group)} /></td>
                          <td className="px-4 py-3 text-xs font-bold text-slate-700">{formatDate(group.scheduledTo || group.postedAt)}</td>
                          <td className="px-4 py-3 text-xs font-bold text-slate-500">{formatAgo(group.updatedAt)}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-700">
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">{group.accountName.slice(0, 2).toUpperCase()}</span>
                              {group.accountName}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right" onClick={(event) => event.stopPropagation()}>
                            <div className="flex justify-end gap-1">
                              <button className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-indigo-600" title="Sincronizar / reenviar" onClick={() => publishNow(group.posts[0])}>
                                {runningId === group.posts[0].id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                              </button>
                              <Link className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-indigo-600" href={`/admin/social/posts/${group.posts[0].id}`} title="Editar">
                                <FileText className="h-4 w-4" />
                              </Link>
                              <button className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-slate-900" title="Mais detalhes" onClick={() => setSelectedId(group.id)}>
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-4 py-14 text-center">
                        <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100"><Search className="h-6 w-6 text-slate-400" /></div>
                          <p className="text-base font-black">Nenhuma publicação encontrada</p>
                          <p className="text-sm font-medium text-slate-500">Ajuste os filtros ou rode o cron para verificar publicações pendentes.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                Itens por página
                <select className="rounded-xl border border-slate-200 px-2 py-1" value={pageSize} onChange={(event) => { setPage(1); setPageSize(Number(event.target.value)); }}>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div className="flex items-center justify-between gap-3">
                <button className={actionButtonClass()} disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}><ChevronLeft className="h-4 w-4" /></button>
                <span className="text-sm font-black">{page} / {totalPages}</span>
                <button className={actionButtonClass()} disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        </div>

        <PublicationDetails
          group={selectedGroup}
          tab={detailsTab}
          setTab={setDetailsTab}
          onClose={() => setSelectedId(null)}
          onPublish={publishNow}
          onDuplicate={duplicatePost}
          onDelete={deletePost}
          onPause={(post) => updatePost(post, { status: "PAUSED" }, "Publicação pausada.")}
          onCancel={(post) => updatePost(post, { status: "CANCELLED" }, "Publicação cancelada.")}
          onRefresh={fetchPosts}
          runningId={runningId}
          cronStatus={cronStatus}
        />
      </section>
    </main>
  );
}

function PublicationDetails({
  group,
  tab,
  setTab,
  onClose,
  onPublish,
  onDuplicate,
  onDelete,
  onPause,
  onCancel,
  onRefresh,
  runningId,
  cronStatus,
}: {
  group: PublicationGroup | null;
  tab: "summary" | "timeline" | "logs" | "media" | "info";
  setTab: (tab: "summary" | "timeline" | "logs" | "media" | "info") => void;
  onClose: () => void;
  onPublish: (post: SocialPost) => void;
  onDuplicate: (post: SocialPost) => void;
  onDelete: (post: SocialPost) => void;
  onPause: (post: SocialPost) => void;
  onCancel: (post: SocialPost) => void;
  onRefresh: () => void;
  runningId: string | null;
  cronStatus: any;
}) {
  const primary = group?.posts[0] || null;
  const hashtags = hashtagsFrom(group?.caption || "");

  return (
    <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] overflow-y-auto rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm xl:block">
      {!group || !primary ? (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <Grid2X2 className="mb-3 h-9 w-9 text-slate-300" />
          <p className="font-black">Selecione uma publicação</p>
          <p className="mt-1 text-sm font-medium text-slate-500">Os detalhes aparecem aqui sem sair da listagem.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Detalhes da publicação</p>
              <h2 className="mt-1 line-clamp-2 text-lg font-black">{group.title}</h2>
            </div>
            <button className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" onClick={onClose}><X className="h-4 w-4" /></button>
          </div>

          <div className="flex gap-3">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200">
              {group.thumbnail ? <Image src={group.thumbnail} alt="" fill className="object-cover" unoptimized /> : <Video className="h-6 w-6 text-slate-400" />}
            </div>
            <div className="min-w-0 text-sm">
              <p className="font-black">{group.accountName}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">ID: {primary.id}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">Origem: {group.origin}</p>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-1 border-b border-slate-100 text-xs font-black text-slate-500">
            {[
              ["summary", "Resumo"],
              ["timeline", "Timeline"],
              ["logs", "Logs"],
              ["media", "Mídia"],
              ["info", "Infos"],
            ].map(([key, label]) => (
              <button key={key} className={`border-b-2 px-2 py-2 ${tab === key ? "border-indigo-600 text-indigo-700" : "border-transparent hover:text-slate-900"}`} onClick={() => setTab(key as any)}>
                {label}
              </button>
            ))}
          </div>

          {tab === "summary" ? (
            <div className="space-y-3">
              <Panel title="Status por plataforma">
                <div className="space-y-3">
                  {group.posts.map((post) => {
                    const url = publishedUrl(post);
                    return (
                      <div key={post.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 p-3">
                        <div className="flex items-center gap-2"><PlatformMark platform={String(post.platform)} /><StatusBadge status={post.status} /></div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                          {formatDate(post.postedAt || post.scheduledTo)}
                          {url ? <a href={url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-800"><ExternalLink className="h-4 w-4" /></a> : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Panel>

              <Panel title="Legenda">
                <p className="whitespace-pre-wrap text-sm font-medium leading-6 text-slate-700">{group.caption || "Sem legenda cadastrada."}</p>
                <button className={`${actionButtonClass()} mt-3`} onClick={() => { navigator.clipboard.writeText(group.caption || ""); toast.success("Legenda copiada."); }}><Copy className="mr-2 inline h-4 w-4" />Copiar legenda</button>
              </Panel>

              <Panel title="Hashtags">
                {hashtags.length ? <div className="flex flex-wrap gap-2">{hashtags.map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{tag}</span>)}</div> : <p className="text-sm font-medium text-slate-500">Nenhuma hashtag detectada.</p>}
                <button className={`${actionButtonClass()} mt-3`} onClick={() => { navigator.clipboard.writeText(hashtags.join(" ")); toast.success("Hashtags copiadas."); }}><Hash className="mr-2 inline h-4 w-4" />Copiar hashtags</button>
              </Panel>
            </div>
          ) : null}

          {tab === "timeline" ? (
            <Panel title="Timeline">
              <div className="space-y-3">
                {group.posts.map((post) => (
                  <div key={post.id} className="rounded-2xl bg-slate-50 p-3">
                    <div className="flex items-center justify-between"><PlatformMark platform={String(post.platform)} /><StatusBadge status={post.status} /></div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-medium text-slate-500">
                      <span>Criado: {formatDate(post.createdAt)}</span>
                      <span>Atualizado: {formatDate(post.updatedAt)}</span>
                      <span>Agendado: {formatDate(post.scheduledTo)}</span>
                      <span>Publicado: {formatDate(post.postedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          ) : null}

          {tab === "logs" ? (
            <Panel title="Logs e resposta das APIs">
              <div className="space-y-3">
                {group.posts.map((post) => (
                  <pre key={post.id} className="max-h-56 overflow-auto rounded-2xl bg-slate-950 p-3 text-xs text-slate-100">
                    {JSON.stringify({ id: post.id, platform: post.platform, status: post.status, error: post.error || post.lastError || null, apiResponse: post.apiResponse || null, payload: post.payload || null }, null, 2)}
                  </pre>
                ))}
                {cronStatus ? <pre className="max-h-56 overflow-auto rounded-2xl bg-slate-100 p-3 text-xs text-slate-700">{JSON.stringify(cronStatus, null, 2)}</pre> : null}
              </div>
            </Panel>
          ) : null}

          {tab === "media" ? (
            <Panel title="Mídias">
              <div className="space-y-3">
                {group.videoUrl ? <video src={group.videoUrl} controls className="w-full rounded-2xl bg-black" /> : <div className="flex h-40 items-center justify-center rounded-2xl bg-slate-100 text-sm font-bold text-slate-500"><ImageIcon className="mr-2 h-5 w-5" />Sem vídeo vinculado</div>}
                {group.videoUrl ? <a href={group.videoUrl} target="_blank" rel="noreferrer" className={actionButtonClass()}><Download className="mr-2 inline h-4 w-4" />Baixar mídia</a> : null}
              </div>
            </Panel>
          ) : null}

          {tab === "info" ? (
            <Panel title="IDs, integrações e URLs">
              <div className="space-y-3 text-xs font-medium text-slate-600">
                {group.posts.map((post) => (
                  <div key={post.id} className="rounded-2xl border border-slate-100 p-3">
                    <p className="font-black text-slate-900">{PLATFORM_LABEL[String(post.platform)] || post.platform}</p>
                    <p>ID interno: {post.id}</p>
                    <p>Tipo: {post.postType || "-"}</p>
                    <p>URL publicada: {publishedUrl(post) || "-"}</p>
                    <p>Erro: {post.error || post.lastError || "-"}</p>
                  </div>
                ))}
              </div>
            </Panel>
          ) : null}

          <div className="grid grid-cols-2 gap-2">
            <Link className={actionButtonClass()} href={`/admin/social/posts/${primary.id}`}><FileText className="mr-2 inline h-4 w-4" />Editar</Link>
            <button className={actionButtonClass()} onClick={() => onDuplicate(primary)}><Copy className="mr-2 inline h-4 w-4" />Duplicar</button>
            <button className={actionButtonClass()} onClick={() => onPause(primary)}><Pause className="mr-2 inline h-4 w-4" />Pausar</button>
            <button className={actionButtonClass()} onClick={() => onPublish(primary)} disabled={runningId === primary.id}>{runningId === primary.id ? <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> : <Send className="mr-2 inline h-4 w-4" />}Publicar agora</button>
            <button className={actionButtonClass()} onClick={onRefresh}><RotateCcw className="mr-2 inline h-4 w-4" />Sincronizar</button>
            <button className={actionButtonClass()} onClick={() => onCancel(primary)}>Cancelar</button>
            <button className={actionButtonClass()} onClick={() => window.open(group.videoUrl || publishedUrl(primary) || `/admin/social/posts/${primary.id}`, "_blank")}><Eye className="mr-2 inline h-4 w-4" />Visualizar</button>
            <button className={actionButtonClass("danger")} onClick={() => onDelete(primary)}><Trash2 className="mr-2 inline h-4 w-4" />Excluir</button>
          </div>
        </div>
      )}
    </aside>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <Info className="h-4 w-4 text-indigo-600" />
        <h3 className="text-sm font-black">{title}</h3>
      </div>
      {children}
    </section>
  );
}
