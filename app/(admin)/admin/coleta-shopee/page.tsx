"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";

export default function ColetaShopeePage() {
  const [coletas, setColetas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modal for details
  const [selectedColeta, setSelectedColeta] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadColetas = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/coleta-shopee");
      if (res.ok) {
        const data = await res.json();
        setColetas(data);
      }
    } catch (e) {
      console.error(e);
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
      if (res.ok) {
        setUrl("");
        loadColetas();
      } else {
        const err = await res.json();
        alert("Erro: " + err.error);
      }
    } catch (e: any) {
      alert("Erro ao adicionar URL");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScrape = async (id: string) => {
    try {
      // Optimo update
      setColetas((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "SCRAPING" } : c))
      );
      const res = await fetch(`/api/coleta-shopee/${id}/scrape`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        alert("Erro no scraping: " + err.error);
      }
      loadColetas();
    } catch (e) {
      alert("Erro ao executar scraping");
      loadColetas();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta coleta?")) return;
    try {
      const res = await fetch(`/api/coleta-shopee/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadColetas();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleViewDetails = (coleta: any) => {
    setSelectedColeta(coleta);
    setIsModalOpen(true);
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

      {/* Cadastrar URL */}
      <Card className="bg-white/5 border border-white/10 backdrop-blur-md">
        <CardContent className="flex items-center gap-4">
          <TextField
            fullWidth
            size="small"
            variant="outlined"
            placeholder="Cole a URL do produto da Shopee aqui..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isSubmitting}
            sx={{
              input: { color: "#f1f5f9" },
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "rgba(255, 255, 255, 0.2)" },
                "&:hover fieldset": { borderColor: "rgba(255, 255, 255, 0.3)" },
                "&.Mui-focused fieldset": { borderColor: "#6366f1" },
              },
            }}
          />
          <Button
            variant="contained"
            color="primary"
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
            onClick={handleAddUrl}
            disabled={!url || isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 whitespace-nowrap"
          >
            Cadastrar URL
          </Button>
        </CardContent>
      </Card>

      {/* Lista de URLs */}
      <TableContainer component={Paper} className="bg-white/5 border border-white/10 backdrop-blur-md">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell className="text-slate-400 font-semibold border-white/10">URL / Título</TableCell>
              <TableCell className="text-slate-400 font-semibold border-white/10">Status</TableCell>
              <TableCell className="text-slate-400 font-semibold border-white/10">Mídias</TableCell>
              <TableCell className="text-slate-400 font-semibold border-white/10 align-right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && coletas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 border-white/10">
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : coletas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-slate-400 border-white/10">
                  Nenhuma URL cadastrada.
                </TableCell>
              </TableRow>
            ) : (
              coletas.map((c) => (
                <TableRow key={c.id} className="hover:bg-white/5 transition-colors">
                  <TableCell className="border-white/10 text-slate-200">
                    <div className="flex flex-col gap-1">
                      {c.titulo && <span className="font-semibold text-indigo-400 cursor-pointer" onClick={() => handleViewDetails(c)}>{c.titulo}</span>}
                      <a href={c.url} target="_blank" rel="noreferrer" className="text-xs text-slate-500 hover:underline max-w-md truncate">
                        {c.url}
                      </a>
                    </div>
                  </TableCell>
                  <TableCell className="border-white/10">
                    <Chip
                      size="small"
                      label={c.status}
                      color={
                        c.status === "COMPLETED" ? "success" :
                        c.status === "SCRAPING" ? "warning" :
                        c.status === "FAILED" ? "error" : "default"
                      }
                      variant="outlined"
                    />
                    {c.errorMessage && <p className="text-xs text-red-400 mt-1 max-w-xs truncate" title={c.errorMessage}>{c.errorMessage}</p>}
                  </TableCell>
                  <TableCell className="border-white/10 text-slate-300">
                    {c.linksMedia?.length || 0} mídias
                  </TableCell>
                  <TableCell className="border-white/10 text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        className="bg-indigo-600 hover:bg-indigo-700"
                        startIcon={c.status === "SCRAPING" ? <CircularProgress size={14} color="inherit" /> : <PlayArrowIcon />}
                        onClick={() => handleScrape(c.id)}
                        disabled={c.status === "SCRAPING"}
                      >
                        Executar Scraping
                      </Button>
                      <IconButton size="small" onClick={() => handleDelete(c.id)} className="text-red-400 hover:bg-red-400/10">
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

      {/* Modal de Detalhes */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="md" fullWidth sx={{ '& .MuiDialog-paper': { bgcolor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', color: '#e2e8f0', borderWidth: 1, borderStyle: 'solid' } }}>
        <DialogTitle className="border-b border-white/10">
          Detalhes do Produto
        </DialogTitle>
        <DialogContent className="pt-6 space-y-4">
          {selectedColeta && (
            <>
              <Typography variant="h6" className="font-bold text-indigo-400">
                {selectedColeta.titulo}
              </Typography>
              <Typography variant="body2" className="text-slate-400 whitespace-pre-wrap">
                {selectedColeta.detalhes}
              </Typography>

              {selectedColeta.aiPromptVendas && (
                <div className="mt-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                  <Typography variant="subtitle2" className="text-indigo-300 font-bold mb-2">
                    🤖 Prompt de Vendas (AI)
                  </Typography>
                  <Typography variant="body2" className="text-slate-300 whitespace-pre-wrap italic">
                    &quot;{selectedColeta.aiPromptVendas}&quot;
                  </Typography>
                </div>
              )}

              <div className="mt-6">
                <Typography variant="subtitle1" className="font-bold text-slate-200 mb-4">
                  Mídias Coletadas
                </Typography>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {selectedColeta.linksMedia?.map((media: any) => (
                    <div key={media.id} className="relative rounded-lg overflow-hidden border border-white/10 bg-black aspect-square flex items-center justify-center">
                      {media.tipo === "VIDEO" ? (
                        <video src={media.urlMinio} controls className="w-full h-full object-cover" />
                      ) : (
                        <img src={media.urlMinio} alt="Media" className="w-full h-full object-cover" />
                      )}
                      <div className="absolute top-2 right-2">
                        <Chip size="small" label={media.tipo} color="secondary" className="bg-black/50 backdrop-blur-sm" />
                      </div>
                    </div>
                  ))}
                  {(!selectedColeta.linksMedia || selectedColeta.linksMedia.length === 0) && (
                    <Typography variant="body2" className="text-slate-500 col-span-full">
                      Nenhuma mídia disponível.
                    </Typography>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
        <DialogActions className="border-t border-white/10 p-4">
          <Button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
