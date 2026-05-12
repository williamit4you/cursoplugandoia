"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import MovieIcon from "@mui/icons-material/Movie";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RefreshIcon from "@mui/icons-material/Refresh";

type MediaItem = {
  id: string;
  tipo: "VIDEO" | "IMAGE" | string;
  urlMinio: string;
};

type ColetaItem = {
  id: string;
  url: string;
  titulo?: string | null;
  descricao?: string | null;
  detalhes?: string | null;
  aiPromptVendas?: string | null;
  status: string;
  errorMessage?: string | null;
  videoFinalUrl?: string | null;
  videoStatus?: string | null;
  linksMedia?: MediaItem[];
};

export default function ColetaShopeePage() {
  const [coletas, setColetas] = useState<ColetaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedColeta, setSelectedColeta] = useState<ColetaItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editFields, setEditFields] = useState({
    titulo: "",
    descricao: "",
    detalhes: "",
    aiPromptVendas: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoColeta, setVideoColeta] = useState<ColetaItem | null>(null);
  const [reactionFile, setReactionFile] = useState<File | null>(null);
  const [reactionPreview, setReactionPreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [pipFraction, setPipFraction] = useState("0.30");
  const [pipMargin, setPipMargin] = useState("30");
  const [pipRadius, setPipRadius] = useState("20");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadColetas = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/coleta-shopee");
      if (res.ok) {
        setColetas(await res.json());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadColetas();
  }, []);

  const handleAddUrl = async () => {
    if (!url) return;
    try {
      setIsSubmitting(true);
      const res = await fetch("/api/coleta-shopee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao cadastrar URL");
      }

      setUrl("");
      await loadColetas();
    } catch (error: any) {
      alert(error.message || "Erro ao adicionar URL");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScrape = async (id: string) => {
    try {
      setColetas((prev) => prev.map((item) => (item.id === id ? { ...item, status: "SCRAPING" } : item)));
      const res = await fetch(`/api/coleta-shopee/${id}/scrape`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro no scraping");
      }
      await loadColetas();
    } catch (error: any) {
      alert(error.message || "Erro ao executar scraping");
      await loadColetas();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta coleta?")) return;
    try {
      await fetch(`/api/coleta-shopee/${id}`, { method: "DELETE" });
      await loadColetas();
    } catch (error) {
      console.error(error);
    }
  };

  const handleViewDetails = (coleta: ColetaItem) => {
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

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao salvar");
      }

      setSaveMsg("Salvo com sucesso.");
      await loadColetas();
    } catch (error: any) {
      setSaveMsg(error.message || "Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  const openVideoModal = (coleta: ColetaItem) => {
    setVideoColeta(coleta);
    setReactionFile(null);
    setReactionPreview(null);
    setGenerateError(null);
    setGeneratedUrl(coleta.videoFinalUrl || null);
    setPipFraction("0.30");
    setPipMargin("30");
    setPipRadius("20");
    setVideoModalOpen(true);
  };

  const handleReactionFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setReactionFile(file);
    setGenerateError(null);
    setGeneratedUrl(null);
    setReactionPreview(URL.createObjectURL(file));
  };

  const handleGenerateVideo = async () => {
    if (!reactionFile || !videoColeta) return;
    setIsGenerating(true);
    setGenerateError(null);
    setGeneratedUrl(null);

    try {
      const form = new FormData();
      form.append("reaction_video", reactionFile, reactionFile.name);
      form.append("pip_fraction", pipFraction);
      form.append("pip_margin", pipMargin);
      form.append("pip_radius", pipRadius);

      const res = await fetch(`/api/coleta-shopee/${videoColeta.id}/criar-video`, {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao gerar video.");

      setGeneratedUrl(data.videoUrl);
      await loadColetas();
    } catch (error: any) {
      setGenerateError(error.message || "Falha ao gerar video.");
    } finally {
      setIsGenerating(false);
    }
  };

  const sortedMedia = (media: MediaItem[] = []) =>
    [...media].sort((a, b) => {
      if (a.tipo === "VIDEO" && b.tipo !== "VIDEO") return -1;
      if (a.tipo !== "VIDEO" && b.tipo === "VIDEO") return 1;
      return 0;
    });

  const firstProductMedia = videoColeta ? sortedMedia(videoColeta.linksMedia)[0] : null;

  const videoStatusColor = (status?: string) =>
    status === "COMPLETED" ? "success" : status === "RENDERING" ? "warning" : status === "FAILED" ? "error" : "default";

  return (
    <Box className="space-y-6">
      <Box className="flex justify-between items-center">
        <Typography variant="h4" className="font-bold text-slate-100">
          Coleta Shopee
        </Typography>
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<RefreshIcon />}
          onClick={loadColetas}
          className="border-white/10 hover:bg-white/5"
        >
          Atualizar
        </Button>
      </Box>

      <Card className="bg-white/5 border border-white/10 backdrop-blur-md">
        <CardContent className="flex flex-col gap-3">
          <Typography variant="subtitle1" className="font-semibold text-slate-200">
            1. Insira o Link do Produto
          </Typography>
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
            <TextField
              fullWidth
              size="medium"
              variant="outlined"
              placeholder="Cole a URL do produto da Shopee aqui"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isSubmitting}
              sx={{
                bgcolor: "rgba(0,0,0,0.2)",
                borderRadius: 1,
                input: { color: "#f1f5f9" },
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                  "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                  "&.Mui-focused fieldset": { borderColor: "#6366f1" },
                },
              }}
            />
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
              onClick={handleAddUrl}
              disabled={!url || isSubmitting}
              sx={{ minWidth: 200 }}
              className="bg-indigo-600 hover:bg-indigo-700 whitespace-nowrap h-[56px] shadow-lg"
            >
              Cadastrar Produto
            </Button>
          </div>
        </CardContent>
      </Card>

      <TableContainer component={Paper} className="bg-white/5 border border-white/10 backdrop-blur-md">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell className="text-slate-400 font-semibold border-white/10">URL / Titulo</TableCell>
              <TableCell className="text-slate-400 font-semibold border-white/10">Status</TableCell>
              <TableCell className="text-slate-400 font-semibold border-white/10">Midias</TableCell>
              <TableCell className="text-slate-400 font-semibold border-white/10">Video TikTok</TableCell>
              <TableCell className="text-slate-400 font-semibold border-white/10 text-right">Acoes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && coletas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 border-white/10">
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : coletas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-400 border-white/10">
                  Nenhuma URL cadastrada.
                </TableCell>
              </TableRow>
            ) : (
              coletas.map((coleta) => (
                <TableRow key={coleta.id} className="hover:bg-white/5 transition-colors">
                  <TableCell className="border-white/10 text-slate-200">
                    <div className="flex flex-col gap-1">
                      {coleta.titulo && (
                        <span
                          className="font-semibold text-indigo-400 cursor-pointer"
                          onClick={() => handleViewDetails(coleta)}
                        >
                          {coleta.titulo}
                        </span>
                      )}
                      <a
                        href={coleta.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-slate-500 hover:underline max-w-md truncate"
                      >
                        {coleta.url}
                      </a>
                    </div>
                  </TableCell>
                  <TableCell className="border-white/10">
                    <Chip
                      size="small"
                      label={coleta.status}
                      variant="outlined"
                      color={
                        coleta.status === "COMPLETED"
                          ? "success"
                          : coleta.status === "SCRAPING"
                            ? "warning"
                            : coleta.status === "FAILED"
                              ? "error"
                              : "default"
                      }
                    />
                    {coleta.errorMessage && (
                      <p className="text-xs text-red-400 mt-1 max-w-xs truncate" title={coleta.errorMessage}>
                        {coleta.errorMessage}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="border-white/10 text-slate-300">
                    {coleta.linksMedia?.length || 0} midias
                  </TableCell>
                  <TableCell className="border-white/10">
                    {coleta.videoStatus && (
                      <Chip
                        size="small"
                        label={coleta.videoStatus}
                        variant="outlined"
                        color={videoStatusColor(coleta.videoStatus)}
                      />
                    )}
                    {coleta.videoFinalUrl && (
                      <Tooltip title="Assistir video gerado">
                        <IconButton size="small" href={coleta.videoFinalUrl} target="_blank" className="text-green-400 ml-1">
                          <OpenInNewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell className="border-white/10 text-right">
                    <div className="flex gap-2 justify-end">
                      <Tooltip title="Ver / Editar dados coletados">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(coleta)}
                          className="text-indigo-400 hover:bg-indigo-400/10"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        className="bg-indigo-600 hover:bg-indigo-700"
                        startIcon={coleta.status === "SCRAPING" ? <CircularProgress size={14} color="inherit" /> : <PlayArrowIcon />}
                        onClick={() => handleScrape(coleta.id)}
                        disabled={coleta.status === "SCRAPING"}
                      >
                        Scraping
                      </Button>
                      {coleta.status === "COMPLETED" && (
                        <Tooltip title="Criar Video TikTok">
                          <Button
                            size="small"
                            variant="contained"
                            sx={{ bgcolor: "#7c3aed", "&:hover": { bgcolor: "#6d28d9" } }}
                            startIcon={<MovieIcon />}
                            onClick={() => openVideoModal(coleta)}
                          >
                            Video
                          </Button>
                        </Tooltip>
                      )}
                      <IconButton size="small" onClick={() => handleDelete(coleta.id)} className="text-red-400 hover:bg-red-400/10">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="xl"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: "#0d1526",
              border: "1px solid rgba(99,102,241,0.25)",
              color: "#e2e8f0",
              borderRadius: 2,
              maxHeight: "90vh",
            },
          },
        }}
      >
        <Box sx={{ px: 3, py: 2, borderBottom: "1px solid rgba(255,255,255,0.08)", bgcolor: "rgba(99,102,241,0.06)" }}>
          <Box className="flex items-center gap-2 mb-1">
            <EditIcon sx={{ color: "#818cf8", fontSize: 18 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#e2e8f0" }}>
              Dados Coletados - Editar
            </Typography>
            {selectedColeta && (
              <Chip
                size="small"
                label={selectedColeta.status}
                variant="outlined"
                color={selectedColeta.status === "COMPLETED" ? "success" : selectedColeta.status === "FAILED" ? "error" : "default"}
                sx={{ ml: "auto", fontSize: 11 }}
              />
            )}
          </Box>
          {selectedColeta && (
            <Typography
              variant="caption"
              sx={{ color: "#64748b", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              {selectedColeta.url}
            </Typography>
          )}
        </Box>

        <DialogContent sx={{ p: 0, overflow: "hidden" }}>
          {selectedColeta && (
            <div style={{ display: "flex", flexDirection: "row", height: "100%", minHeight: 480 }}>
              <Box
                sx={{
                  flex: "0 0 55%",
                  p: 3,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  borderRight: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <TextField
                  fullWidth
                  label="Titulo do Produto"
                  variant="filled"
                  size="small"
                  value={editFields.titulo}
                  onChange={(e) => setEditFields((prev) => ({ ...prev, titulo: e.target.value }))}
                />
                <TextField
                  fullWidth
                  multiline
                  rows={5}
                  label="Descricao Completa"
                  variant="filled"
                  size="small"
                  value={editFields.descricao}
                  onChange={(e) => setEditFields((prev) => ({ ...prev, descricao: e.target.value }))}
                />
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Detalhes do Produto"
                  variant="filled"
                  size="small"
                  value={editFields.detalhes}
                  onChange={(e) => setEditFields((prev) => ({ ...prev, detalhes: e.target.value }))}
                />
                <TextField
                  fullWidth
                  multiline
                  rows={7}
                  label="Script de Vendas (IA)"
                  variant="filled"
                  size="small"
                  value={editFields.aiPromptVendas}
                  onChange={(e) => setEditFields((prev) => ({ ...prev, aiPromptVendas: e.target.value }))}
                />
                {saveMsg && (
                  <Typography variant="body2" sx={{ color: saveMsg.includes("sucesso") ? "#4ade80" : "#f87171" }}>
                    {saveMsg}
                  </Typography>
                )}
              </Box>

              <Box sx={{ flex: "0 0 45%", p: 3, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
                <Box className="flex items-center justify-between">
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
                    Midias Coletadas
                  </Typography>
                  <Chip
                    size="small"
                    label={`${selectedColeta.linksMedia?.length || 0} arquivo(s)`}
                    sx={{ bgcolor: "rgba(255,255,255,0.06)", color: "#94a3b8", fontSize: 11 }}
                  />
                </Box>

                {!selectedColeta.linksMedia?.length ? (
                  <Box
                    sx={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "rgba(239,68,68,0.05)",
                      border: "1px dashed rgba(239,68,68,0.25)",
                      borderRadius: 2,
                      p: 4,
                      textAlign: "center",
                    }}
                  >
                    <Typography variant="body2" sx={{ color: "#f87171", fontWeight: 600 }}>
                      Nenhuma midia coletada
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                    {sortedMedia(selectedColeta.linksMedia).map((media, index) => (
                      <Box
                        key={media.id}
                        sx={{
                          position: "relative",
                          borderRadius: 1.5,
                          overflow: "hidden",
                          border: media.tipo === "VIDEO" ? "2px solid rgba(167,139,250,0.5)" : "1px solid rgba(255,255,255,0.1)",
                          bgcolor: "#000",
                          aspectRatio: "1 / 1",
                        }}
                      >
                        {media.tipo === "VIDEO" ? (
                          <video src={media.urlMinio} controls style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <img src={media.urlMinio} alt={`Midia ${index + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        )}
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </div>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid rgba(255,255,255,0.08)", gap: 1.5 }}>
          <Button onClick={() => setIsModalOpen(false)} sx={{ color: "#64748b", "&:hover": { color: "#94a3b8" } }}>
            Fechar
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveEdit}
            disabled={isSaving}
            startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
            sx={{ bgcolor: "#6366f1", "&:hover": { bgcolor: "#4f46e5" }, px: 3 }}
          >
            {isSaving ? "Salvando..." : "Salvar Alteracoes"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={videoModalOpen}
        onClose={() => !isGenerating && setVideoModalOpen(false)}
        maxWidth="sm"
        fullWidth
        sx={{ "& .MuiDialog-paper": { bgcolor: "#0f172a", borderColor: "rgba(124,58,237,0.3)", color: "#e2e8f0", borderWidth: 1, borderStyle: "solid" } }}
      >
        <DialogTitle className="border-b border-white/10 flex items-center gap-2">
          <MovieIcon sx={{ color: "#7c3aed" }} />
          <span>Criar Video TikTok</span>
          {videoColeta && <span className="text-sm text-slate-400 ml-2 truncate">{videoColeta.titulo}</span>}
        </DialogTitle>

        <DialogContent className="pt-6 space-y-5">
          {videoColeta && (
            <div>
              <Typography variant="caption" className="text-slate-400 mb-2 block">
                {videoColeta.linksMedia?.length || 0} midias do produto
              </Typography>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {sortedMedia(videoColeta.linksMedia).slice(0, 6).map((media) => (
                  <div key={media.id} className="relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border border-white/10 bg-black">
                    {media.tipo === "VIDEO" ? (
                      <video src={media.urlMinio} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={media.urlMinio} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Box
            sx={{
              border: "1px solid rgba(124,58,237,0.22)",
              borderRadius: 2,
              p: 2,
              bgcolor: "rgba(124,58,237,0.06)",
            }}
          >
            <Typography variant="subtitle2" className="text-violet-300 font-semibold mb-2">
              Ordem da composicao
            </Typography>
            <Typography variant="body2" className="text-slate-300">
              1. O video/imagens do produto ficam no fundo.
            </Typography>
            <Typography variant="body2" className="text-slate-300">
              2. O seu video fica por cima, no canto inferior direito.
            </Typography>
            <Typography variant="body2" className="text-slate-300">
              3. O audio final vem do seu video de reacao.
            </Typography>
          </Box>

          <div>
            <Typography variant="subtitle2" className="text-violet-300 font-semibold mb-3">
              Seu video de reacao
            </Typography>
            <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleReactionFileChange} />

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
                <Typography variant="body2" className="text-slate-300">
                  Clique para selecionar o video de reacao
                </Typography>
              </Box>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-violet-500/30 bg-black">
                <video src={reactionPreview} controls className="w-full max-h-48 object-contain" />
                <div className="absolute top-2 right-2">
                  <Button
                    size="small"
                    variant="outlined"
                    sx={{ borderColor: "rgba(255,255,255,0.3)", color: "white", fontSize: 11 }}
                    onClick={() => {
                      setReactionFile(null);
                      setReactionPreview(null);
                      setGeneratedUrl(null);
                    }}
                  >
                    Trocar
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Box className="space-y-3">
            <Typography variant="subtitle2" className="text-violet-300 font-semibold">
              Posicionamento do seu video
            </Typography>

            <Box
              sx={{
                position: "relative",
                height: 220,
                borderRadius: 2,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.1)",
                bgcolor: "#020617",
              }}
            >
              {firstProductMedia?.tipo === "VIDEO" ? (
                <video src={firstProductMedia.urlMinio} className="w-full h-full object-cover opacity-70" muted />
              ) : firstProductMedia ? (
                <img src={firstProductMedia.urlMinio} alt="" className="w-full h-full object-cover opacity-70" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
                  Fundo do produto
                </div>
              )}

              <Box
                sx={{
                  position: "absolute",
                  right: 16,
                  bottom: 16,
                  width: 82,
                  height: 82,
                  borderRadius: `${Number(pipRadius) || 20}px`,
                  overflow: "hidden",
                  border: "2px solid rgba(255,255,255,0.85)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
                  bgcolor: "#111827",
                }}
              >
                {reactionPreview ? (
                  <video src={reactionPreview} className="w-full h-full object-cover" muted />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-300 text-center px-2">
                    Seu video aqui
                  </div>
                )}
              </Box>
            </Box>

            <div className="grid grid-cols-3 gap-3">
              <TextField
                fullWidth
                size="small"
                label="Tamanho"
                value={pipFraction}
                onChange={(e) => setPipFraction(e.target.value)}
                helperText="0.30 = 30%"
              />
              <TextField
                fullWidth
                size="small"
                label="Margem"
                value={pipMargin}
                onChange={(e) => setPipMargin(e.target.value)}
                helperText="px"
              />
              <TextField
                fullWidth
                size="small"
                label="Borda arred."
                value={pipRadius}
                onChange={(e) => setPipRadius(e.target.value)}
                helperText="px"
              />
            </div>
          </Box>

          {generateError && (
            <Box sx={{ bgcolor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 2, p: 2 }}>
              <Typography variant="caption" className="text-red-400">
                {generateError}
              </Typography>
            </Box>
          )}

          {generatedUrl && !isGenerating && (
            <Box sx={{ bgcolor: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 2, p: 2 }}>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircleIcon sx={{ color: "#22c55e", fontSize: 20 }} />
                <Typography variant="body2" className="text-green-400 font-semibold">
                  Video gerado com sucesso
                </Typography>
              </div>
              <Button
                variant="contained"
                size="small"
                href={generatedUrl}
                target="_blank"
                startIcon={<OpenInNewIcon />}
                sx={{ bgcolor: "#22c55e", "&:hover": { bgcolor: "#16a34a" } }}
              >
                Assistir video
              </Button>
            </Box>
          )}

          {isGenerating && (
            <Box>
              <Typography variant="caption" className="text-violet-300 block mb-2">
                Gerando video...
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
            variant="contained"
            disabled={!reactionFile || isGenerating}
            onClick={handleGenerateVideo}
            startIcon={isGenerating ? <CircularProgress size={18} color="inherit" /> : <MovieIcon />}
            sx={{ bgcolor: "#7c3aed", "&:hover": { bgcolor: "#6d28d9" }, "&:disabled": { bgcolor: "rgba(124,58,237,0.3)" } }}
          >
            {isGenerating ? "Gerando..." : "Criar Video TikTok"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
