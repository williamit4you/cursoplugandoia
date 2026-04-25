"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
  const [enqueueing, setEnqueueing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"content" | "settings" | "json">("content");

  const aspectRatioLabel = useMemo(() => {
    if (!project) return "";
    return project.aspectRatio === "LANDSCAPE_16_9" ? "YouTube (16:9)" : "Vertical (9:16)";
  }, [project]);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/video-code/projects/${id}`, { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setProject(data);
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
        if (data.status === "DONE" || data.status === "FAILED" || data.status === "READY") {
          if (data.status === "DONE") setRendering(false);
          if (data.status === "READY") setGenerating(false);
          clearInterval(iv);
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
      if (res.ok) {
        const data = await res.json();
        setProject(data);
      }
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
      if (res.ok) setProject(data);
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
      if (res.ok) {
        setProject(data);
        toast.success("Renderização iniciada!");
      } else {
        toast.error(data.error || "Erro ao renderizar");
        setRendering(false);
      }
    } catch {
      toast.error("Erro de conexão");
      setRendering(false);
    }
  };

  const enqueueSocial = async (platform: string, postType: string = "REEL") => {
    if (!project?.videoUrl) return;
    setEnqueueing(platform + postType);
    try {
      const res = await fetch("/api/social/enqueue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: project.videoUrl,
          summary: project.description || project.title || project.ideaPrompt,
          platform,
          postType,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Enfileirado para ${platform}! Vá em Fila de Stories para publicar.`);
      } else {
        toast.error(data.error || "Erro ao enfileirar");
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setEnqueueing(null);
    }
  };

  const del = async () => {
    if (!confirm("Excluir este projeto permanentemente?")) return;
    const res = await fetch(`/api/video-code/projects/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/admin/video-code");
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <ToastContainer position="top-right" autoClose={4000} />
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      <p className="text-gray-500 font-medium text-sm font-bold uppercase tracking-widest">Iniciando motor de vídeo...</p>
    </div>
  );
  if (!project) return <div className="p-12 text-center text-gray-500 font-bold bg-gray-50 rounded-2xl">Projeto não encontrado.</div>;

  return (
    <div className="max-w-6xl pb-24 animate-in fade-in duration-500">
      <ToastContainer position="top-right" autoClose={4000} />
      {/* Header & Navigation */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4 flex-1 min-w-0">
          <button 
            onClick={() => router.back()} 
            className="group flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-indigo-600 transition-colors"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Voltar para a lista
          </button>
          <div className="flex items-center gap-3">
             <h1 className="text-3xl font-black text-gray-900 tracking-tight truncate">
              {project.title?.trim() ? project.title : "Projeto sem título"}
            </h1>
            <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
              project.status === 'DONE' ? 'bg-emerald-100 text-emerald-700' : 
              project.status === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'
            }`}>
              {project.status === 'RENDERING' ? 'Renderizando' : project.status}
            </div>
          </div>
          <p className="text-gray-500 flex items-center gap-2 text-sm">
             <span className="font-bold text-indigo-600">{aspectRatioLabel}</span>
             <span className="text-gray-300">•</span>
             <span className="font-medium">{project.videoDurationSec} segundos</span>
             <span className="text-gray-300">•</span>
             <span className="font-medium">{project.fps} FPS</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={generate}
            disabled={generating || rendering}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 font-bold text-gray-700 shadow-sm hover:border-indigo-200 hover:text-indigo-600 transition-all disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            {generating ? "Gerando Roteiro..." : "Gerar com IA"}
          </button>
          <button
            onClick={renderMp4}
            disabled={rendering || generating || project.status === "RENDERING"}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-white font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            {(rendering || project.status === "RENDERING") ? "Renderizando..." : "Renderizar MP4"}
          </button>
          <button 
            onClick={save} 
            disabled={saving} 
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-white font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
             {saving ? "Salvando..." : "Salvar"}
          </button>
          <button 
            onClick={del} 
            className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all"
            title="Excluir Projeto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Editor & Config */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Status Messages */}
          {project.errorMessage && (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-5 flex gap-4 animate-in slide-in-from-top-2 duration-300">
               <div className="bg-white p-2 rounded-lg shadow-sm">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
               </div>
               <div>
                <div className="font-black text-red-900 text-sm">Erro na renderização</div>
                <div className="mt-1 text-sm text-red-700 whitespace-pre-wrap">{project.errorMessage}</div>
               </div>
            </div>
          )}

          {project.status === "RENDERING" && (
            <div className="rounded-3xl border border-indigo-100 bg-white p-8 shadow-2xl shadow-indigo-50 space-y-6 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between">
                <div className="text-lg font-black text-indigo-900 flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-indigo-600 animate-ping"></div>
                  Processando Vídeo...
                </div>
                <div className="text-sm font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl">
                  {Math.round(project.renderProgress)}%
                </div>
              </div>
              
              <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(79,70,229,0.5)]" 
                  style={{ width: `${project.renderProgress}%` }}
                ></div>
              </div>

              {/* Rendering Checklist */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {[
                  { label: "Gerando Narração (Voz IA)", min: 0 },
                  { label: "Sincronizando Legendas (Whisper)", min: 10 },
                  { label: "Renderizando Cenas (Remotion)", min: 20 },
                  { label: "Finalizando Arquivo MP4", min: 95 },
                ].map((step, i) => {
                  const isDone = project.renderProgress >= step.min + 5 || (step.min === 95 && project.renderProgress === 100);
                  const isCurrent = project.renderProgress >= step.min && !isDone;
                  return (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${isDone ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : isCurrent ? 'bg-indigo-50 border-indigo-100 text-indigo-700 scale-[1.02] shadow-sm' : 'bg-gray-50 border-gray-100 text-gray-400 opacity-60'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isDone ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-white'}`}>
                        {isDone ? (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                        ) : (
                          <span className="text-[10px] font-black">{i + 1}</span>
                        )}
                      </div>
                      <span className={`text-xs font-bold uppercase tracking-tight ${isCurrent ? 'animate-pulse' : ''}`}>{step.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-100 px-4 bg-gray-50/30">
              {[
                { id: 'content', label: 'Roteiro & Conteúdo', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
                { id: 'settings', label: 'Configurações', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
                { id: 'json', label: 'VideoSpec (Dev)', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-4 text-sm font-bold flex items-center gap-2 transition-all border-b-2 ${
                    activeTab === tab.id 
                      ? 'border-indigo-600 text-indigo-600 bg-white shadow-[0_2px_10px_rgba(79,70,229,0.05)]' 
                      : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-white'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon}></path></svg>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-8">
              {activeTab === 'content' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-gray-700 uppercase tracking-wider">Título do Vídeo</label>
                    <input
                      className="w-full rounded-2xl border-gray-200 bg-gray-50/50 px-5 py-4 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 transition-all font-bold text-lg"
                      value={project.title ?? ""}
                      placeholder="Ex: Como ganhar dinheiro com IA"
                      onChange={(e) => setProject((p) => (p ? { ...p, title: e.target.value } : p))}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-black text-gray-700 uppercase tracking-wider">Narração (Script)</label>
                      <textarea
                        className="w-full rounded-2xl border-gray-200 bg-gray-50/50 px-5 py-4 min-h-[300px] text-gray-800 focus:border-indigo-500 focus:ring-indigo-500 transition-all leading-relaxed"
                        value={project.narrationText ?? ""}
                        placeholder="O texto que a IA vai falar..."
                        onChange={(e) => setProject((p) => (p ? { ...p, narrationText: e.target.value } : p))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-black text-gray-700 uppercase tracking-wider">Descrição / Notas</label>
                      <textarea
                        className="w-full rounded-2xl border-gray-200 bg-gray-50/50 px-5 py-4 min-h-[300px] text-gray-800 focus:border-indigo-500 focus:ring-indigo-500 transition-all leading-relaxed"
                        value={project.description ?? ""}
                        placeholder="Detalhes sobre o conteúdo ou contexto..."
                        onChange={(e) => setProject((p) => (p ? { ...p, description: e.target.value } : p))}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest border-l-4 border-indigo-500 pl-3">Voz e Velocidade</h3>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400">Voz Selecionada</label>
                        <select
                          className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 font-bold text-gray-800"
                          value={project.ttsVoice}
                          onChange={(e) => setProject((p) => (p ? { ...p, ttsVoice: e.target.value } : p))}
                        >
                          <option value="pt-BR-AntonioNeural">Antônio (Masculino, Viral)</option>
                          <option value="pt-BR-FranciscaNeural">Francisca (Feminino, Suave)</option>
                          <option value="pt-BR-DonatoNeural">Donato (Masculino, Forte)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold text-gray-400">
                          <label>Velocidade do Pitch</label>
                          <span className="text-indigo-600 font-black">{project.ttsSpeed}</span>
                        </div>
                        <input
                          className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 font-mono font-bold"
                          value={project.ttsSpeed}
                          onChange={(e) => setProject((p) => (p ? { ...p, ttsSpeed: e.target.value } : p))}
                          placeholder="+5%"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest border-l-4 border-emerald-500 pl-3">Formato & Técnico</h3>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400">Formato de Saída</label>
                        <select
                          className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 font-bold text-gray-800"
                          value={project.aspectRatio}
                          onChange={(e) => setProject((p) => (p ? { ...p, aspectRatio: e.target.value as AspectRatio } : p))}
                        >
                          <option value="PORTRAIT_9_16">9:16 (TikTok / Reels / Shorts)</option>
                          <option value="LANDSCAPE_16_9">16:9 (YouTube Desktop / TV)</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400">Duração (seg)</label>
                          <input
                            type="number"
                            className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 font-bold"
                            value={project.videoDurationSec}
                            onChange={(e) => setProject((p) => (p ? { ...p, videoDurationSec: Number(e.target.value) } : p))}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400">FPS</label>
                          <input
                            type="number"
                            className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 font-bold"
                            value={project.fps}
                            onChange={(e) => setProject((p) => (p ? { ...p, fps: Number(e.target.value) } : p))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-black text-gray-700 uppercase tracking-wider">Comando de Origem (Idea Prompt)</label>
                    <textarea
                      className="w-full rounded-2xl border-gray-200 bg-gray-50/50 px-5 py-4 min-h-[100px] text-gray-500 italic text-sm"
                      value={project.ideaPrompt}
                      readOnly
                    />
                  </div>
                </div>
              )}

              {activeTab === 'json' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Estrutura de Cenas do Remotion</div>
                    <div className="flex gap-2">
                       <button onClick={() => {
                         try {
                           const formatted = JSON.stringify(JSON.parse(project.videoSpecJson), null, 2);
                           setProject(p => p ? {...p, videoSpecJson: formatted} : p);
                         } catch(e) {}
                       }} className="text-[10px] font-black bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-indigo-600 hover:text-white transition-all">FORMATAR</button>
                    </div>
                  </div>
                  <textarea
                    className="w-full rounded-2xl border-gray-200 bg-[#1e1e1e] text-[#d4d4d4] p-6 min-h-[500px] font-mono text-xs leading-relaxed shadow-inner"
                    spellCheck={false}
                    value={project.videoSpecJson ?? "{}"}
                    onChange={(e) => setProject((p) => (p ? { ...p, videoSpecJson: e.target.value } : p))}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Previews & History */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Result Card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 font-black text-xs text-gray-400 uppercase tracking-widest flex justify-between">
              <span>Preview Final</span>
              {project.status === 'DONE' && <span className="text-emerald-600 animate-pulse">● PRONTO</span>}
            </div>
            <div className="p-6 space-y-6">
              {project.videoUrl ? (
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden bg-black shadow-2xl group border-4 border-indigo-50">
                    <video 
                      controls 
                      autoPlay={project.status === 'DONE'}
                      src={project.videoUrl} 
                      className="w-full h-auto aspect-[9/16] object-cover" 
                    />
                    <div className="absolute inset-0 pointer-events-none border border-white/10 rounded-2xl"></div>
                  </div>
                  <a 
                    href={project.videoUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    Baixar Vídeo MP4
                  </a>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => enqueueSocial("META", "STORY")}
                      disabled={enqueueing != null}
                      className="rounded-xl border border-pink-100 bg-pink-50 px-4 py-2 text-xs font-bold text-pink-700 hover:bg-pink-100 disabled:opacity-50"
                    >
                      {enqueueing === "METASTORY" ? "..." : "Meta Story"}
                    </button>
                    <button
                      onClick={() => enqueueSocial("META", "REEL")}
                      disabled={enqueueing != null}
                      className="rounded-xl border border-purple-100 bg-purple-50 px-4 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100 disabled:opacity-50"
                    >
                      {enqueueing === "METAREEL" ? "..." : "Meta Reels"}
                    </button>
                    <button
                      onClick={() => enqueueSocial("LINKEDIN", "REEL")}
                      disabled={enqueueing != null}
                      className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    >
                      {enqueueing === "LINKEDINREEL" ? "..." : "LinkedIn"}
                    </button>
                    <button
                      onClick={() => enqueueSocial("YOUTUBE", "REEL")}
                      disabled={enqueueing != null}
                      className="rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
                    >
                      {enqueueing === "YOUTUBEREEL" ? "..." : "YouTube"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="aspect-[9/16] rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                  </div>
                  <p className="text-gray-400 text-sm font-bold leading-tight">Vídeo ainda não disponível.</p>
                  <p className="text-gray-300 text-[10px] mt-2 font-bold uppercase tracking-tighter italic">Configure o roteiro e clique em &quot;Renderizar MP4&quot;.</p>
                </div>
              )}

              {project.audioUrl && (
                <div className="pt-4 border-t border-gray-50 space-y-3">
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex justify-between items-center">
                    <span>Narração Gerada</span>
                    <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">OK</span>
                  </div>
                  <audio controls src={project.audioUrl} className="w-full h-10 custom-audio" />
                </div>
              )}
            </div>
          </div>

          {/* Timeline Card / Helper */}
          <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
               <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <h4 className="font-black text-lg mb-2 relative z-10 tracking-tight">Dica de Especialista</h4>
            <p className="text-indigo-100 text-xs leading-relaxed font-medium relative z-10">
              O vídeo completo demora mais para processar que o áudio. Acompanhe o checklist ao lado para ver em qual etapa estamos!
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
