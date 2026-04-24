"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type AspectRatio = "PORTRAIT_9_16" | "LANDSCAPE_16_9";

type Project = {
  id: string;
  status: string;
  ideaPrompt: string;
  aspectRatio: AspectRatio;
  videoDurationSec: number;
  fps: number;
  ttsVoice: string;
  ttsSpeed: string;
  title: string | null;
  description: string | null;
  narrationText: string | null;
  videoSpecJson: string;
  audioUrl: string | null;
  captionsUrl: string | null;
  videoUrl: string | null;
  thumbUrl: string | null;
  renderProgress: number;
  errorMessage: string | null;
  log: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function VideoCodeProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [project, setProject] = useState<Project | null>(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [loading, setLoading] = useState(true);

  const aspectRatioLabel = useMemo(() => {
    if (!project) return "";
    return project.aspectRatio === "LANDSCAPE_16_9" ? "YouTube (16:9 — 1920x1080)" : "TikTok/Reels (9:16 — 1080x1920)";
  }, [project]);

  const fetchProject = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/video-code/projects/${id}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "Erro ao carregar");
        setLoading(false);
        return;
      }
      setProject(data);
    } catch {
      alert("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Polling for progress during rendering
  useEffect(() => {
    if (!project || (project.status !== "RENDERING" && project.status !== "GENERATING")) return;

    const iv = setInterval(async () => {
      const res = await fetch(`/api/video-code/projects/${id}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setProject(data);
        if (data.status === "DONE" || data.status === "FAILED") {
          clearInterval(iv);
          setRendering(false);
          setGenerating(false);
        }
      }
    }, 2000);

    return () => clearInterval(iv);
  }, [id, project?.status, project]);

  const save = async () => {
    if (!project) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/video-code/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaPrompt: project.ideaPrompt,
          aspectRatio: project.aspectRatio,
          videoDurationSec: project.videoDurationSec,
          fps: project.fps,
          ttsVoice: project.ttsVoice,
          ttsSpeed: project.ttsSpeed,
          title: project.title,
          description: project.description,
          narrationText: project.narrationText,
          videoSpecJson: project.videoSpecJson,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "Erro ao salvar");
        setSaving(false);
        return;
      }
      setProject(data);
    } catch {
      alert("Erro de conexão");
    } finally {
      setSaving(false);
    }
  };

  const generate = async () => {
    if (!project) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/video-code/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "Erro ao gerar com IA");
        setGenerating(false);
        return;
      }
      setProject(data);
    } catch {
      alert("Erro de conexão");
    } finally {
      setGenerating(false);
    }
  };

  const renderMp4 = async () => {
    if (!project) return;
    setRendering(true);
    try {
      const res = await fetch("/api/video-code/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "Erro ao renderizar MP4");
        setRendering(false);
        return;
      }
      setProject(data);
    } catch {
      alert("Erro de conexão");
    } finally {
      setRendering(false);
    }
  };

  const del = async () => {
    if (!confirm("Excluir este projeto?")) return;
    try {
      const res = await fetch(`/api/video-code/projects/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data?.error || "Erro ao excluir");
        return;
      }
      router.push("/admin/video-code");
    } catch {
      alert("Erro de conexão");
    }
  };

  if (loading) return <div>Carregando...</div>;
  if (!project) return <div>Projeto não encontrado.</div>;

  return (
    <div className="max-w-4xl pb-20">
      <div className="mb-6 flex items-center justify-between">
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Voltar para lista
        </button>
      </div>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold truncate">
            {project.title?.trim() ? project.title : "Projeto de vídeo"}
          </h1>
          <div className="mt-1 text-sm text-gray-600">
            {aspectRatioLabel} • {project.videoDurationSec}s • {project.status}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={generate}
            disabled={generating}
            className="rounded-md border px-4 py-2 font-semibold disabled:opacity-50"
            title="Gera título, descrição, narração e cenas"
          >
            {generating ? "Gerando..." : "Gerar com IA"}
          </button>
          <button
            onClick={renderMp4}
            disabled={rendering}
            className="rounded-md bg-emerald-600 px-4 py-2 text-white font-semibold disabled:opacity-50"
            title="Renderiza o MP4 com Remotion (pode demorar)"
          >
            {rendering ? "Renderizando..." : "Renderizar MP4"}
          </button>
          <button onClick={save} disabled={saving} className="rounded-md bg-indigo-600 px-4 py-2 text-white font-semibold disabled:opacity-50">
            {saving ? "Salvando..." : "Salvar"}
          </button>
          <button onClick={del} className="rounded-md border px-4 py-2 font-semibold">
            Excluir
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {project.errorMessage ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <div className="font-bold">Erro</div>
            <div className="mt-1 whitespace-pre-wrap">{project.errorMessage}</div>
          </div>
        ) : null}

        {project.status === "RENDERING" && (
          <div className="rounded-xl border border-indigo-100 bg-white p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></div>
                Renderizando vídeo no Remotion...
              </div>
              <div className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                {Math.round(project.renderProgress)}%
              </div>
            </div>
            <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-600 h-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(79,70,229,0.5)]" 
                style={{ width: `${project.renderProgress}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-gray-400 font-medium">O processo pode levar de 30 a 60 segundos dependendo da duração do vídeo.</p>
          </div>
        )}

        <div className="rounded-lg border bg-white p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-1">Voz (narração)</label>
              <select
                className="w-full rounded-md border px-3 py-2"
                value={project.ttsVoice}
                onChange={(e) => setProject((p) => (p ? { ...p, ttsVoice: e.target.value } : p))}
              >
                <option value="pt-BR-AntonioNeural">Antônio (pt-BR, masculino)</option>
                <option value="pt-BR-FranciscaNeural">Francisca (pt-BR, feminino)</option>
                <option value="pt-PT-DuarteNeural">Duarte (pt-PT, masculino)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Velocidade</label>
              <input
                className="w-full rounded-md border px-3 py-2"
                value={project.ttsSpeed}
                onChange={(e) => setProject((p) => (p ? { ...p, ttsSpeed: e.target.value } : p))}
                placeholder="+5%"
              />
              <div className="mt-1 text-xs text-gray-500">Formato: +5% / -10%</div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Formato</label>
            <select
              className="w-full rounded-md border px-3 py-2"
              value={project.aspectRatio}
              onChange={(e) => setProject((p) => (p ? { ...p, aspectRatio: e.target.value as AspectRatio } : p))}
            >
              <option value="PORTRAIT_9_16">TikTok/Reels (9:16 — 1080x1920)</option>
              <option value="LANDSCAPE_16_9">YouTube (16:9 — 1920x1080)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-1">Duração (s)</label>
              <input
                className="w-full rounded-md border px-3 py-2"
                type="number"
                min={5}
                max={600}
                value={project.videoDurationSec}
                onChange={(e) => setProject((p) => (p ? { ...p, videoDurationSec: Number(e.target.value) } : p))}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">FPS</label>
              <input
                className="w-full rounded-md border px-3 py-2"
                type="number"
                min={15}
                max={60}
                value={project.fps}
                onChange={(e) => setProject((p) => (p ? { ...p, fps: Number(e.target.value) } : p))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Ideia / comando</label>
            <textarea
              className="w-full rounded-md border px-3 py-2 min-h-[120px]"
              value={project.ideaPrompt}
              onChange={(e) => setProject((p) => (p ? { ...p, ideaPrompt: e.target.value } : p))}
            />
          </div>
        </div>

        <div className="rounded-lg border bg-white p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Título</label>
            <input
              className="w-full rounded-md border px-3 py-2"
              value={project.title ?? ""}
              onChange={(e) => setProject((p) => (p ? { ...p, title: e.target.value } : p))}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Descrição</label>
            <textarea
              className="w-full rounded-md border px-3 py-2 min-h-[90px]"
              value={project.description ?? ""}
              onChange={(e) => setProject((p) => (p ? { ...p, description: e.target.value } : p))}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Narração</label>
            <textarea
              className="w-full rounded-md border px-3 py-2 min-h-[120px]"
              value={project.narrationText ?? ""}
              onChange={(e) => setProject((p) => (p ? { ...p, narrationText: e.target.value } : p))}
            />
          </div>
        </div>

        <div className="rounded-lg border bg-white p-5 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">VideoSpec (JSON)</div>
              <div className="text-xs text-gray-600">No MVP, esse JSON será consumido pelo renderer Remotion.</div>
            </div>
          </div>
          <textarea
            className="w-full rounded-md border px-3 py-2 min-h-[220px] font-mono text-xs"
            value={project.videoSpecJson ?? "{}"}
            onChange={(e) => setProject((p) => (p ? { ...p, videoSpecJson: e.target.value } : p))}
          />
        </div>

        {project.videoUrl ? (
          <div className="rounded-lg border bg-white p-5">
            <div className="text-sm font-semibold mb-2">Vídeo gerado</div>
            <a className="text-indigo-700 underline" href={project.videoUrl} target="_blank" rel="noreferrer">
              Abrir MP4
            </a>
          </div>
        ) : null}

        {project.audioUrl ? (
          <div className="rounded-lg border bg-white p-5">
            <div className="text-sm font-semibold mb-2">Áudio de narração</div>
            <audio controls src={project.audioUrl} style={{ width: "100%" }} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
