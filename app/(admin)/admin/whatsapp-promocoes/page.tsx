"use client";

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
  if (!value) return "sem agenda";
  return new Date(value).toLocaleString("pt-BR");
}

function formatMoney(value?: number | null) {
  if (value == null) return "R$ 0,00";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function WhatsappPromocoesPage() {
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
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [scheduleDrafts, setScheduleDrafts] = useState<Record<string, string>>({});
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<CatalogItem>>({});
  const [catalogPage, setCatalogPage] = useState(0);
  const [catalogRowsPerPage, setCatalogRowsPerPage] = useState(10);
  const [postPage, setPostPage] = useState(0);
  const [postRowsPerPage, setPostRowsPerPage] = useState(10);
  const [historyItem, setHistoryItem] = useState<CatalogItem | null>(null);
  const [historyPosts, setHistoryPosts] = useState<PromoPost[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [configRes, catalogRes, postsRes] = await Promise.all([
        fetch("/api/whatsapp-promos/config", { cache: "no-store" }),
        fetch("/api/whatsapp-promos/catalog", { cache: "no-store" }),
        fetch(`/api/whatsapp-promos/posts?status=${encodeURIComponent(statusFilter)}`, { cache: "no-store" }),
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
      setScheduleDrafts(
        Object.fromEntries((postsData.items || []).map((item: PromoPost) => [item.id, toLocalDateTime(item.scheduledTo)])),
      );
    } catch (err: any) {
      setError(err?.message || "Falha ao carregar modulo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [statusFilter]);

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
  }, [catalogRowsPerPage, catalog.length]);

  useEffect(() => {
    setPostPage(0);
  }, [postRowsPerPage, posts.length, statusFilter]);

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

  const uploadProductImage = async (file: File) => {
    if (!file.type.startsWith("image/")) throw new Error("Selecione um arquivo de imagem valido.");
    if (file.size > 10 * 1024 * 1024) throw new Error("A imagem deve ter no maximo 10 MB.");
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
      const skippedInfo = Number(data.skippedCount || 0) > 0 ? ` ${data.skippedCount} linha(s) ignorada(s).` : "";
      setMessage(`CSV importado. ${data.createdCount || 0} item(ns) criado(s).${skippedInfo}`);
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
      const status = mode === "schedule" ? "SCHEDULED" : (config?.offersRequireApproval ? "DRAFT" : "APPROVED");
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

  const saveCatalogItem = async () => {
    const itemId = editingItem?.id;
    if (!itemId) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/whatsapp-promos/catalog/${encodeURIComponent(itemId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editDraft),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Falha ao salvar item");
      setMessage("Item do catalogo atualizado.");
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

  const statusColor = (status: string) =>
    status === "SENT" ? "success" : status === "FAILED" ? "error" : status === "SCHEDULED" ? "info" : "default";

  const surfaceSx = {
    p: { xs: 2, md: 3 },
    borderRadius: 4,
    border: "1px solid",
    borderColor: "rgba(148, 163, 184, 0.18)",
    boxShadow: "0 22px 70px rgba(15, 23, 42, 0.08)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)",
  } as const;

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
        <Box sx={{ position: "absolute", right: -40, bottom: -56, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
        <Box sx={{ position: "relative", display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.45fr) minmax(320px, 0.95fr)" }, gap: 3 }}>
          <Box>
            <Typography variant="overline" sx={{ letterSpacing: 1.4, opacity: 0.72 }}>
              Operacao WhatsApp
            </Typography>
            <Typography variant="h3" sx={{ mt: 0.75, fontWeight: 900, lineHeight: 1.05, fontSize: { xs: "2rem", md: "3rem" } }}>
              WhatsApp Promocoes
            </Typography>
            <Typography sx={{ mt: 1.25, maxWidth: 760, color: "rgba(255,255,255,0.82)", fontSize: { xs: 14, md: 16 } }}>
              Organize o catalogo, publique com contexto e acompanhe o que foi enviado sem depender de blocos soltos ou formularios crus.
            </Typography>
            <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Chip label={`Catalogo: ${catalog.length}`} sx={{ bgcolor: "rgba(255,255,255,0.14)", color: "white", fontWeight: 700 }} />
              <Chip label={`Prontos: ${readyCount}`} sx={{ bgcolor: "rgba(34,197,94,0.22)", color: "white", fontWeight: 700 }} />
              <Chip label={`Agendados: ${scheduledCount}`} sx={{ bgcolor: "rgba(59,130,246,0.22)", color: "white", fontWeight: 700 }} />
              <Chip label={`Enviados: ${sentCount}`} sx={{ bgcolor: "rgba(250,204,21,0.22)", color: "white", fontWeight: 700 }} />
              {failedCount ? <Chip label={`Falhas: ${failedCount}`} sx={{ bgcolor: "rgba(248,113,113,0.24)", color: "white", fontWeight: 700 }} /> : null}
              {loading ? <Chip label="Atualizando..." sx={{ bgcolor: "rgba(255,255,255,0.14)", color: "white", fontWeight: 700 }} /> : null}
            </Box>
          </Box>
          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              p: 2,
              borderRadius: 4,
              border: "1px solid rgba(255,255,255,0.12)",
              bgcolor: "rgba(255,255,255,0.08)",
              backdropFilter: "blur(8px)",
            }}
          >
            <Typography sx={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.72)", textTransform: "uppercase", letterSpacing: 1.1 }}>
              Resumo operacional
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1.25 }}>
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

      {message ? <Alert severity="success" sx={{ borderRadius: 3 }}>{message}</Alert> : null}
      {error ? <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert> : null}

      <Paper sx={surfaceSx}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.5fr) minmax(280px, 0.85fr)" }, gap: 3 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Centro de distribuicao
            </Typography>
            <Typography sx={{ mt: 0.75, color: "text.secondary" }}>
              Configure o grupo, a janela de envio e a cadencia de publicacao em um unico bloco.
            </Typography>
            {config ? (
              <Box sx={{ mt: 2.5, display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 1.5 }}>
                <Box sx={{ gridColumn: { xs: "span 12", md: "span 3" } }}>
                  <TextField select fullWidth label="Cron" value={config.offersCronEnabled ? "true" : "false"} onChange={(e) => setConfig({ ...config, offersCronEnabled: e.target.value === "true" })}>
                    <MenuItem value="true">Ligado</MenuItem>
                    <MenuItem value="false">Desligado</MenuItem>
                  </TextField>
                </Box>
                <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
                  <TextField fullWidth label="ID do grupo" value={config.offersGroupTargetId} onChange={(e) => setConfig({ ...config, offersGroupTargetId: e.target.value })} />
                </Box>
                <Box sx={{ gridColumn: { xs: "span 12", md: "span 5" } }}>
                  <TextField fullWidth label="Nome do grupo" value={config.offersGroupLabel} onChange={(e) => setConfig({ ...config, offersGroupLabel: e.target.value })} />
                </Box>
                <Box sx={{ gridColumn: { xs: "span 12", md: "span 3" } }}>
                  <TextField fullWidth type="number" label="Intervalo (min)" value={config.offersPublishIntervalMin} onChange={(e) => setConfig({ ...config, offersPublishIntervalMin: Number(e.target.value || 60) })} />
                </Box>
                <Box sx={{ gridColumn: { xs: "span 6", md: "span 3" } }}>
                  <TextField fullWidth type="number" label="Hora inicial" value={config.offersDailyStartHour} onChange={(e) => setConfig({ ...config, offersDailyStartHour: Number(e.target.value || 8) })} />
                </Box>
                <Box sx={{ gridColumn: { xs: "span 6", md: "span 3" } }}>
                  <TextField fullWidth type="number" label="Hora final" value={config.offersDailyEndHour} onChange={(e) => setConfig({ ...config, offersDailyEndHour: Number(e.target.value || 22) })} />
                </Box>
                <Box sx={{ gridColumn: { xs: "span 12", md: "span 3" } }}>
                  <TextField select fullWidth label="Aprovacao" value={config.offersRequireApproval ? "true" : "false"} onChange={(e) => setConfig({ ...config, offersRequireApproval: e.target.value === "true" })}>
                    <MenuItem value="true">Exigir aprovacao</MenuItem>
                    <MenuItem value="false">Publicar direto</MenuItem>
                  </TextField>
                </Box>
              </Box>
            ) : null}
          </Box>
          <Box sx={{ display: "grid", gap: 1.25, alignContent: "start" }}>
            <Box sx={{ p: 1.75, borderRadius: 3, bgcolor: "#f8fafc", border: "1px solid", borderColor: "rgba(148,163,184,0.18)" }}>
              <Typography sx={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: "text.secondary" }}>
                Estado da fila
              </Typography>
              <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Chip label={config?.evolutionEnabled ? "Canal pronto" : "Canal pendente"} color={config?.evolutionEnabled ? "success" : "warning"} />
                <Chip label={`Proxima execucao: ${formatDateTime(config?.offersNextRunAt)}`} />
              </Box>
            </Box>
            <Box sx={{ p: 1.75, borderRadius: 3, bgcolor: "#f8fafc", border: "1px solid", borderColor: "rgba(148,163,184,0.18)" }}>
              <Typography sx={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: "text.secondary" }}>
                Janela do dia
              </Typography>
              <Typography sx={{ mt: 0.8, fontWeight: 800, fontSize: 20 }}>
                {config ? `${config.offersDailyStartHour}:00 - ${config.offersDailyEndHour}:00` : "--"}
              </Typography>
              <Typography sx={{ mt: 0.4, fontSize: 13, color: "text.secondary" }}>
                Intervalo atual de {config?.offersPublishIntervalMin || 0} minutos entre disparos.
              </Typography>
            </Box>
            <Button variant="contained" onClick={saveConfig} disabled={saving} sx={{ justifySelf: "start", px: 2.5, py: 1.2, borderRadius: 3, fontWeight: 800, bgcolor: "#111827" }}>
              Salvar configuracao
            </Button>
          </Box>
        </Box>
      </Paper>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1.2fr 0.8fr" }, gap: 2.5 }}>
        <Paper sx={surfaceSx}>
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "flex-start", flexWrap: "wrap" }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Cadastro manual
              </Typography>
              <Typography sx={{ mt: 0.75, color: "text.secondary" }}>
                Monte uma oferta com foto, preco e link prontos para virar postagem sem retrabalho.
              </Typography>
            </Box>
            <Chip label={manual.imageUrl ? "Foto carregada" : "Sem foto"} color={manual.imageUrl ? "success" : "default"} />
          </Box>
          <Box sx={{ mt: 2.5, display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.2fr) 240px" }, gap: 2 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 1.5 }}>
              {[
                ["title", "Titulo", 12],
                ["description", "Descricao", 12],
                ["category", "Categoria", 5],
                ["affiliateUrl", "Link afiliado", 7],
                ["productUrl", "URL do produto", 7],
                ["oldPrice", "Preco antigo", 2.5],
                ["currentPrice", "Preco atual", 2.5],
              ].map(([key, label, span]) => (
                <Box key={key} sx={{ gridColumn: { xs: "span 12", md: `span ${span}` } }}>
                  <TextField
                    fullWidth
                    label={label}
                    value={(manual as any)[key]}
                    onChange={(e) => setManual((current) => ({ ...current, [key]: e.target.value }))}
                    multiline={key === "description"}
                    minRows={key === "description" ? 4 : undefined}
                  />
                </Box>
              ))}
            </Box>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 3,
                border: "1px dashed",
                borderColor: manual.imageUrl ? "success.main" : "rgba(99,102,241,0.35)",
                bgcolor: manual.imageUrl ? "rgba(240,253,244,0.85)" : "rgba(248,250,252,0.9)",
                display: "grid",
                alignContent: "start",
                gap: 1.25,
              }}
            >
              <Typography sx={{ fontWeight: 800 }}>Foto do produto</Typography>
              <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                Opcional, mas recomendada. Se a midia falhar, o erro agora aparece no historico do post.
              </Typography>
              <Button component="label" variant="outlined" disabled={uploadingImage} sx={{ justifySelf: "start", borderRadius: 3 }}>
                {uploadingImage ? "Enviando foto..." : "Selecionar foto"}
                <input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => selectManualImage(e.target.files?.[0] || null)} />
              </Button>
              {manualImageFile ? <Typography sx={{ fontSize: 12 }}>Arquivo: {manualImageFile.name}</Typography> : null}
              {manual.imageUrl ? (
                <Box component="img" src={manual.imageUrl} alt="Previa da oferta" sx={{ width: "100%", aspectRatio: "1 / 1", objectFit: "contain", borderRadius: 3, bgcolor: "white", border: "1px solid", borderColor: "divider", p: 1 }} />
              ) : (
                <Box sx={{ width: "100%", aspectRatio: "1 / 1", borderRadius: 3, bgcolor: "rgba(226,232,240,0.55)", display: "grid", placeItems: "center", color: "text.secondary", fontSize: 13 }}>
                  Sem imagem carregada
                </Box>
              )}
            </Box>
          </Box>
          <Box sx={{ mt: 2, display: "flex", gap: 1.25, flexWrap: "wrap", alignItems: "center" }}>
            <Typography sx={{ fontSize: 13, color: "text.secondary", flex: 1, minWidth: 220 }}>
              A oferta manual entra no catalogo pronta para editar, postar ou agendar.
            </Typography>
            <Button variant="contained" onClick={createManualItem} disabled={saving} sx={{ px: 2.5, py: 1.2, borderRadius: 3, fontWeight: 800, bgcolor: "#111827" }}>
              Cadastrar item
            </Button>
          </Box>
        </Paper>

        <Paper sx={surfaceSx}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Importacao em massa
          </Typography>
          <Typography sx={{ mt: 0.75, color: "text.secondary" }}>
            Importe um lote para abastecer o catalogo e refine depois so o que vale a pena publicar.
          </Typography>
          <Box sx={{ mt: 2.5, display: "grid", gap: 1.5 }}>
            <TextField fullWidth label="Chave do lote" value={batchKey} onChange={(e) => setBatchKey(e.target.value)} placeholder="lote-shopee-agosto" />
            <Box sx={{ p: 1.5, borderRadius: 3, border: "1px dashed", borderColor: "rgba(148,163,184,0.45)", bgcolor: "rgba(248,250,252,0.85)" }}>
              <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 1 }}>Arquivo CSV</Typography>
              <input type="file" accept=".csv,text/csv" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} />
              <Typography sx={{ mt: 1, fontSize: 12, color: "text.secondary" }}>
                {csvFile ? `Selecionado: ${csvFile.name}` : "Nenhum arquivo selecionado ainda."}
              </Typography>
            </Box>
            <Box sx={{ p: 1.75, borderRadius: 3, bgcolor: "#f8fafc", border: "1px solid", borderColor: "rgba(148,163,184,0.18)" }}>
              <Typography sx={{ fontWeight: 800, fontSize: 14 }}>Fluxo sugerido</Typography>
              <Typography sx={{ mt: 0.75, fontSize: 13, color: "text.secondary" }}>1. Importe o CSV.</Typography>
              <Typography sx={{ fontSize: 13, color: "text.secondary" }}>2. Revise os melhores itens no catalogo.</Typography>
              <Typography sx={{ fontSize: 13, color: "text.secondary" }}>3. Poste ou agende direto pela tabela.</Typography>
            </Box>
            <Button variant="contained" onClick={importCsv} disabled={!csvFile || saving} sx={{ px: 2.5, py: 1.2, borderRadius: 3, fontWeight: 800, bgcolor: "#111827" }}>
              Importar CSV
            </Button>
          </Box>
        </Paper>
      </Box>

      <Paper sx={surfaceSx}>
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Catalogo promocional
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip label={`Total: ${catalog.length}`} />
            <Chip label={`Prontos: ${readyCount}`} color="success" />
          </Box>
        </Box>

        <TableContainer sx={{ mt: 2, border: "1px solid", borderColor: "divider", borderRadius: 3, maxHeight: 620 }}>
          <Table stickyHeader size="small" sx={{ minWidth: 980 }}>
            <TableHead>
              <TableRow>
                <TableCell>Produto</TableCell>
                <TableCell>Categoria</TableCell>
                <TableCell align="right">Preco atual</TableCell>
                <TableCell align="right">Desconto</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Imagem</TableCell>
                <TableCell align="right">Acoes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {catalogPageItems.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell sx={{ maxWidth: 330 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: 14 }} noWrap>{item.title}</Typography>
                    <Typography sx={{ fontSize: 11, opacity: 0.65 }} noWrap>{item.slug}</Typography>
                  </TableCell>
                  <TableCell>{item.category || "-"}</TableCell>
                  <TableCell align="right">{item.currentPrice != null ? formatMoney(item.currentPrice) : "-"}</TableCell>
                  <TableCell align="right">{item.discountPercent != null ? `${item.discountPercent}%` : "-"}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                      <Chip size="small" label={item.readyForPublish ? "Pronto" : "Pendente"} color={item.readyForPublish ? "success" : "warning"} />
                      <Chip size="small" label={item.active ? "Ativo" : "Inativo"} />
                    </Box>
                  </TableCell>
                  <TableCell>
                    {item.imageUrl ? (
                      <Box component="img" src={item.imageUrl} alt="" sx={{ width: 42, height: 42, objectFit: "contain", borderRadius: 1, border: "1px solid", borderColor: "divider", bgcolor: "white" }} />
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, whiteSpace: "nowrap" }}>
                      <Button size="small" variant="outlined" onClick={() => openEditor(item)}>Editar</Button>
                      <Button size="small" variant="outlined" onClick={() => openHistory(item)}>Posts ({item._count?.posts || 0})</Button>
                      <Button size="small" variant="contained" onClick={() => createPost(item, "draft")} disabled={saving}>Postar</Button>
                      <Button size="small" onClick={() => createPost(item, "schedule")} disabled={saving}>Agendar</Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {!catalog.length ? <TableRow><TableCell colSpan={7} align="center">Nenhum item no catalogo.</TableCell></TableRow> : null}
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
            setCatalogRowsPerPage(Number(event.target.value || 10));
            setCatalogPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
          labelRowsPerPage="Itens por pagina"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Paper>

      <Paper sx={surfaceSx}>
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Postagens do WhatsApp
            </Typography>
            <Typography sx={{ mt: 0.5, fontSize: 13, color: "text.secondary" }}>
              Veja o texto que foi gerado, reagende, aprove ou envie na hora.
            </Typography>
          </Box>
          <TextField select size="small" label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 180 }}>
            {["ALL", "DRAFT", "APPROVED", "SCHEDULED", "SENT", "FAILED"].map((item) => (
              <MenuItem key={item} value={item}>
                {item}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        <Box sx={{ mt: 2, display: "grid", gap: 2 }}>
          {postPageItems.map((post) => (
            <Box key={post.id} sx={{ border: "1px solid #e5e7eb", borderRadius: 3, p: 2, display: "grid", gap: 1.5, bgcolor: "rgba(255,255,255,0.9)" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                <Box>
                  <Typography sx={{ fontWeight: 900 }}>{post.headline}</Typography>
                  <Typography sx={{ fontSize: 12, opacity: 0.7 }}>{post.catalogItem.title}</Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Chip size="small" label={post.status} color={statusColor(post.status)} />
                  <Chip size="small" label={post.sentAt ? `Enviado: ${formatDateTime(post.sentAt)}` : "Nao enviado"} />
                </Box>
              </Box>

              <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: "#f8fafc", border: "1px solid", borderColor: "rgba(148,163,184,0.12)" }}>
                <Typography sx={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{post.bodyText}</Typography>
              </Box>

              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Chip size="small" variant="outlined" label={`Criado: ${formatDateTime(post.createdAt)}`} />
                <Chip size="small" variant="outlined" label={`Agendado: ${post.scheduledTo ? formatDateTime(post.scheduledTo) : "nao"}`} />
                <Chip size="small" variant="outlined" label={post.mediaUrl || post.catalogItem.imageUrl ? "Com imagem" : "Texto apenas"} />
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "220px auto" }, gap: 2, alignItems: "center" }}>
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
                    Enviar agora
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
            setPostRowsPerPage(Number(event.target.value || 10));
            setPostPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50]}
          labelRowsPerPage="Posts por pagina"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Paper>

      <Dialog open={Boolean(editingItem)} onClose={() => !saving && setEditingItem(null)} fullWidth maxWidth="md">
        <DialogTitle>Editar oferta</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 2 }}>
            <Box sx={{ gridColumn: "span 12" }}>
              <TextField fullWidth label="Titulo" value={String(editDraft.title || "")} onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))} />
            </Box>
            <Box sx={{ gridColumn: "span 12" }}>
              <TextField fullWidth multiline minRows={3} label="Descricao" value={String(editDraft.description || "")} onChange={(e) => setEditDraft((d) => ({ ...d, description: e.target.value }))} />
            </Box>
            <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
              <TextField fullWidth label="Categoria" value={String(editDraft.category || "")} onChange={(e) => setEditDraft((d) => ({ ...d, category: e.target.value }))} />
            </Box>
            <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
              <TextField fullWidth label="Link afiliado" value={String(editDraft.affiliateUrl || "")} onChange={(e) => setEditDraft((d) => ({ ...d, affiliateUrl: e.target.value }))} />
            </Box>
            <Box sx={{ gridColumn: "span 12" }}>
              <TextField fullWidth label="URL do produto" value={String(editDraft.productUrl || "")} onChange={(e) => setEditDraft((d) => ({ ...d, productUrl: e.target.value }))} />
            </Box>
            <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
              <TextField fullWidth label="Preco antigo" value={String(editDraft.oldPrice ?? "")} onChange={(e) => setEditDraft((d) => ({ ...d, oldPrice: e.target.value as any }))} />
            </Box>
            <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
              <TextField fullWidth label="Preco atual" value={String(editDraft.currentPrice ?? "")} onChange={(e) => setEditDraft((d) => ({ ...d, currentPrice: e.target.value as any }))} />
            </Box>
            <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
              <TextField select fullWidth label="Status" value={editDraft.active === false ? "inactive" : "active"} onChange={(e) => setEditDraft((d) => ({ ...d, active: e.target.value === "active" }))}>
                <MenuItem value="active">Ativo</MenuItem>
                <MenuItem value="inactive">Inativo</MenuItem>
              </TextField>
            </Box>
            <Box sx={{ gridColumn: "span 12" }}>
              <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 1 }}>Imagem do produto</Typography>
              <Button component="label" variant="outlined" disabled={uploadingImage}>
                {uploadingImage ? "Enviando..." : "Enviar nova imagem"}
                <input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => selectEditImage(e.target.files?.[0] || null)} />
              </Button>
              {editDraft.imageUrl ? (
                <Box component="img" src={String(editDraft.imageUrl)} alt="Previa da oferta" sx={{ display: "block", mt: 1, width: 160, height: 160, objectFit: "contain", border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "white" }} />
              ) : (
                <Typography sx={{ mt: 1, fontSize: 13, opacity: 0.7 }}>Sem imagem. O WhatsApp enviara apenas o texto.</Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingItem(null)} disabled={saving}>Cancelar</Button>
          <Button variant="contained" onClick={saveCatalogItem} disabled={saving || uploadingImage}>Salvar alteracoes</Button>
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
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Chip size="small" variant="outlined" label={`Criado: ${formatDateTime(post.createdAt)}`} />
                  <Chip size="small" variant="outlined" label={`Agendado: ${post.scheduledTo ? formatDateTime(post.scheduledTo) : "nao"}`} />
                  <Chip size="small" variant="outlined" label={`Enviado: ${post.sentAt ? formatDateTime(post.sentAt) : "nao"}`} />
                </Box>
                <Typography sx={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{post.bodyText}</Typography>
                <Typography sx={{ fontSize: 12, opacity: 0.72 }}>Link usado: {post.linkUrl}</Typography>
                <Typography sx={{ fontSize: 12, opacity: 0.72 }}>Destino: {post.targetId || "nao definido"}</Typography>
                {(post.mediaUrl || post.catalogItem.imageUrl) ? (
                  <Box>
                    <Typography sx={{ fontSize: 12, opacity: 0.72, mb: 0.5 }}>Imagem usada no envio</Typography>
                    <Box component="img" src={post.mediaUrl || post.catalogItem.imageUrl || ""} alt="" sx={{ width: 140, height: 140, objectFit: "contain", borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "white" }} />
                  </Box>
                ) : (
                  <Typography sx={{ fontSize: 12, opacity: 0.72 }}>Esse post foi criado sem imagem.</Typography>
                )}
                {post.errorMessage ? <Alert severity="error">{post.errorMessage}</Alert> : null}
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryItem(null)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
