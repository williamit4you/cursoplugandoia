"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, TextField, Typography, Paper, Alert, MenuItem, Select, FormControl, InputLabel, ToggleButton, ToggleButtonGroup } from "@mui/material";
import TipTapEditor from "@/components/TipTapEditor";
import LinkedInEditor from "@/components/LinkedInEditor";

export default function NewPostPage() {
  const router = useRouter();
  const [editorMode, setEditorMode] = useState<"classic" | "linkedin">("linkedin");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async (data: { title: string, summary: string, content: string, status: string, coverImage?: string }) => {
    setLoading(true);
    setError("");

    try {
      const finalSlug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'rascunho';
      const uniqueSlug = `${finalSlug}-${Date.now().toString().slice(-5)}`;

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          summary: data.summary,
          content: data.content,
          status: data.status,
          coverImage: data.coverImage,
          slug: uniqueSlug
        }),
      });

      if (!res.ok) throw new Error("Falha ao salvar a notícia.");
      router.push("/admin/posts");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitClassic = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave({ title, summary, content, status });
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Criar Nova Notícia</Typography>
        <ToggleButtonGroup
          color="primary"
          value={editorMode}
          exclusive
          onChange={(e, newMode) => { if (newMode) setEditorMode(newMode) }}
          aria-label="Editor Mode"
          size="small"
        >
          <ToggleButton value="classic">Modo Clássico (Formulário)</ToggleButton>
          <ToggleButton value="linkedin">Modo Otimizado (Estilo LinkedIn)</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {editorMode === "linkedin" ? (
        <LinkedInEditor onSave={handleSave} />
      ) : (
        <Paper sx={{ p: 4, maxWidth: 1000, mx: "auto" }}>
          <Box component="form" onSubmit={submitClassic} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Resumo (Descrição Curta)"
              multiline rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value)}>
                <MenuItem value="DRAFT">Rascunho</MenuItem>
                <MenuItem value="PUBLISHED">Publicado</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ mt: 3, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Conteúdo da Notícia</Typography>
              <TipTapEditor content={content} onChange={setContent} />
            </Box>
            <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }} disabled={loading}>
              {loading ? "Salvando..." : "Salvar Notícia"}
            </Button>
          </Box>
        </Paper>
      )}
    </>
  );
}
