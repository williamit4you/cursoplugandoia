"use client";

import { useEffect, useRef, useState } from "react";
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
  Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Switch, FormControlLabel, Box, Alert, Typography
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { useRouter } from "next/navigation";

const STEP_COLORS: Record<string, string> = {
  FETCH:  "#1976d2",
  AI:     "#7b1fa2",
  VIDEO:  "#e65100",
  UPLOAD: "#00695c",
  INGEST: "#2e7d32",
  PEXELS: "#f57c00",
  ERROR:  "#c62828",
};

const LEVEL_BG: Record<string, string> = {
  INFO:    "#e3f2fd",
  SUCCESS: "#e8f5e9",
  ERROR:   "#ffebee",
  WARN:    "#fff8e1",
};

const LEVEL_COLOR: Record<string, string> = {
  INFO:    "#1565c0",
  SUCCESS: "#2e7d32",
  ERROR:   "#b71c1c",
  WARN:    "#e65100",
};

export default function ScrapersTable({ initialData }: { initialData: any[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState("");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [triggerStatus, setTriggerStatus] = useState({ state: "", message: "" });
  const [isRunning, setIsRunning] = useState(false);
  const [pipelineLogs, setPipelineLogs] = useState<any[]>([]);
  const [showMonitor, setShowMonitor] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  const evtRef = useRef<EventSource | null>(null);

  // Auto-scroll when new logs arrive
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [pipelineLogs]);

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => evtRef.current?.close();
  }, []);

  const handleOpenNew = () => {
    setIsEditing(false);
    setCurrentId("");
    setName("");
    setUrl("");
    setIsActive(true);
    setOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setIsEditing(true);
    setCurrentId(item.id);
    setName(item.name);
    setUrl(item.url);
    setIsActive(item.isActive);
    setOpen(true);
  };

  const handleSave = async () => {
    const payload = { name, url, isActive };
    const method = isEditing ? "PUT" : "POST";
    const endpoint = isEditing ? `/api/scrapers/${currentId}` : `/api/scrapers`;

    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else {
      alert("Erro ao salvar! Veja se a URL já existe.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover esta fonte definitivamente?")) return;
    const res = await fetch(`/api/scrapers/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  };

  const handleTrigger = async () => {
    // Reset state
    setPipelineLogs([]);
    setIsRunning(true);
    setShowMonitor(true);
    setTriggerStatus({ state: "info", message: "📡 Motor ativado! Monitorando em tempo real..." });

    const res = await fetch(`/api/worker/trigger`, { method: "POST" });
    if (!res.ok) {
      setTriggerStatus({ state: "error", message: "❌ Falha ao ativar o motor." });
      setIsRunning(false);
      return;
    }

    // Fecha SSE anterior se existir
    evtRef.current?.close();

    // Conecta ao SSE
    const evtSource = new EventSource("/api/pipeline/status");
    evtRef.current = evtSource;

    evtSource.onmessage = (e) => {
      try {
        const log = JSON.parse(e.data);
        setPipelineLogs((prev) => [...prev, log]);
        if (log.message?.includes("Pipeline finalizado")) {
          setTriggerStatus({ state: "success", message: "✅ Pipeline finalizado com sucesso!" });
          setIsRunning(false);
          evtSource.close();
        }
      } catch {}
    };

    evtSource.onerror = () => {
      evtSource.close();
      setIsRunning(false);
    };
  };

  return (
    <>
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <Button variant="contained" color="primary" onClick={handleOpenNew}>
          Adicionar Fonte (RSS/Url)
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          onClick={handleTrigger}
          disabled={isRunning}
        >
          {isRunning ? "⏳ Processando..." : "🤖 Capturar Notícias Agora"}
        </Button>
        {pipelineLogs.length > 0 && !showMonitor && (
          <Button variant="text" size="small" onClick={() => setShowMonitor(true)}>
            Ver Monitor
          </Button>
        )}
      </Box>

      {triggerStatus.message && (
        <Alert severity={triggerStatus.state as any} sx={{ mb: 2 }}>
          {triggerStatus.message}
        </Alert>
      )}

      {/* MONITOR DE PIPELINE EM TEMPO REAL */}
      {showMonitor && (
        <Box sx={{
          mb: 3,
          border: "1px solid #e0e0e0",
          borderRadius: 2,
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
        }}>
          <Box sx={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            px: 2, py: 1.5,
            background: "linear-gradient(90deg, #1a1a2e 0%, #16213e 100%)",
            color: "white"
          }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              🛰️ Monitor de Pipeline{" "}
              {isRunning && (
                <span style={{ marginLeft: 8, fontSize: 11, opacity: 0.7 }}>
                  ● AO VIVO
                </span>
              )}
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button size="small" sx={{ color: "#aaa", minWidth: "auto" }}
                onClick={() => setPipelineLogs([])}>
                Limpar
              </Button>
              <Button size="small" sx={{ color: "#aaa", minWidth: "auto" }}
                onClick={() => setShowMonitor(false)}>
                ✕
              </Button>
            </Box>
          </Box>

          <Box sx={{
            height: 300,
            overflowY: "auto",
            background: "#0d0d1a",
            p: 1.5,
            fontFamily: "'Fira Code', 'Courier New', monospace",
            fontSize: 12,
          }}>
            {pipelineLogs.length === 0 ? (
              <Typography sx={{ color: "#555", fontSize: 12, textAlign: "center", mt: 4 }}>
                Aguardando logs do worker... (pode levar até 1 minuto para o daemon responder)
              </Typography>
            ) : (
              pipelineLogs.map((log, idx) => (
                <Box key={idx} sx={{
                  display: "flex", alignItems: "flex-start", gap: 1, mb: 0.5,
                  p: "4px 8px", borderRadius: 1,
                  background: idx % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent"
                }}>
                  <Box sx={{
                    px: 0.8, py: 0.1, borderRadius: 0.5, flexShrink: 0,
                    fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
                    background: STEP_COLORS[log.step] || "#555",
                    color: "white",
                    minWidth: 52, textAlign: "center"
                  }}>
                    {log.step}
                  </Box>
                  <Box sx={{
                    px: 0.6, py: 0.1, borderRadius: 0.5, flexShrink: 0,
                    fontSize: 10, fontWeight: 600,
                    background: LEVEL_BG[log.level] || "#eee",
                    color: LEVEL_COLOR[log.level] || "#333",
                    minWidth: 44, textAlign: "center"
                  }}>
                    {log.level}
                  </Box>
                  <Typography sx={{ color: "#555", fontSize: 11, flexShrink: 0, lineHeight: "18px" }}>
                    {new Date(log.createdAt).toLocaleTimeString("pt-BR")}
                  </Typography>
                  <Typography sx={{ color: "#e0e0e0", fontSize: 12, lineHeight: "18px", wordBreak: "break-word" }}>
                    {log.message}
                  </Typography>
                </Box>
              ))
            )}
            <div ref={logEndRef} />
          </Box>
        </Box>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Nome da Fonte</strong></TableCell>
              <TableCell><strong>URL Base (Crawler)</strong></TableCell>
              <TableCell><strong>Ativo</strong></TableCell>
              <TableCell><strong>Última Captura</strong></TableCell>
              <TableCell><strong>Ações</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {initialData.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">Nenhuma fonte cadastrada.</TableCell>
              </TableRow>
            )}
            {initialData.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell sx={{ color: "text.secondary", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {item.url}
                </TableCell>
                <TableCell>
                  <span style={{
                    color: item.isActive ? "#2e7d32" : "#d32f2f",
                    fontWeight: 600,
                    padding: "4px 8px",
                    borderRadius: "16px",
                    backgroundColor: item.isActive ? "#e8f5e9" : "#ffebee",
                  }}>
                    {item.isActive ? "Ativado" : "Pausado"}
                  </span>
                </TableCell>
                <TableCell>
                  {item.lastScraped ? new Date(item.lastScraped).toLocaleString("pt-BR") : "Ainda pendente"}
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpenEdit(item)} color="info"><EditIcon /></IconButton>
                  <IconButton size="small" onClick={() => handleDelete(item.id)} color="error"><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditing ? "Editar Fonte" : "Nova Fonte de Scraping"}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Cadastre a URL principal da listagem de notícias ou o Feed RSS (ex: g1.globo.com/tecnologia)
          </Typography>
          <TextField
            autoFocus margin="dense" label="Nome do Portal" type="text"
            fullWidth variant="outlined" value={name} onChange={(e) => setName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense" label="URL Alvo (Site ou RSS)" type="url"
            fullWidth variant="outlined" value={url} onChange={(e) => setUrl(e.target.value)}
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
            label="Motor autorizado a ler esta fonte?"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">Salvar Fonte</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
