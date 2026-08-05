"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Alert, Box, FormControl, InputLabel, MenuItem, Paper, Select, TextField } from "@mui/material";
import { ArrowLeft, ExternalLink, FileText, Newspaper, Video } from "lucide-react";
import Link from "next/link";

import TipTapEditor from "@/components/TipTapEditor";
import LinkedInEditor from "@/components/LinkedInEditor";

function publicUrl(slug: string | null | undefined) {
  const cleanSlug = String(slug || "").trim();
  return cleanSlug ? `/noticias/${cleanSlug}` : null;
}

function sourceHost(url: string | null | undefined) {
  if (!url) return "Sem fonte";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Fonte invalida";
  }
}

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();

  const [editorMode, setEditorMode] = useState<"classic" | "linkedin">("linkedin");
  const [status, setStatus] = useState("DRAFT");
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [initialData, setInitialData] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/posts/${params.id}?adminView=1`, { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        setInitialData(data);
        setTitle(data.title);
        setSummary(data.summary || "");
        setContent(data.content);
        setStatus(data.status);
        setLoadingConfig(false);
      })
      .catch(() => {
        setError("Artigo nao encontrado.");
        setLoadingConfig(false);
      });
  }, [params.id]);

  const handleUpdate = async (data: {
    title: string;
    summary: string;
    content: string;
    status: string;
    coverImage?: string;
  }) => {
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

      if (!res.ok) throw new Error("Falha ao atualizar a noticia.");

      router.push("/admin/posts");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingSubmit(false);
    }
  };

  const submitClassic = (e: React.FormEvent) => {
    e.preventDefault();
    handleUpdate({
      title,
      summary,
      content,
      status,
      coverImage: initialData?.coverImage,
    });
  };

  const linkedVideos = Array.isArray(initialData?.codeVideoProjects)
    ? initialData.codeVideoProjects
    : [];
  const linkedCategories = Array.isArray(initialData?.categories)
    ? initialData.categories
    : [];
  const publishedLink = publicUrl(initialData?.slug);

  const cards = useMemo(
    () => [
      {
        label: "Status",
        value: status === "PUBLISHED" ? "Publicado" : "Rascunho",
        tone:
          status === "PUBLISHED"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-slate-50 text-slate-700 border-slate-200",
      },
      {
        label: "Visualizacoes",
        value: String(initialData?.views || 0),
        tone: "bg-indigo-50 text-indigo-700 border-indigo-200",
      },
      {
        label: "Videos ligados",
        value: String(linkedVideos.length),
        tone: "bg-violet-50 text-violet-700 border-violet-200",
      },
      {
        label: "Fonte",
        value: sourceHost(initialData?.sourceUrl),
        tone: "bg-amber-50 text-amber-700 border-amber-200",
      },
    ],
    [initialData?.sourceUrl, initialData?.views, linkedVideos.length, status],
  );

  if (loadingConfig) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/posts"
                className="rounded-xl border border-white/15 bg-white/10 p-2 text-white transition-colors hover:bg-white/15"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-indigo-300">
                Resumo de Noticias
              </p>
            </div>
            <h1 className="mt-4 line-clamp-2 text-3xl font-black tracking-tight">
              {initialData?.title || "Noticia"}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              Tela especifica da noticia com contexto editorial, origem, categorias e vinculos de video.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {publishedLink ? (
              <Link
                href={publishedLink}
                target="_blank"
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-300/30 bg-indigo-400/10 px-4 py-2.5 text-sm font-black text-indigo-100"
              >
                <Newspaper className="h-4 w-4" />
                Abrir artigo
              </Link>
            ) : null}
            {initialData?.sourceUrl ? (
              <a
                href={initialData.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-2.5 text-sm font-black text-emerald-100"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir fonte
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className={`rounded-2xl border p-5 ${card.tone}`}>
            <p className="text-xs font-black uppercase tracking-wide">{card.label}</p>
            <p className="mt-2 text-2xl font-black">{card.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          {error ? (
            <Alert severity="error" className="rounded-xl border border-rose-200/50 shadow-sm">
              {error}
            </Alert>
          ) : null}

          <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">Edicao da noticia</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Edite conteudo, altere o status e mantenha a noticia pronta para SEO e operacao.
                </p>
              </div>
              <div className="flex rounded-xl border border-slate-200 bg-slate-100/80 p-1.5">
                <button
                  onClick={() => setEditorMode("classic")}
                  className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                    editorMode === "classic"
                      ? "border border-slate-200/30 bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Formulario
                </button>
                <button
                  onClick={() => setEditorMode("linkedin")}
                  className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                    editorMode === "linkedin"
                      ? "border border-slate-200/30 bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Editor otimizado
                </button>
              </div>
            </div>

            {editorMode === "linkedin" ? (
              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200/60">
                <LinkedInEditor initialData={initialData} onSave={handleUpdate} />
              </div>
            ) : (
              <Paper
                sx={{
                  p: 4,
                  mt: 3,
                  borderRadius: 4,
                  border: "1px solid rgba(226, 232, 240, 0.6)",
                  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
                }}
              >
                <Box component="form" onSubmit={submitClassic} noValidate>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    label="Titulo"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    slotProps={{ input: { style: { borderRadius: 12 } } }}
                  />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    label="Resumo"
                    multiline
                    rows={2}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    slotProps={{ input: { style: { borderRadius: 12 } } }}
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
                    <div className="mb-2 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-500">
                      <FileText className="h-4 w-4 text-indigo-600" />
                      Conteudo da noticia
                    </div>
                    <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                      <TipTapEditor content={content} onChange={setContent} />
                    </div>
                  </Box>
                  <button
                    type="submit"
                    className="mt-4 flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-black text-white shadow-md shadow-indigo-600/10 transition-all active:scale-95 disabled:opacity-50"
                    disabled={loadingSubmit}
                  >
                    {loadingSubmit ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                    ) : (
                      "SALVAR ALTERACOES"
                    )}
                  </button>
                </Box>
              </Paper>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">Contexto editorial</h2>
            <div className="mt-4 space-y-4 text-sm text-slate-600">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">Resumo</p>
                <p className="mt-1 leading-6">{initialData?.summary || "Sem resumo."}</p>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">Categorias</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {linkedCategories.length ? (
                    linkedCategories.map((item: any) => (
                      <span
                        key={item.category.id}
                        className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-black text-slate-700"
                      >
                        {item.category.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400">Sem categoria</span>
                  )}
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">Criado em</p>
                  <p className="mt-1">{new Date(initialData?.createdAt).toLocaleString("pt-BR")}</p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">Publicado em</p>
                  <p className="mt-1">
                    {initialData?.publishedAt
                      ? new Date(initialData.publishedAt).toLocaleString("pt-BR")
                      : "Ainda nao publicado"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">Videos vinculados</h2>
            <div className="mt-4 space-y-3">
              {linkedVideos.length ? (
                linkedVideos.map((project: any) => (
                  <article
                    key={project.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-900">
                          {project.newsVariant || "PRESENTER"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">ID: {project.id}</p>
                      </div>
                      <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[10px] font-black text-violet-700">
                        {project.status}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        href={`/admin/video-code/${project.id}`}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700"
                      >
                        <Video className="h-3.5 w-3.5" />
                        Abrir projeto
                      </Link>
                      {project.videoUrl ? (
                        <a
                          href={project.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700"
                        >
                          Ver video
                        </a>
                      ) : null}
                    </div>
                    {Array.isArray(project.socialPosts) && project.socialPosts.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {project.socialPosts.map((social: any) => (
                          <span
                            key={social.id}
                            className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-1 text-[10px] font-black text-indigo-700"
                          >
                            {social.platform}: {social.status}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-slate-500">Sem fila social registrada.</p>
                    )}
                  </article>
                ))
              ) : (
                <p className="text-sm text-slate-500">Nenhum video vinculado a esta noticia.</p>
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
