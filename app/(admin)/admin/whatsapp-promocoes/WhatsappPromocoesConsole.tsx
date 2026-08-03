"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
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
  posts?: Array<{
    id: string;
    status: string;
    scheduledTo: string | null;
    sentAt: string | null;
    createdAt: string;
  }>;
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

function toLocalDateTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDateTime(value?: string | null) {
  if (!value) return "sem data";
  return new Date(value).toLocaleString("pt-BR");
}

function formatMoney(value?: number | null) {
  if (value == null) return "-";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function getStatusColor(status: string): "default" | "success" | "error" | "warning" | "info" {
  if (status === "SENT") return "success";
  if (status === "FAILED" || status === "CANCELED") return "error";
  if (status === "SCHEDULED") return "info";
  if (status === "APPROVED") return "warning";
  return "default";
}

export default function WhatsappPromocoesConsole({ section }: { section: WhatsappPromocoesSection }) {
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
  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalogWorkflow, setCatalogWorkflow] = useState("ALL");
  const [selectedCatalogIds, setSelectedCatalogIds] = useState<string[]>([]);
  const [bulkScheduleAt, setBulkScheduleAt] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [postQuery, setPostQuery] = useState("");
  const [postDateFrom, setPostDateFrom] = useState("");
  const [postDateTo, setPostDateTo] = useState("");
  const [scheduleDrafts, setScheduleDrafts] = useState<Record<string, string>>({});
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<CatalogItem>>({});
  const [editingPost, setEditingPost] = useState<PromoPost | null>(null);
  const [postEditDraft, setPostEditDraft] = useState<Partial<PromoPost>>({});
  const [catalogPage, setCatalogPage] = useState(0);
  const [catalogRowsPerPage, setCatalogRowsPerPage] = useState(25);
  const [postPage, setPostPage] = useState(0);
  const [postRowsPerPage, setPostRowsPerPage] = useState(20);
  const [historyItem, setHistoryItem] = useState<CatalogItem | null>(null);
  const [historyPosts, setHistoryPosts] = useState<PromoPost[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const navItems: Array<{ key: WhatsappPromocoesSection; label: string; href: string }> = [
    { key: "cadastro", label: "Cadastro", href: "/admin/whatsapp-promocoes/cadastro" },
    { key: "catalogo", label: "Catálogo", href: "/admin/whatsapp-promocoes/catalogo" },
    { key: "agendamentos", label: "Agendamentos", href: "/admin/whatsapp-promocoes/agendamentos" },
  ];

  const surfaceSx = {
    p: { xs: 2, md: 3 },
    borderRadius: 4,
    border: "1px solid",
    borderColor: "rgba(148, 163, 184, 0.18)",
    boxShadow: "0 22px 70px rgba(15, 23, 42, 0.08)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)",
  } as const;

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [configRes, catalogRes, postsRes] = await Promise.all([
        fetch("/api/whatsapp-promos/config", { cache: "no-store" }),
        fetch(`/api/whatsapp-promos/catalog?q=${encodeURIComponent(catalogQuery)}&workflow=${encodeURIComponent(catalogWorkflow)}`, { cache: "no-store" }),
        fetch(`/api/whatsapp-promos/posts?status=${encodeURIComponent(statusFilter)}&q=${encodeURIComponent(postQuery)}&dateFrom=${encodeURIComponent(postDateFrom)}&dateTo=${encodeURIComponent(postDateTo)}`, { cache: "no-store" }),
      ]);
      const [configData, catalogData, postsData] = await Promise.all([
        configRes.json().catch(() => ({})),
        catalogRes.json().catch(() => ({})),
        postsRes.json().catch(() => ({})),
      ]);
      if (!configRes.ok) throw new Error(configData?.error || "Falha ao carregar configuração");
      if (!catalogRes.ok) throw new Error(catalogData?.error || "Falha ao carregar catálogo");
      if (!postsRes.ok) throw new Error(postsData?.error || "Falha ao carregar postagens");
      setConfig(configData);
      setCatalog(catalogData.items || []);
      setPosts(postsData.items || []);
      setScheduleDrafts(Object.fromEntries((postsData.items || []).map((item: PromoPost) => [item.id, toLocalDateTime(item.scheduledTo)])));
    } catch (err: any) {
      setError(err?.message || "Falha ao carregar módulo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [statusFilter, catalogQuery, catalogWorkflow, postQuery, postDateFrom, postDateTo]);

  const readyCount = useMemo(() => catalog.filter((item) => item.readyForPublish).length, [catalog]);
  const scheduledCount = useMemo(() => posts.filter((item) => item.status === "SCHEDULED").length, [posts]);
  const sentCount = useMemo(() => posts.filter((item) => item.status === "SENT").length, [posts]);
  const failedCount = useMemo(() => posts.filter((item) => item.status === "FAILED").length, [posts]);

  const catalogPageItems = useMemo(
    () => catalog.slice(catalogPage * catalogRowsPerPage, catalogPage * catalogRowsPerPage + catalogRowsPerPage),
    [catalog, catalogPage, catalogRowsPerPage],
  );

  const postPageItems = useMemo(
    () => posts.slice(postPage * postRowsPerPage, postPage * postRowsPerPage + postRowsPerPage),
    [posts, postPage, postRowsPerPage],
  );

  useEffect(() => {
    setCatalogPage(0);
  }, [catalogRowsPerPage, catalog.length, catalogQuery, catalogWorkflow]);

  useEffect(() => {
    setPostPage(0);
  }, [postRowsPerPage, posts.length, statusFilter, postQuery, postDateFrom, postDateTo]);

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
      if (!res.ok) throw new Error(data?.error || "Falha ao salvar configuração");
      setMessage("Configuração salva.");
      await load();
    } catch (err: any) {
      setError(err?.message || "Falha ao salvar configuração");
    } finally {
      setSaving(false);
    }
  };

  const uploadProductImage = async (file: File) => {
    if (!file.type.startsWith("image/")) throw new Error("Selecione um arquivo de imagem válido.");
    if (file.size > 10 * 1024 * 1024) throw new Error("A imagem deve ter no máximo 10 MB.");
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
      setMessage("Item cadastrado no catálogo.");
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
      const res = await fetch("/api/whatsapp-promos/import-csv", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Falha ao importar CSV");
      setCsvFile(null);
      setBatchKey("");
      setMessage(`CSV importado. ${data.createdCount || 0} item(ns) criado(s). ${data.skippedCount || 0} linha(s) ignorada(s).`);
      await load();
    } catch (err: any) {
      setError(err?.message || "Falha ao importar CSV");
    } finally {
      setSaving(false);
    }
  };

  const createPost = async (item: CatalogItem, mode: "draft" | "schedule") => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const scheduledTo = mode === "schedule" ? new Date(Date.now() + 60 * 60 * 1000).toISOString() : null;
      const status = mode === "schedule" ? "SCHEDULED" : config?.offersRequireApproval ? "DRAFT" : "APPROVED";
      const res = await fetch("/api/whatsapp-promos/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catalogItemId: item.id,
          status,
          scheduledTo,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Falha ao criar postagem");
      setMessage(mode === "schedule" ? "Postagem agendada." : "Postagem criada.");
      await load();
    } catch (err: any) {
      setError(err?.message || "Falha ao criar postagem");
    } finally {
      setSaving(false);
    }
  };

  const openEditor = (item: CatalogItem) => {
    setEditingItem(item);
    setEditDraft({
      ...item,
      imageUrl: item.imageUrl || "",
      category: item.category || "",
      productUrl: item.productUrl || "",
    });
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
      setMessage("Item atualizado.");
      setEditingItem(null);
      await load();
    } catch (err: any) {
      setError(err?.message || "Falha ao salvar item");
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
      if (!res.ok) throw new Error(data?.error || "Falha ao enviar promoção");
      setMessage("Promoção enviada para o WhatsApp.");
      await load();
    } catch (err: any) {
      setError(err?.message || "Falha ao enviar promoção");
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

  const openHistory = async (item: CatalogItem) => {
    setHistoryItem(item);
    setHistoryPosts([]);
    setHistoryLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/whatsapp-promos/posts?status=ALL&catalogItemId=${encodeURIComponent(item.id)}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Falha ao carregar histórico");
      setHistoryPosts(data.items || []);
    } catch (err: any) {
      setError(err?.message || "Falha ao carregar histórico");
    } finally {
      setHistoryLoading(false);
    }
  };

  const toggleCatalogSelection = (itemId: string) => {
    setSelectedCatalogIds((current) => (current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId]));
  };

  const toggleSelectAllCatalog = () => {
    const visibleIds = catalogPageItems.map((item) => item.id);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedCatalogIds.includes(id));
    setSelectedCatalogIds((current) => {
      if (allVisibleSelected) return current.filter((id) => !visibleIds.includes(id));
      return [...new Set([...current, ...visibleIds])];
    });
  };

  const openPostEditor = (post: PromoPost) => {
    setEditingPost(post);
    setPostEditDraft({
      headline: post.headline,
      bodyText: post.bodyText,
      linkUrl: post.linkUrl,
      mediaUrl: post.mediaUrl || post.catalogItem.imageUrl || "",
      targetId: post.targetId || config?.offersGroupTargetId || "",
      status: post.status,
      scheduledTo: toLocalDateTime(post.scheduledTo),
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
          headline: postEditDraft.headline,
          bodyText: postEditDraft.bodyText,
          linkUrl: postEditDraft.linkUrl,
          mediaUrl: postEditDraft.mediaUrl,
          targetId: postEditDraft.targetId,
          status: postEditDraft.status,
          scheduledTo: postEditDraft.scheduledTo ? new Date(String(postEditDraft.scheduledTo)).toISOString() : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Falha ao salvar post");
      setMessage("Postagem atualizada.");
      setEditingPost(null);
      await load();
    } catch (err: any) {
      setError(err?.message || "Falha ao salvar post");
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
      if (!res.ok) throw new Error(data?.error || "Falha ao cancelar agendamento");
      setMessage("Postagem cancelada.");
      await load();
    } catch (err: any) {
      setError(err?.message || "Falha ao cancelar agendamento");
    } finally {
      setSaving(false);
    }
  };

  const workflowInfo = (item: CatalogItem) => {
    const itemPosts = item.posts || [];
    if (itemPosts.some((post) => post.status === "SENT")) return { label: "Enviado", color: "success" as const };
    if (itemPosts.some((post) => post.status === "SCHEDULED")) return { label: "Agendado", color: "info" as const };
    if (itemPosts.some((post) => post.status === "FAILED")) return { label: "Falhou", color: "error" as const };
    if (!item.readyForPublish) return { label: "Pendente ajuste", color: "warning" as const };
    return { label: "Pronto para agenda", color: "default" as const };
  };

  const bulkScheduleSelected = async () => {
    if (!selectedCatalogIds.length) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const when = bulkScheduleAt ? new Date(bulkScheduleAt).toISOString() : new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const existing = selectedCatalogIds
        .map((itemId) => posts.find((post) => post.catalogItem.id === itemId && post.status !== "SENT" && post.status !== "CANCELED"))
        .filter(Boolean) as PromoPost[];
      const existingIds = new Set(existing.map((post) => post.catalogItem.id));
      const missingIds = selectedCatalogIds.filter((itemId) => !existingIds.has(itemId));

      await Promise.all(
        existing.map((post) =>
          fetch(`/api/whatsapp-promos/posts/${encodeURIComponent(post.id)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "SCHEDULED", scheduledTo: when }),
          }).then(async (res) => {
            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              throw new Error(data?.error || "Falha ao reagendar post");
            }
          }),
        ),
      );

      if (missingIds.length) {
        const res = await fetch("/api/whatsapp-promos/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemIds: missingIds,
            status: "SCHEDULED",
            scheduledTo: when,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Falha ao criar posts em massa");
      }

      setSelectedCatalogIds([]);
      setMessage(`${selectedCatalogIds.length} item(ns) enviados para a fila de agendamento.`);
      await load();
    } catch (err: any) {
      setError(err?.message || "Falha no agendamento em massa");
    } finally {
      setSaving(false);
    }
  };

  const sectionTitle =
    section === "cadastro" ? "Cadastro e importação" : section === "catalogo" ? "Catálogo operacional" : "Fila e histórico de envios";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 5,
          px: { xs: 2.5, md: 3.5 },
          py: { xs: 2.5, md: 3.25 },
          color: "common.white",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 58%, #0f766e 100%)",
          boxShadow: "0 28px 80px rgba(15, 23, 42, 0.16)",
        }}
      >
        <Box sx={{ position: "absolute", inset: 0, background: "radial-gradient(circle at top right, rgba(255,255,255,0.18), transparent 28%)" }} />
        <Box sx={{ position: "relative", display: "grid", gap: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: { xs: "flex-start", md: "center" }, flexWrap: "wrap" }}>
            <Box>
              <Typography variant="overline" sx={{ letterSpacing: 1.4, opacity: 0.72 }}>
                Operação WhatsApp
              </Typography>
              <Typography variant="h3" sx={{ mt: 0.75, fontWeight: 900, lineHeight: 1.05, fontSize: { xs: "2rem", md: "3rem" } }}>
                WhatsApp Promoções
              </Typography>
              <Typography sx={{ mt: 1.25, maxWidth: 760, color: "rgba(255,255,255,0.82)", fontSize: { xs: 14, md: 16 } }}>
                {sectionTitle}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {navItems.map((item) => (
                <Button
                  key={item.key}
                  component={Link}
                  href={item.href}
                  variant={section === item.key ? "contained" : "outlined"}
                  sx={{
                    borderRadius: 999,
                    px: 2,
                    color: "white",
                    borderColor: "rgba(255,255,255,0.24)",
                    bgcolor: section === item.key ? "rgba(255,255,255,0.18)" : "transparent",
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip label={`Catálogo: ${catalog.length}`} sx={{ bgcolor: "rgba(255,255,255,0.14)", color: "white", fontWeight: 700 }} />
            <Chip label={`Prontos: ${readyCount}`} sx={{ bgcolor: "rgba(34,197,94,0.22)", color: "white", fontWeight: 700 }} />
            <Chip label={`Agendados: ${scheduledCount}`} sx={{ bgcolor: "rgba(59,130,246,0.22)", color: "white", fontWeight: 700 }} />
            <Chip label={`Enviados: ${sentCount}`} sx={{ bgcolor: "rgba(250,204,21,0.22)", color: "white", fontWeight: 700 }} />
            {failedCount > 0 ? <Chip label={`Falhas: ${failedCount}`} sx={{ bgcolor: "rgba(248,113,113,0.24)", color: "white", fontWeight: 700 }} /> : null}
            <Chip label={config?.offersCronEnabled ? "Cron ligado" : "Cron desligado"} sx={{ bgcolor: "rgba(255,255,255,0.14)", color: "white", fontWeight: 700 }} />
            <Chip label={loading ? "Atualizando..." : config?.evolutionEnabled ? "Evolution pronta" : "Evolution desligada"} sx={{ bgcolor: "rgba(255,255,255,0.14)", color: "white", fontWeight: 700 }} />
          </Box>
        </Box>
      </Box>

      {message ? <Alert severity="success" sx={{ borderRadius: 3 }}>{message}</Alert> : null}
      {error ? <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert> : null}

      {section === "cadastro" ? (
        <>
          <Paper sx={surfaceSx}>
            <Box sx={{ display: "grid", gap: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>Configuração do cron</Typography>
                <Typography sx={{ mt: 0.75, color: "text.secondary" }}>
                  Defina a janela de disparo e o grupo padrão da operação.
                </Typography>
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 1.5 }}>
                <Box sx={{ gridColumn: { xs: "span 12", md: "span 3" } }}>
                  <TextField select fullWidth label="Cron" value={config?.offersCronEnabled ? "on" : "off"} onChange={(e) => setConfig((current) => current ? { ...current, offersCronEnabled: e.target.value === "on" } : current)}>
                    <MenuItem value="on">Ligado</MenuItem>
                    <MenuItem value="off">Desligado</MenuItem>
                  </TextField>
                </Box>
                <Box sx={{ gridColumn: { xs: "span 12", md: "span 3" } }}>
                  <TextField fullWidth label="ID do grupo" value={config?.offersGroupTargetId || ""} onChange={(e) => setConfig((current) => current ? { ...current, offersGroupTargetId: e.target.value } : current)} />
                </Box>
                <Box sx={{ gridColumn: { xs: "span 12", md: "span 3" } }}>
                  <TextField fullWidth label="Nome do grupo" value={config?.offersGroupLabel || ""} onChange={(e) => setConfig((current) => current ? { ...current, offersGroupLabel: e.target.value } : current)} />
                </Box>
                <Box sx={{ gridColumn: { xs: "span 12", md: "span 3" } }}>
                  <TextField fullWidth type="number" label="Intervalo (min)" value={config?.offersPublishIntervalMin || 0} onChange={(e) => setConfig((current) => current ? { ...current, offersPublishIntervalMin: Number(e.target.value || 0) } : current)} />
                </Box>
                <Box sx={{ gridColumn: { xs: "span 12", md: "span 3" } }}>
                  <TextField fullWidth type="number" label="Hora inicial" value={config?.offersDailyStartHour || 0} onChange={(e) => setConfig((current) => current ? { ...current, offersDailyStartHour: Number(e.target.value || 0) } : current)} />
                </Box>
                <Box sx={{ gridColumn: { xs: "span 12", md: "span 3" } }}>
                  <TextField fullWidth type="number" label="Hora final" value={config?.offersDailyEndHour || 0} onChange={(e) => setConfig((current) => current ? { ...current, offersDailyEndHour: Number(e.target.value || 0) } : current)} />
                </Box>
                <Box sx={{ gridColumn: { xs: "span 12", md: "span 3" } }}>
                  <TextField select fullWidth label="Aprovação" value={config?.offersRequireApproval ? "manual" : "auto"} onChange={(e) => setConfig((current) => current ? { ...current, offersRequireApproval: e.target.value === "manual" } : current)}>
                    <MenuItem value="manual">Exigir aprovação</MenuItem>
                    <MenuItem value="auto">Automática</MenuItem>
                  </TextField>
                </Box>
                <Box sx={{ gridColumn: { xs: "span 12", md: "span 3" }, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                  <Chip label={`Próxima: ${formatDateTime(config?.offersNextRunAt)}`} color="success" />
                </Box>
              </Box>
              <Box>
                <Button variant="contained" onClick={saveConfig} disabled={saving || !config} sx={{ borderRadius: 3, bgcolor: "#111827" }}>
                  Salvar configuração
                </Button>
              </Box>
            </Box>
          </Paper>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1.08fr 1fr" }, gap: 3 }}>
            <Paper sx={surfaceSx}>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>Cadastro manual</Typography>
              <Typography sx={{ mt: 0.75, color: "text.secondary" }}>
                Cadastre uma oferta completa e deixe a foto como opcional.
              </Typography>
              <Box sx={{ mt: 2.5, display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 1.5 }}>
                <Box sx={{ gridColumn: "span 12" }}>
                  <TextField fullWidth label="Título" value={manual.title} onChange={(e) => setManual((current) => ({ ...current, title: e.target.value }))} />
                </Box>
                <Box sx={{ gridColumn: "span 12" }}>
                  <TextField fullWidth multiline minRows={4} label="Descrição" value={manual.description} onChange={(e) => setManual((current) => ({ ...current, description: e.target.value }))} />
                </Box>
                <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
                  <TextField fullWidth label="Categoria" value={manual.category} onChange={(e) => setManual((current) => ({ ...current, category: e.target.value }))} />
                </Box>
                <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
                  <TextField fullWidth label="Link afiliado" value={manual.affiliateUrl} onChange={(e) => setManual((current) => ({ ...current, affiliateUrl: e.target.value }))} />
                </Box>
                <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
                  <TextField fullWidth label="URL do produto" value={manual.productUrl} onChange={(e) => setManual((current) => ({ ...current, productUrl: e.target.value }))} />
                </Box>
                <Box sx={{ gridColumn: { xs: "span 12", md: "span 3" } }}>
                  <TextField fullWidth label="Preço antigo" value={manual.oldPrice} onChange={(e) => setManual((current) => ({ ...current, oldPrice: e.target.value }))} />
                </Box>
                <Box sx={{ gridColumn: { xs: "span 12", md: "span 3" } }}>
                  <TextField fullWidth label="Preço atual" value={manual.currentPrice} onChange={(e) => setManual((current) => ({ ...current, currentPrice: e.target.value }))} />
                </Box>
                <Box sx={{ gridColumn: "span 12", display: "grid", gap: 1 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 800 }}>Foto do produto (opcional)</Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                    <Button component="label" variant="outlined" disabled={uploadingImage} sx={{ borderRadius: 3 }}>
                      {uploadingImage ? "Enviando foto..." : "Selecionar foto"}
                      <input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => selectManualImage(e.target.files?.[0] || null)} />
                    </Button>
                    {manualImageFile ? <Typography sx={{ fontSize: 12 }}>{manualImageFile.name}</Typography> : null}
                  </Box>
                  <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                    A imagem é opcional. Se estiver válida, o post pode ser enviado com mídia.
                  </Typography>
                  {manual.imageUrl ? (
                    <Box component="img" src={manual.imageUrl} alt="Prévia da oferta" sx={{ width: 140, height: 140, objectFit: "contain", borderRadius: 3, border: "1px solid", borderColor: "divider", bgcolor: "white", p: 1 }} />
                  ) : null}
                </Box>
              </Box>
              <Box sx={{ mt: 2.5 }}>
                <Button variant="contained" onClick={createManualItem} disabled={saving} sx={{ borderRadius: 3, bgcolor: "#111827" }}>
                  Cadastrar item
                </Button>
              </Box>
            </Paper>

            <Paper sx={surfaceSx}>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>Importação em massa</Typography>
              <Typography sx={{ mt: 0.75, color: "text.secondary" }}>
                Ideal para subir 300 a 400 itens e filtrar depois só o que vale a pena agendar.
              </Typography>
              <Box sx={{ mt: 2.5, display: "grid", gap: 1.5 }}>
                <TextField fullWidth label="Chave do lote" value={batchKey} onChange={(e) => setBatchKey(e.target.value)} placeholder="lote-shopee-agosto" />
                <Box sx={{ p: 1.5, borderRadius: 3, border: "1px dashed", borderColor: "rgba(148,163,184,0.45)", bgcolor: "rgba(248,250,252,0.85)" }}>
                  <input type="file" accept=".csv,text/csv" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} />
                  <Typography sx={{ mt: 1, fontSize: 12, color: "text.secondary" }}>
                    {csvFile ? `Selecionado: ${csvFile.name}` : "Nenhum arquivo selecionado."}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.75, borderRadius: 3, bgcolor: "#f8fafc", border: "1px solid", borderColor: "rgba(148,163,184,0.18)" }}>
                  <Typography sx={{ fontWeight: 800, fontSize: 14 }}>Fluxo sugerido</Typography>
                  <Typography sx={{ mt: 0.75, fontSize: 13, color: "text.secondary" }}>1. Importe o CSV.</Typography>
                  <Typography sx={{ fontSize: 13, color: "text.secondary" }}>2. Vá para o catálogo e filtre o que está pronto.</Typography>
                  <Typography sx={{ fontSize: 13, color: "text.secondary" }}>3. Selecione vários itens e agende em massa.</Typography>
                </Box>
                <Button variant="contained" onClick={importCsv} disabled={!csvFile || saving} sx={{ borderRadius: 3, bgcolor: "#111827" }}>
                  Importar CSV
                </Button>
              </Box>
            </Paper>
          </Box>
        </>
      ) : null}

      {section === "catalogo" ? (
        <Paper sx={surfaceSx}>
          <Box sx={{ display: "grid", gap: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>Catálogo promocional</Typography>
                <Typography sx={{ mt: 0.5, fontSize: 13, color: "text.secondary" }}>
                  Selecione vários itens, abra o link rápido e mande tudo para a fila.
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Chip label={`Total: ${catalog.length}`} />
                <Chip label={`Prontos: ${readyCount}`} color="success" />
                <Chip label={`Selecionados: ${selectedCatalogIds.length}`} color={selectedCatalogIds.length ? "info" : "default"} />
              </Box>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.2fr 220px 220px auto" }, gap: 1.5, alignItems: "center" }}>
              <TextField size="small" label="Buscar item" value={catalogQuery} onChange={(e) => setCatalogQuery(e.target.value)} />
              <TextField select size="small" label="Fluxo" value={catalogWorkflow} onChange={(e) => setCatalogWorkflow(e.target.value)}>
                <MenuItem value="ALL">Todos</MenuItem>
                <MenuItem value="NEEDS_SCHEDULE">Falta agendar</MenuItem>
                <MenuItem value="SCHEDULED">Já agendados</MenuItem>
                <MenuItem value="SENT">Já enviados</MenuItem>
                <MenuItem value="FAILED">Com falha</MenuItem>
              </TextField>
              <TextField size="small" type="datetime-local" label="Agendar selecionados" value={bulkScheduleAt} onChange={(e) => setBulkScheduleAt(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
              <Button variant="contained" onClick={bulkScheduleSelected} disabled={saving || !selectedCatalogIds.length} sx={{ borderRadius: 3, bgcolor: "#2563eb", minHeight: 40 }}>
                Agendar em massa
              </Button>
            </Box>

            <TableContainer sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, maxHeight: 700 }}>
              <Table stickyHeader size="small" sx={{ minWidth: 1280 }}>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <input
                        type="checkbox"
                        checked={catalogPageItems.length > 0 && catalogPageItems.every((item) => selectedCatalogIds.includes(item.id))}
                        onChange={toggleSelectAllCatalog}
                      />
                    </TableCell>
                    <TableCell>Produto</TableCell>
                    <TableCell>Categoria</TableCell>
                    <TableCell align="right">Preço atual</TableCell>
                    <TableCell align="right">Desconto</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Imagem</TableCell>
                    <TableCell>Atalhos</TableCell>
                    <TableCell align="right">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {catalogPageItems.map((item) => {
                    const workflow = workflowInfo(item);
                    return (
                      <TableRow key={item.id} hover selected={selectedCatalogIds.includes(item.id)}>
                        <TableCell padding="checkbox">
                          <input type="checkbox" checked={selectedCatalogIds.includes(item.id)} onChange={() => toggleCatalogSelection(item.id)} />
                        </TableCell>
                        <TableCell sx={{ maxWidth: 360 }}>
                          <Typography sx={{ fontWeight: 800, fontSize: 14 }} noWrap>{item.title}</Typography>
                          <Typography sx={{ fontSize: 11, opacity: 0.68 }} noWrap>{item.slug}</Typography>
                          {item.sourceBatchKey ? <Typography sx={{ fontSize: 11, opacity: 0.58 }}>Lote: {item.sourceBatchKey}</Typography> : null}
                        </TableCell>
                        <TableCell>{item.category || "-"}</TableCell>
                        <TableCell align="right">{formatMoney(item.currentPrice)}</TableCell>
                        <TableCell align="right">{item.discountPercent != null ? `${item.discountPercent}%` : "-"}</TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                            <Chip size="small" label={item.readyForPublish ? "Pronto" : "Pendente"} color={item.readyForPublish ? "success" : "warning"} />
                            <Chip size="small" label={workflow.label} color={workflow.color} />
                            <Chip size="small" label={item.active ? "Ativo" : "Inativo"} />
                          </Box>
                        </TableCell>
                        <TableCell>
                          {item.imageUrl ? (
                            <Box component="img" src={item.imageUrl} alt="" sx={{ width: 46, height: 46, objectFit: "contain", borderRadius: 1.5, border: "1px solid", borderColor: "divider", bgcolor: "white" }} />
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                            <Button size="small" variant="outlined" href={item.affiliateUrl} target="_blank" rel="noreferrer">Abrir link</Button>
                            {item.imageUrl ? <Button size="small" variant="outlined" href={item.imageUrl} target="_blank" rel="noreferrer">Abrir imagem</Button> : null}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.75, flexWrap: "wrap" }}>
                            <Button size="small" variant="outlined" onClick={() => openEditor(item)}>Editar</Button>
                            <Button size="small" variant="outlined" onClick={() => openHistory(item)}>Posts ({item._count?.posts || 0})</Button>
                            <Button size="small" variant="contained" onClick={() => createPost(item, "draft")} disabled={saving} sx={{ bgcolor: "#111827" }}>Postar</Button>
                            <Button size="small" variant="contained" onClick={() => createPost(item, "schedule")} disabled={saving} sx={{ bgcolor: "#2563eb" }}>Agendar</Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!catalog.length ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center">Nenhum item encontrado.</TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={catalog.length}
              page={catalogPage}
              onPageChange={(_event, nextPage) => setCatalogPage(nextPage)}
              rowsPerPage={catalogRowsPerPage}
              onRowsPerPageChange={(event) => {
                setCatalogRowsPerPage(Number(event.target.value || 25));
                setCatalogPage(0);
              }}
              rowsPerPageOptions={[25, 50, 100]}
              labelRowsPerPage="Itens por página"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            />
          </Box>
        </Paper>
      ) : null}

      {section === "agendamentos" ? (
        <Paper sx={surfaceSx}>
          <Box sx={{ display: "grid", gap: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>Postagens do WhatsApp</Typography>
                <Typography sx={{ mt: 0.5, fontSize: 13, color: "text.secondary" }}>
                  Filtre, edite, publique antes da hora, cancele ou reagende quando precisar.
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Chip label={`Total: ${posts.length}`} />
                <Chip label={`Agendados: ${scheduledCount}`} color="info" />
                <Chip label={`Enviados: ${sentCount}`} color="success" />
              </Box>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.1fr 200px 170px 170px" }, gap: 1.5 }}>
              <TextField size="small" label="Buscar post ou produto" value={postQuery} onChange={(e) => setPostQuery(e.target.value)} />
              <TextField select size="small" label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                {["ALL", "DRAFT", "APPROVED", "SCHEDULED", "SENT", "FAILED", "CANCELED"].map((item) => (
                  <MenuItem key={item} value={item}>{item}</MenuItem>
                ))}
              </TextField>
              <TextField size="small" type="date" label="Data inicial" value={postDateFrom} onChange={(e) => setPostDateFrom(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
              <TextField size="small" type="date" label="Data final" value={postDateTo} onChange={(e) => setPostDateTo(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
            </Box>

            <Box sx={{ display: "grid", gap: 2 }}>
              {postPageItems.map((post) => (
                <Box key={post.id} sx={{ border: "1px solid #e5e7eb", borderRadius: 3, p: 2, display: "grid", gap: 1.5, bgcolor: "rgba(255,255,255,0.92)" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 900 }}>{post.headline}</Typography>
                      <Typography sx={{ fontSize: 12, opacity: 0.72 }} noWrap>{post.catalogItem.title}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      <Chip size="small" label={post.status} color={getStatusColor(post.status)} />
                      <Chip size="small" label={post.sentAt ? `Enviado: ${formatDateTime(post.sentAt)}` : "Não enviado"} />
                    </Box>
                  </Box>

                  <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: "#f8fafc", border: "1px solid", borderColor: "rgba(148,163,184,0.12)" }}>
                    <Typography sx={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{post.bodyText}</Typography>
                  </Box>

                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Chip size="small" variant="outlined" label={`Criado: ${formatDateTime(post.createdAt)}`} />
                    <Chip size="small" variant="outlined" label={`Agendado: ${post.scheduledTo ? formatDateTime(post.scheduledTo) : "não"}`} />
                    <Chip size="small" variant="outlined" label={post.mediaUrl || post.catalogItem.imageUrl ? "Com imagem" : "Texto apenas"} />
                    {post.targetId ? <Chip size="small" variant="outlined" label={`Destino: ${post.targetId}`} /> : null}
                  </Box>

                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "220px auto" }, gap: 2, alignItems: "center" }}>
                    <TextField
                      type="datetime-local"
                      size="small"
                      label="Agendar"
                      value={scheduleDrafts[post.id] || ""}
                      onChange={(e) => setScheduleDrafts((current) => ({ ...current, [post.id]: e.target.value }))}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      <Button variant="contained" onClick={() => savePostSchedule(post.id, "SCHEDULED")} disabled={saving} sx={{ bgcolor: "#2563eb" }}>
                        Salvar agendamento
                      </Button>
                      <Button variant="contained" onClick={() => savePostSchedule(post.id, "APPROVED")} disabled={saving} sx={{ bgcolor: "#111827" }}>
                        Deixar pronto
                      </Button>
                      <Button variant="contained" onClick={() => sendNow(post.id)} disabled={saving} sx={{ bgcolor: "#059669" }}>
                        Publicar agora
                      </Button>
                      <Button variant="outlined" onClick={() => openPostEditor(post)} disabled={saving}>
                        Editar
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => cancelPost(post.id)}
                        disabled={saving || post.status === "SENT" || post.status === "CANCELED"}
                      >
                        Cancelar
                      </Button>
                    </Box>
                  </Box>

                  {post.errorMessage ? <Alert severity="error">{post.errorMessage}</Alert> : null}
                </Box>
              ))}

              {!postPageItems.length ? <Typography sx={{ color: "text.secondary" }}>Nenhuma postagem encontrada para esse filtro.</Typography> : null}
            </Box>

            <TablePagination
              component="div"
              count={posts.length}
              page={postPage}
              onPageChange={(_event, nextPage) => setPostPage(nextPage)}
              rowsPerPage={postRowsPerPage}
              onRowsPerPageChange={(event) => {
                setPostRowsPerPage(Number(event.target.value || 20));
                setPostPage(0);
              }}
              rowsPerPageOptions={[20, 50, 100]}
              labelRowsPerPage="Posts por página"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            />
          </Box>
        </Paper>
      ) : null}

      <Dialog open={Boolean(editingItem)} onClose={() => !saving && setEditingItem(null)} fullWidth maxWidth="md">
        <DialogTitle>Editar oferta</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 2 }}>
            <Box sx={{ gridColumn: "span 12" }}>
              <TextField fullWidth label="Título" value={String(editDraft.title || "")} onChange={(e) => setEditDraft((draft) => ({ ...draft, title: e.target.value }))} />
            </Box>
            <Box sx={{ gridColumn: "span 12" }}>
              <TextField fullWidth multiline minRows={3} label="Descrição" value={String(editDraft.description || "")} onChange={(e) => setEditDraft((draft) => ({ ...draft, description: e.target.value }))} />
            </Box>
            <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
              <TextField fullWidth label="Categoria" value={String(editDraft.category || "")} onChange={(e) => setEditDraft((draft) => ({ ...draft, category: e.target.value }))} />
            </Box>
            <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
              <TextField fullWidth label="Link afiliado" value={String(editDraft.affiliateUrl || "")} onChange={(e) => setEditDraft((draft) => ({ ...draft, affiliateUrl: e.target.value }))} />
            </Box>
            <Box sx={{ gridColumn: "span 12" }}>
              <TextField fullWidth label="URL do produto" value={String(editDraft.productUrl || "")} onChange={(e) => setEditDraft((draft) => ({ ...draft, productUrl: e.target.value }))} />
            </Box>
            <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
              <TextField fullWidth label="Preço antigo" value={String(editDraft.oldPrice ?? "")} onChange={(e) => setEditDraft((draft) => ({ ...draft, oldPrice: e.target.value as any }))} />
            </Box>
            <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
              <TextField fullWidth label="Preço atual" value={String(editDraft.currentPrice ?? "")} onChange={(e) => setEditDraft((draft) => ({ ...draft, currentPrice: e.target.value as any }))} />
            </Box>
            <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
              <TextField select fullWidth label="Status do item" value={editDraft.active === false ? "inactive" : "active"} onChange={(e) => setEditDraft((draft) => ({ ...draft, active: e.target.value === "active" }))}>
                <MenuItem value="active">Ativo</MenuItem>
                <MenuItem value="inactive">Inativo</MenuItem>
              </TextField>
            </Box>
            <Box sx={{ gridColumn: "span 12", display: "grid", gap: 1 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 14 }}>Imagem do produto</Typography>
              <Button component="label" variant="outlined" disabled={uploadingImage} sx={{ justifySelf: "start" }}>
                {uploadingImage ? "Enviando..." : "Enviar nova imagem"}
                <input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => selectEditImage(e.target.files?.[0] || null)} />
              </Button>
              {editDraft.imageUrl ? (
                <Box component="img" src={String(editDraft.imageUrl)} alt="Prévia da oferta" sx={{ width: 160, height: 160, objectFit: "contain", border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "white" }} />
              ) : (
                <Typography sx={{ fontSize: 12, color: "text.secondary" }}>Sem imagem.</Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingItem(null)} disabled={saving}>Cancelar</Button>
          <Button variant="contained" onClick={saveCatalogItem} disabled={saving || uploadingImage}>Salvar alterações</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(historyItem)} onClose={() => !historyLoading && setHistoryItem(null)} fullWidth maxWidth="md">
        <DialogTitle>{historyItem ? `Histórico de posts: ${historyItem.title}` : "Histórico de posts"}</DialogTitle>
        <DialogContent dividers>
          {historyLoading ? <Typography>Carregando histórico...</Typography> : null}
          {!historyLoading && !historyPosts.length ? <Typography>Esse item ainda não tem posts.</Typography> : null}
          <Box sx={{ display: "grid", gap: 2 }}>
            {historyPosts.map((post) => (
              <Box key={post.id} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2, display: "grid", gap: 1.25 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                  <Typography sx={{ fontWeight: 800 }}>{post.headline}</Typography>
                  <Chip size="small" label={post.status} color={getStatusColor(post.status)} />
                </Box>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Chip size="small" variant="outlined" label={`Criado: ${formatDateTime(post.createdAt)}`} />
                  <Chip size="small" variant="outlined" label={`Agendado: ${post.scheduledTo ? formatDateTime(post.scheduledTo) : "não"}`} />
                  <Chip size="small" variant="outlined" label={`Enviado: ${post.sentAt ? formatDateTime(post.sentAt) : "não"}`} />
                </Box>
                <Typography sx={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{post.bodyText}</Typography>
                <Typography sx={{ fontSize: 12, opacity: 0.72 }}>Link usado: {post.linkUrl}</Typography>
                {post.errorMessage ? <Alert severity="error">{post.errorMessage}</Alert> : null}
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryItem(null)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(editingPost)} onClose={() => !saving && setEditingPost(null)} fullWidth maxWidth="md">
        <DialogTitle>Editar postagem agendada</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 2 }}>
            <Box sx={{ gridColumn: "span 12" }}>
              <TextField fullWidth label="Headline" value={String(postEditDraft.headline || "")} onChange={(e) => setPostEditDraft((draft) => ({ ...draft, headline: e.target.value }))} />
            </Box>
            <Box sx={{ gridColumn: "span 12" }}>
              <TextField fullWidth multiline minRows={7} label="Texto do post" value={String(postEditDraft.bodyText || "")} onChange={(e) => setPostEditDraft((draft) => ({ ...draft, bodyText: e.target.value }))} />
            </Box>
            <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
              <TextField fullWidth label="Link do post" value={String(postEditDraft.linkUrl || "")} onChange={(e) => setPostEditDraft((draft) => ({ ...draft, linkUrl: e.target.value }))} />
            </Box>
            <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
              <TextField fullWidth label="URL da imagem" value={String(postEditDraft.mediaUrl || "")} onChange={(e) => setPostEditDraft((draft) => ({ ...draft, mediaUrl: e.target.value }))} />
            </Box>
            <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
              <TextField fullWidth label="Destino" value={String(postEditDraft.targetId || "")} onChange={(e) => setPostEditDraft((draft) => ({ ...draft, targetId: e.target.value }))} />
            </Box>
            <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
              <TextField select fullWidth label="Status" value={String(postEditDraft.status || "APPROVED")} onChange={(e) => setPostEditDraft((draft) => ({ ...draft, status: e.target.value }))}>
                {["DRAFT", "APPROVED", "SCHEDULED", "FAILED", "CANCELED"].map((item) => (
                  <MenuItem key={item} value={item}>{item}</MenuItem>
                ))}
              </TextField>
            </Box>
            <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
              <TextField fullWidth type="datetime-local" label="Agendado para" value={String(postEditDraft.scheduledTo || "")} onChange={(e) => setPostEditDraft((draft) => ({ ...draft, scheduledTo: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingPost(null)} disabled={saving}>Cancelar</Button>
          <Button variant="contained" onClick={savePostEdit} disabled={saving}>Salvar post</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
