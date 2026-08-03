"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Chip, MenuItem, Paper, TextField, Typography } from "@mui/material";

type BioCategoryOption = {
  id: string;
  name: string;
  slug: string;
};

type BioArticleLink = {
  briefId: string;
  angle: string;
  briefTitle: string;
  postTitle: string | null;
  publicUrl: string | null;
};

type BioAnalyticsItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string | null;
  videoUrl: string | null;
  affiliateUrl: string;
  categoryId: string | null;
  category: BioCategoryOption | null;
  active: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  clicksTotal: number;
  clicks7d: number;
  clicks30d: number;
  seoReady: boolean;
  seoIssues: string[];
  articleCount: number;
  articleLinks: BioArticleLink[];
};

function baseUrl() {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

function angleLabel(value: string) {
  if (value === "PAIN") return "Dor";
  if (value === "PRODUCT") return "Produto";
  if (value === "SALES") return "Oferta";
  return value;
}

export default function BioAnalyticsPage() {
  const [items, setItems] = useState<BioAnalyticsItem[]>([]);
  const [categories, setCategories] = useState<BioCategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [active, setActive] = useState("true");
  const [draftImageUrls, setDraftImageUrls] = useState<Record<string, string>>({});
  const [draftCategoryIds, setDraftCategoryIds] = useState<Record<string, string>>({});
  const [draftActive, setDraftActive] = useState<Record<string, boolean>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const qs = new URLSearchParams({ q, active });
      const res = await fetch(`/api/bio/admin/analytics?${qs.toString()}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Falha ao carregar");
      setItems(data.items || []);
      setCategories(data.categories || []);
      setDraftImageUrls(Object.fromEntries((data.items || []).map((item: BioAnalyticsItem) => [item.id, item.imageUrl || ""])));
      setDraftCategoryIds(Object.fromEntries((data.items || []).map((item: BioAnalyticsItem) => [item.id, item.categoryId || ""])));
      setDraftActive(Object.fromEntries((data.items || []).map((item: BioAnalyticsItem) => [item.id, Boolean(item.active)])));
    } catch (error: any) {
      setMessage(error?.message || "Falha ao carregar");
    } finally {
      setLoading(false);
    }
  };

  const saveImageUrl = async (id: string) => {
    setSavingId(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/bio/admin/analytics?id=${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: draftImageUrls[id] || "" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Falha ao salvar imagem");
      setItems((current) =>
        current.map((item) =>
          item.id === id ? { ...item, imageUrl: data.item?.imageUrl || null, updatedAt: data.item?.updatedAt || item.updatedAt } : item,
        ),
      );
      setDraftImageUrls((current) => ({ ...current, [id]: data.item?.imageUrl || "" }));
    } catch (error: any) {
      setMessage(error?.message || "Falha ao salvar imagem");
    } finally {
      setSavingId(null);
    }
  };

  const saveSeoSettings = async (id: string) => {
    setSavingId(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/bio/admin/analytics?id=${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: draftCategoryIds[id] || null,
          active: Boolean(draftActive[id]),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Falha ao salvar configuracoes SEO");
      await load();
    } catch (error: any) {
      setMessage(error?.message || "Falha ao salvar configuracoes SEO");
    } finally {
      setSavingId(null);
    }
  };

  const uploadImageFile = async (id: string, file: File | null) => {
    if (!file) return;
    setSavingId(id);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.set("image", file);
      const res = await fetch(`/api/bio/admin/analytics?id=${encodeURIComponent(id)}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Falha ao enviar imagem");
      setItems((current) =>
        current.map((item) =>
          item.id === id ? { ...item, imageUrl: data.item?.imageUrl || null, updatedAt: data.item?.updatedAt || item.updatedAt } : item,
        ),
      );
      setDraftImageUrls((current) => ({ ...current, [id]: data.item?.imageUrl || "" }));
    } catch (error: any) {
      setMessage(error?.message || "Falha ao enviar imagem");
    } finally {
      setSavingId(null);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = useMemo(() => {
    const total = items.reduce((acc, item) => acc + (item.clicksTotal || 0), 0);
    const d7 = items.reduce((acc, item) => acc + (item.clicks7d || 0), 0);
    const d30 = items.reduce((acc, item) => acc + (item.clicks30d || 0), 0);
    return { total, d7, d30 };
  }, [items]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          Bio Analytics
        </Typography>
        <Typography sx={{ opacity: 0.8, mt: 1 }}>
          Cliques, prontidao SEO e qualidade operacional dos produtos da vitrine publica.
        </Typography>
      </Box>

      {message ? <Alert severity="error">{message}</Alert> : null}

      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 2 }}>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 7" } }}>
            <TextField
              fullWidth
              label="Buscar"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Titulo, slug, descricao..."
            />
          </Box>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 5" } }}>
            <TextField select fullWidth label="Ativo" value={active} onChange={(e) => setActive(e.target.value)}>
              <MenuItem value="true">Somente ativos</MenuItem>
              <MenuItem value="false">Somente inativos</MenuItem>
              <MenuItem value="all">Todos</MenuItem>
            </TextField>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 2, mt: 2, alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={load}
            disabled={loading}
            style={{ padding: "10px 14px", borderRadius: 10, fontWeight: 800, background: "#111827", color: "white" }}
          >
            Aplicar
          </button>

          <Chip label={`Cliques 7d: ${totals.d7}`} size="small" />
          <Chip label={`Cliques 30d: ${totals.d30}`} size="small" />
          <Chip label={`Cliques total: ${totals.total}`} size="small" />
          <Chip label={`Itens: ${items.length}`} size="small" variant="outlined" />
        </Box>
      </Paper>

      <Paper sx={{ p: 0, overflow: "hidden" }}>
        <Box sx={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                {["Produto", "Imagem", "SEO", "Cliques (7d/30d/Total)", "Links"].map((label) => (
                  <th key={label} style={{ textAlign: "left", padding: 16, fontSize: 12 }}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <td style={{ padding: 16, minWidth: 360, maxWidth: 620 }}>
                    <div style={{ fontWeight: 900 }}>{item.title}</div>
                    <div style={{ opacity: 0.7, fontSize: 12, marginTop: 4, fontFamily: "monospace" }}>{item.slug}</div>
                    <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Chip size="small" label={item.category?.name || "Sem categoria"} variant={item.category ? "filled" : "outlined"} />
                      <Chip size="small" label={item.active ? "ATIVO" : "INATIVO"} color={item.active ? "success" : "default"} />
                      <Chip size="small" label={item.seoReady ? "SEO pronto" : "SEO pendente"} color={item.seoReady ? "success" : "warning"} />
                      <Chip size="small" label={`Artigos: ${item.articleCount}`} />
                    </div>
                  </td>
                  <td style={{ padding: 16, minWidth: 280 }}>
                    <div style={{ display: "grid", gap: 10 }}>
                      <div
                        style={{
                          width: 112,
                          height: 112,
                          borderRadius: 16,
                          overflow: "hidden",
                          border: "1px solid rgba(255,255,255,0.1)",
                          background: "rgba(255,255,255,0.04)",
                          display: "grid",
                          placeItems: "center",
                          color: "rgba(255,255,255,0.5)",
                          fontSize: 11,
                          textAlign: "center",
                          padding: 8,
                        }}
                      >
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <span>Sem imagem</span>
                        )}
                      </div>
                      <TextField
                        size="small"
                        fullWidth
                        label="URL da imagem"
                        value={draftImageUrls[item.id] || ""}
                        onChange={(e) => setDraftImageUrls((current) => ({ ...current, [item.id]: e.target.value }))}
                        placeholder="https://..."
                      />
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <button
                          onClick={() => saveImageUrl(item.id)}
                          disabled={savingId === item.id}
                          style={{ padding: "8px 12px", borderRadius: 10, fontWeight: 800, background: "#111827", color: "white" }}
                        >
                          Salvar URL
                        </button>
                        <label
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "8px 12px",
                            borderRadius: 10,
                            fontWeight: 800,
                            border: "1px solid rgba(255,255,255,0.12)",
                            cursor: savingId === item.id ? "not-allowed" : "pointer",
                          }}
                        >
                          Subir foto
                          <input
                            type="file"
                            accept="image/*"
                            disabled={savingId === item.id}
                            style={{ display: "none" }}
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              void uploadImageFile(item.id, file);
                              e.currentTarget.value = "";
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: 16, minWidth: 260 }}>
                    <div style={{ display: "grid", gap: 10 }}>
                      <TextField
                        select
                        size="small"
                        fullWidth
                        label="Categoria"
                        value={draftCategoryIds[item.id] || ""}
                        onChange={(e) => setDraftCategoryIds((current) => ({ ...current, [item.id]: e.target.value }))}
                      >
                        <MenuItem value="">Sem categoria</MenuItem>
                        {categories.map((category) => (
                          <MenuItem key={category.id} value={category.id}>
                            {category.name}
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        select
                        size="small"
                        fullWidth
                        label="Status"
                        value={draftActive[item.id] ? "true" : "false"}
                        onChange={(e) => setDraftActive((current) => ({ ...current, [item.id]: e.target.value === "true" }))}
                      >
                        <MenuItem value="true">Ativo</MenuItem>
                        <MenuItem value="false">Inativo</MenuItem>
                      </TextField>
                      <button
                        onClick={() => saveSeoSettings(item.id)}
                        disabled={savingId === item.id}
                        style={{ padding: "8px 12px", borderRadius: 10, fontWeight: 800, background: "#111827", color: "white" }}
                      >
                        Salvar SEO
                      </button>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {(item.seoIssues || []).map((issue) => (
                          <Chip key={issue} size="small" label={issue} color="warning" variant="outlined" />
                        ))}
                        {item.seoIssues.length === 0 ? <Chip size="small" label="Base minima ok" color="success" variant="outlined" /> : null}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: 16 }}>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <Chip size="small" label={`7d: ${item.clicks7d}`} />
                      <Chip size="small" label={`30d: ${item.clicks30d}`} />
                      <Chip size="small" label={`Total: ${item.clicksTotal}`} />
                    </div>
                  </td>
                  <td style={{ padding: 16, minWidth: 420 }}>
                    <div style={{ display: "grid", gap: 8 }}>
                      <a
                        href={`${baseUrl()}/bio/${encodeURIComponent(item.slug)}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontWeight: 900 }}
                      >
                        Abrir pagina /bio
                      </a>
                      <a href={item.affiliateUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, opacity: 0.8 }}>
                        Abrir link afiliado
                      </a>
                      {(item.articleLinks || []).slice(0, 3).map((article) =>
                        article.publicUrl ? (
                          <a key={article.briefId} href={article.publicUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, opacity: 0.8 }}>
                            Artigo {angleLabel(article.angle)}: {article.postTitle || article.briefTitle}
                          </a>
                        ) : null,
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && items.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 24, textAlign: "center", opacity: 0.7 }}>
                    Nenhum item encontrado.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </Box>
      </Paper>
    </Box>
  );
}
