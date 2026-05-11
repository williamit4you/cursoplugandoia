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

export default function ColetaShopeePage() {
  const [coletas, setColetas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal de detalhes
  const [selectedColeta, setSelectedColeta] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    setIsModalOpen(true);
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── Modal Detalhes ── */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="md" fullWidth
        sx={{ "& .MuiDialog-paper": { bgcolor: "#0f172a", borderColor: "rgba(255,255,255,0.1)", color: "#e2e8f0", borderWidth: 1, borderStyle: "solid" } }}>
        <DialogTitle className="border-b border-white/10">Detalhes do Produto</DialogTitle>
        <DialogContent className="pt-6 space-y-4">
          {selectedColeta && (
            <>
              <Typography variant="h6" className="font-bold text-indigo-400">{selectedColeta.titulo}</Typography>
              <Typography variant="body2" className="text-slate-400 whitespace-pre-wrap">{selectedColeta.detalhes}</Typography>
              {selectedColeta.aiPromptVendas && (
                <div className="mt-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                  <Typography variant="subtitle2" className="text-indigo-300 font-bold mb-2">🤖 Script de Vendas (AI)</Typography>
                  <Typography variant="body2" className="text-slate-300 whitespace-pre-wrap italic">&quot;{selectedColeta.aiPromptVendas}&quot;</Typography>
                </div>
              )}
              <div className="mt-6">
                <Typography variant="subtitle1" className="font-bold text-slate-200 mb-4">Mídias Coletadas (ordem TikTok: vídeo → imagens)</Typography>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {sortedMedia(selectedColeta.linksMedia).map((media: any, idx: number) => (
                    <div key={media.id} className="relative rounded-lg overflow-hidden border border-white/10 bg-black aspect-square flex items-center justify-center">
                      {media.tipo === "VIDEO"
                        ? <video src={media.urlMinio} controls className="w-full h-full object-cover" />
                        : <img src={media.urlMinio} alt="Media" className="w-full h-full object-cover" />}
                      <div className="absolute top-2 left-2 flex gap-1">
                        <Chip size="small" label={`#${idx + 1}`} className="bg-black/60 text-white text-xs" />
                        <Chip size="small" label={media.tipo} color={media.tipo === "VIDEO" ? "secondary" : "default"} className="bg-black/50 backdrop-blur-sm" />
                      </div>
                    </div>
                  ))}
                  {(!selectedColeta.linksMedia || selectedColeta.linksMedia.length === 0) && (
                    <Typography variant="body2" className="text-slate-500 col-span-full">Nenhuma mídia disponível.</Typography>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
        <DialogActions className="border-t border-white/10 p-4">
          <Button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">Fechar</Button>
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
