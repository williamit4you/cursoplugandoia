"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Project = {
  id: string;
  status: string;
  projectType: string;
  ideaPrompt: string;
  aspectRatio: "PORTRAIT_9_16" | "LANDSCAPE_16_9";
  videoDurationSec: number;
  fps: number;
  ttsVoice: string;
  ttsSpeed: string;
  title: string | null;
  description: string | null;
  narrationText: string | null;
  promptPreview: string | null;
  metadataJson: string;
  videoSpecJson: string;
  audioUrl: string | null;
  videoUrl: string | null;
  renderProgress: number;
  errorMessage: string | null;
};

type Metadata = {
  productName?: string;
  productDescription?: string;
  productTechnicalDetails?: string;
  productUseCases?: string;
  targetAudience?: string;
  productUrl?: string;
  ctaText?: string;
  youtubeTags?: string;
  primaryBgColor?: string;
  primaryTextColor?: string;
  assets?: Array<{
    url: string;
    kind?: "IMAGE" | "VIDEO";
    name?: string;
  }>;
};

function parseMetadata(text: string): Metadata {
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export default function PropagandaDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [metadata, setMetadata] = useState<Metadata>({});

  const aspectRatioLabel = useMemo(() => {
    if (!project) return "";
    return project.aspectRatio === "LANDSCAPE_16_9" ? "YouTube (16:9)" : "Vertical (9:16)";
  }, [project]);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/video-code/projects/${id}`, { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setProject(data);
        setMetadata(parseMetadata(data.metadataJson || "{}"));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!project || (project.status !== "RENDERING" && project.status !== "GENERATING")) return;
    const interval = setInterval(fetchProject, 2000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.status, id]);

  const save = async () => {
    if (!project) return;
    setSaving(true);
    try {
      const payload = {
        title: metadata.productName || project.title,
        description: metadata.productDescription || project.description,
        narrationText: project.narrationText,
        promptPreview: project.promptPreview,
        videoSpecJson: project.videoSpecJson,
        metadataJson: JSON.stringify(metadata),
        ttsVoice: project.ttsVoice,
        ttsSpeed: project.ttsSpeed,
        videoDurationSec: project.videoDurationSec,
        aspectRatio: project.aspectRatio,
      };
      const res = await fetch(`/api/video-code/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setProject(data);
        setMetadata(parseMetadata(data.metadataJson || "{}"));
      } else {
        alert(data?.error || "Erro ao salvar");
      }
    } finally {
      setSaving(false);
    }
  };

  const generate = async () => {
    setGenerating(true);
    try {
      await save();
      const res = await fetch("/api/video-code/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: id }),
      });
      const data = await res.json();
      if (res.ok) {
        setProject(data);
        setMetadata(parseMetadata(data.metadataJson || "{}"));
      } else {
        alert(data?.error || "Erro ao gerar propaganda");
      }
    } finally {
      setGenerating(false);
    }
  };

  const renderVideo = async () => {
    setRendering(true);
    try {
      const res = await fetch("/api/video-code/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: id }),
      });
      const data = await res.json();
      if (res.ok) {
        setProject(data);
      } else {
        alert(data?.error || "Erro ao renderizar");
        setRendering(false);
      }
    } catch {
      alert("Erro de conexão");
      setRendering(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center font-bold text-gray-500">Carregando propaganda...</div>;
  }

  if (!project) {
    return <div className="p-12 text-center font-bold text-gray-500">Propaganda não encontrada.</div>;
  }

  return (
    <div className="max-w-7xl animate-in fade-in duration-500 pb-24">
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <button
            onClick={() => router.push("/admin/propagandas")}
            className="mb-4 text-sm font-bold text-gray-400 hover:text-emerald-600"
          >
            Voltar para lista
          </button>
          <h1 className="text-3xl font-black tracking-tight text-gray-900">
            {metadata.productName || project.title || "Propaganda sem título"}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {aspectRatioLabel} · {project.videoDurationSec}s · status {project.status}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
          <button
            onClick={generate}
            disabled={generating || rendering}
            className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 font-bold text-gray-700 hover:border-emerald-200 hover:text-emerald-700 disabled:opacity-50"
          >
            {generating ? "Gerando..." : "Regenerar roteiro"}
          </button>
          <button
            onClick={renderVideo}
            disabled={rendering || generating || project.status === "RENDERING"}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {rendering || project.status === "RENDERING" ? "Renderizando..." : "Criar vídeo"}
          </button>
        </div>
      </div>

      {project.errorMessage && (
        <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          {project.errorMessage}
        </div>
      )}

      {project.status === "RENDERING" && (
        <div className="mb-6 rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-black text-indigo-900">Processando vídeo...</div>
            <div className="font-black text-indigo-600">{Math.round(project.renderProgress)}%</div>
          </div>
          <div className="h-4 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full bg-indigo-600 transition-all duration-1000"
              style={{ width: `${project.renderProgress}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-xl font-black text-gray-900">Dados do produto</h2>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500">
                  Nome do produto
                </label>
                <input
                  value={metadata.productName || ""}
                  onChange={(e) => setMetadata((current) => ({ ...current, productName: e.target.value }))}
                  className="w-full rounded-2xl border-gray-200 bg-gray-50 px-4 py-3 font-bold text-gray-900"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500">
                  Descrição comercial / descrição do YouTube
                </label>
                <textarea
                  value={metadata.productDescription || ""}
                  onChange={(e) => setMetadata((current) => ({ ...current, productDescription: e.target.value }))}
                  className="min-h-[130px] w-full rounded-2xl border-gray-200 bg-gray-50 px-4 py-3 text-gray-900"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500">
                  Detalhes técnicos
                </label>
                <textarea
                  value={metadata.productTechnicalDetails || ""}
                  onChange={(e) =>
                    setMetadata((current) => ({ ...current, productTechnicalDetails: e.target.value }))
                  }
                  className="min-h-[130px] w-full rounded-2xl border-gray-200 bg-gray-50 px-4 py-3 text-gray-900"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500">
                  Usos
                </label>
                <textarea
                  value={metadata.productUseCases || ""}
                  onChange={(e) => setMetadata((current) => ({ ...current, productUseCases: e.target.value }))}
                  className="min-h-[120px] w-full rounded-2xl border-gray-200 bg-gray-50 px-4 py-3 text-gray-900"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500">
                  Público-alvo
                </label>
                <textarea
                  value={metadata.targetAudience || ""}
                  onChange={(e) => setMetadata((current) => ({ ...current, targetAudience: e.target.value }))}
                  className="min-h-[120px] w-full rounded-2xl border-gray-200 bg-gray-50 px-4 py-3 text-gray-900"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500">
                  Link do produto
                </label>
                <input
                  value={metadata.productUrl || ""}
                  onChange={(e) => setMetadata((current) => ({ ...current, productUrl: e.target.value }))}
                  className="w-full rounded-2xl border-gray-200 bg-gray-50 px-4 py-3 text-gray-900"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500">
                  CTA
                </label>
                <textarea
                  value={metadata.ctaText || ""}
                  onChange={(e) => setMetadata((current) => ({ ...current, ctaText: e.target.value }))}
                  className="min-h-[100px] w-full rounded-2xl border-gray-200 bg-gray-50 px-4 py-3 text-gray-900"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500">
                  Tags para YouTube
                </label>
                <textarea
                  value={metadata.youtubeTags || ""}
                  onChange={(e) => setMetadata((current) => ({ ...current, youtubeTags: e.target.value }))}
                  className="min-h-[90px] w-full rounded-2xl border-gray-200 bg-gray-50 px-4 py-3 text-gray-900"
                  placeholder="smart tv, tv 4k, televisao, oferta..."
                />
                <div className="mt-2 text-xs font-semibold text-gray-400">
                  Separadas por virgula, prontas para SEO do YouTube.
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-xl font-black text-gray-900">Etapa 1 · Prompt e narração</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500">
                  Prompt enviado para IA
                </label>
                <textarea
                  value={project.promptPreview || ""}
                  onChange={(e) => setProject((current) => (current ? { ...current, promptPreview: e.target.value } : current))}
                  className="min-h-[220px] w-full rounded-2xl border-gray-200 bg-gray-50 px-4 py-3 font-mono text-sm text-gray-800"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500">
                  Narração
                </label>
                <textarea
                  value={project.narrationText || ""}
                  onChange={(e) => setProject((current) => (current ? { ...current, narrationText: e.target.value } : current))}
                  className="min-h-[240px] w-full rounded-2xl border-gray-200 bg-gray-50 px-4 py-3 text-gray-900"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500">
                  Descrição do vídeo
                </label>
                <textarea
                  value={project.description || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setProject((current) => (current ? { ...current, description: value } : current));
                    setMetadata((current) => ({ ...current, productDescription: value }));
                  }}
                  className="min-h-[140px] w-full rounded-2xl border-gray-200 bg-gray-50 px-4 py-3 text-gray-900"
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black text-gray-900">Etapa 1 · JSON do vídeo</h2>
              <button
                onClick={() => {
                  try {
                    const formatted = JSON.stringify(JSON.parse(project.videoSpecJson), null, 2);
                    setProject((current) => (current ? { ...current, videoSpecJson: formatted } : current));
                  } catch {}
                }}
                className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-black text-gray-700 hover:bg-emerald-600 hover:text-white"
              >
                Format
              </button>
            </div>
            <textarea
              value={project.videoSpecJson || "{}"}
              onChange={(e) => setProject((current) => (current ? { ...current, videoSpecJson: e.target.value } : current))}
              className="min-h-[420px] w-full rounded-2xl border-gray-200 bg-[#111827] p-5 font-mono text-xs text-gray-100"
              spellCheck={false}
            />
          </div>
        </div>

        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-black text-gray-900">Cores e saída</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500">
                  Fundo
                </label>
                <input
                  type="color"
                  value={metadata.primaryBgColor || "#1d4ed8"}
                  onChange={(e) => setMetadata((current) => ({ ...current, primaryBgColor: e.target.value }))}
                  className="h-12 w-full rounded-xl border-gray-200 bg-white p-1"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500">
                  Texto
                </label>
                <input
                  type="color"
                  value={metadata.primaryTextColor || "#ffffff"}
                  onChange={(e) => setMetadata((current) => ({ ...current, primaryTextColor: e.target.value }))}
                  className="h-12 w-full rounded-xl border-gray-200 bg-white p-1"
                />
              </div>
            </div>
            <div className="mt-4 rounded-2xl p-5 text-sm font-bold text-white" style={{ backgroundColor: metadata.primaryBgColor || "#1d4ed8", color: metadata.primaryTextColor || "#ffffff" }}>
              Preview rápido da combinação principal.
            </div>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-black text-gray-900">Assets enviados</h2>
            <div className="grid grid-cols-2 gap-3">
              {(metadata.assets || []).map((asset, index) => (
                <div key={`${asset.url}-${index}`} className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                  <div className="aspect-square bg-white">
                    {asset.kind === "VIDEO" ? (
                      <video src={asset.url} className="h-full w-full object-cover" />
                    ) : (
                      <img src={asset.url} alt={asset.name || `asset-${index + 1}`} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="p-3">
                    <div className="line-clamp-1 text-xs font-black text-gray-700">{asset.name || "Arquivo"}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{asset.kind || "IMAGE"}</div>
                  </div>
                </div>
              ))}
              {(metadata.assets || []).length === 0 && (
                <div className="col-span-full rounded-2xl border-2 border-dashed border-gray-200 p-6 text-center text-sm font-bold text-gray-400">
                  Nenhum asset salvo neste projeto.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-black text-gray-900">Etapa 2 · Resultado</h2>
            {project.videoUrl ? (
              <div className="space-y-4">
                <video controls src={project.videoUrl} className="w-full rounded-2xl bg-black" />
                <a
                  href={project.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 font-black text-white hover:bg-indigo-700"
                >
                  Abrir vídeo final
                </a>
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center text-sm font-bold text-gray-400">
                O vídeo final aparece aqui depois do render.
              </div>
            )}

            {project.audioUrl && (
              <div className="mt-4">
                <div className="mb-2 text-xs font-black uppercase tracking-wider text-gray-500">Narração gerada</div>
                <audio controls src={project.audioUrl} className="w-full" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
