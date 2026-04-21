"use client";

import { useState } from "react";
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
  Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Switch, FormControlLabel, Box, Alert, Typography 
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { useRouter } from "next/navigation";

export default function ScrapersTable({ initialData }: { initialData: any[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState("");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [triggerStatus, setTriggerStatus] = useState({ state: "", message: "" });

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
      body: JSON.stringify(payload)
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
    setTriggerStatus({ state: "loading", message: "Avisando Motor para rodar AGORA..." });
    const res = await fetch(`/api/worker/trigger`, { method: "POST" });
    if (res.ok) {
      setTriggerStatus({ state: "success", message: "Motor ativado com sucesso! As notícias entrarão em Rascunho em breve." });
    } else {
      setTriggerStatus({ state: "error", message: "Falha de comunicação." });
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button variant="contained" color="primary" onClick={handleOpenNew}>Adicionar Fonte (RSS/Url)</Button>
        <Button variant="outlined" color="secondary" onClick={handleTrigger}>
          🤖 Capturar Notícias Agora
        </Button>
      </Box>

      {triggerStatus.message && (
        <Alert severity={triggerStatus.state as any} sx={{ mb: 2 }}>{triggerStatus.message}</Alert>
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
                <TableCell sx={{ color: 'text.secondary', maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {item.url}
                </TableCell>
                <TableCell>
                  <span style={{ 
                    color: item.isActive ? '#2e7d32' : '#d32f2f', 
                    fontWeight: 600,
                    padding: '4px 8px',
                    borderRadius: '16px',
                    backgroundColor: item.isActive ? '#e8f5e9' : '#ffebee'
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
  )
}
