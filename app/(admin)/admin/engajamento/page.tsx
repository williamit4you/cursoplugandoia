"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Alert, Box, MenuItem, Paper, TextField, Typography } from "@mui/material";

type Idea = {
  id: string;
  coletaId: string | null;
  templateType: string;
  personaName: string | null;
  hook: string;
  script: string;
  onScreenText: any;
  ctaComment: string | null;
  status: string;
  creatorImageUrl: string | null;
  audioUrl: string | null;
  videoUrl: string | null;
  captionsUrl: string | null;
  errorMessage: string | null;
  createdAt: string;
  coleta?: { id: string; titulo: string | null } | null;
};

type CreatorAsset = {
  id: string;
  url: string;
  label: string | null;
  active: boolean;
};

function normalize(value: unknown) {
  return String(value || "").trim();
}

function statusLabel(status: string) {
  if (status === "DRAFT") return "Rascunho";
  if (status === "GENERATING_AUDIO") return "Gerando audio";
  if (status === "AUDIO_READY") return "Audio pronto";
  if (status === "GENERATING_VIDEO") return "Gerando video";
  if (status === "READY") return "Video pronto";
  if (status === "FAILED") return "Falhou";
  return status;
}

export default function EngajamentoPage() {
  const [assets, setAssets] = useState<CreatorAsset[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageSeverity, setMessageSeverity] = useState<"success" | "warning" | "error">("error");

  const [productUrl, setProductUrl] = useState("");
  const [selectedCreatorImageUrl, setSelectedCreatorImageUrl] = useState("");
  const [newAssetUrl, setNewAssetUrl] = useState("");
  const [newAssetLabel, setNewAssetLabel] = useState("");

  const selected = useMemo(() => ideas.find((item) => item.id === selectedId) || null, [ideas, selectedId]);

  const loadAll = async () => {
    try {
      const [assetsRes, ideasRes] = await Promise.all([
        fetch("/api/creator-assets?active=true", { cache: "no-store" }),
        fetch("/api/engajamento/ideas?take=80", { cache: "no-store" }),
      ]);
      const assetsData = await assetsRes.json().catch(() => ({}));
      const ideasData = await ideasRes.json().catch(() => ({}));
      if (assetsRes.ok) setAssets(assetsData.items || []);
      if (ideasRes.ok) setIdeas(ideasData.items || []);
    } catch (error: any) {
      setMessageSeverity("error");
      setMessage(error?.message || "Falha ao carregar");
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const saveAsset = async () => {
    if (!newAssetUrl.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/creator-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newAssetUrl, label: newAssetLabel }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Falha ao salvar imagem");

      setAssets((prev) => {
        const withoutDuplicate = prev.filter((item) => item.url !== data.item.url);
        return [data.item as CreatorAsset, ...withoutDuplicate];
      });
      setNewAssetUrl("");
      setNewAssetLabel("");
      setMessageSeverity("success");
      setMessage("Imagem salva na galeria.");
    } catch (error: any) {
      setMessageSeverity("error");
      setMessage(error?.message || "Falha ao salvar imagem");
    } finally {
      setLoading(false);
    }
  };

  const generateFromUrl = async () => {
    const url = normalize(productUrl);
    if (!url) return;

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/engajamento/from-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          creatorImageUrl: normalize(selectedCreatorImageUrl) || null,
          autoRender: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Falha ao gerar fluxo automatico");

      const createdIdeas = Array.isArray(data.ideas) ? (data.ideas as Idea[]) : [];
      if (createdIdeas.length === 0) throw new Error("Nenhuma ideia foi criada");

      setIdeas((prev) => [...createdIdeas, ...prev]);
      setSelectedId(String(data.primaryIdeaId || createdIdeas[0].id));
      setProductUrl("");

      if (data.autoRenderError) {
        setMessageSeverity("warning");
        setMessage(`Ideias criadas, mas a renderizacao automatica falhou: ${data.autoRenderError}`);
      } else {
        setMessageSeverity("success");
        setMessage("Fluxo concluido: ideias criadas e a principal ja voltou com video pronto.");
      }
    } catch (error: any) {
      setMessageSeverity("error");
      setMessage(error?.message || "Falha ao gerar por URL");
    } finally {
      setLoading(false);
    }
  };

  const patchIdea = async (id: string, patch: Record<string, any>) => {
    const res = await fetch(`/api/engajamento/ideas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Falha ao salvar");
    const item = data.item as Idea;
    setIdeas((prev) => prev.map((current) => (current.id === id ? { ...current, ...item } : current)));
  };

  const gerarAudio = async () => {
    if (!selected) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/engajamento/ideas/${selected.id}/gerar-audio`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Falha ao gerar audio");
      await loadAll();
      setSelectedId(selected.id);
      setMessageSeverity("success");
      setMessage("Audio regenerado com sucesso.");
    } catch (error: any) {
      setMessageSeverity("error");
      setMessage(error?.message || "Falha ao gerar audio");
    } finally {
      setLoading(false);
    }
  };

  const gerarVideo = async () => {
    if (!selected) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/engajamento/ideas/${selected.id}/gerar-video`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Falha ao gerar video");
      await loadAll();
      setSelectedId(selected.id);
      setMessageSeverity("success");
      setMessage("Video regenerado com sucesso.");
    } catch (error: any) {
      setMessageSeverity("error");
      setMessage(error?.message || "Falha ao gerar video");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          Conteudo de Engajamento
        </Typography>
        <Typography sx={{ opacity: 0.8, mt: 1 }}>
          Cole a URL do produto e o sistema faz o fluxo automatico: scraping, 3 ideias de engajamento e renderizacao da
          principal com sua foto falando.
        </Typography>
        <Typography sx={{ opacity: 0.75, mt: 1 }}>
          Para o modo em que voce so escreve e recebe o video pronto, use{" "}
          <Link href="/admin/texto-para-video" style={{ textDecoration: "underline" }}>
            Texto para Video
          </Link>
          .
        </Typography>
      </Box>

      {message ? <Alert severity={messageSeverity}>{message}</Alert> : null}

      <Paper sx={{ p: 2 }}>
        <Typography sx={{ fontWeight: 900, mb: 1 }}>1) Galeria do criador</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 2 }}>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 7" } }}>
            <TextField
              label="URL da imagem"
              value={newAssetUrl}
              onChange={(event) => setNewAssetUrl(event.target.value)}
              fullWidth
              placeholder="https://..."
            />
          </Box>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 5" } }}>
            <TextField
              label="Label (opcional)"
              value={newAssetLabel}
              onChange={(event) => setNewAssetLabel(event.target.value)}
              fullWidth
              placeholder="Ex.: rosto principal"
            />
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5, mt: 2, flexWrap: "wrap" }}>
          <button
            onClick={saveAsset}
            disabled={loading || !newAssetUrl.trim()}
            style={{ padding: "10px 14px", borderRadius: 10, fontWeight: 900, background: "#111827", color: "white" }}
          >
            {loading ? "Salvando..." : "Adicionar imagem"}
          </button>
          <div style={{ opacity: 0.8, fontSize: 12, paddingTop: 10 }}>{assets.length} imagem(ns) ativas</div>
        </Box>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography sx={{ fontWeight: 900, mb: 1 }}>2) URL para video pronto</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 2 }}>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 7" } }}>
            <TextField
              label="URL do produto"
              value={productUrl}
              onChange={(event) => setProductUrl(event.target.value)}
              fullWidth
              placeholder="https://shopee.com.br/..."
              helperText="Fluxo automatico: scrape do produto, gera 3 ideias e renderiza a principal."
            />
          </Box>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 5" } }}>
            <TextField
              select
              fullWidth
              label="Imagem do criador"
              value={selectedCreatorImageUrl}
              onChange={(event) => setSelectedCreatorImageUrl(String(event.target.value))}
              helperText="Se deixar vazio, usa a imagem padrao da configuracao/pipeline."
            >
              <MenuItem value="">Usar imagem padrao da configuracao</MenuItem>
              {assets.map((asset) => (
                <MenuItem key={asset.id} value={asset.url}>
                  {asset.label ? `${asset.label} - ${asset.url}` : asset.url}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5, mt: 2 }}>
          <button
            onClick={generateFromUrl}
            disabled={loading || !normalize(productUrl)}
            style={{ padding: "10px 14px", borderRadius: 10, fontWeight: 900, background: "#111827", color: "white" }}
          >
            {loading ? "Gerando..." : "Gerar ideias + video principal"}
          </button>
        </Box>
      </Paper>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2 }}>
        <Paper sx={{ p: 2 }}>
          <Typography sx={{ fontWeight: 900, mb: 1 }}>Ideias recentes</Typography>
          <Box sx={{ display: "grid", gap: 1 }}>
            {ideas.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                style={{
                  textAlign: "left",
                  padding: 12,
                  borderRadius: 12,
                  border: item.id === selectedId ? "2px solid #111827" : "1px solid rgba(0,0,0,0.08)",
                  background: "white",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 900 }}>{item.hook}</div>
                <div style={{ opacity: 0.75, fontSize: 12 }}>
                  {statusLabel(item.status)} · {item.templateType}
                  {item.coleta?.titulo ? ` · ${item.coleta.titulo}` : ""}
                </div>
                {item.errorMessage ? <div style={{ marginTop: 6, color: "#b91c1c", fontSize: 12 }}>{item.errorMessage}</div> : null}
              </button>
            ))}
            {ideas.length === 0 ? <div style={{ opacity: 0.7 }}>Nenhuma ideia ainda.</div> : null}
          </Box>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography sx={{ fontWeight: 900, mb: 1 }}>Detalhe</Typography>
          {!selected ? (
            <div style={{ opacity: 0.7 }}>Selecione uma ideia.</div>
          ) : (
            <Box sx={{ display: "grid", gap: 2 }}>
              <Alert severity={selected.status === "FAILED" ? "error" : "info"}>
                Status atual: {statusLabel(selected.status)}
              </Alert>

              <TextField
                label="Hook"
                value={selected.hook}
                onChange={(event) =>
                  setIdeas((prev) => prev.map((item) => (item.id === selected.id ? { ...item, hook: event.target.value } : item)))
                }
                onBlur={() => patchIdea(selected.id, { hook: selected.hook })}
                fullWidth
              />

              <TextField
                label="Script (locucao)"
                value={selected.script}
                onChange={(event) =>
                  setIdeas((prev) => prev.map((item) => (item.id === selected.id ? { ...item, script: event.target.value } : item)))
                }
                onBlur={() => patchIdea(selected.id, { script: selected.script })}
                fullWidth
                multiline
                rows={8}
              />

              <TextField
                label="CTA comentario (opcional)"
                value={selected.ctaComment || ""}
                onChange={(event) =>
                  setIdeas((prev) =>
                    prev.map((item) => (item.id === selected.id ? { ...item, ctaComment: event.target.value } : item))
                  )
                }
                onBlur={() => patchIdea(selected.id, { ctaComment: selected.ctaComment || "" })}
                fullWidth
              />

              <TextField
                select
                label="Imagem do criador"
                value={selected.creatorImageUrl || ""}
                onChange={(event) => {
                  const url = String(event.target.value);
                  setIdeas((prev) => prev.map((item) => (item.id === selected.id ? { ...item, creatorImageUrl: url } : item)));
                  patchIdea(selected.id, { creatorImageUrl: url }).catch(() => null);
                }}
                fullWidth
                helperText="Se vazio, a regeneracao usa a imagem padrao da configuracao."
              >
                <MenuItem value="">Usar imagem padrao da configuracao</MenuItem>
                {assets.map((asset) => (
                  <MenuItem key={asset.id} value={asset.url}>
                    {asset.label ? `${asset.label} - ${asset.url}` : asset.url}
                  </MenuItem>
                ))}
              </TextField>

              <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                <button onClick={gerarAudio} disabled={loading} style={{ padding: "10px 14px", borderRadius: 10, fontWeight: 900 }}>
                  Gerar audio novamente
                </button>
                <button onClick={gerarVideo} disabled={loading || !selected.audioUrl} style={{ padding: "10px 14px", borderRadius: 10, fontWeight: 900 }}>
                  Gerar video novamente
                </button>
                {selected.audioUrl ? (
                  <a href={selected.audioUrl} target="_blank" rel="noreferrer" style={{ paddingTop: 10 }}>
                    Abrir audio
                  </a>
                ) : null}
                {selected.videoUrl ? (
                  <>
                    <a href={selected.videoUrl} target="_blank" rel="noreferrer" style={{ paddingTop: 10 }}>
                      Abrir video
                    </a>
                    <a href={selected.videoUrl} download style={{ paddingTop: 10 }}>
                      Baixar MP4
                    </a>
                  </>
                ) : null}
                {selected.captionsUrl ? (
                  <a href={selected.captionsUrl} target="_blank" rel="noreferrer" style={{ paddingTop: 10 }}>
                    Legendas (VTT)
                  </a>
                ) : null}
              </Box>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
