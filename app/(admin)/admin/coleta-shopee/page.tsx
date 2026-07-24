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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
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
  const [selectedPersonaId, setSelectedPersonaId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [personas, setPersonas] = useState<{ id: string; name: string }[]>([]);

  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualFields, setManualFields] = useState({ titulo: "", url: "", descricao: "", creatorPersonaId: "" });
  const [manualVideoFile, setManualVideoFile] = useState<File | null>(null);
  const [isManualSubmitting, setIsManualSubmitting] = useState(false);
  const manualFileInputRef = useRef<HTMLInputElement>(null);

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
  const [videoMsg, setVideoMsg] = useState<string | null>(null);
  const [pipFraction, setPipFraction] = useState("0.30");
  const [pipMargin, setPipMargin] = useState("30");
  const [pipRadius, setPipRadius] = useState("20");
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadColetas = async () => {
    try {
      setLoading(true);
      const [coletasRes, personasRes] = await Promise.all([
        fetch("/api/coleta-shopee"),
        fetch("/api/creator-personas"),
      ]);
      if (coletasRes.ok) {
        setColetas(await coletasRes.json());
      }
      if (personasRes.ok) {
        setPersonas(await personasRes.json());
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

  useEffect(() => {
    const hasRunningJobs = coletas.some((item) => item.status === "SCRAPING" || item.videoStatus === "RENDERING");
    if (!hasRunningJobs) return;

    const intervalId = window.setInterval(() => {
      loadColetas();
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [coletas]);

  useEffect(() => {
    if (!selectedColeta) return;
    const fresh = coletas.find((item) => item.id === selectedColeta.id);
    if (!fresh) return;
    setSelectedColeta(fresh);
    setEditFields((prev) => ({
      titulo: fresh.titulo ?? prev.titulo,
      descricao: fresh.descricao ?? prev.descricao,
      detalhes: fresh.detalhes ?? prev.detalhes,
      aiPromptVendas: fresh.aiPromptVendas ?? prev.aiPromptVendas,
    }));
  }, [coletas, selectedColeta]);

  useEffect(() => {
    if (!selectedColeta?.linksMedia?.length) {
      setSelectedMediaId(null);
      return;
    }
    const preferred = sortedMedia(selectedColeta.linksMedia)[0];
    setSelectedMediaId((prev) =>
      prev && selectedColeta.linksMedia?.some((item) => item.id === prev) ? prev : preferred?.id || null
    );
  }, [selectedColeta]);

  const handleManualSubmit = async () => {
    if (!manualFields.url || !manualFields.titulo || !manualVideoFile) {
      alert("URL, Titulo e Video sao obrigatorios.");
      return;
    }
    try {
      setIsManualSubmitting(true);
      const form = new FormData();
      form.append("url", manualFields.url);
      form.append("titulo", manualFields.titulo);
      form.append("descricao", manualFields.descricao);
      if (manualFields.creatorPersonaId) {
        form.append("creatorPersonaId", manualFields.creatorPersonaId);
      }
      form.append("video", manualVideoFile, manualVideoFile.name);

      const res = await fetch("/api/coleta-shopee/manual", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro no envio manual");
      }

      setManualFields({ titulo: "", url: "", descricao: "", creatorPersonaId: "" });
      setManualVideoFile(null);
      setIsManualModalOpen(false);
      await loadColetas();
    } catch (error: any) {
      alert(error.message || "Erro ao adicionar manualmente.");
    } finally {
      setIsManualSubmitting(false);
    }
  };

  const handleAddUrl = async () => {
    if (!url) return;
    try {
      setIsSubmitting(true);
      const res = await fetch("/api/coleta-shopee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, creatorPersonaId: selectedPersonaId }),
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
    const preferredMedia = sortedMedia(coleta.linksMedia)[0];
    setSelectedColeta(coleta);
    setSelectedMediaId(preferredMedia?.id || null);
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
    setVideoMsg(null);
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
    setVideoMsg(null);

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
      setVideoMsg("Geracao iniciada em segundo plano. Voce pode fechar esta janela.");
      setVideoColeta((prev) => (prev ? { ...prev, videoStatus: "RENDERING" } : prev));
      await loadColetas();
      window.setTimeout(() => setVideoModalOpen(false), 700);
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
  const selectedVideoMedia = selectedColeta?.linksMedia ? sortedMedia(selectedColeta.linksMedia).find((item) => item.tipo === "VIDEO") || null : null;
  const sortedSelectedMedia = selectedColeta ? sortedMedia(selectedColeta.linksMedia) : [];
  const selectedPreviewMedia =
    sortedSelectedMedia.find((item) => item.id === selectedMediaId) ||
    sortedSelectedMedia[0] ||
    null;
  const imageCount = selectedColeta?.linksMedia?.filter((item) => item.tipo === "IMAGE").length || 0;
  const videoCount = selectedColeta?.linksMedia?.filter((item) => item.tipo === "VIDEO").length || 0;

  const videoStatusColor = (status?: string | null) =>
    status === "COMPLETED" ? "success" : status === "RENDERING" ? "warning" : status === "FAILED" ? "error" : "default";

  const fieldSx = {
    "& .MuiFormHelperText-root": {
      color: "rgba(148,163,184,0.92)",
      ml: 0,
      mt: 0.75,
    },
    "& .MuiInputBase-root": {
      backgroundColor: "rgba(15,23,42,0.92)",
      color: "#e2e8f0",
    },
    "& .MuiFilledInput-root": {
      backgroundColor: "rgba(15,23,42,0.92)",
      border: "1px solid rgba(148,163,184,0.18)",
      borderRadius: "14px",
      overflow: "hidden",
      "&:before, &:after": {
        display: "none",
      },
      "&:hover": {
        backgroundColor: "rgba(15,23,42,0.96)",
      },
      "&.Mui-focused": {
        backgroundColor: "rgba(15,23,42,0.98)",
        borderColor: "rgba(129,140,248,0.55)",
        boxShadow: "0 0 0 3px rgba(99,102,241,0.12)",
      },
    },
    "& .MuiInputBase-input": {
      color: "#f8fafc !important",
      WebkitTextFillColor: "#f8fafc",
      fontWeight: 500,
    },
    "& .MuiInputBase-inputMultiline": {
      color: "#f8fafc !important",
      WebkitTextFillColor: "#f8fafc",
      lineHeight: 1.55,
    },
    "& .MuiInputBase-input::placeholder": {
      color: "rgba(148,163,184,0.95)",
      opacity: 1,
    },
    "& textarea::placeholder": {
      color: "rgba(148,163,184,0.95)",
      opacity: 1,
    },
    "& .MuiInputLabel-root": { color: "#94a3b8" },
    "& .MuiInputLabel-root.Mui-focused": { color: "#a5b4fc" },
  };

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
            <FormControl sx={{ minWidth: 200 }} size="medium">
              <InputLabel id="persona-label-main" sx={{ color: "rgba(255,255,255,0.7)" }}>Vendedor (Opcional)</InputLabel>
              <Select
                labelId="persona-label-main"
                value={selectedPersonaId}
                label="Vendedor (Opcional)"
                onChange={(e) => setSelectedPersonaId(e.target.value)}
                sx={{
                  bgcolor: "rgba(0,0,0,0.2)",
                  color: "#f1f5f9",
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.2)" },
                  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.3)" },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#6366f1" },
                  "& .MuiSvgIcon-root": { color: "rgba(255,255,255,0.7)" },
                }}
              >
                <MenuItem value="">
                  <em>Aleatório / Padrão</em>
                </MenuItem>
                {personas.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
            <Button
              variant="outlined"
              size="large"
              onClick={() => setIsManualModalOpen(true)}
              sx={{ minWidth: 200, borderColor: "rgba(255,255,255,0.2)", color: "#e2e8f0" }}
              className="hover:bg-white/5 whitespace-nowrap h-[56px]"
            >
              Adicionar Manualmente
            </Button>
          </div>
        </CardContent>
      </Card>

      <TableContainer component={Paper} className="bg-white/5 border border-white/10 backdrop-blur-md" sx={{ overflowX: "auto" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell className="text-slate-400 font-semibold border-white/10">Acoes</TableCell>
              <TableCell className="text-slate-400 font-semibold border-white/10">URL / Titulo</TableCell>
              <TableCell className="text-slate-400 font-semibold border-white/10">Status</TableCell>
              <TableCell className="text-slate-400 font-semibold border-white/10">Midias</TableCell>
              <TableCell className="text-slate-400 font-semibold border-white/10">Video TikTok</TableCell>
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
                  <TableCell className="border-white/10">
                    <div className="flex flex-wrap gap-2 justify-start min-w-[220px]">
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
                        className="text-xs text-slate-500 hover:underline break-all"
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
                    <div className="flex items-center gap-2">
                      <span>{coleta.linksMedia?.length || 0} midias</span>
                      {!!coleta.linksMedia?.length && (
                        <Chip
                          size="small"
                          label={`${coleta.linksMedia.filter((item) => item.tipo === "VIDEO").length} video / ${coleta.linksMedia.filter((item) => item.tipo !== "VIDEO").length} imagens`}
                          sx={{ bgcolor: "rgba(255,255,255,0.06)", color: "#94a3b8", fontSize: 11 }}
                        />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="border-white/10">
                    <div className="flex items-center gap-2">
                      <Chip
                        size="small"
                        label={coleta.videoStatus || "PENDENTE"}
                        variant={coleta.videoFinalUrl ? "filled" : "outlined"}
                        color={videoStatusColor(coleta.videoStatus)}
                      />
                      {coleta.videoFinalUrl && (
                        <Tooltip title="Assistir video gerado">
                          <IconButton size="small" href={coleta.videoFinalUrl} target="_blank" className="text-green-400">
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
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
              bgcolor: "#08111f",
              border: "1px solid rgba(99,102,241,0.25)",
              color: "#e2e8f0",
              borderRadius: 3,
              maxHeight: "94vh",
              height: "94vh",
              overflow: "hidden",
              boxShadow: "0 24px 80px rgba(2,6,23,0.65)",
            },
          },
        }}
      >
        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            bgcolor: "linear-gradient(180deg, rgba(99,102,241,0.08), rgba(15,23,42,0.22))",
            background: "linear-gradient(180deg, rgba(99,102,241,0.10), rgba(8,17,31,0.92))",
          }}
        >
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

        <DialogContent
          sx={{
            p: 0,
            overflowY: "auto",
            overflowX: "hidden",
            bgcolor: "#08111f",
            flex: 1,
            "&::-webkit-scrollbar": {
              width: 12,
            },
            "&::-webkit-scrollbar-thumb": {
              background: "rgba(99,102,241,0.45)",
              borderRadius: 999,
              border: "3px solid rgba(8,17,31,1)",
            },
            "&::-webkit-scrollbar-track": {
              background: "rgba(15,23,42,0.6)",
            },
          }}
        >
          {selectedColeta && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1.08fr) minmax(380px, 0.92fr)",
                minHeight: "100%",
                alignItems: "start",
              }}
            >
              <Box
                sx={{
                  p: 3,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  borderRight: "1px solid rgba(255,255,255,0.07)",
                  minHeight: "100%",
                }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    gap: 1.5,
                  }}
                >
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
                    <Typography variant="caption" sx={{ color: "#94a3b8" }}>Status da coleta</Typography>
                    <Typography variant="body2" sx={{ color: "#e2e8f0", fontWeight: 700 }}>{selectedColeta.status}</Typography>
                  </Box>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.18)" }}>
                    <Typography variant="caption" sx={{ color: "#94a3b8" }}>Video TikTok</Typography>
                    <Typography variant="body2" sx={{ color: "#e2e8f0", fontWeight: 700 }}>{selectedColeta.videoStatus || "PENDENTE"}</Typography>
                  </Box>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <Typography variant="caption" sx={{ color: "#94a3b8" }}>Arquivos</Typography>
                    <Typography variant="body2" sx={{ color: "#e2e8f0", fontWeight: 700 }}>{selectedColeta.linksMedia?.length || 0}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 1.5 }}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <Typography variant="caption" sx={{ color: "#94a3b8" }}>Descricao</Typography>
                    <Typography variant="body2" sx={{ color: editFields.descricao ? "#e2e8f0" : "#f59e0b", fontWeight: 700 }}>
                      {editFields.descricao ? `${editFields.descricao.length} caracteres` : "Nao preenchida"}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <Typography variant="caption" sx={{ color: "#94a3b8" }}>Detalhes</Typography>
                    <Typography variant="body2" sx={{ color: editFields.detalhes ? "#e2e8f0" : "#f59e0b", fontWeight: 700 }}>
                      {editFields.detalhes ? `${editFields.detalhes.length} caracteres` : "Nao preenchidos"}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <Typography variant="caption" sx={{ color: "#94a3b8" }}>Script IA</Typography>
                    <Typography variant="body2" sx={{ color: editFields.aiPromptVendas ? "#e2e8f0" : "#f59e0b", fontWeight: 700 }}>
                      {editFields.aiPromptVendas ? `${editFields.aiPromptVendas.length} caracteres` : "Nao gerado"}
                    </Typography>
                  </Box>
                </Box>
                <TextField
                  fullWidth
                  label="Titulo do Produto"
                  variant="filled"
                  size="small"
                  value={editFields.titulo}
                  onChange={(e) => setEditFields((prev) => ({ ...prev, titulo: e.target.value }))}
                  sx={fieldSx}
                  helperText="Titulo principal salvo no banco"
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
                  sx={fieldSx}
                  placeholder="Descricao comercial ou texto principal do produto"
                  helperText={editFields.descricao ? "Texto principal usado para enriquecer o cadastro." : "Ainda nao veio descricao estruturada para este produto."}
                />
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Detalhes do Produto"
                  variant="filled"
                  size="small"
                  value={editFields.detalhes}
                  onChange={(e) => setEditFields((prev) => ({ ...prev, detalhes: e.target.value }))}
                  sx={fieldSx}
                  placeholder="Especificacoes, variacoes e atributos tecnicos"
                  helperText={editFields.detalhes ? "Detalhes tecnicos e atributos detectados." : "Ainda nao vieram detalhes estruturados para este produto."}
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
                  sx={fieldSx}
                  placeholder="Script de vendas gerado pela IA"
                  helperText={editFields.aiPromptVendas ? "Roteiro salvo e pronto para ajuste manual." : "A IA ainda nao retornou script para este item."}
                />
                {saveMsg && (
                  <Typography variant="body2" sx={{ color: saveMsg.includes("sucesso") ? "#4ade80" : "#f87171" }}>
                    {saveMsg}
                  </Typography>
                )}
              </Box>

              <Box
                sx={{
                  p: 3,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  minHeight: "100%",
                  bgcolor: "rgba(2,6,23,0.42)",
                }}
              >
                <Box
                  sx={{
                    borderRadius: 2,
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.08)",
                    bgcolor: "rgba(2,6,23,0.85)",
                  }}
                >
                  <Box sx={{ p: 1.5, borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <Typography variant="caption" sx={{ color: "#94a3b8", letterSpacing: 1, textTransform: "uppercase" }}>
                        Midia em destaque
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#e2e8f0", fontWeight: 700 }}>
                        {selectedPreviewMedia?.tipo === "VIDEO" ? "Video principal do produto" : "Imagem principal do produto"}
                      </Typography>
                    </div>
                    {selectedPreviewMedia && (
                      <Button
                        size="small"
                        variant="outlined"
                        href={selectedPreviewMedia.urlMinio}
                        target="_blank"
                        sx={{ borderColor: "rgba(255,255,255,0.14)", color: "#e2e8f0" }}
                      >
                        Abrir
                      </Button>
                    )}
                  </Box>
                    <Box sx={{ p: 1.5 }}>
                      <Box
                        sx={{
                          borderRadius: 2,
                          overflow: "hidden",
                          bgcolor: "#000",
                          aspectRatio: "16 / 11",
                          border: "1px solid rgba(255,255,255,0.08)",
                          boxShadow: "0 18px 45px rgba(0,0,0,0.35)",
                        }}
                      >
                      {selectedPreviewMedia ? (
                        selectedPreviewMedia.tipo === "VIDEO" ? (
                          <video src={selectedPreviewMedia.urlMinio} controls style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <img src={selectedPreviewMedia.urlMinio} alt="Midia principal" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        )
                      ) : (
                        <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
                          Nenhuma midia disponivel
                        </Box>
                      )}
                    </Box>
                    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 1.25, mt: 1.5 }}>
                      <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <Typography variant="caption" sx={{ color: "#94a3b8" }}>Total</Typography>
                        <Typography variant="body2" sx={{ color: "#e2e8f0", fontWeight: 700 }}>{selectedColeta.linksMedia?.length || 0} arquivos</Typography>
                      </Box>
                      <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <Typography variant="caption" sx={{ color: "#94a3b8" }}>Videos</Typography>
                        <Typography variant="body2" sx={{ color: "#e2e8f0", fontWeight: 700 }}>{videoCount}</Typography>
                      </Box>
                      <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <Typography variant="caption" sx={{ color: "#94a3b8" }}>Imagens</Typography>
                        <Typography variant="body2" sx={{ color: "#e2e8f0", fontWeight: 700 }}>{imageCount}</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>

                <Box
                  sx={{
                    borderRadius: 2,
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.08)",
                    bgcolor: "rgba(2,6,23,0.85)",
                  }}
                >
                  <Box sx={{ p: 1.5, borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <Typography variant="caption" sx={{ color: "#94a3b8", letterSpacing: 1, textTransform: "uppercase" }}>
                        Video TikTok
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#e2e8f0", fontWeight: 700 }}>
                        {selectedColeta.videoFinalUrl ? "Video pronto para assistir" : selectedColeta.videoStatus === "RENDERING" ? "Gerando em segundo plano" : "Ainda nao gerado"}
                      </Typography>
                    </div>
                    <Chip size="small" label={selectedColeta.videoStatus || "PENDENTE"} color={videoStatusColor(selectedColeta.videoStatus)} />
                  </Box>

                  {selectedColeta.videoFinalUrl ? (
                    <Box sx={{ p: 1.5 }}>
                      <video src={selectedColeta.videoFinalUrl} controls style={{ width: "100%", borderRadius: 12, background: "#000" }} />
                      <div className="flex gap-2 mt-3">
                        <Button variant="contained" href={selectedColeta.videoFinalUrl} target="_blank" startIcon={<OpenInNewIcon />} sx={{ bgcolor: "#22c55e", "&:hover": { bgcolor: "#16a34a" } }}>
                          Assistir
                        </Button>
                        <Button variant="outlined" href={selectedColeta.videoFinalUrl} target="_blank" sx={{ borderColor: "rgba(255,255,255,0.14)", color: "#e2e8f0" }}>
                          Baixar
                        </Button>
                      </div>
                    </Box>
                  ) : (
                    <Box sx={{ p: 2, color: "#94a3b8" }}>
                      <Typography variant="body2">
                        {selectedColeta.videoStatus === "RENDERING"
                          ? "A geracao continua mesmo com a tela fechada. Assim que terminar, o video aparece aqui automaticamente."
                          : "Use o botao de video na lista para iniciar a geracao em segundo plano."}
                      </Typography>
                    </Box>
                  )}
                </Box>

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
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 1.5,
                      maxHeight: 720,
                      minHeight: 280,
                      overflowY: "auto",
                      pr: 0.5,
                      "&::-webkit-scrollbar": {
                        width: 12,
                      },
                      "&::-webkit-scrollbar-thumb": {
                        background: "rgba(99,102,241,0.45)",
                        borderRadius: 999,
                        border: "3px solid rgba(8,17,31,1)",
                      },
                      "&::-webkit-scrollbar-track": {
                        background: "rgba(15,23,42,0.6)",
                      },
                    }}
                  >
                    {sortedSelectedMedia.map((media, index) => (
                      <Box
                        key={media.id}
                        sx={{
                          position: "relative",
                          borderRadius: 1.5,
                          overflow: "hidden",
                          border:
                            selectedPreviewMedia?.id === media.id
                              ? "2px solid rgba(99,102,241,0.85)"
                              : media.tipo === "VIDEO"
                                ? "2px solid rgba(167,139,250,0.5)"
                                : "1px solid rgba(255,255,255,0.1)",
                          bgcolor: "#000",
                          aspectRatio: "1 / 1",
                          cursor: "pointer",
                          boxShadow:
                            selectedPreviewMedia?.id === media.id
                              ? "0 0 0 1px rgba(99,102,241,0.2), 0 18px 38px rgba(37,99,235,0.18)"
                              : "0 10px 30px rgba(0,0,0,0.22)",
                        }}
                        onClick={() => setSelectedMediaId(media.id)}
                      >
                        {media.tipo === "VIDEO" ? (
                          <video src={media.urlMinio} controls style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <img src={media.urlMinio} alt={`Midia ${index + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        )}
                        <Box
                          sx={{
                            position: "absolute",
                            left: 8,
                            right: 8,
                            bottom: 8,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 1,
                            p: 0.75,
                            borderRadius: 1,
                            bgcolor: "rgba(2,6,23,0.75)",
                            backdropFilter: "blur(10px)",
                          }}
                        >
                          <Typography variant="caption" sx={{ color: "#e2e8f0", fontWeight: 700 }}>
                            {media.tipo === "VIDEO" ? `Video ${index + 1}` : `Imagem ${index + 1}`}
                          </Typography>
                          <Button
                            size="small"
                            variant="text"
                            href={media.urlMinio}
                            target="_blank"
                            onClick={(event) => event.stopPropagation()}
                            sx={{ minWidth: 0, color: "#c7d2fe", fontSize: 11, px: 1 }}
                          >
                            Abrir
                          </Button>
                        </Box>
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
        sx={{
          "& .MuiDialog-paper": {
            bgcolor: "#08111f",
            borderColor: "rgba(124,58,237,0.3)",
            color: "#e2e8f0",
            borderWidth: 1,
            borderStyle: "solid",
            borderRadius: 3,
            boxShadow: "0 24px 80px rgba(2,6,23,0.65)",
          },
          "& .MuiInputBase-input": {
            color: "#f8fafc !important",
            WebkitTextFillColor: "#f8fafc",
          },
          "& .MuiInputLabel-root": {
            color: "#94a3b8",
          },
          "& .MuiFormHelperText-root": {
            color: "#94a3b8",
          },
        }}
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

          {videoMsg && (
            <Box sx={{ bgcolor: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 2, p: 2 }}>
              <Typography variant="body2" className="text-green-400">
                {videoMsg}
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
                Enviando para fila de geracao...
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
            disabled={!reactionFile || isGenerating || videoColeta?.videoStatus === "RENDERING"}
            onClick={handleGenerateVideo}
            startIcon={isGenerating ? <CircularProgress size={18} color="inherit" /> : <MovieIcon />}
            sx={{ bgcolor: "#7c3aed", "&:hover": { bgcolor: "#6d28d9" }, "&:disabled": { bgcolor: "rgba(124,58,237,0.3)" } }}
          >
            {videoColeta?.videoStatus === "RENDERING" ? "Gerando em segundo plano" : isGenerating ? "Enfileirando..." : "Criar Video TikTok"}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: { bgcolor: "#0f172a", color: "#f8fafc", borderRadius: 2, border: "1px solid rgba(255,255,255,0.1)" },
          },
        }}
      >
        <DialogTitle>Cadastro Manual de Produto</DialogTitle>
        <DialogContent className="space-y-4 pt-4">
          <TextField
            fullWidth
            label="Link de Afiliado ou URL"
            variant="filled"
            value={manualFields.url}
            onChange={(e) => setManualFields((p) => ({ ...p, url: e.target.value }))}
            sx={fieldSx}
          />
          <TextField
            fullWidth
            label="Titulo do Produto"
            variant="filled"
            value={manualFields.titulo}
            onChange={(e) => setManualFields((p) => ({ ...p, titulo: e.target.value }))}
            sx={fieldSx}
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Descricao (Opcional - Ajuda a IA)"
            variant="filled"
            value={manualFields.descricao}
            onChange={(e) => setManualFields((p) => ({ ...p, descricao: e.target.value }))}
            sx={fieldSx}
          />
          <FormControl fullWidth size="medium" variant="filled" sx={fieldSx}>
            <InputLabel id="persona-label-manual" sx={{ color: "rgba(255,255,255,0.7)" }}>Vendedor (Opcional)</InputLabel>
            <Select
              labelId="persona-label-manual"
              value={manualFields.creatorPersonaId}
              onChange={(e) => setManualFields((p) => ({ ...p, creatorPersonaId: e.target.value }))}
              sx={{
                bgcolor: "rgba(15,23,42,0.92)",
                color: "#f8fafc",
                borderRadius: "14px",
                border: "1px solid rgba(148,163,184,0.18)",
                "&::before, &::after": { display: "none" },
                "& .MuiSelect-select": { padding: "25px 12px 8px" },
              }}
            >
              <MenuItem value="">
                <em>Aleatório / Padrão</em>
              </MenuItem>
              {personas.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box>
            <Typography variant="body2" sx={{ mb: 1, color: "#94a3b8" }}>
              Arquivo de Video (Obrigatorio)
            </Typography>
            <input
              type="file"
              accept="video/mp4,video/webm"
              ref={manualFileInputRef}
              onChange={(e) => setManualVideoFile(e.target.files?.[0] || null)}
              style={{ display: "none" }}
            />
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => manualFileInputRef.current?.click()}
              startIcon={<CloudUploadIcon />}
              fullWidth
            >
              {manualVideoFile ? manualVideoFile.name : "Selecionar Video"}
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setIsManualModalOpen(false)} sx={{ color: "#94a3b8" }} disabled={isManualSubmitting}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleManualSubmit}
            disabled={!manualFields.url || !manualFields.titulo || !manualVideoFile || isManualSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700"
            startIcon={isManualSubmitting && <CircularProgress size={16} />}
          >
            {isManualSubmitting ? "Enviando..." : "Salvar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
