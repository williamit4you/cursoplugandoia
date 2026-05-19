"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Box, MenuItem, Paper, TextField, Typography } from "@mui/material";

type Template = {
  type: string;
  name: string;
  objective: string;
  personaName: string;
  guidance: string;
};

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

type CreatorAsset = { id: string; url: string; label: string | null; active: boolean };

function normalize(value: unknown) {
  return String(value || "").trim();
}


export default function EngajamentoPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [assets, setAssets] = useState<CreatorAsset[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [coletaId, setColetaId] = useState("");
  const [templateType, setTemplateType] = useState("");
  const [personaName, setPersonaName] = useState("");

  const [newAssetUrl, setNewAssetUrl] = useState("");
  const [newAssetLabel, setNewAssetLabel] = useState("");

  const selected = useMemo(() => ideas.find((x) => x.id === selectedId) || null, [ideas, selectedId]);

  const loadAll = async () => {
    setMessage(null);
    try {
      const [tRes, aRes, iRes] = await Promise.all([
        fetch("/api/engajamento/templates", { cache: "no-store" }),
        fetch("/api/creator-assets?active=true", { cache: "no-store" }),
        fetch("/api/engajamento/ideas?take=80", { cache: "no-store" }),
      ]);
      const tData = await tRes.json().catch(() => ({}));
      const aData = await aRes.json().catch(() => ({}));
      const iData = await iRes.json().catch(() => ({}));
      if (tRes.ok) setTemplates(tData.templates || []);
      if (aRes.ok) setAssets(aData.items || []);
      if (iRes.ok) setIdeas(iData.items || []);

      if (!templateType && Array.isArray(tData.templates) && tData.templates.length > 0) {
        setTemplateType(String(tData.templates[0].type));
        setPersonaName(String(tData.templates[0].personaName || ""));
      }
    } catch (e: any) {
      setMessage(e?.message || "Falha ao carregar");
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateIdea = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/engajamento/ideas/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coletaId: normalize(coletaId) || null,
          templateType,
          personaName: normalize(personaName) || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Falha ao gerar");
      const item = data.item as Idea;
      setIdeas((prev) => [item, ...prev]);
      setSelectedId(item.id);
    } catch (e: any) {
      setMessage(e?.message || "Falha ao gerar");
    } finally {
      setLoading(false);
    }
  };

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
        const without = prev.filter((x) => x.url !== data.item.url);
        return [data.item as CreatorAsset, ...without];
      });
      setNewAssetUrl("");
      setNewAssetLabel("");
    } catch (e: any) {
      setMessage(e?.message || "Falha ao salvar");
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
    setIdeas((prev) => prev.map((x) => (x.id === id ? { ...(x as any), ...(item as any) } : x)));
  };

  const gerarAudio = async () => {
    if (!selected) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/engajamento/ideas/${selected.id}/gerar-audio`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Falha ao gerar áudio");
      await loadAll();
      setSelectedId(selected.id);
    } catch (e: any) {
      setMessage(e?.message || "Falha ao gerar áudio");
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
      if (!res.ok) throw new Error(data?.error || "Falha ao gerar vídeo");
      await loadAll();
      setSelectedId(selected.id);
    } catch (e: any) {
      setMessage(e?.message || "Falha ao gerar vídeo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          Conteúdo (Engajamento)
        </Typography>
        <Typography sx={{ opacity: 0.8, mt: 1 }}>
          Gere ideias por template, edite, gere áudio e vídeo (foto falando) com legendas.
        </Typography>
      </Box>

      {message ? <Alert severity="error">{message}</Alert> : null}

      <Paper sx={{ p: 2 }}>
        <Typography sx={{ fontWeight: 900, mb: 1 }}>1) Imagens do criador (galeria)</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 2 }}>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 7" } }}>
            <TextField
              label="URL da imagem"
              value={newAssetUrl}
              onChange={(e) => setNewAssetUrl(e.target.value)}
              fullWidth
              placeholder="https://..."
            />
          </Box>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 5" } }}>
            <TextField
              label="Label (opcional)"
              value={newAssetLabel}
              onChange={(e) => setNewAssetLabel(e.target.value)}
              fullWidth
              placeholder="Ex.: rosto 1, selfie 2..."
            />
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5, mt: 2, flexWrap: "wrap" }}>
          <button
            onClick={saveAsset}
            disabled={loading || !newAssetUrl.trim()}
            style={{ padding: "10px 14px", borderRadius: 10, fontWeight: 900, background: "#111827", color: "white" }}
          >
            {loading ? "..." : "Adicionar imagem"}
          </button>
          <div style={{ opacity: 0.8, fontSize: 12, paddingTop: 10 }}>
            {assets.length} imagem(ns) ativas
          </div>
        </Box>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography sx={{ fontWeight: 900, mb: 1 }}>2) Gerar uma ideia</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 2 }}>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
            <TextField
              label="Coleta ID (opcional)"
              value={coletaId}
              onChange={(e) => setColetaId(e.target.value)}
              fullWidth
              placeholder="cuid da coleta (Shopee)"
              helperText="Se vazio, gera genérico (melhor com coletaId)."
            />
          </Box>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
            <TextField
              select
              fullWidth
              label="Template"
              value={templateType}
              onChange={(e) => {
                const type = String(e.target.value);
                setTemplateType(type);
                const t = templates.find((x) => x.type === type);
                if (t?.personaName) setPersonaName(t.personaName);
              }}
            >
              {templates.map((t) => (
                <MenuItem key={t.type} value={t.type}>
                  {t.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
            <TextField
              label="Persona (opcional)"
              value={personaName}
              onChange={(e) => setPersonaName(e.target.value)}
              fullWidth
              placeholder="IA caçadora de produtos"
            />
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5, mt: 2 }}>
          <button
            onClick={generateIdea}
            disabled={loading || !templateType}
            style={{ padding: "10px 14px", borderRadius: 10, fontWeight: 900, background: "#111827", color: "white" }}
          >
            {loading ? "Gerando..." : "Gerar ideia"}
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
                  {item.templateType} · {item.status}
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
              <TextField
                label="Hook"
                value={selected.hook}
                onChange={(e) => setIdeas((prev) => prev.map((x) => (x.id === selected.id ? { ...x, hook: e.target.value } : x)))}
                onBlur={() => patchIdea(selected.id, { hook: selected.hook })}
                fullWidth
              />
              <TextField
                label="Script (locução)"
                value={selected.script}
                onChange={(e) => setIdeas((prev) => prev.map((x) => (x.id === selected.id ? { ...x, script: e.target.value } : x)))}
                onBlur={() => patchIdea(selected.id, { script: selected.script })}
                fullWidth
                multiline
                rows={8}
              />
              <TextField
                label="CTA comentário (opcional)"
                value={selected.ctaComment || ""}
                onChange={(e) => setIdeas((prev) => prev.map((x) => (x.id === selected.id ? { ...x, ctaComment: e.target.value } : x)))}
                onBlur={() => patchIdea(selected.id, { ctaComment: selected.ctaComment || "" })}
                fullWidth
              />

              <TextField
                select
                label="Imagem do criador"
                value={selected.creatorImageUrl || ""}
                onChange={(e) => {
                  const url = String(e.target.value);
                  setIdeas((prev) => prev.map((x) => (x.id === selected.id ? { ...x, creatorImageUrl: url } : x)));
                  patchIdea(selected.id, { creatorImageUrl: url }).catch(() => null);
                }}
                fullWidth
                helperText="Obrigatório para gerar o vídeo."
              >
                <MenuItem value="">(selecione)</MenuItem>
                {assets.map((a) => (
                  <MenuItem key={a.id} value={a.url}>
                    {a.label ? `${a.label} — ${a.url}` : a.url}
                  </MenuItem>
                ))}
              </TextField>

              <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                <button
                  onClick={gerarAudio}
                  disabled={loading}
                  style={{ padding: "10px 14px", borderRadius: 10, fontWeight: 900 }}
                >
                  Gerar áudio
                </button>
                <button
                  onClick={gerarVideo}
                  disabled={loading || !selected.audioUrl || !selected.creatorImageUrl}
                  style={{ padding: "10px 14px", borderRadius: 10, fontWeight: 900 }}
                >
                  Gerar vídeo
                </button>
                {selected.audioUrl ? (
                  <a href={selected.audioUrl} target="_blank" rel="noreferrer" style={{ paddingTop: 10 }}>
                    Abrir áudio
                  </a>
                ) : null}
                {selected.videoUrl ? (
                  <>
                    <a href={selected.videoUrl} target="_blank" rel="noreferrer" style={{ paddingTop: 10 }}>
                      Abrir vídeo
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
