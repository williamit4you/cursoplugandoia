"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Box, Typography, Card, CardContent, TextField, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, CircularProgress, Chip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, LinearProgress, Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import MovieIcon from "@mui/icons-material/Movie";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import EditIcon from "@mui/icons-material/Edit";

export default function ColetaShopeePage() {
  const [coletas, setColetas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal de detalhes / edição
  const [selectedColeta, setSelectedColeta] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editFields, setEditFields] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Modal de criação de vídeo TikTok
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoColeta, setVideoColeta] = useState<any>(null);
  const [reactionFile, setReactionFile] = useState<File | null>(null);
  const [reactionPreview, setReactionPreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadColetas = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/coleta-shopee");
      if (res.ok) setColetas(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadColetas(); }, []);

  const handleAddUrl = async () => {
    if (!url) return;
    try {
      setIsSubmitting(true);
      const res = await fetch("/api/coleta-shopee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (res.ok) { setUrl(""); loadColetas(); }
      else { const e = await res.json(); alert("Erro: " + e.error); }
    } catch { alert("Erro ao adicionar URL"); }
    finally { setIsSubmitting(false); }
  };

  const handleScrape = async (id: string) => {
    try {
      setColetas(prev => prev.map(c => c.id === id ? { ...c, status: "SCRAPING" } : c));
      const res = await fetch(`/api/coleta-shopee/${id}/scrape`, { method: "POST" });
      if (!res.ok) { const e = await res.json(); alert("Erro no scraping: " + e.error); }
      loadColetas();
    } catch { alert("Erro ao executar scraping"); loadColetas(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta coleta?")) return;
    try {
      await fetch(`/api/coleta-shopee/${id}`, { method: "DELETE" });
      loadColetas();
    } catch (e) { console.error(e); }
  };

  const handleViewDetails = (coleta: any) => {
    setSelectedColeta(coleta);
    setEditFields({
      titulo: coleta.titulo || "",
      descricao: coleta.descricao || "",
      detalhes: coleta.detalhes || "",
      aiPromptVendas: coleta.aiPromptVendas || "",
    });
    setSaveMsg(null);
    setIsModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedColeta) return;
    setIsSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch(`/api/coleta-shopee/${selectedColeta.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFields),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Erro ao salvar");
      setSaveMsg("✅ Salvo com sucesso!");
      loadColetas();
    } catch (e: any) {
      setSaveMsg("❌ " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Vídeo TikTok ──────────────────────────────────────────────
  const openVideoModal = (coleta: any) => {
    setVideoColeta(coleta);
    setReactionFile(null);
    setReactionPreview(null);
    setGenerateError(null);
    setGeneratedUrl(coleta.videoFinalUrl || null);
    setVideoModalOpen(true);
  };

  const handleReactionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReactionFile(file);
    setGenerateError(null);
    setGeneratedUrl(null);
    const objectUrl = URL.createObjectURL(file);
    setReactionPreview(objectUrl);
  };

  const handleGenerateVideo = async () => {
    if (!reactionFile || !videoColeta) return;
    setIsGenerating(true);
    setGenerateError(null);
    setGeneratedUrl(null);

    try {
      const form = new FormData();
      form.append("reaction_video", reactionFile, reactionFile.name);

      const res = await fetch(`/api/coleta-shopee/${videoColeta.id}/criar-video`, {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao gerar vídeo.");

      setGeneratedUrl(data.videoUrl);
      loadColetas(); // atualiza a tabela com videoFinalUrl e videoStatus
    } catch (err: any) {
      setGenerateError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Ordena mídias: vídeos primeiro, imagens depois
  const sortedMedia = (media: any[]) => {
    if (!media) return [];
    return [...media].sort((a, b) => {
      if (a.tipo === "VIDEO" && b.tipo !== "VIDEO") return -1;
      if (a.tipo !== "VIDEO" && b.tipo === "VIDEO") return 1;
      return 0;
    });
  };

  const videoStatusColor = (s?: string) =>
    s === "COMPLETED" ? "success" : s === "RENDERING" ? "warning" : s === "FAILED" ? "error" : "default";

  return (
    <Box className="space-y-6">
      {/* Header */}
      <Box className="flex justify-between items-center">
        <Typography variant="h4" className="font-bold text-slate-100">Coleta Shopee</Typography>
        <Button variant="outlined" color="inherit" startIcon={<RefreshIcon />} onClick={loadColetas} className="border-white/10 hover:bg-white/5">
          Atualizar
        </Button>
      </Box>

      {/* Cadastrar URL */}
      <Card className="bg-white/5 border border-white/10 backdrop-blur-md">
        <CardContent className="flex flex-col gap-3">
          <Typography variant="subtitle1" className="font-semibold text-slate-200">
            1. Insira o Link do Produto
          </Typography>
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
            <TextField
              fullWidth size="medium" variant="outlined"
              placeholder="Cole a URL do produto da Shopee aqui (ex: https://shopee.com.br/...)"
              value={url} onChange={e => setUrl(e.target.value)} disabled={isSubmitting}
              sx={{ 
                bgcolor: "rgba(0,0,0,0.2)", 
                borderRadius: 1, 
                input: { color: "#f1f5f9" }, 
                "& .MuiOutlinedInput-root": { 
                  "& fieldset": { borderColor: "rgba(255,255,255,0.2)" }, 
                  "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" }, 
                  "&.Mui-focused fieldset": { borderColor: "#6366f1" } 
                } 
              }}
            />
            <Button variant="contained" color="primary" size="large"
              startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
              onClick={handleAddUrl} disabled={!url || isSubmitting}
              sx={{ minWidth: 200 }}
              className="bg-indigo-600 hover:bg-indigo-700 whitespace-nowrap h-[56px] shadow-lg">
              Cadastrar Produto
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <TableContainer component={Paper} className="bg-white/5 border border-white/10 backdrop-blur-md">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell className="text-slate-400 font-semibold border-white/10">URL / Título</TableCell>
              <TableCell className="text-slate-400 font-semibold border-white/10">Status</TableCell>
              <TableCell className="text-slate-400 font-semibold border-white/10">Mídias</TableCell>
              <TableCell className="text-slate-400 font-semibold border-white/10">Vídeo TikTok</TableCell>
              <TableCell className="text-slate-400 font-semibold border-white/10 text-right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && coletas.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 border-white/10"><CircularProgress size={30} /></TableCell></TableRow>
            ) : coletas.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-400 border-white/10">Nenhuma URL cadastrada.</TableCell></TableRow>
            ) : coletas.map(c => (
              <TableRow key={c.id} className="hover:bg-white/5 transition-colors">
                <TableCell className="border-white/10 text-slate-200">
                  <div className="flex flex-col gap-1">
                    {c.titulo && <span className="font-semibold text-indigo-400 cursor-pointer" onClick={() => handleViewDetails(c)}>{c.titulo}</span>}
                    <a href={c.url} target="_blank" rel="noreferrer" className="text-xs text-slate-500 hover:underline max-w-md truncate">{c.url}</a>
                  </div>
                </TableCell>
                <TableCell className="border-white/10">
                  <Chip size="small" label={c.status} variant="outlined"
                    color={c.status === "COMPLETED" ? "success" : c.status === "SCRAPING" ? "warning" : c.status === "FAILED" ? "error" : "default"} />
                  {c.errorMessage && <p className="text-xs text-red-400 mt-1 max-w-xs truncate" title={c.errorMessage}>{c.errorMessage}</p>}
                </TableCell>
                <TableCell className="border-white/10 text-slate-300">{c.linksMedia?.length || 0} mídias</TableCell>
                <TableCell className="border-white/10">
                  {c.videoStatus && (
                    <Chip size="small" label={c.videoStatus} variant="outlined" color={videoStatusColor(c.videoStatus)} />
                  )}
                  {c.videoFinalUrl && (
                    <Tooltip title="Assistir vídeo gerado">
                      <IconButton size="small" href={c.videoFinalUrl} target="_blank" className="text-green-400 ml-1">
                        <OpenInNewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell className="border-white/10 text-right">
                  <div className="flex gap-2 justify-end">
                    <Tooltip title="Ver / Editar dados coletados">
                      <IconButton size="small" onClick={() => handleViewDetails(c)} className="text-indigo-400 hover:bg-indigo-400/10">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Button size="small" variant="contained" color="primary"
                      className="bg-indigo-600 hover:bg-indigo-700"
                      startIcon={c.status === "SCRAPING" ? <CircularProgress size={14} color="inherit" /> : <PlayArrowIcon />}
                      onClick={() => handleScrape(c.id)} disabled={c.status === "SCRAPING"}>
                      Scraping
                    </Button>
                    {c.status === "COMPLETED" && (
                      <Tooltip title="Criar Vídeo TikTok">
                        <Button size="small" variant="contained"
                          sx={{ bgcolor: "#7c3aed", "&:hover": { bgcolor: "#6d28d9" } }}
                          startIcon={<MovieIcon />}
                          onClick={() => openVideoModal(c)}>
                          Vídeo
                        </Button>
                      </Tooltip>
                    )}
                    <IconButton size="small" onClick={() => handleDelete(c.id)} className="text-red-400 hover:bg-red-400/10">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </div>
                </      {/* ── Modal Detalhes / Edição ── */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="xl" fullWidth
        PaperProps={{
          sx: {
            bgcolor: "#0d1526",
            border: "1px solid rgba(99,102,241,0.25)",
            color: "#e2e8f0",
            borderRadius: 2,
            maxHeight: "90vh",
          }
        }}>

        {/* Header */}
        <Box sx={{ px: 3, py: 2, borderBottom: "1px solid rgba(255,255,255,0.08)", bgcolor: "rgba(99,102,241,0.06)" }}>
          <Box className="flex items-center gap-2 mb-1">
            <EditIcon sx={{ color: "#818cf8", fontSize: 18 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#e2e8f0" }}>
              Dados Coletados — Editar
            </Typography>
            {selectedColeta && (
              <Chip size="small" label={selectedColeta.status} variant="outlined"
                color={selectedColeta.status === "COMPLETED" ? "success" : selectedColeta.status === "FAILED" ? "error" : "default"}
                sx={{ ml: "auto", fontSize: 11 }} />
            )}
          </Box>
          {selectedColeta && (
            <Typography variant="caption" sx={{ color: "#64748b", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              🔗 {selectedColeta.url}
            </Typography>
          )}
        </Box>

        <DialogContent sx={{ p: 0, overflow: "hidden" }}>
          {selectedColeta && (
            <div style={{ display: "flex", flexDirection: "row", height: "100%", minHeight: 480 }}>
              {/* ── Coluna esquerda: campos de texto ── */}
              <Box sx={{
                flex: "0 0 55%",
                p: 3,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 2,
                borderRight: "1px solid rgba(255,255,255,0.07)",
              }}>
                <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
                  📝 Informações do Produto
                </Typography>

                <TextField fullWidth label="Título do Produto" variant="filled" size="small"
                  value={editFields.titulo}
                  onChange={e => setEditFields((p: any) => ({ ...p, titulo: e.target.value }))}
                  sx={{
                    "& .MuiFilledInput-root": { bgcolor: "rgba(255,255,255,0.04)", color: "#f1f5f9", borderRadius: 1 },
                    "& .MuiFilledInput-root:hover": { bgcolor: "rgba(255,255,255,0.07)" },
                    "& .MuiFilledInput-root:before": { borderColor: "rgba(255,255,255,0.1)" },
                    "& .MuiInputLabel-root": { color: "#64748b" },
                    "& .MuiInputLabel-root.Mui-focused": { color: "#818cf8" },
                  }} />

                <TextField fullWidth multiline rows={5} label="Descrição Completa" variant="filled" size="small"
                  value={editFields.descricao}
                  onChange={e => setEditFields((p: any) => ({ ...p, descricao: e.target.value }))}
                  sx={{
                    "& .MuiFilledInput-root": { bgcolor: "rgba(255,255,255,0.04)", color: "#cbd5e1", borderRadius: 1 },
                    "& .MuiFilledInput-root:hover": { bgcolor: "rgba(255,255,255,0.07)" },
                    "& .MuiFilledInput-root:before": { borderColor: "rgba(255,255,255,0.1)" },
                    "& .MuiInputLabel-root": { color: "#64748b" },
                  }} />

                <TextField fullWidth multiline rows={3} label="Detalhes (resumo)" variant="filled" size="small"
                  value={editFields.detalhes}
                  onChange={e => setEditFields((p: any) => ({ ...p, detalhes: e.target.value }))}
                  sx={{
                    "& .MuiFilledInput-root": { bgcolor: "rgba(255,255,255,0.04)", color: "#cbd5e1", borderRadius: 1 },
                    "& .MuiFilledInput-root:hover": { bgcolor: "rgba(255,255,255,0.07)" },
                    "& .MuiFilledInput-root:before": { borderColor: "rgba(255,255,255,0.1)" },
                    "& .MuiInputLabel-root": { color: "#64748b" },
                  }} />

                <Box sx={{ bgcolor: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 1.5, p: 1.5 }}>
                  <Typography variant="caption" sx={{ color: "#818cf8", fontWeight: 700, display: "block", mb: 1 }}>
                    🤖 Script de Vendas (IA)
                  </Typography>
                  <TextField fullWidth multiline rows={7} variant="filled" size="small"
                    placeholder="Cole ou edite o script de vendas gerado pela IA..."
                    value={editFields.aiPromptVendas}
                    onChange={e => setEditFields((p: any) => ({ ...p, aiPromptVendas: e.target.value }))}
                    sx={{
                      "& .MuiFilledInput-root": { bgcolor: "rgba(99,102,241,0.08)", color: "#a5b4fc", fontStyle: "italic", fontSize: 13, borderRadius: 1 },
                      "& .MuiFilledInput-root:hover": { bgcolor: "rgba(99,102,241,0.12)" },
                      "& .MuiFilledInput-root:before": { borderColor: "rgba(99,102,241,0.3)" },
                    }} />
                </Box>

                {saveMsg && (
                  <Box sx={{
                    p: 1.5, borderRadius: 1,
                    bgcolor: saveMsg.startsWith("✅") ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                    border: saveMsg.startsWith("✅") ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(239,68,68,0.3)",
                  }}>
                    <Typography variant="body2" sx={{ color: saveMsg.startsWith("✅") ? "#4ade80" : "#f87171" }}>
                      {saveMsg}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* ── Coluna direita: mídias ── */}
              <Box sx={{ flex: "0 0 45%", p: 3, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
                <Box className="flex items-center justify-between">
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
                    🎬 Mídias Coletadas
                  </Typography>
                  <Chip size="small"
                    label={`${selectedColeta.linksMedia?.length || 0} arquivo(s)`}
                    sx={{ bgcolor: "rgba(255,255,255,0.06)", color: "#94a3b8", fontSize: 11 }} />
                </Box>

                {(!selectedColeta.linksMedia || selectedColeta.linksMedia.length === 0) ? (
                  <Box sx={{
                    flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    bgcolor: "rgba(239,68,68,0.05)", border: "1px dashed rgba(239,68,68,0.25)", borderRadius: 2, p: 4, textAlign: "center",
                  }}>
                    <Typography sx={{ fontSize: 32, mb: 1 }}>📭</Typography>
                    <Typography variant="body2" sx={{ color: "#f87171", fontWeight: 600 }}>Nenhuma mídia coletada</Typography>
                    <Typography variant="caption" sx={{ color: "#64748b", mt: 0.5 }}>Execute o scraping para baixar imagens e vídeos do produto</Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                    {sortedMedia(selectedColeta.linksMedia).map((media: any, idx: number) => (
                      <Box key={media.id} sx={{
                        position: "relative", borderRadius: 1.5, overflow: "hidden",
                        border: media.tipo === "VIDEO" ? "2px solid rgba(167,139,250,0.5)" : "1px solid rgba(255,255,255,0.1)",
                        bgcolor: "#000", aspectRatio: "1 / 1",
                      }}>
                        {media.tipo === "VIDEO"
                          ? <video src={media.urlMinio} controls style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <img src={media.urlMinio} alt="Media" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                        <Box sx={{ position: "absolute", top: 4, left: 4, display: "flex", gap: 0.5 }}>
                          <Chip size="small" label={`#${idx + 1}`} sx={{ height: 16, fontSize: 9, bgcolor: "rgba(0,0,0,0.75)", color: "white" }} />
                          <Chip size="small" label={media.tipo === "VIDEO" ? "🎬" : "🖼️"}
                            sx={{ height: 16, fontSize: 9, bgcolor: media.tipo === "VIDEO" ? "rgba(167,139,250,0.8)" : "rgba(0,0,0,0.75)", color: "white" }} />
                        </Box>
                        <IconButton size="small" href={media.urlMinio} target="_blank"
                          sx={{ position: "absolute", bottom: 4, right: 4, bgcolor: "rgba(0,0,0,0.7)", color: "white", p: 0.4, "&:hover": { bgcolor: "rgba(99,102,241,0.8)" } }}>
                          <OpenInNewIcon sx={{ fontSize: 13 }} />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid rgba(255,255,255,0.08)", gap: 1.5 }}>
          <Button onClick={() => setIsModalOpen(false)} sx={{ color: "#64748b", "&:hover": { color: "#94a3b8" } }}>
            Fechar
          </Button>
          <Button variant="contained" onClick={handleSaveEdit} disabled={isSaving}
            startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
            sx={{ bgcolor: "#6366f1", "&:hover": { bgcolor: "#4f46e5" }, px: 3 }}>
            {isSaving ? "Salvando…" : "Salvar Alterações"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Modal Criar Vídeo TikTok ── */}
      <Dialog open={videoModalOpen} onClose={() => !isGenerating && setVideoModalOpen(false)} maxWidth="sm" fullWidth
        sx={{ "& .MuiDialog-paper": { bgcolor: "#0f172a", borderColor: "rgba(124,58,237,0.3)", color: "#e2e8f0", borderWidth: 1, borderStyle: "solid" } }}>
        <DialogTitle className="border-b border-white/10 flex items-center gap-2">
          <MovieIcon sx={{ color: "#7c3aed" }} />
          <span>Criar Vídeo TikTok</span>
          {videoColeta && <span className="text-sm text-slate-400 ml-2 truncate">{videoColeta.titulo}</span>}
        </DialogTitle>

        <DialogContent className="pt-6 space-y-5">
          {/* Preview das mídias do produto */}
          {videoColeta && (
            <div>
              <Typography variant="caption" className="text-slate-400 mb-2 block">
                📦 {videoColeta.linksMedia?.length || 0} mídias do produto (vídeos → imagens)
              </Typography>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {sortedMedia(videoColeta.linksMedia).slice(0, 6).map((m: any, i: number) => (
                  <div key={m.id} className="relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border border-white/10 bg-black">
                    {m.tipo === "VIDEO"
                      ? <video src={m.urlMinio} className="w-full h-full object-cover" muted />
                      : <img src={m.urlMinio} alt="" className="w-full h-full object-cover" />}
                    <div className="absolute top-0.5 left-0.5">
                      <Chip size="small" label={m.tipo === "VIDEO" ? "🎬" : "🖼"} sx={{ height: 16, fontSize: 9, bgcolor: "rgba(0,0,0,0.7)" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload do vídeo de reação */}
          <div>
            <Typography variant="subtitle2" className="text-violet-300 font-semibold mb-3">
              🎙️ Seu vídeo de reação (PiP — canto inferior direito)
            </Typography>
            <Typography variant="caption" className="text-slate-500 block mb-3">
              O áudio deste vídeo será o único áudio do resultado final. O vídeo do produto ficará mudo.
            </Typography>

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleReactionFileChange}
            />

            {!reactionPreview ? (
              <Box
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  border: "2px dashed rgba(124,58,237,0.4)",
                  borderRadius: 2,
                  p: 4,
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  "&:hover": { borderColor: "rgba(124,58,237,0.8)", bgcolor: "rgba(124,58,237,0.05)" },
                }}
              >
                <CloudUploadIcon sx={{ fontSize: 40, color: "#7c3aed", mb: 1 }} />
                <Typography variant="body2" className="text-slate-300">Clique para selecionar o vídeo de reação</Typography>
                <Typography variant="caption" className="text-slate-500">MP4, MOV, WebM — qualquer tamanho</Typography>
              </Box>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-violet-500/30 bg-black">
                <video src={reactionPreview} controls className="w-full max-h-48 object-contain" />
                <div className="absolute top-2 right-2">
                  <Button size="small" variant="outlined"
                    sx={{ borderColor: "rgba(255,255,255,0.3)", color: "white", fontSize: 11 }}
                    onClick={() => { setReactionFile(null); setReactionPreview(null); setGeneratedUrl(null); }}>
                    Trocar
                  </Button>
                </div>
                <div className="absolute bottom-2 left-2">
                  <Chip size="small" label="Áudio ativo ✓" color="success" />
                </div>
              </div>
            )}
          </div>

          {/* Layout info */}
          <Box sx={{ bgcolor: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 2, p: 2 }}>
            <Typography variant="caption" className="text-violet-300 block font-semibold mb-1">📐 Layout do vídeo gerado</Typography>
            <Typography variant="caption" className="text-slate-400">
              • Formato: TikTok 9:16 (1080×1920) &nbsp;|&nbsp; 30 fps<br />
              • Fundo: mídias do produto (vídeo → imagens, <strong className="text-white">sem áudio</strong>)<br />
              • PiP: seu vídeo de reação no <strong className="text-violet-300">canto inferior direito</strong> (~30% do tamanho)<br />
              • Áudio: <strong className="text-green-400">somente do vídeo de reação</strong>
            </Typography>
          </Box>

          {/* Erros */}
          {generateError && (
            <Box sx={{ bgcolor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 2, p: 2 }}>
              <Typography variant="caption" className="text-red-400">❌ {generateError}</Typography>
            </Box>
          )}

          {/* Vídeo gerado */}
          {generatedUrl && !isGenerating && (
            <Box sx={{ bgcolor: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 2, p: 2 }}>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircleIcon sx={{ color: "#22c55e", fontSize: 20 }} />
                <Typography variant="body2" className="text-green-400 font-semibold">Vídeo gerado com sucesso!</Typography>
              </div>
              <Button
                variant="contained" size="small" href={generatedUrl} target="_blank"
                startIcon={<OpenInNewIcon />}
                sx={{ bgcolor: "#22c55e", "&:hover": { bgcolor: "#16a34a" } }}>
                Assistir vídeo
              </Button>
            </Box>
          )}

          {/* Progresso */}
          {isGenerating && (
            <Box>
              <Typography variant="caption" className="text-violet-300 block mb-2">
                🎬 Gerando vídeo… isso pode levar alguns minutos.
              </Typography>
              <LinearProgress sx={{ borderRadius: 1, "& .MuiLinearProgress-bar": { bgcolor: "#7c3aed" } }} />
            </Box>
          )}
        </DialogContent>

        <DialogActions className="border-t border-white/10 p-4 gap-2">
          <Button onClick={() => setVideoModalOpen(false)} disabled={isGenerating} className="text-slate-400 hover:text-white">
            Fechar
          </Button>
          <Button
            variant="contained" disabled={!reactionFile || isGenerating}
            onClick={handleGenerateVideo}
            startIcon={isGenerating ? <CircularProgress size={18} color="inherit" /> : <MovieIcon />}
            sx={{ bgcolor: "#7c3aed", "&:hover": { bgcolor: "#6d28d9" }, "&:disabled": { bgcolor: "rgba(124,58,237,0.3)" } }}>
            {isGenerating ? "Gerando…" : "Criar Vídeo TikTok"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
