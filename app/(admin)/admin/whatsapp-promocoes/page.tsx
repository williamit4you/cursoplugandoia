"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography } from "@mui/material";

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
  const [catalogDrafts, setCatalogDrafts] = useState<Record<string, Partial<CatalogItem>>>({});
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
    setEditDraft({ ...item, imageUrl: item.imageUrl || "", category: item.category || "", productUrl: item.productUrl || "" });
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

  const saveCatalogItem = async (legacyItemId?: string) => {
    const itemId = legacyItemId || editingItem?.id;
    const draft = legacyItemId ? catalogDrafts[legacyItemId] : editDraft;
    if (!itemId || !draft) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/whatsapp-promos/catalog/${encodeURIComponent(itemId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
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

  const historyStatusColor = (status: string) =>
    status === "SENT" ? "success" : status === "FAILED" ? "error" : status === "SCHEDULED" ? "info" : "default";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          WhatsApp Promocoes
        </Typography>
        <Typography sx={{ opacity: 0.8, mt: 1 }}>
          Cadastre ofertas em massa, poste a qualquer momento e deixe o cron cuidar dos agendamentos futuros.
        </Typography>
      </Box>

      {message ? <Alert severity="success">{message}</Alert> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Configuracao do cron
        </Typography>
        {config ? (
          <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 2 }}>
            <Box sx={{ gridColumn: { xs: "span 12", md: "span 3" } }}>
              <TextField select fullWidth label="Cron" value={config.offersCronEnabled ? "true" : "false"} onChange={(e) => setConfig({ ...config, offersCronEnabled: e.target.value === "true" })}>
                <MenuItem value="true">Ligado</MenuItem>
                <MenuItem value="false">Desligado</MenuItem>
              </TextField>
            </Box>
            <Box sx={{ gridColumn: { xs: "span 12", md: "span 3" } }}>
              <TextField fullWidth label="ID do grupo" value={config.offersGroupTargetId} onChange={(e) => setConfig({ ...config, offersGroupTargetId: e.target.value })} />
            </Box>
            <Box sx={{ gridColumn: { xs: "span 12", md: "span 3" } }}>
              <TextField fullWidth label="Nome do grupo" value={config.offersGroupLabel} onChange={(e) => setConfig({ ...config, offersGroupLabel: e.target.value })} />
            </Box>
            <Box sx={{ gridColumn: { xs: "span 12", md: "span 3" } }}>
              <TextField fullWidth type="number" label="Intervalo (min)" value={config.offersPublishIntervalMin} onChange={(e) => setConfig({ ...config, offersPublishIntervalMin: Number(e.target.value || 60) })} />
            </Box>
            <Box sx={{ gridColumn: { xs: "span 12", md: "span 3" } }}>
              <TextField fullWidth type="number" label="Hora inicial" value={config.offersDailyStartHour} onChange={(e) => setConfig({ ...config, offersDailyStartHour: Number(e.target.value || 8) })} />
            </Box>
            <Box sx={{ gridColumn: { xs: "span 12", md: "span 3" } }}>
              <TextField fullWidth type="number" label="Hora final" value={config.offersDailyEndHour} onChange={(e) => setConfig({ ...config, offersDailyEndHour: Number(e.target.value || 22) })} />
            </Box>
            <Box sx={{ gridColumn: { xs: "span 12", md: "span 3" } }}>
              <TextField select fullWidth label="Aprovacao" value={config.offersRequireApproval ? "true" : "false"} onChange={(e) => setConfig({ ...config, offersRequireApproval: e.target.value === "true" })}>
                <MenuItem value="true">Exigir aprovacao</MenuItem>
                <MenuItem value="false">Nao exigir</MenuItem>
              </TextField>
            </Box>
            <Box sx={{ gridColumn: { xs: "span 12", md: "span 3" }, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Chip label={config.evolutionEnabled ? "Evolution pronta" : "Evolution desligada"} color={config.evolutionEnabled ? "success" : "warning"} />
              <Chip label={`Proxima: ${config.offersNextRunAt ? new Date(config.offersNextRunAt).toLocaleString("pt-BR") : "sem agenda"}`} />
            </Box>
            <Box sx={{ gridColumn: "span 12" }}>
              <button onClick={saveConfig} disabled={saving} style={{ padding: "10px 14px", borderRadius: 10, fontWeight: 800, background: "#111827", color: "white" }}>
                Salvar configuracao
              </button>
            </Box>
          </Box>
        ) : null}
      </Paper>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1fr 1fr" }, gap: 2 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Cadastro manual
          </Typography>
          <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 2 }}>
            {[
              ["title", "Titulo", 12],
              ["description", "Descricao", 12],
              ["category", "Categoria", 6],
              ["affiliateUrl", "Link afiliado", 6],
              ["productUrl", "URL do produto", 6],
              ["oldPrice", "Preco antigo", 3],
              ["currentPrice", "Preco atual", 3],
            ].map(([key, label, span]) => (
              <Box key={key} sx={{ gridColumn: { xs: "span 12", md: `span ${span}` } }}>
                <TextField fullWidth label={label} value={(manual as any)[key]} onChange={(e) => setManual((current) => ({ ...current, [key]: e.target.value }))} multiline={key === "description"} minRows={key === "description" ? 3 : undefined} />
              </Box>
            ))}
            <Box sx={{ gridColumn: "span 12" }}>
              <Typography sx={{ fontSize: 13, mb: 0.5, opacity: 0.8 }}>Foto do produto (opcional)</Typography>
              <Button component="label" variant="outlined" disabled={uploadingImage}>
                {uploadingImage ? "Enviando foto..." : "Selecionar foto"}
                <input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => selectManualImage(e.target.files?.[0] || null)} />
              </Button>
              {manualImageFile ? <Typography sx={{ fontSize: 12, mt: 0.5 }}>Selecionada: {manualImageFile.name}</Typography> : null}
              {manual.imageUrl ? <Box component="img" src={manual.imageUrl} alt="Prévia da oferta" sx={{ display: "block", mt: 1, width: 120, height: 120, objectFit: "contain", borderRadius: 2, border: "1px solid", borderColor: "divider" }} /> : null}
              <Typography sx={{ fontSize: 12, mt: 0.5, opacity: 0.65 }}>
                A foto é opcional. Ela será enviada junto à legenda no WhatsApp; sem foto, a postagem será somente texto.
              </Typography>
            </Box>
            <Box sx={{ gridColumn: "span 12" }}>
              <button onClick={createManualItem} disabled={saving} style={{ padding: "10px 14px", borderRadius: 10, fontWeight: 800, background: "#111827", color: "white" }}>
                Cadastrar item
              </button>
            </Box>
          </Box>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Importacao em massa
          </Typography>
          <Typography sx={{ mt: 1, fontSize: 13, opacity: 0.8 }}>
            Suba um CSV para alimentar o catalogo. Depois voce completa preco e categoria dos melhores itens.
          </Typography>
          <Box sx={{ mt: 2, display: "grid", gap: 2 }}>
            <TextField fullWidth label="Chave do lote" value={batchKey} onChange={(e) => setBatchKey(e.target.value)} placeholder="lote-shopee-agosto" />
            <input type="file" accept=".csv,text/csv" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} />
            <button onClick={importCsv} disabled={!csvFile || saving} style={{ padding: "10px 14px", borderRadius: 10, fontWeight: 800, background: "#111827", color: "white" }}>
              Importar CSV
            </button>
          </Box>
        </Paper>
      </Box>

      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Catalogo promocional
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip label={`Total: ${catalog.length}`} />
            <Chip label={`Prontos: ${readyCount}`} color="success" />
          </Box>
        </Box>
        <TableContainer sx={{ mt: 2, border: "1px solid", borderColor: "divider", borderRadius: 2, maxHeight: 620 }}>
          <Table stickyHeader size="small" sx={{ minWidth: 980 }}>
            <TableHead>
              <TableRow>
                <TableCell>Produto</TableCell>
                <TableCell>Categoria</TableCell>
                <TableCell align="right">Preço atual</TableCell>
                <TableCell align="right">Desconto</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Imagem</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {catalogPageItems.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell sx={{ maxWidth: 330 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: 14 }} noWrap>{item.title}</Typography>
                    <Typography sx={{ fontSize: 11, opacity: 0.65 }} noWrap>{item.slug}</Typography>
                  </TableCell>
                  <TableCell>{item.category || "—"}</TableCell>
                  <TableCell align="right">{item.currentPrice != null ? item.currentPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—"}</TableCell>
                  <TableCell align="right">{item.discountPercent != null ? `${item.discountPercent}%` : "—"}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                      <Chip size="small" label={item.readyForPublish ? "Pronto" : "Pendente"} color={item.readyForPublish ? "success" : "warning"} />
                      <Chip size="small" label={item.active ? "Ativo" : "Inativo"} />
                    </Box>
                  </TableCell>
                  <TableCell>{item.imageUrl ? <Box component="img" src={item.imageUrl} alt="" sx={{ width: 42, height: 42, objectFit: "contain", borderRadius: 1, border: "1px solid", borderColor: "divider" }} /> : "—"}</TableCell>
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
              {!catalog.length ? <TableRow><TableCell colSpan={7} align="center">Nenhum item no catálogo.</TableCell></TableRow> : null}
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
        <Box sx={{ display: "none" }} aria-hidden="true">
          {catalog.map((item) => (
            <Box key={item.id} sx={{ border: "1px solid #e5e7eb", borderRadius: 3, p: 2, display: "grid", gap: 1 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                <Box>
                  <Typography sx={{ fontWeight: 900 }}>{item.title}</Typography>
                  <Typography sx={{ fontSize: 12, opacity: 0.7 }}>{item.slug}</Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Chip size="small" label={item.readyForPublish ? "Pronto" : "Pendente"} color={item.readyForPublish ? "success" : "warning"} />
                  <Chip size="small" label={item.active ? "Ativo" : "Inativo"} />
                  <Chip size="small" label={`Posts: ${item._count?.posts || 0}`} />
                </Box>
              </Box>
              <Typography sx={{ fontSize: 13, opacity: 0.8 }}>
                {item.category || "Sem categoria"} • Atual: {item.currentPrice != null ? `R$ ${item.currentPrice}` : "sem preco"} • Desconto: {item.discountPercent != null ? `${item.discountPercent}%` : "-"}
              </Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(12, minmax(0, 1fr))" }, gap: 1 }}>
                <Box sx={{ gridColumn: { md: "span 4" } }}>
                  <TextField
                    size="small"
                    fullWidth
                    label="URL da imagem (opcional)"
                    value={String(catalogDrafts[item.id]?.imageUrl ?? "")}
                    onChange={(e) => setCatalogDrafts((current) => ({ ...current, [item.id]: { ...current[item.id], imageUrl: e.target.value } }))}
                  />
                </Box>
                <Box sx={{ gridColumn: { md: "span 4" } }}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Categoria"
                    value={String(catalogDrafts[item.id]?.category ?? "")}
                    onChange={(e) => setCatalogDrafts((current) => ({ ...current, [item.id]: { ...current[item.id], category: e.target.value } }))}
                  />
                </Box>
                <Box sx={{ gridColumn: { md: "span 4" } }}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Link afiliado"
                    value={String(catalogDrafts[item.id]?.affiliateUrl ?? "")}
                    onChange={(e) => setCatalogDrafts((current) => ({ ...current, [item.id]: { ...current[item.id], affiliateUrl: e.target.value } }))}
                  />
                </Box>
                <Box sx={{ gridColumn: { md: "span 2" } }}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Preco antigo"
                    value={String(catalogDrafts[item.id]?.oldPrice ?? "")}
                    onChange={(e) => setCatalogDrafts((current) => ({ ...current, [item.id]: { ...current[item.id], oldPrice: e.target.value as any } }))}
                  />
                </Box>
                <Box sx={{ gridColumn: { md: "span 2" } }}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Preco atual"
                    value={String(catalogDrafts[item.id]?.currentPrice ?? "")}
                    onChange={(e) => setCatalogDrafts((current) => ({ ...current, [item.id]: { ...current[item.id], currentPrice: e.target.value as any } }))}
                  />
                </Box>
              </Box>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <button onClick={() => saveCatalogItem(item.id)} disabled={saving} style={{ padding: "8px 12px", borderRadius: 10, fontWeight: 800, background: "#7c3aed", color: "white" }}>
                  Salvar item
                </button>
                <button onClick={() => createPost(item, "draft")} disabled={saving} style={{ padding: "8px 12px", borderRadius: 10, fontWeight: 800, background: "#111827", color: "white" }}>
                  Criar postagem
                </button>
                <button onClick={() => createPost(item, "schedule")} disabled={saving} style={{ padding: "8px 12px", borderRadius: 10, fontWeight: 800, background: "#2563eb", color: "white" }}>
                  Agendar +1h
                </button>
                <a href={item.affiliateUrl} target="_blank" rel="noreferrer" style={{ padding: "8px 12px", borderRadius: 10, fontWeight: 800, border: "1px solid #d1d5db" }}>
                  Abrir afiliado
                </a>
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Postagens do WhatsApp
          </Typography>
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
            <Box key={post.id} sx={{ border: "1px solid #e5e7eb", borderRadius: 3, p: 2, display: "grid", gap: 1 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                <Box>
                  <Typography sx={{ fontWeight: 900 }}>{post.headline}</Typography>
                  <Typography sx={{ fontSize: 12, opacity: 0.7 }}>{post.catalogItem.title}</Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Chip size="small" label={post.status} color={post.status === "SENT" ? "success" : post.status === "FAILED" ? "error" : "default"} />
                  <Chip size="small" label={post.sentAt ? `Enviado: ${new Date(post.sentAt).toLocaleString("pt-BR")}` : "Nao enviado"} />
                </Box>
              </Box>
              <Typography sx={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{post.bodyText}</Typography>
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
                  <button onClick={() => savePostSchedule(post.id, "SCHEDULED")} disabled={saving} style={{ padding: "8px 12px", borderRadius: 10, fontWeight: 800, background: "#2563eb", color: "white" }}>
                    Salvar agendamento
                  </button>
                  <button onClick={() => savePostSchedule(post.id, "APPROVED")} disabled={saving} style={{ padding: "8px 12px", borderRadius: 10, fontWeight: 800, background: "#111827", color: "white" }}>
                    Deixar pronto
                  </button>
                  <button onClick={() => sendNow(post.id)} disabled={saving} style={{ padding: "8px 12px", borderRadius: 10, fontWeight: 800, background: "#059669", color: "white" }}>
                    Enviar agora
                  </button>
                </Box>
              </Box>
              {post.errorMessage ? <Alert severity="error">{post.errorMessage}</Alert> : null}
            </Box>
          ))}
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
            <Box sx={{ gridColumn: "span 12" }}><TextField fullWidth label="Título" value={String(editDraft.title || "")} onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))} /></Box>
            <Box sx={{ gridColumn: "span 12" }}><TextField fullWidth multiline minRows={3} label="Descrição" value={String(editDraft.description || "")} onChange={(e) => setEditDraft((d) => ({ ...d, description: e.target.value }))} /></Box>
            <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}><TextField fullWidth label="Categoria" value={String(editDraft.category || "")} onChange={(e) => setEditDraft((d) => ({ ...d, category: e.target.value }))} /></Box>
            <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}><TextField fullWidth label="Link afiliado" value={String(editDraft.affiliateUrl || "")} onChange={(e) => setEditDraft((d) => ({ ...d, affiliateUrl: e.target.value }))} /></Box>
            <Box sx={{ gridColumn: "span 12" }}><TextField fullWidth label="URL do produto" value={String(editDraft.productUrl || "")} onChange={(e) => setEditDraft((d) => ({ ...d, productUrl: e.target.value }))} /></Box>
            <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}><TextField fullWidth label="Preço antigo" value={String(editDraft.oldPrice ?? "")} onChange={(e) => setEditDraft((d) => ({ ...d, oldPrice: e.target.value as any }))} /></Box>
            <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}><TextField fullWidth label="Preço atual" value={String(editDraft.currentPrice ?? "")} onChange={(e) => setEditDraft((d) => ({ ...d, currentPrice: e.target.value as any }))} /></Box>
            <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}><TextField select fullWidth label="Status" value={editDraft.active === false ? "inactive" : "active"} onChange={(e) => setEditDraft((d) => ({ ...d, active: e.target.value === "active" }))}><MenuItem value="active">Ativo</MenuItem><MenuItem value="inactive">Inativo</MenuItem></TextField></Box>
            <Box sx={{ gridColumn: "span 12" }}>
              <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 1 }}>Imagem do produto</Typography>
              <Button component="label" variant="outlined" disabled={uploadingImage}>{uploadingImage ? "Enviando..." : "Enviar nova imagem"}<input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => selectEditImage(e.target.files?.[0] || null)} /></Button>
              {editDraft.imageUrl ? <Box component="img" src={String(editDraft.imageUrl)} alt="Prévia da oferta" sx={{ display: "block", mt: 1, width: 160, height: 160, objectFit: "contain", border: "1px solid", borderColor: "divider", borderRadius: 2 }} /> : <Typography sx={{ mt: 1, fontSize: 13, opacity: 0.7 }}>Sem imagem. O WhatsApp enviará apenas o texto.</Typography>}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions><Button onClick={() => setEditingItem(null)} disabled={saving}>Cancelar</Button><Button variant="contained" onClick={() => saveCatalogItem()} disabled={saving || uploadingImage}>Salvar alterações</Button></DialogActions>
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
                  <Chip size="small" label={post.status} color={historyStatusColor(post.status)} />
                </Box>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Chip size="small" variant="outlined" label={`Criado: ${post.createdAt ? new Date(post.createdAt).toLocaleString("pt-BR") : "-"}`} />
                  <Chip size="small" variant="outlined" label={`Agendado: ${post.scheduledTo ? new Date(post.scheduledTo).toLocaleString("pt-BR") : "nao"}`} />
                  <Chip size="small" variant="outlined" label={`Enviado: ${post.sentAt ? new Date(post.sentAt).toLocaleString("pt-BR") : "nao"}`} />
                </Box>
                <Typography sx={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{post.bodyText}</Typography>
                <Typography sx={{ fontSize: 12, opacity: 0.72 }}>Link usado: {post.linkUrl}</Typography>
                <Typography sx={{ fontSize: 12, opacity: 0.72 }}>Destino: {post.targetId || "nao definido"}</Typography>
                {(post.mediaUrl || post.catalogItem.imageUrl) ? (
                  <Box>
                    <Typography sx={{ fontSize: 12, opacity: 0.72, mb: 0.5 }}>Imagem usada no envio</Typography>
                    <Box component="img" src={post.mediaUrl || post.catalogItem.imageUrl || ""} alt="" sx={{ width: 140, height: 140, objectFit: "contain", borderRadius: 2, border: "1px solid", borderColor: "divider" }} />
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
