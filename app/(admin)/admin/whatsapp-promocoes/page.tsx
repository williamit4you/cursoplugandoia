"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Chip, MenuItem, Paper, TextField, Typography } from "@mui/material";

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
  scheduledTo: string | null;
  sentAt: string | null;
  targetId: string | null;
  errorMessage: string | null;
  catalogItem: {
    id: string;
    title: string;
    slug: string;
  };
};

const emptyManual = {
  title: "",
  description: "",
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
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [batchKey, setBatchKey] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [scheduleDrafts, setScheduleDrafts] = useState<Record<string, string>>({});
  const [catalogDrafts, setCatalogDrafts] = useState<Record<string, Partial<CatalogItem>>>({});

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
      setCatalogDrafts(
        Object.fromEntries(
          (catalogData.items || []).map((item: CatalogItem) => [
            item.id,
            {
              title: item.title,
              category: item.category || "",
              affiliateUrl: item.affiliateUrl,
              productUrl: item.productUrl || "",
              oldPrice: item.oldPrice,
              currentPrice: item.currentPrice,
              active: item.active,
            },
          ]),
        ),
      );
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

  const saveCatalogItem = async (itemId: string) => {
    const draft = catalogDrafts[itemId];
    if (!draft) return;
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
        <Box sx={{ mt: 2, display: "grid", gap: 2 }}>
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
          {posts.map((post) => (
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
                  InputLabelProps={{ shrink: true }}
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
      </Paper>
    </Box>
  );
}
