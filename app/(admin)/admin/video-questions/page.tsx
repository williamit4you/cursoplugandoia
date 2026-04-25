"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const SECRET = process.env.NEXT_PUBLIC_WORKER_SECRET || "super-secret-worker-key-123";

type Question = {
  id: string;
  questionText: string;
  status: string;
  errorMessage: string | null;
  createdAt: string;
  useExternalMedia: boolean;
  codeVideoProjectId: string | null;
  codeVideoProject?: { id: string; status: string; title: string | null; videoUrl: string | null } | null;
};

type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

function StatusPill({ status, projectStatus }: { status: string, projectStatus?: string }) {
  const cfg: Record<string, { bg: string; color: string; label: string; dot: string }> = {
    PENDING:    { bg: "#f3f4f6", color: "#6b7280", label: "Pendente",     dot: "#9ca3af" },
    PROCESSING: { bg: "#eff6ff", color: "#1d4ed8", label: "Roteiro/IA",  dot: "#3b82f6" },
    RENDERING:  { bg: "#fff7ed", color: "#c2410c", label: "MP4/Vídeo",   dot: "#f97316" },
    DONE:       { bg: "#ecfdf5", color: "#047857", label: "Concluído",   dot: "#10b981" },
    FAILED:     { bg: "#fef2f2", color: "#b91c1c", label: "Erro",       dot: "#ef4444" },
  };

  let effectiveStatus = status;
  if ((status === "PROCESSING" || status === "PENDING") && projectStatus === "RENDERING") {
    effectiveStatus = "RENDERING";
  }

  const c = cfg[effectiveStatus] || cfg.PENDING;
  const isPulse = effectiveStatus === "PROCESSING" || effectiveStatus === "RENDERING";
  
  return (
    <span 
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all ${isPulse ? "animate-pulse" : ""}`}
      style={{ background: c.bg, color: c.color, borderColor: `${c.color}20` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} />
      {c.label}
    </span>
  );
}

export default function VideoQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [useExternalMedia, setUseExternalMedia] = useState(false);
  
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [enqueueing, setEnqueueing] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const doneCount = useMemo(() => questions.filter((q) => q.status === "DONE").length, [questions]);

  const fetchAll = async (p = page, s = search) => {
    setRefreshing(true);
    try {
      const qs = new URLSearchParams({
        page: String(p),
        limit: "10",
        search: s,
      });
      const res = await fetch(`/api/video-questions?${qs.toString()}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions);
        setPagination(data.pagination);
      }
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAll(page, search);
    const iv = setInterval(() => fetchAll(page, search), 10000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1); // Reset page when searching
  };

  const create = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/video-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionText, useExternalMedia }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Erro ao criar pergunta");
        return;
      }
      setQuestionText("");
      setUseExternalMedia(false);
      setShowCreateModal(false);
      toast.success("Pergunta criada com sucesso!");
      await fetchAll(1, search);
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setCreating(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Excluir esta pergunta?")) return;
    const res = await fetch(`/api/video-questions/${id}`, { method: "DELETE" });
    if (res.ok) fetchAll();
  };

  const enqueueSocial = async (id: string, platform: "META" | "TIKTOK" | "LINKEDIN" | "YOUTUBE", postType: "STORY" | "REEL" = "REEL") => {
    setEnqueueing(id + platform + postType);
    try {
      const res = await fetch(`/api/video-questions/${id}/enqueue-social`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-worker-secret": SECRET },
        body: JSON.stringify({ platform, postType }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Erro ao enfileirar");
        return;
      }
      toast.success(`Postagem para ${platform} enfileirada com sucesso!`);
      fetchAll(page, search);
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setEnqueueing(null);
    }
  };

  const generateNow = async (q: Question) => {
    setGeneratingId(q.id);
    try {
      const cfgRes = await fetch("/api/video-questions/config", { headers: { "x-worker-secret": SECRET } });
      if (!cfgRes.ok) throw new Error("Falha ao obter configuração");
      const cfg = await cfgRes.json();

      const projRes = await fetch("/api/video-code/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaPrompt: q.questionText,
          useExternalMedia: q.useExternalMedia,
          aspectRatio: cfg.defaultAspectRatio || "PORTRAIT_9_16",
          videoDurationSec: cfg.videoDurationSec || 30,
          ttsVoice: cfg.ttsVoice || "pt-BR-AntonioNeural",
          ttsSpeed: cfg.ttsSpeed || "+5%",
        }),
      });
      if (!projRes.ok) throw new Error("Falha ao criar projeto");
      const project = await projRes.json();

      await fetch(`/api/video-questions/${q.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codeVideoProjectId: project.id, status: "PROCESSING" }),
      });

      const genRes = await fetch("/api/video-code/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      });
      if (!genRes.ok) throw new Error("Falha na geração por IA");

      toast.success("Geração iniciada! Você pode ver o roteiro agora.");
      await fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar");
    } finally {
      setGeneratingId(null);
    }
  };

  const runWorker = async () => {
    if (!confirm("Isso irá buscar a próxima pergunta pendente e iniciar a geração completa do vídeo (Roteiro + MP4). Deseja continuar?")) return;
    setGeneratingId("worker-manual");
    try {
      const res = await fetch("/api/worker/process-next-question", {
        method: "POST",
        headers: { "x-worker-secret": SECRET },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("🚀 Automação iniciada! O vídeo está sendo gerado em segundo plano.");
        fetchAll(1, search);
      } else {
        toast.error(data.error || "Erro ao iniciar automação");
      }
    } catch {
      toast.error("Erro de conexão com o worker");
    } finally {
      setGeneratingId(null);
    }
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const res = await fetch("/api/video-questions/import", {
        method: "POST",
        body: text,
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Importado com sucesso! Foram criadas ${data.count} perguntas na fila.`);
        setPage(1);
        fetchAll(1, search);
      } else {
        toast.error(data.error || "Erro ao importar CSV");
      }
    } catch (err) {
      toast.error("Erro de conexão ao importar");
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadCSVTemplate = () => {
    const csvContent = "pergunta,usar_pexels\n\"O que é um banco de dados relacional?\",true\n\"Como investir na bolsa?\",false";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "exemplo_perguntas.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="pb-10">
      <ToastContainer position="top-right" autoClose={4000} />
      
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Perguntas → Vídeos</h1>
          <p className="text-gray-500 text-sm font-medium">Gerencie a produção automática e postagem social.</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
              Concluídos: {doneCount} / {questions.length}
            </span>
            {refreshing && <span className="text-[10px] font-bold text-indigo-400 animate-pulse">Atualizando...</span>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
            <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleImportCsv} />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
            >
              Importar CSV
            </button>
            <button 
              onClick={downloadCSVTemplate}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
            >
              Baixar Modelo
            </button>
          </div>

          <button 
            onClick={() => fetchAll(page, search)}
            className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-400 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-lg transition-all shadow-sm"
            title="Atualizar lista"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          </button>

          <button 
            onClick={runWorker}
            disabled={generatingId === "worker-manual"}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all active:scale-95 disabled:opacity-50"
          >
            {generatingId === "worker-manual" ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            )}
            RODAR AGORA
          </button>

          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-black text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
            NOVA PERGUNTA
          </button>
        </div>
      </div>

      {/* Busca e Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6">
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <input 
            type="text" 
            placeholder="Buscar por conteúdo da pergunta..." 
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 outline-none transition-all text-sm font-medium"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Tabela de Perguntas */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Pergunta / Título</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Mídias</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Redes Sociais</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {questions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400 italic">
                    Nenhuma pergunta encontrada.
                  </td>
                </tr>
              ) : (
                questions.map((q) => {
                  const project = q.codeVideoProject;
                  const socialPosts = project?.socialPosts || [];
                  
                  const PlatformBadge = ({ platform, color }: { platform: string, color: string }) => {
                    const post = socialPosts.find(p => p.platform === platform);
                    const status = post?.status || "NONE";
                    
                    let opacity = "opacity-20 grayscale";
                    let tooltip = `Não enfileirado para ${platform}`;
                    const views = post?.views || 0;

                    if (status === "POSTED") {
                      opacity = "opacity-100";
                      tooltip = `Publicado no ${platform} em ${new Date(post?.postedAt!).toLocaleString("pt-BR")}. Views: ${views}`;
                    } else if (status !== "NONE") {
                      opacity = "opacity-60";
                      tooltip = `Enfileirado/Processando no ${platform}`;
                    }

                    return (
                      <div className="flex flex-col items-center">
                        <span 
                          title={tooltip}
                          style={{ backgroundColor: status === "POSTED" ? color : '#f3f4f6', color: status === "POSTED" ? 'white' : '#9ca3af' }}
                          className={`inline-flex items-center justify-center px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter ${opacity} transition-all cursor-help`}
                        >
                          {platform.slice(0, 2)}
                        </span>
                        {status === "POSTED" && views > 0 && (
                          <span className="text-[8px] font-bold text-gray-400 mt-0.5">{views}</span>
                        )}
                      </div>
                    );
                  };

                  return (
                    <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="max-w-md">
                          <p className="text-sm font-semibold text-gray-900 line-clamp-2" title={q.questionText}>
                            {q.questionText}
                          </p>
                          {project?.title && (
                            <p className="text-xs text-indigo-600 mt-1 font-medium italic">
                              Título: {project.title}
                            </p>
                          )}
                          <p className="text-[10px] text-gray-400 mt-1">
                            ID: {q.id} • {new Date(q.createdAt).toLocaleString("pt-BR")}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusPill status={q.status} projectStatus={project?.status} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {q.useExternalMedia ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100">Pexels</span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-50 text-gray-500 border border-gray-100">Codigos</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <PlatformBadge platform="META" color="#E1306C" />
                          <PlatformBadge platform="YOUTUBE" color="#FF0000" />
                          <PlatformBadge platform="TIKTOK" color="#000000" />
                          <PlatformBadge platform="LINKEDIN" color="#0A66C2" />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right space-y-2">
                        {project ? (
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex gap-2">
                              <a 
                                href={`/admin/video-code/${project.id}`}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors"
                              >
                                Abrir Editor
                              </a>
                              {project.videoUrl && (
                                <a 
                                  href={project.videoUrl} target="_blank"
                                  className="text-xs font-bold text-emerald-600 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 transition-colors"
                                >
                                  Ver MP4
                                </a>
                              )}
                            </div>
                            
                            {project.videoUrl && (
                              <div className="flex gap-1 flex-wrap justify-end max-w-[200px]">
                                {[{ p: "META", t: "REEL", c: "pink" }, { p: "YOUTUBE", t: "REEL", c: "red" }, { p: "TIKTOK", t: "REEL", c: "gray" }, { p: "LINKEDIN", t: "REEL", c: "blue" }].map(({ p, t, c }) => {
                                  const already = socialPosts.some(sp => sp.platform === p && sp.postType === t && sp.status !== "FAILED");
                                  return (
                                    <button 
                                      key={p + t}
                                      onClick={() => enqueueSocial(q.id, p, t)}
                                      disabled={enqueueing != null || already}
                                      className={`text-[9px] font-black px-2 py-1 rounded bg-${c}-50 text-${c}-700 border border-${c}-100 hover:bg-${c}-100 disabled:opacity-30 disabled:cursor-not-allowed uppercase transition-all`}
                                    >
                                      {p.slice(0, 4)}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                            <button 
                              onClick={() => deleteQuestion(q.id)}
                              className="text-[10px] text-red-400 hover:text-red-600 font-bold uppercase tracking-widest mt-1 opacity-40 hover:opacity-100 transition-opacity"
                            >
                              Excluir
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-end gap-2">
                            <button 
                              disabled={generatingId != null || q.status === "PROCESSING" || q.status === "RENDERING"}
                              onClick={() => generateNow(q)}
                              className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-xs font-bold hover:bg-indigo-700 shadow-sm transition-all disabled:opacity-50"
                            >
                              {generatingId === q.id ? "Iniciando..." : (q.status === "PROCESSING" || q.status === "RENDERING") ? "Processando..." : "Gerar Vídeo Agora"}
                            </button>
                            <button 
                              onClick={() => deleteQuestion(q.id)}
                              className="text-[10px] text-red-400 hover:text-red-600 font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
                            >
                              Excluir
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginação */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8 bg-white p-4 rounded-xl border border-gray-100 shadow-sm w-fit mx-auto">
          <button 
            disabled={page === 1}
            onClick={() => { setPage(page - 1); fetchAll(page - 1, search); }}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <span className="text-sm font-bold text-gray-700">Página {page} de {pagination.totalPages}</span>
          <button 
            disabled={page === pagination.totalPages}
            onClick={() => { setPage(page + 1); fetchAll(page + 1, search); }}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
          </button>
        </div>
      )}

      {/* Modal Criar Pergunta */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-900">Criar Nova Pergunta</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Texto da Pergunta / Ideia</label>
                <textarea
                  className="w-full rounded-md border-gray-300 border px-4 py-3 min-h-[120px] focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder='Ex.: "Explique o que é um banco de dados"'
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer p-3 border rounded-md hover:bg-gray-50">
                  <input type="checkbox" checked={useExternalMedia} onChange={(e) => setUseExternalMedia(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" />
                  Usar mídias externas (Pexels)
                </label>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 font-semibold text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={create}
                disabled={creating || questionText.trim().length === 0}
                className="px-4 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors disabled:opacity-50"
              >
                {creating ? "Salvando..." : "Salvar Pergunta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
