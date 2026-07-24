"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Paper,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { toast } from "react-toastify";

type Persona = {
  id: string;
  name: string;
  imageUrl: string;
  voiceRefUrl: string | null;
  active: boolean;
};

export default function VendedoresPage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", imageUrl: "", voiceRefUrl: "" });
  const [saving, setSaving] = useState(false);

  const fetchPersonas = async () => {
    try {
      const res = await fetch("/api/creator-personas");
      if (res.ok) {
        setPersonas(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonas();
  }, []);

  const handleSave = async () => {
    if (!form.name || !form.imageUrl) {
      toast.error("Nome e Imagem são obrigatórios!");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/creator-personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Vendedor cadastrado com sucesso!");
        setIsModalOpen(false);
        setForm({ name: "", imageUrl: "", voiceRefUrl: "" });
        fetchPersonas();
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao salvar");
      }
    } catch (e) {
      toast.error("Erro na comunicação");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este vendedor?")) return;
    try {
      const res = await fetch(`/api/creator-personas/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Deletado com sucesso!");
        fetchPersonas();
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao deletar");
      }
    } catch (e) {
      toast.error("Erro na comunicação");
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: "1200px", margin: "0 auto" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold" }}>
          Vendedores (Personas)
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsModalOpen(true)}
          sx={{ borderRadius: 2, px: 3 }}
        >
          Novo Vendedor
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: "grey.100" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Nome</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Foto (Avatar)</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Áudio Ref (Voz)</TableCell>
              <TableCell sx={{ fontWeight: "bold", textAlign: "right" }}>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {personas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  Nenhum vendedor cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              personas.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>
                    {p.imageUrl && (
                      <Box
                        component="img"
                        src={p.imageUrl}
                        alt="Avatar"
                        sx={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {p.voiceRefUrl ? (
                      <audio controls src={p.voiceRefUrl} style={{ height: 32 }} />
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton color="error" onClick={() => handleDelete(p.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: "bold" }}>Cadastrar Vendedor</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}>
            <TextField
              label="Nome do Vendedor"
              fullWidth
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <TextField
              label="URL da Foto (Avatar Base)"
              fullWidth
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              helperText="Link público para a imagem da pessoa"
            />
            <TextField
              label="URL do Áudio de Referência (Opcional)"
              fullWidth
              value={form.voiceRefUrl}
              onChange={(e) => setForm({ ...form, voiceRefUrl: e.target.value })}
              helperText="Link público do áudio de 15s para clonagem de voz"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setIsModalOpen(false)} color="inherit" disabled={saving}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
