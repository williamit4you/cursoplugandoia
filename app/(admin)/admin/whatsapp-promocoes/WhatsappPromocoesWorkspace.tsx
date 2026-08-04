"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

export type WhatsappPromocoesSection = "cadastro" | "catalogo" | "agendamentos";

type ConfigState = {
  offersCronEnabled: boolean;
  offersGroupTargetId: string;
  offersGroupLabel: string;
  offersPublishIntervalMin: number;
  offersDailyStartHour: number;
  offersDailyEndHour: number;
  offersRequireApproval: boolean;
  offersLastRunAt: string | null;
  offersNextRunAt: string | null;
  evolutionEnabled: boolean;
};

type CatalogItem = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  category: string | null;
  affiliateUrl: string;
  productUrl: string | null;
  oldPrice: number | null;
  currentPrice: number | null;
  discountPercent: number | null;
  savingsAmount: number | null;
  active: boolean;
  readyForPublish: boolean;
  sourceBatchKey: string | null;
  _count?: { posts: number };
};

type PromoPost = {
  id: string;
  status: string;
  headline: string;
  bodyText: string;
  linkUrl: string;
  mediaUrl?: string | null;
  scheduledTo: string | null;
  sentAt: string | null;
  targetId: string | null;
  errorMessage: string | null;
  createdAt?: string;
  updatedAt?: string;
  catalogItem: {
    id: string;
    title: string;
    slug: string;
    imageUrl?: string | null;
  };
};

type CatalogFilter = "ALL" | "MISSING_POST" | "SCHEDULED" | "PENDING" | "SENT" | "FAILED";

const emptyManual = {
  title: "",
  description: "",
  imageUrl: "",
  category: "",
  affiliateUrl: "",
  productUrl: "",
  oldPrice: "",
  currentPrice: "",
};

const emptyPostDraft = {
  headline: "",
  bodyText: "",
  linkUrl: "",
  mediaUrl: "",
  targetId: "",
  scheduledTo: "",
  status: "SCHEDULED",
};

function toLocalDateTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDateTime(value?: string | null) {
  if (!value) return "sem agenda";
  return new Date(value).toLocaleString("pt-BR");
}

function formatMoney(value?: number | null) {
  if (value == null) return "R$ 0,00";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function matchesDateRange(value: string | null | undefined, from: string, to: string) {
  if (!value) return false;
  const current = new Date(value).getTime();
  const fromTime = from ? new Date(`${from}T00:00:00`).getTime() : null;
  const toTime = to ? new Date(`${to}T23:59:59`).getTime() : null;
  if (fromTime && current < fromTime) return false;
  if (toTime && current > toTime) return false;
  return true;
}

function isSameDay(value: string | null | undefined, compare = new Date()) {
  if (!value) return false;
  const current = new Date(value);
  return current.getFullYear() === compare.getFullYear() && current.getMonth() === compare.getMonth() && current.getDate() === compare.getDate();
}

function isPastDate(value: string | null | undefined) {
  if (!value) return false;
  return new Date(value).getTime() < Date.now();
}

export default function WhatsappPromocoesWorkspace({ section }: { section: WhatsappPromocoesSection }) {
  const [config, setConfig] = useState<ConfigState | null>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [posts, setPosts] = useState<PromoPost[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [manual, setManual] = useState(emptyManual);
  const [manualImageFile, setManualImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [batchKey, setBatchKey] = useState("");
  const [scheduleDrafts, setScheduleDrafts] = useState<Record<string, string>>({});
  const [selectedCatalogIds, setSelectedCatalogIds] = useState<string[]>([]);
  const [bulkScheduleAt, setBulkScheduleAt] = useState("");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogFilter, setCatalogFilter] = useState<CatalogFilter>("ALL");
  const [catalogDateFrom, setCatalogDateFrom] = useState("");
  const [catalogDateTo, setCatalogDateTo] = useState("");
  const [postSearch, setPostSearch] = useState("");
  const [postStatusFilter, setPostStatusFilter] = useState("ALL");
  const [postDateMode, setPostDateMode] = useState<"ANY" | "CREATED" | "SCHEDULED" | "SENT">("ANY");
  const [postDateFrom, setPostDateFrom] = useState("");
  const [postDateTo, setPostDateTo] = useState("");
  const [catalogPage, setCatalogPage] = useState(0);
  const [catalogRowsPerPage, setCatalogRowsPerPage] = useState(25);
  const [postPage, setPostPage] = useState(0);
  const [postRowsPerPage, setPostRowsPerPage] = useState(25);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<CatalogItem>>({});
  const [editingPost, setEditingPost] = useState<PromoPost | null>(null);
  const [postDraft, setPostDraft] = useState(emptyPostDraft);
  const [historyItem, setHistoryItem] = useState<CatalogItem | null>(null);
  const [historyPosts, setHistoryPosts] = useState<PromoPost[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const navItems: Array<{ key: WhatsappPromocoesSection; label: string; href: string }> = [
    { key: "cadastro", label: "Cadastro", href: "/admin/whatsapp-promocoes/cadastro" },
    { key: "catalogo", label: "Catalogo", href: "/admin/whatsapp-promocoes/catalogo" },
    { key: "agendamentos", label: "Agendamentos", href: "/admin/whatsapp-promocoes/agendamentos" },
  ];

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [configRes, catalogRes, postsRes] = await Promise.all([
        fetch("/api/whatsapp-promos/config", { cache: "no-store" }),
        fetch("/api/whatsapp-promos/catalog", { cache: "no-store" }),
        fetch("/api/whatsapp-promos/posts?status=ALL", { cache: "no-store" }),
      ]);
      const [configData, catalogData, postsData] = await Promise.all([
        configRes.json().catch(() => ({})),
        catalogRes.json().catch(() => ({})),
        postsRes.json().catch(() => ({})),
      ]);
      if (!configRes.ok) throw new Error(configData?.error || "Falha ao carregar configuracao");
      if (!catalogRes.ok) throw new Error(catalogData?.error || "Falha ao carregar catalogo");
      if (!postsRes.ok) throw new Error(postsData?.error || "Falha ao carregar postagens");
      setConfig(configData);
      setCatalog(catalogData.items || []);
      setPosts(postsData.items || []);
      setScheduleDrafts(Object.fromEntries((postsData.items || []).map((item: PromoPost) => [item.id, toLocalDateTime(item.scheduledTo)])));
    } catch (err: any) {
      setError(err?.message || "Falha ao carregar modulo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const postsByCatalog = useMemo(() => {
    const map = new Map<string, PromoPost[]>();
    for (const post of posts) {
      const list = map.get(post.catalogItem.id) || [];
      list.push(post);
      map.set(post.catalogItem.id, list);
    }
    return map;
  }, [posts]);

  const catalogMeta = useMemo(() => {
    const map = new Map<string, { hasScheduled: boolean; hasPending: boolean; hasSent: boolean; hasFailed: boolean; nextScheduledAt: string | null }>();
    for (const item of catalog) {
      const related = postsByCatalog.get(item.id) || [];
      const scheduled = related.filter((post) => post.status === "SCHEDULED" && post.scheduledTo).sort((a, b) => new Date(a.scheduledTo || 0).getTime() - new Date(b.scheduledTo || 0).getTime());
      map.set(item.id, {
        hasScheduled: related.some((post) => post.status === "SCHEDULED"),
        hasPending: related.some((post) => post.status === "DRAFT" || post.status === "APPROVED"),
        hasSent: related.some((post) => post.status === "SENT"),
        hasFailed: related.some((post) => post.status === "FAILED"),
        nextScheduledAt: scheduled[0]?.scheduledTo || null,
      });
    }
    return map;
  }, [catalog, postsByCatalog]);

  const filteredCatalog = useMemo(() => {
    return catalog.filter((item) => {
      const meta = catalogMeta.get(item.id) || { hasScheduled: false, hasPending: false, hasSent: false, hasFailed: false, nextScheduledAt: null };
      const search = catalogSearch.trim().toLowerCase();
      if (search) {
        const haystack = [item.title, item.slug, item.category || "", item.affiliateUrl || "", item.productUrl || ""].join(" ").toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      if (catalogFilter === "MISSING_POST" && (item._count?.posts || 0) > 0) return false;
      if (catalogFilter === "SCHEDULED" && !meta.hasScheduled) return false;
      if (catalogFilter === "PENDING" && !meta.hasPending) return false;
      if (catalogFilter === "SENT" && !meta.hasSent) return false;
      if (catalogFilter === "FAILED" && !meta.hasFailed) return false;
      if ((catalogDateFrom || catalogDateTo) && !matchesDateRange(meta.nextScheduledAt, catalogDateFrom, catalogDateTo)) return false;
      return true;
    });
  }, [catalog, catalogDateFrom, catalogDateTo, catalogFilter, catalogMeta, catalogSearch]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (postStatusFilter !== "ALL" && post.status !== postStatusFilter) return false;
      const search = postSearch.trim().toLowerCase();
      if (search) {
        const haystack = [post.headline, post.bodyText, post.catalogItem.title, post.linkUrl].join(" ").toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      if (!(postDateFrom || postDateTo)) return true;
      const baseValue = postDateMode === "SENT" ? post.sentAt : postDateMode === "SCHEDULED" ? post.scheduledTo : post.createdAt;
      return matchesDateRange(baseValue, postDateFrom, postDateTo);
    });
  }, [postDateFrom, postDateMode, postDateTo, postSearch, postStatusFilter, posts]);

  const catalogPageItems = useMemo(() => filteredCatalog.slice(catalogPage * catalogRowsPerPage, catalogPage * catalogRowsPerPage + catalogRowsPerPage), [catalogPage, catalogRowsPerPage, filteredCatalog]);
  const postPageItems = useMemo(() => filteredPosts.slice(postPage * postRowsPerPage, postPage * postRowsPerPage + postRowsPerPage), [filteredPosts, postPage, postRowsPerPage]);

  useEffect(() => setCatalogPage(0), [catalogRowsPerPage, filteredCatalog.length, catalogSearch, catalogFilter, catalogDateFrom, catalogDateTo]);
  useEffect(() => setPostPage(0), [postRowsPerPage, filteredPosts.length, postSearch, postStatusFilter, postDateMode, postDateFrom, postDateTo]);

  const readyCount = useMemo(() => catalog.filter((item) => item.readyForPublish).length, [catalog]);
  const scheduledCount = useMemo(() => posts.filter((item) => item.status === "SCHEDULED").length, [posts]);
  const sentCount = useMemo(() => posts.filter((item) => item.status === "SENT").length, [posts]);
  const failedCount = useMemo(() => posts.filter((item) => item.status === "FAILED").length, [posts]);
  const pendingCatalogCount = useMemo(() => catalog.filter((item) => !item._count?.posts).length, [catalog]);
  const scheduledTodayCount = useMemo(() => posts.filter((item) => item.status === "SCHEDULED" && isSameDay(item.scheduledTo)).length, [posts]);
  const overdueScheduledCount = useMemo(() => posts.filter((item) => item.status === "SCHEDULED" && isPastDate(item.scheduledTo)).length, [posts]);
  const approvalQueueCount = useMemo(() => posts.filter((item) => item.status === "DRAFT" || item.status === "APPROVED").length, [posts]);

  const statusColor = (status: string) =>
    status === "SENT" ? "success" : status === "FAILED" ? "error" : status === "SCHEDULED" ? "info" : status === "CANCELED" ? "warning" : "default";

  const surfaceSx = {
    p: { xs: 2, md: 3 },
    borderRadius: 4,
    border: "1px solid",
    borderColor: "rgba(148, 163, 184, 0.18)",
    boxShadow: "0 22px 70px rgba(15, 23, 42, 0.08)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)",
  } as const;

  const metricCards = [
    { label: "Catalogo", value: catalog.length, tone: "#0f172a" },
    { label: "Sem agenda", value: pendingCatalogCount, tone: "#7c3aed" },
    { label: "Agendados hoje", value: scheduledTodayCount, tone: "#2563eb" },
    { label: "Atrasados", value: overdueScheduledCount, tone: "#dc2626" },
    { label: "Fila de aprovacao", value: approvalQueueCount, tone: "#475569" },
    { label: "Enviados", value: sentCount, tone: "#059669" },
  ];

  const saveConfig = async () => {
    if (!config) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/whatsapp-promos/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Falha ao salvar configuracao");
      setMessage("Configuracao salva.");
      await load();
    } catch (err: any) {
      setError(err?.message || "Falha ao salvar configuracao");
    } finally {
      setSaving(false);
    }
  };

  const uploadProductImage = async (file: File) => {
    if (!file.type.startsWith("image/")) throw new Error("Selecione um arquivo de imagem valido.");
    const formData = new FormData();
    formData.set("file", file);
    const response = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.url) throw new Error(data?.error || "Falha ao enviar a imagem.");
    return String(data.url);
  };

  const selectManualImage = async (file: File | null) => {
    setManualImageFile(file);
    if (!file) return;
    setUploadingImage(true);
    setError(null);
    try {
      const imageUrl = await uploadProductImage(file);
      setManual((current) => ({ ...current, imageUrl }));
    } catch (err: any) {
      setManualImageFile(null);
      setError(err?.message || "Falha ao enviar a imagem.");
    } finally {
      setUploadingImage(false);
    }
  };

  const createManualItem = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/whatsapp-promos/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manual),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Falha ao criar item");
      setManual(emptyManual);
      setManualImageFile(null);
      setMessage("Item cadastrado no catalogo.");
      await load();
    } catch (err: any) {
      setError(err?.message || "Falha ao criar item");
    } finally {
      setSaving(false);
    }
  };

  const importCsv = async () => {
    if (!csvFile) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.set("file", csvFile);
      formData.set("batchKey", batchKey || `lote-${Date.now()}`);
      const res = await fetch("/api/whatsapp-promos/import-csv", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Falha ao importar CSV");
      setCsvFile(null);
      setBatchKey("");
      setMessage(`CSV importado. ${data.createdCount || 0} item(ns) criado(s).`);
      await load();
    } catch (err: any) {
      setError(err?.message || "Falha ao importar CSV");
    } finally {
      setSaving(false);
    }
  };

  const createPost = async (item: CatalogItem, mode: "draft" | "schedule", scheduledAt?: string) => {
    const scheduledTo = mode === "schedule" ? (scheduledAt || new Date(Date.now() + 60 * 60 * 1000).toISOString()) : null;
    const status = mode === "schedule" ? "SCHEDULED" : (config?.offersRequireApproval ? "DRAFT" : "APPROVED");
    const res = await fetch("/api/whatsapp-promos/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ catalogItemId: item.id, status, scheduledTo }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Falha ao criar postagem");
  };

  const handleCreatePost = async (item: CatalogItem, mode: "draft" | "schedule") => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await createPost(item, mode);
      setMessage(mode === "schedule" ? "Postagem agendada." : "Postagem criada.");
      await load();
    } catch (err: any) {
      setError(err?.message || "Falha ao criar postagem");
    } finally {
      setSaving(false);
    }
  };

  const bulkScheduleSelected = async () => {
    if (!selectedCatalogIds.length) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const selectedItems = filteredCatalog.filter((item) => selectedCatalogIds.includes(item.id));
      const scheduledAt = bulkScheduleAt ? new Date(bulkScheduleAt).toISOString() : new Date(Date.now() + 60 * 60 * 1000).toISOString();
      for (const item of selectedItems) {
        await createPost(item, "schedule", scheduledAt);
      }
      setSelectedCatalogIds([]);
      setMessage(`${selectedItems.length} item(ns) agendado(s).`);
      await load();
    } catch (err: any) {
      setError(err?.message || "Falha ao agendar em lote");
    } finally {
      setSaving(false);
    }
  };

  const toggleCatalogSelection = (id: string) => {
    setSelectedCatalogIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const toggleSelectAllVisibleCatalog = () => {
    const visibleIds = catalogPageItems.map((item) => item.id);
    const everySelected = visibleIds.every((id) => selectedCatalogIds.includes(id));
    setSelectedCatalogIds((current) => {
      if (everySelected) return current.filter((id) => !visibleIds.includes(id));
      return Array.from(new Set([...current, ...visibleIds]));
    });
  };

  const openEditor = (item: CatalogItem) => {
    setEditingItem(item);
    setEditDraft({ ...item, imageUrl: item.imageUrl || "", category: item.category || "", productUrl: item.productUrl || "" });
  };

  const saveCatalogItem = async () => {
    if (!editingItem) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/whatsapp-promos/catalog/${encodeURIComponent(editingItem.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editDraft),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Falha ao salvar item");
      setEditingItem(null);
      setMessage("Item atualizado.");
      await load();
    } catch (err: any) {
      setError(err?.message || "Falha ao salvar item");
    } finally {
      setSaving(false);
    }
  };

  const selectEditImage = async (file: File | null) => {
    if (!file) return;
    setUploadingImage(true);
    setError(null);
    try {
      const imageUrl = await uploadProductImage(file);
      setEditDraft((current) => ({ ...current, imageUrl }));
    } catch (err: any) {
      setError(err?.message || "Falha ao enviar a imagem.");
    } finally {
      setUploadingImage(false);
    }
  };

  const openPostEditor = (post: PromoPost) => {
    setEditingPost(post);
    setPostDraft({
      headline: post.headline,
      bodyText: post.bodyText,
      linkUrl: post.linkUrl,
      mediaUrl: post.mediaUrl || post.catalogItem.imageUrl || "",
      targetId: post.targetId || "",
      scheduledTo: toLocalDateTime(post.scheduledTo),
      status: post.status || "SCHEDULED",
    });
  };

  const savePostEdit = async () => {
    if (!editingPost) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/whatsapp-promos/posts/${encodeURIComponent(editingPost.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline: postDraft.headline,
          bodyText: postDraft.bodyText,
          linkUrl: postDraft.linkUrl,
          mediaUrl: postDraft.mediaUrl || null,
          targetId: postDraft.targetId || null,
          status: postDraft.status,
          scheduledTo: postDraft.scheduledTo ? new Date(postDraft.scheduledTo).toISOString() : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Falha ao editar publicacao");
      setEditingPost(null);
      setMessage("Publicacao atualizada.");
      await load();
    } catch (err: any) {
      setError(err?.message || "Falha ao editar publicacao");
    } finally {
      setSaving(false);
    }
  };

  const sendNow = async (postId: string) => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/whatsapp-promos/posts/${encodeURIComponent(postId)}/send`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Falha ao enviar promocao");
      setMessage("Promocao enviada para o WhatsApp.");
      await load();
    } catch (err: any) {
      setError(err?.message || "Falha ao enviar promocao");
    } finally {
      setSaving(false);
    }
  };

  const savePostSchedule = async (postId: string, nextStatus?: string) => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/whatsapp-promos/posts/${encodeURIComponent(postId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          scheduledTo: scheduleDrafts[postId] ? new Date(scheduleDrafts[postId]).toISOString() : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Falha ao salvar postagem");
      setMessage("Postagem atualizada.");
      await load();
    } catch (err: any) {
      setError(err?.message || "Falha ao salvar postagem");
    } finally {
      setSaving(false);
    }
  };

  const cancelPost = async (postId: string) => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/whatsapp-promos/posts/${encodeURIComponent(postId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELED", scheduledTo: null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Falha ao cancelar postagem");
      setMessage("Postagem cancelada.");
      await load();
    } catch (err: any) {
      setError(err?.message || "Falha ao cancelar postagem");
    } finally {
      setSaving(false);
    }
  };

  const openHistory = async (item: CatalogItem) => {
    setHistoryItem(item);
    setHistoryPosts([]);
    setHistoryLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/whatsapp-promos/posts?status=ALL&catalogItemId=${encodeURIComponent(item.id)}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Falha ao carregar historico");
      setHistoryPosts(data.items || []);
    } catch (err: any) {
      setError(err?.message || "Falha ao carregar historico");
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ position: "relative", overflow: "hidden", borderRadius: 5, px: { xs: 2.5, md: 3.5 }, py: { xs: 2.5, md: 3.25 }, color: "common.white", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 58%, #0f766e 100%)", boxShadow: "0 28px 80px rgba(15, 23, 42, 0.16)" }}>
        <Box sx={{ position: "absolute", inset: 0, background: "radial-gradient(circle at top right, rgba(255,255,255,0.18), transparent 28%)" }} />
        <Box sx={{ position: "relative", display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.45fr) minmax(320px, 0.95fr)" }, gap: 3 }}>
          <Box>
            <Typography variant="overline" sx={{ letterSpacing: 1.4, opacity: 0.72 }}>Operacao WhatsApp</Typography>
            <Typography variant="h3" sx={{ mt: 0.75, fontWeight: 900, lineHeight: 1.05, fontSize: { xs: "2rem", md: "3rem" } }}>WhatsApp Promocoes</Typography>
            <Typography sx={{ mt: 1.25, maxWidth: 760, color: "rgba(255,255,255,0.82)", fontSize: { xs: 14, md: 16 } }}>
              Separado para volume alto: cadastro, lista operacional e fila de agendamentos com filtros e acoes fortes.
            </Typography>
            <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Chip label={`Catalogo: ${catalog.length}`} sx={{ bgcolor: "rgba(255,255,255,0.14)", color: "white", fontWeight: 700 }} />
              <Chip label={`Prontos: ${readyCount}`} sx={{ bgcolor: "rgba(34,197,94,0.22)", color: "white", fontWeight: 700 }} />
              <Chip label={`Agendados: ${scheduledCount}`} sx={{ bgcolor: "rgba(59,130,246,0.22)", color: "white", fontWeight: 700 }} />
              <Chip label={`Enviados: ${sentCount}`} sx={{ bgcolor: "rgba(250,204,21,0.22)", color: "white", fontWeight: 700 }} />
              {failedCount ? <Chip label={`Falhas: ${failedCount}`} sx={{ bgcolor: "rgba(248,113,113,0.24)", color: "white", fontWeight: 700 }} /> : null}
            </Box>
            <Box sx={{ mt: 2.5, display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", xl: "repeat(6, minmax(0, 1fr))" }, gap: 1.2 }}>
              {metricCards.map((card) => (
                <Box key={card.label} sx={{ p: 1.5, borderRadius: 3, bgcolor: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.12)" }}>
                  <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.68)" }}>{card.label}</Typography>
                  <Typography sx={{ mt: 0.35, fontWeight: 900, fontSize: 24, lineHeight: 1 }}>{card.value}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
          <Box sx={{ display: "grid", gap: 1.25, alignContent: "start" }}>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {navItems.map((item) => (
                <Button key={item.key} component={Link} href={item.href} variant={section === item.key ? "contained" : "outlined"} sx={{ borderRadius: 999, px: 2, py: 1, color: "white", borderColor: "rgba(255,255,255,0.22)", bgcolor: section === item.key ? "rgba(255,255,255,0.18)" : "transparent" }}>
                  {item.label}
                </Button>
              ))}
            </Box>
            <Box sx={{ p: 2, borderRadius: 4, border: "1px solid rgba(255,255,255,0.12)", bgcolor: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)" }}>
              <Typography sx={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.72)", textTransform: "uppercase", letterSpacing: 1.1 }}>Resumo operacional</Typography>
              <Box sx={{ mt: 1.25, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1.25 }}>
                <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: "rgba(15,23,42,0.28)" }}>
                  <Typography sx={{ fontSize: 12, opacity: 0.72 }}>Canal</Typography>
                  <Typography sx={{ fontWeight: 800 }}>{config?.evolutionEnabled ? "Evolution pronta" : "Evolution desligada"}</Typography>
                </Box>
                <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: "rgba(15,23,42,0.28)" }}>
                  <Typography sx={{ fontSize: 12, opacity: 0.72 }}>Cron</Typography>
                  <Typography sx={{ fontWeight: 800 }}>{config?.offersCronEnabled ? "Ligado" : "Desligado"}</Typography>
                </Box>
                <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: "rgba(15,23,42,0.28)" }}>
                  <Typography sx={{ fontSize: 12, opacity: 0.72 }}>Proxima janela</Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: 13 }}>{formatDateTime(config?.offersNextRunAt)}</Typography>
                </Box>
                <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: "rgba(15,23,42,0.28)" }}>
                  <Typography sx={{ fontSize: 12, opacity: 0.72 }}>Aprovacao</Typography>
                  <Typography sx={{ fontWeight: 800 }}>{config?.offersRequireApproval ? "Manual" : "Automatica"}</Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {message ? <Alert severity="success" sx={{ borderRadius: 3 }}>{message}</Alert> : null}
      {error ? <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert> : null}

      {section === "cadastro" ? (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1.2fr 0.8fr" }, gap: 2.5 }}>
          <Paper sx={surfaceSx}>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>Centro de distribuicao</Typography>
            <Typography sx={{ mt: 0.75, color: "text.secondary" }}>Configure o grupo, a janela e a cadencia da automacao.</Typography>
            {config ? (
              <Box sx={{ mt: 2.5, display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 1.5 }}>
                <Box sx={{ gridColumn: { xs: "span 12", md: "span 3" } }}><TextField select fullWidth label="Cron" value={config.offersCronEnabled ? "true" : "false"} onChange={(e) => setConfig({ ...config, offersCronEnabled: e.target.value === "true" })}><MenuItem value="true">Ligado</MenuItem><MenuItem value="false">Desligado</MenuItem></TextField></Box>
                <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}><TextField fullWidth label="ID do grupo" value={config.offersGroupTargetId} onChange={(e) => setConfig({ ...config, offersGroupTargetId: e.target.value })} /></Box>
                <Box sx={{ gridColumn: { xs: "span 12", md: "span 5" } }}><TextField fullWidth label="Nome do grupo" value={config.offersGroupLabel} onChange={(e) => setConfig({ ...config, offersGroupLabel: e.target.value })} /></Box>
                <Box sx={{ gridColumn: { xs: "span 12", md: "span 3" } }}><TextField fullWidth type="number" label="Intervalo (min)" value={config.offersPublishIntervalMin} onChange={(e) => setConfig({ ...config, offersPublishIntervalMin: Number(e.target.value || 60) })} /></Box>
                <Box sx={{ gridColumn: { xs: "span 6", md: "span 3" } }}><TextField fullWidth type="number" label="Hora inicial" value={config.offersDailyStartHour} onChange={(e) => setConfig({ ...config, offersDailyStartHour: Number(e.target.value || 8) })} /></Box>
                <Box sx={{ gridColumn: { xs: "span 6", md: "span 3" } }}><TextField fullWidth type="number" label="Hora final" value={config.offersDailyEndHour} onChange={(e) => setConfig({ ...config, offersDailyEndHour: Number(e.target.value || 22) })} /></Box>
                <Box sx={{ gridColumn: { xs: "span 12", md: "span 3" } }}><TextField select fullWidth label="Aprovacao" value={config.offersRequireApproval ? "true" : "false"} onChange={(e) => setConfig({ ...config, offersRequireApproval: e.target.value === "true" })}><MenuItem value="true">Exigir aprovacao</MenuItem><MenuItem value="false">Publicar direto</MenuItem></TextField></Box>
                <Box sx={{ gridColumn: "span 12" }}><Button variant="contained" onClick={saveConfig} disabled={saving} sx={{ borderRadius: 3, bgcolor: "#111827" }}>Salvar configuracao</Button></Box>
              </Box>
            ) : null}
          </Paper>

          <Paper sx={surfaceSx}>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>Cadastro e importacao</Typography>
            <Box sx={{ mt: 2.5, display: "grid", gap: 1.5 }}>
              {[
                ["title", "Titulo"],
                ["description", "Descricao"],
                ["category", "Categoria"],
                ["affiliateUrl", "Link afiliado"],
                ["productUrl", "URL do produto"],
                ["oldPrice", "Preco antigo"],
                ["currentPrice", "Preco atual"],
              ].map(([key, label]) => (
                <TextField key={key} fullWidth label={label} value={(manual as any)[key]} onChange={(e) => setManual((current) => ({ ...current, [key]: e.target.value }))} multiline={key === "description"} minRows={key === "description" ? 4 : undefined} />
              ))}
              <Box sx={{ p: 1.5, borderRadius: 3, border: "1px dashed", borderColor: manual.imageUrl ? "success.main" : "rgba(99,102,241,0.35)", bgcolor: manual.imageUrl ? "rgba(240,253,244,0.85)" : "rgba(248,250,252,0.9)" }}>
                <Typography sx={{ fontWeight: 800 }}>Foto do produto</Typography>
                <Button component="label" variant="outlined" disabled={uploadingImage} sx={{ mt: 1.2, borderRadius: 3 }}>
                  {uploadingImage ? "Enviando foto..." : "Selecionar foto"}
                  <input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => selectManualImage(e.target.files?.[0] || null)} />
                </Button>
                {manualImageFile ? <Typography sx={{ mt: 1, fontSize: 12 }}>Arquivo: {manualImageFile.name}</Typography> : null}
                {manual.imageUrl ? <Box component="img" src={manual.imageUrl} alt="Previa da oferta" sx={{ mt: 1, width: "100%", maxWidth: 220, aspectRatio: "1 / 1", objectFit: "contain", borderRadius: 3, bgcolor: "white", border: "1px solid", borderColor: "divider", p: 1 }} /> : null}
              </Box>
              <TextField fullWidth label="Chave do lote" value={batchKey} onChange={(e) => setBatchKey(e.target.value)} placeholder="lote-shopee-agosto" />
              <Box><Typography sx={{ fontSize: 13, color: "text.secondary", mb: 1 }}>Arquivo CSV</Typography><input type="file" accept=".csv,text/csv" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} /></Box>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button variant="contained" onClick={createManualItem} disabled={saving} sx={{ borderRadius: 3, bgcolor: "#111827" }}>Cadastrar item</Button>
                <Button variant="contained" onClick={importCsv} disabled={!csvFile || saving} sx={{ borderRadius: 3, bgcolor: "#0f766e" }}>Importar CSV</Button>
              </Box>
            </Box>
          </Paper>
        </Box>
      ) : null}

      {section === "catalogo" ? (
        <Paper sx={surfaceSx}>
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>Lista operacional</Typography>
              <Typography sx={{ mt: 0.5, fontSize: 13, color: "text.secondary" }}>Selecione varios, abra link ou imagem e agende em lote.</Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Chip label={`Filtrados: ${filteredCatalog.length}`} />
              <Chip label={`Selecionados: ${selectedCatalogIds.length}`} color="info" />
            </Box>
          </Box>

          <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.7fr 1fr 1fr 1fr auto" }, gap: 1.25, position: "sticky", top: 12, zIndex: 4, p: 1.5, borderRadius: 3, bgcolor: "rgba(255,255,255,0.94)", backdropFilter: "blur(12px)", border: "1px solid", borderColor: "rgba(148,163,184,0.18)" }}>
            <TextField label="Buscar item" value={catalogSearch} onChange={(e) => setCatalogSearch(e.target.value)} />
            <TextField select label="Filtro" value={catalogFilter} onChange={(e) => setCatalogFilter(e.target.value as CatalogFilter)}>
              <MenuItem value="ALL">Todos</MenuItem>
              <MenuItem value="MISSING_POST">Falta agendar</MenuItem>
              <MenuItem value="SCHEDULED">Ja agendado</MenuItem>
              <MenuItem value="PENDING">Pendente</MenuItem>
              <MenuItem value="SENT">Ja enviado</MenuItem>
              <MenuItem value="FAILED">Falhou</MenuItem>
            </TextField>
            <TextField type="date" label="Agendado de" value={catalogDateFrom} onChange={(e) => setCatalogDateFrom(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField type="date" label="Agendado ate" value={catalogDateTo} onChange={(e) => setCatalogDateTo(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
            <Button variant="outlined" onClick={() => { setCatalogSearch(""); setCatalogFilter("ALL"); setCatalogDateFrom(""); setCatalogDateTo(""); }}>Limpar</Button>
          </Box>

          <Box sx={{ mt: 2, p: 1.5, borderRadius: 3, bgcolor: "#f8fafc", border: "1px solid", borderColor: "rgba(148,163,184,0.18)", display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center", position: "sticky", top: { xs: 150, md: 96 }, zIndex: 3 }}>
            <TextField type="datetime-local" size="small" label="Agendar selecionados para" value={bulkScheduleAt} onChange={(e) => setBulkScheduleAt(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={{ minWidth: 260 }} />
            <Button variant="contained" disabled={!selectedCatalogIds.length || saving} onClick={bulkScheduleSelected} sx={{ bgcolor: "#2563eb" }}>Agendar selecionados</Button>
            <Button variant="outlined" disabled={!selectedCatalogIds.length} onClick={() => setSelectedCatalogIds([])}>Limpar selecao</Button>
            <Chip size="small" label={`${pendingCatalogCount} sem agenda`} color="warning" variant="outlined" />
            <Chip size="small" label={`${scheduledTodayCount} para hoje`} color="info" variant="outlined" />
          </Box>

          <TableContainer sx={{ mt: 2, border: "1px solid", borderColor: "divider", borderRadius: 3, maxHeight: 680 }}>
            <Table stickyHeader size="small" sx={{ minWidth: 1280 }}>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={catalogPageItems.length > 0 && catalogPageItems.every((item) => selectedCatalogIds.includes(item.id))}
                      indeterminate={catalogPageItems.some((item) => selectedCatalogIds.includes(item.id)) && !catalogPageItems.every((item) => selectedCatalogIds.includes(item.id))}
                      onChange={toggleSelectAllVisibleCatalog}
                    />
                  </TableCell>
                  <TableCell>Produto</TableCell>
                  <TableCell>Categoria</TableCell>
                  <TableCell align="right">Preco atual</TableCell>
                  <TableCell>Status de fila</TableCell>
                  <TableCell>Proximo agendamento</TableCell>
                  <TableCell>Imagem</TableCell>
                  <TableCell align="right">Acoes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {catalogPageItems.map((item) => {
                  const meta = catalogMeta.get(item.id) || { hasScheduled: false, hasPending: false, hasSent: false, hasFailed: false, nextScheduledAt: null };
                  return (
                    <TableRow key={item.id} hover selected={selectedCatalogIds.includes(item.id)} sx={meta.nextScheduledAt && isPastDate(meta.nextScheduledAt) ? { bgcolor: "rgba(254,242,242,0.95)" } : undefined}>
                      <TableCell padding="checkbox"><Checkbox checked={selectedCatalogIds.includes(item.id)} onChange={() => toggleCatalogSelection(item.id)} /></TableCell>
                      <TableCell sx={{ maxWidth: 320 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: 14 }} noWrap>{item.title}</Typography>
                        <Typography sx={{ fontSize: 11, opacity: 0.65 }} noWrap>{item.slug}</Typography>
                      </TableCell>
                      <TableCell>{item.category || "-"}</TableCell>
                      <TableCell align="right">{item.currentPrice != null ? formatMoney(item.currentPrice) : "-"}</TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                          <Chip size="small" label={item.readyForPublish ? "Pronto" : "Pendente"} color={item.readyForPublish ? "success" : "warning"} />
                          {meta.hasScheduled ? <Chip size="small" label="Agendado" color="info" /> : null}
                          {meta.hasPending ? <Chip size="small" label="Na fila" /> : null}
                          {meta.hasSent ? <Chip size="small" label="Enviado" color="success" /> : null}
                          {meta.hasFailed ? <Chip size="small" label="Falhou" color="error" /> : null}
                          {meta.nextScheduledAt && isSameDay(meta.nextScheduledAt) ? <Chip size="small" label="Hoje" color="info" variant="outlined" /> : null}
                          {meta.nextScheduledAt && isPastDate(meta.nextScheduledAt) ? <Chip size="small" label="Atrasado" color="error" variant="outlined" /> : null}
                          {!item._count?.posts ? <Chip size="small" label="Sem agendamento" variant="outlined" /> : null}
                        </Box>
                      </TableCell>
                      <TableCell>{meta.nextScheduledAt ? formatDateTime(meta.nextScheduledAt) : "-"}</TableCell>
                      <TableCell>{item.imageUrl ? <Box component="img" src={item.imageUrl} alt="" sx={{ width: 42, height: 42, objectFit: "contain", borderRadius: 1, border: "1px solid", borderColor: "divider", bgcolor: "white" }} /> : "-"}</TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, flexWrap: "wrap" }}>
                          <Button size="small" variant="outlined" onClick={() => openEditor(item)}>Editar</Button>
                          <Button size="small" variant="outlined" onClick={() => openHistory(item)}>Posts ({item._count?.posts || 0})</Button>
                          <Button size="small" component="a" href={item.affiliateUrl} target="_blank" rel="noreferrer">Abrir link</Button>
                          <Button size="small" component="a" href={item.imageUrl || item.productUrl || item.affiliateUrl} target="_blank" rel="noreferrer">Abrir imagem</Button>
                          <Button size="small" variant="contained" onClick={() => handleCreatePost(item, "draft")} disabled={saving}>Postar</Button>
                          <Button size="small" onClick={() => handleCreatePost(item, "schedule")} disabled={saving}>Agendar</Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!filteredCatalog.length ? <TableRow><TableCell colSpan={8} align="center">Nenhum item encontrado.</TableCell></TableRow> : null}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filteredCatalog.length}
            page={catalogPage}
            onPageChange={(_event, nextPage) => setCatalogPage(nextPage)}
            rowsPerPage={catalogRowsPerPage}
            onRowsPerPageChange={(event) => {
              setCatalogRowsPerPage(Number(event.target.value || 25));
              setCatalogPage(0);
            }}
            rowsPerPageOptions={[25, 50, 100]}
            labelRowsPerPage="Itens por pagina"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </Paper>
      ) : null}

      {section === "agendamentos" ? (
        <Paper sx={surfaceSx}>
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>Fila de agendamentos e envios</Typography>
              <Typography sx={{ mt: 0.5, fontSize: 13, color: "text.secondary" }}>Filtre o que falta, o que foi agendado, o que foi enviado e adiante ou cancele quando precisar.</Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Chip label={`Filtrados: ${filteredPosts.length}`} />
              <Chip label={`Agendados: ${scheduledCount}`} color="info" />
              <Chip label={`Enviados: ${sentCount}`} color="success" />
            </Box>
          </Box>

          <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.5fr 1fr 1fr 1fr 1fr auto" }, gap: 1.25, position: "sticky", top: 12, zIndex: 4, p: 1.5, borderRadius: 3, bgcolor: "rgba(255,255,255,0.94)", backdropFilter: "blur(12px)", border: "1px solid", borderColor: "rgba(148,163,184,0.18)" }}>
            <TextField label="Buscar postagem" value={postSearch} onChange={(e) => setPostSearch(e.target.value)} />
            <TextField select label="Status" value={postStatusFilter} onChange={(e) => setPostStatusFilter(e.target.value)}>
              {["ALL", "DRAFT", "APPROVED", "SCHEDULED", "SENT", "FAILED", "CANCELED"].map((item) => (
                <MenuItem key={item} value={item}>{item}</MenuItem>
              ))}
            </TextField>
            <TextField select label="Data base" value={postDateMode} onChange={(e) => setPostDateMode(e.target.value as "ANY" | "CREATED" | "SCHEDULED" | "SENT")}>
              <MenuItem value="ANY">Criacao</MenuItem>
              <MenuItem value="CREATED">Criacao</MenuItem>
              <MenuItem value="SCHEDULED">Agendamento</MenuItem>
              <MenuItem value="SENT">Envio</MenuItem>
            </TextField>
            <TextField type="date" label="De" value={postDateFrom} onChange={(e) => setPostDateFrom(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField type="date" label="Ate" value={postDateTo} onChange={(e) => setPostDateTo(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
            <Button variant="outlined" onClick={() => { setPostSearch(""); setPostStatusFilter("ALL"); setPostDateMode("ANY"); setPostDateFrom(""); setPostDateTo(""); }}>Limpar</Button>
          </Box>

          <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" }, gap: 1.25 }}>
            {[
              { label: "Aguardando aprovacao", value: approvalQueueCount, tone: "#475569" },
              { label: "Agendados hoje", value: scheduledTodayCount, tone: "#2563eb" },
              { label: "Atrasados", value: overdueScheduledCount, tone: "#dc2626" },
              { label: "Falharam", value: failedCount, tone: "#b91c1c" },
            ].map((card) => (
              <Box key={card.label} sx={{ p: 1.5, borderRadius: 3, border: "1px solid", borderColor: "rgba(148,163,184,0.18)", bgcolor: "rgba(248,250,252,0.9)" }}>
                <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{card.label}</Typography>
                <Typography sx={{ mt: 0.5, fontWeight: 900, fontSize: 24, color: card.tone }}>{card.value}</Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{ mt: 2, display: "grid", gap: 2 }}>
            {postPageItems.map((post) => (
              <Box key={post.id} sx={{ border: "1px solid #e5e7eb", borderRadius: 3, p: 2, display: "grid", gap: 1.5, bgcolor: post.status === "SCHEDULED" && isPastDate(post.scheduledTo) ? "rgba(254,242,242,0.96)" : "rgba(255,255,255,0.9)" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                  <Box>
                    <Typography sx={{ fontWeight: 900 }}>{post.headline}</Typography>
                    <Typography sx={{ fontSize: 12, opacity: 0.7 }}>{post.catalogItem.title}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Chip size="small" label={post.status} color={statusColor(post.status)} />
                    <Chip size="small" label={post.sentAt ? `Enviado: ${formatDateTime(post.sentAt)}` : "Nao enviado"} />
                    {post.status === "SCHEDULED" && isSameDay(post.scheduledTo) ? <Chip size="small" label="Hoje" color="info" variant="outlined" /> : null}
                    {post.status === "SCHEDULED" && isPastDate(post.scheduledTo) ? <Chip size="small" label="Atrasado" color="error" variant="outlined" /> : null}
                  </Box>
                </Box>
                <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: "#f8fafc", border: "1px solid", borderColor: "rgba(148,163,184,0.12)" }}>
                  <Typography sx={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{post.bodyText}</Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Chip size="small" variant="outlined" label={`Criado: ${formatDateTime(post.createdAt)}`} />
                  <Chip size="small" variant="outlined" label={`Agendado: ${post.scheduledTo ? formatDateTime(post.scheduledTo) : "nao"}`} />
                  <Chip size="small" variant="outlined" label={`Enviado: ${post.sentAt ? formatDateTime(post.sentAt) : "nao"}`} />
                  <Chip size="small" variant="outlined" label={post.mediaUrl || post.catalogItem.imageUrl ? "Com imagem" : "Texto apenas"} />
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "240px auto" }, gap: 2, alignItems: "center" }}>
                  <TextField type="datetime-local" size="small" label="Agendar" value={scheduleDrafts[post.id] || ""} onChange={(e) => setScheduleDrafts((current) => ({ ...current, [post.id]: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Button variant="contained" onClick={() => savePostSchedule(post.id, "SCHEDULED")} disabled={saving} sx={{ bgcolor: "#2563eb" }}>Salvar agendamento</Button>
                    <Button variant="contained" onClick={() => savePostSchedule(post.id, "APPROVED")} disabled={saving} sx={{ bgcolor: "#111827" }}>Deixar pronto</Button>
                    <Button variant="contained" onClick={() => sendNow(post.id)} disabled={saving} sx={{ bgcolor: "#059669" }}>Publicar agora</Button>
                    <Button variant="outlined" onClick={() => openPostEditor(post)} disabled={saving}>Editar publicacao</Button>
                    <Button variant="outlined" color="warning" onClick={() => cancelPost(post.id)} disabled={saving || post.status === "SENT" || post.status === "CANCELED"}>Cancelar</Button>
                  </Box>
                </Box>
                {post.errorMessage ? <Alert severity="error">{post.errorMessage}</Alert> : null}
              </Box>
            ))}
            {!postPageItems.length ? <Typography sx={{ color: "text.secondary" }}>Nenhuma postagem encontrada para esse filtro.</Typography> : null}
          </Box>

          <TablePagination
            component="div"
            count={filteredPosts.length}
            page={postPage}
            onPageChange={(_event, nextPage) => setPostPage(nextPage)}
            rowsPerPage={postRowsPerPage}
            onRowsPerPageChange={(event) => {
              setPostRowsPerPage(Number(event.target.value || 25));
              setPostPage(0);
            }}
            rowsPerPageOptions={[25, 50, 100]}
            labelRowsPerPage="Posts por pagina"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </Paper>
      ) : null}

      <Dialog open={Boolean(editingItem)} onClose={() => !saving && setEditingItem(null)} fullWidth maxWidth="md">
        <DialogTitle>Editar oferta</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 2 }}>
            <Box sx={{ gridColumn: "span 12" }}><TextField fullWidth label="Titulo" value={String(editDraft.title || "")} onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))} /></Box>
            <Box sx={{ gridColumn: "span 12" }}><TextField fullWidth multiline minRows={3} label="Descricao" value={String(editDraft.description || "")} onChange={(e) => setEditDraft((d) => ({ ...d, description: e.target.value }))} /></Box>
            <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}><TextField fullWidth label="Categoria" value={String(editDraft.category || "")} onChange={(e) => setEditDraft((d) => ({ ...d, category: e.target.value }))} /></Box>
            <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}><TextField fullWidth label="Link afiliado" value={String(editDraft.affiliateUrl || "")} onChange={(e) => setEditDraft((d) => ({ ...d, affiliateUrl: e.target.value }))} /></Box>
            <Box sx={{ gridColumn: "span 12" }}><TextField fullWidth label="URL do produto" value={String(editDraft.productUrl || "")} onChange={(e) => setEditDraft((d) => ({ ...d, productUrl: e.target.value }))} /></Box>
            <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}><TextField fullWidth label="Preco antigo" value={String(editDraft.oldPrice ?? "")} onChange={(e) => setEditDraft((d) => ({ ...d, oldPrice: e.target.value as any }))} /></Box>
            <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}><TextField fullWidth label="Preco atual" value={String(editDraft.currentPrice ?? "")} onChange={(e) => setEditDraft((d) => ({ ...d, currentPrice: e.target.value as any }))} /></Box>
            <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}><TextField select fullWidth label="Status" value={editDraft.active === false ? "inactive" : "active"} onChange={(e) => setEditDraft((d) => ({ ...d, active: e.target.value === "active" }))}><MenuItem value="active">Ativo</MenuItem><MenuItem value="inactive">Inativo</MenuItem></TextField></Box>
            <Box sx={{ gridColumn: "span 12" }}>
              <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 1 }}>Imagem do produto</Typography>
              <Button component="label" variant="outlined" disabled={uploadingImage}>
                {uploadingImage ? "Enviando..." : "Enviar nova imagem"}
                <input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => selectEditImage(e.target.files?.[0] || null)} />
              </Button>
              {editDraft.imageUrl ? <Box component="img" src={String(editDraft.imageUrl)} alt="Previa da oferta" sx={{ display: "block", mt: 1, width: 160, height: 160, objectFit: "contain", border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "white" }} /> : <Typography sx={{ mt: 1, fontSize: 13, opacity: 0.7 }}>Sem imagem.</Typography>}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingItem(null)} disabled={saving}>Cancelar</Button>
          <Button variant="contained" onClick={saveCatalogItem} disabled={saving || uploadingImage}>Salvar alteracoes</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(editingPost)} onClose={() => !saving && setEditingPost(null)} fullWidth maxWidth="md">
        <DialogTitle>Editar publicacao</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 2 }}>
            <Box sx={{ gridColumn: "span 12" }}><TextField fullWidth label="Headline" value={postDraft.headline} onChange={(e) => setPostDraft((d) => ({ ...d, headline: e.target.value }))} /></Box>
            <Box sx={{ gridColumn: "span 12" }}><TextField fullWidth multiline minRows={6} label="Texto" value={postDraft.bodyText} onChange={(e) => setPostDraft((d) => ({ ...d, bodyText: e.target.value }))} /></Box>
            <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}><TextField fullWidth label="Link" value={postDraft.linkUrl} onChange={(e) => setPostDraft((d) => ({ ...d, linkUrl: e.target.value }))} /></Box>
            <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}><TextField fullWidth label="URL da imagem" value={postDraft.mediaUrl} onChange={(e) => setPostDraft((d) => ({ ...d, mediaUrl: e.target.value }))} /></Box>
            <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}><TextField fullWidth label="Destino" value={postDraft.targetId} onChange={(e) => setPostDraft((d) => ({ ...d, targetId: e.target.value }))} /></Box>
            <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}><TextField type="datetime-local" fullWidth label="Agendado para" value={postDraft.scheduledTo} onChange={(e) => setPostDraft((d) => ({ ...d, scheduledTo: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} /></Box>
            <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}><TextField select fullWidth label="Status" value={postDraft.status} onChange={(e) => setPostDraft((d) => ({ ...d, status: e.target.value }))}>{["DRAFT", "APPROVED", "SCHEDULED", "FAILED", "CANCELED"].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingPost(null)} disabled={saving}>Cancelar</Button>
          <Button variant="contained" onClick={savePostEdit} disabled={saving}>Salvar publicacao</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(historyItem)} onClose={() => !historyLoading && setHistoryItem(null)} fullWidth maxWidth="md">
        <DialogTitle>{historyItem ? `Historico de posts: ${historyItem.title}` : "Historico de posts"}</DialogTitle>
        <DialogContent dividers>
          {historyLoading ? <Typography>Carregando historico...</Typography> : null}
          {!historyLoading && !historyPosts.length ? <Typography>Esse item ainda nao tem posts criados.</Typography> : null}
          <Box sx={{ display: "grid", gap: 2 }}>
            {historyPosts.map((post) => (
              <Box key={post.id} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2, display: "grid", gap: 1.25 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                  <Typography sx={{ fontWeight: 800 }}>{post.headline}</Typography>
                  <Chip size="small" label={post.status} color={statusColor(post.status)} />
                </Box>
                <Typography sx={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{post.bodyText}</Typography>
                {post.errorMessage ? <Alert severity="error">{post.errorMessage}</Alert> : null}
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions><Button onClick={() => setHistoryItem(null)}>Fechar</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
