"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Box, Button, TextField, Typography, Paper, Alert, MenuItem, Select, FormControl, InputLabel, CircularProgress } from "@mui/material";
import TipTapEditor from "@/components/TipTapEditor";
import LinkedInEditor from "@/components/LinkedInEditor";
import { FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";

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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/posts"
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="space-y-0.5">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-600" />
              Editar Notícia
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Altere ou publique o artigo diretamente no site.
            </p>
          </div>
        </div>

        {/* Toggle Mode */}
        <div className="flex bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/40">
          <button
            onClick={() => setEditorMode("classic")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              editorMode === "classic"
                ? "bg-white text-indigo-600 shadow-sm border border-slate-200/30"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Modo Clássico (Formulário)
          </button>
          <button
            onClick={() => setEditorMode("linkedin")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              editorMode === "linkedin"
                ? "bg-white text-indigo-600 shadow-sm border border-slate-200/30"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Modo LinkedIn (Otimizado)
          </button>
        </div>
      </div>

      {error && (
        <Alert severity="error" className="rounded-xl border border-rose-200/50 shadow-sm">
          {error}
        </Alert>
      )}

      {editorMode === "linkedin" ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <LinkedInEditor initialData={initialData} onSave={handleUpdate} />
        </div>
      ) : (
        <Paper sx={{ p: 4, maxWidth: 1000, mx: "auto", borderRadius: 4, border: "1px solid rgba(226, 232, 240, 0.6)", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)" }}>
          <Box component="form" onSubmit={submitClassic} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              slotProps={{
                input: {
                  style: { borderRadius: 12 }
                }
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Resumo (Descrição Curta)"
              multiline rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              slotProps={{
                input: {
                  style: { borderRadius: 12 }
                }
              }}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select 
                value={status} 
                label="Status" 
                onChange={(e) => setStatus(e.target.value)}
                sx={{ borderRadius: 3 }}
              >
                <MenuItem value="DRAFT">Rascunho</MenuItem>
                <MenuItem value="PUBLISHED">Publicado</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ mt: 3, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700, color: "text.secondary", fontSize: "0.875rem", textTransform: "uppercase" }}>
                Conteúdo da Notícia
              </Typography>
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <TipTapEditor content={content} onChange={setContent} />
              </div>
            </Box>
            <button 
              type="submit" 
              className="mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-black shadow-md shadow-indigo-600/10 transition-all disabled:opacity-50 active:scale-95 flex items-center gap-2"
              disabled={loadingSubmit}
            >
              {loadingSubmit ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                "SALVAR ALTERAÇÕES"
              )}
            </button>
          </Box>
        </Paper>
      )}
    </div>
  );
}
