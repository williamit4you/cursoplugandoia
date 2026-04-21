"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Box, Button, TextField, Typography, Paper, Alert, MenuItem, Select, FormControl, InputLabel, ToggleButton, ToggleButtonGroup, CircularProgress } from "@mui/material";
import TipTapEditor from "@/components/TipTapEditor";
import LinkedInEditor from "@/components/LinkedInEditor";

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  
  const [editorMode, setEditorMode] = useState<"classic" | "linkedin">("linkedin");
  const [status, setStatus] = useState("DRAFT");
  const [loadingConfig, setLoadingConfig] = useState(true);
  
  const [initialData, setInitialData] = useState<any>(null);

  // Classic Form Fields
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/posts/${params.id}`)
      .then(r => r.json())
      .then(data => {
        setInitialData(data);
        setTitle(data.title);
        setSummary(data.summary || "");
        setContent(data.content);
        setStatus(data.status);
        setLoadingConfig(false);
      })
      .catch(() => {
        setError("Artigo não encontrado.");
        setLoadingConfig(false);
      });
  }, [params.id]);

  const handleUpdate = async (data: { title: string, summary: string, content: string, status: string, coverImage?: string }) => {
    setLoadingSubmit(true);
    setError("");

    try {
      const res = await fetch(`/api/posts/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          summary: data.summary,
          content: data.content,
          status: data.status,
          coverImage: data.coverImage,
        }),
      });

      if (!res.ok) throw new Error("Falha ao atualizar a notícia.");
      
      router.push("/admin/posts");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingSubmit(false);
    }
  };

  const submitClassic = (e: React.FormEvent) => {
    e.preventDefault();
    handleUpdate({ title, summary, content, status, coverImage: initialData?.coverImage });
  };

  if (loadingConfig) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><CircularProgress /></Box>
  }

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Editando Notícia</Typography>
        <ToggleButtonGroup
          color="primary"
          value={editorMode}
          exclusive
          onChange={(e, newMode) => { if (newMode) setEditorMode(newMode) }}
          aria-label="Editor Mode"
          size="small"
        >
          <ToggleButton value="classic">Modo Clássico</ToggleButton>
          <ToggleButton value="linkedin">Modo LinkedIn</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {editorMode === "linkedin" ? (
        <LinkedInEditor initialData={initialData} onSave={handleUpdate} />
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
            <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }} disabled={loadingSubmit}>
              {loadingSubmit ? "Atualizando..." : "Salvar Alterações"}
            </Button>
          </Box>
        </Paper>
      )}
    </>
  );
}
