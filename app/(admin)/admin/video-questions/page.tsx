"use client";

import { useEffect, useMemo, useState, useRef } from "react";

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

function StatusPill({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string; label: string }> = {
    PENDING: { bg: "#f3f4f6", color: "#374151", label: "Pendente" },
    PROCESSING: { bg: "#fef3c7", color: "#92400e", label: "Processando" },
    DONE: { bg: "#d1fae5", color: "#065f46", label: "Concluído" },
    FAILED: { bg: "#fee2e2", color: "#991b1b", label: "Falhou" },
  };
  const c = cfg[status] || cfg.PENDING;
  return (
    <span style={{ background: c.bg, color: c.color, padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 800 }}>
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
        alert(data?.error || "Erro ao criar pergunta");
        return;
      }
      setQuestionText("");
      setUseExternalMedia(false);
      setShowCreateModal(false);
      await fetchAll(1, search);
    } catch {
      alert("Erro de conexão");
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
        alert(data?.error || "Erro ao enfileirar");
        return;
      }
      alert("Enfileirado! Vá em Fila de Stories para publicar.");
    } catch {
      alert("Erro de conexão");
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

      alert("Geração iniciada! Você pode ver o roteiro agora.");
      await fetchAll();
    } catch (err: any) {
      alert(err.message || "Erro ao gerar");
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
        alert(`Importado com sucesso! Foram criadas ${data.count} perguntas na fila.`);
        setPage(1);
        fetchAll(1, search);
      } else {
        alert(data.error || "Erro ao importar CSV");
      }
    } catch (err) {
      alert("Erro de conexão ao importar");
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
    <div>
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Perguntas → vídeos</h1>
          <p className="text-sm text-gray-600">
            Armazene perguntas, gere vídeos automaticamente no intervalo configurado e acompanhe o checklist.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Concluídos: <b>{doneCount}</b> / {questions.length} {refreshing ? "• atualizando..." : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleCSVUpload} 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Importar CSV
          </button>
          <button
            onClick={downloadCSVTemplate}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Baixar Modelo CSV
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            + Criar Nova Pergunta
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
        <div className="relative w-full md:w-96">
          <input
            type="text"
            className="w-full rounded-md border pl-10 pr-4 py-2"
            placeholder="Buscar perguntas..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {questions.map((q) => (
          <div key={q.id} className="rounded-lg border bg-white p-4">
            <div className="flex flex-col md:flex-row items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <StatusPill status={q.status} />
                  <span className="text-xs text-gray-500">{new Date(q.createdAt).toLocaleString("pt-BR")}</span>
                  {q.useExternalMedia && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-600">Pexels</span>
                  )}
                </div>
                <div className="mt-2 font-bold text-gray-900 text-lg">{q.questionText}</div>
                {q.errorMessage ? (
                  <div className="mt-2 text-sm text-red-700 whitespace-pre-wrap">{q.errorMessage}</div>
                ) : null}
                {q.codeVideoProject?.videoUrl ? (
                  <div className="mt-2 text-sm">
                    <a className="text-indigo-700 underline font-bold flex items-center gap-1" href={q.codeVideoProject.videoUrl} target="_blank" rel="noreferrer">
                      Abrir MP4
                    </a>
                  </div>
                ) : null}
                {q.codeVideoProjectId ? (
                   <div className="mt-1 text-sm flex gap-3">
                    <a className="text-indigo-600 underline hover:text-indigo-800" href={`/admin/video-code/${q.codeVideoProjectId}`}>
                      Ver Roteiro / Editar
                    </a>
                  </div>
                ) : (
                  <button 
                    disabled={generatingId != null}
                    onClick={() => generateNow(q)}
                    className="mt-3 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md px-3 py-1 text-xs font-bold hover:bg-indigo-100 transition-colors"
                  >
                    {generatingId === q.id ? "Gerando..." : "Gerar Vídeo Agora"}
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-2 w-full md:w-auto min-w-[240px]">
                <label className="flex items-center gap-2 text-sm font-semibold justify-end mb-2">
                  <input type="checkbox" readOnly checked={q.status === "DONE"} />
                  Vídeo concluído
                </label>

                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    onClick={() => enqueueSocial(q.id, "META", "STORY")}
                    disabled={enqueueing != null}
                    className="rounded-md border px-3 py-1 text-xs font-semibold bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100"
                    title="Envia para a fila social (Meta Story)"
                  >
                    Meta (Story)
                  </button>
                  <button
                    onClick={() => enqueueSocial(q.id, "META", "REEL")}
                    disabled={enqueueing != null}
                    className="rounded-md border px-3 py-1 text-xs font-semibold bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                    title="Envia para a fila social (Meta Reels)"
                  >
                    Meta (Reels)
                  </button>
                  <button
                    onClick={() => enqueueSocial(q.id, "TIKTOK", "REEL")}
                    disabled={enqueueing != null}
                    className="rounded-md border px-3 py-1 text-xs font-semibold hover:bg-gray-50"
                  >
                    TikTok
                  </button>
                  <button
                    onClick={() => enqueueSocial(q.id, "LINKEDIN", "REEL")}
                    disabled={enqueueing != null}
                    className="rounded-md border px-3 py-1 text-xs font-semibold hover:bg-gray-50"
                  >
                    LinkedIn
                  </button>
                </div>

                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => del(q.id)}
                    className="rounded-md border px-3 py-1 text-xs font-semibold text-red-700 border-red-200 hover:bg-red-50"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {questions.length === 0 ? (
          <div className="rounded-lg border bg-white p-12 text-center text-gray-500">
            {search ? "Nenhuma pergunta encontrada para esta busca." : "Nenhuma pergunta cadastrada."}
          </div>
        ) : null}

        {pagination && pagination.totalPages > 1 ? (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 rounded-md border bg-white font-semibold text-gray-700 disabled:opacity-50 hover:bg-gray-50"
            >
              Anterior
            </button>
            <div className="text-sm font-semibold px-4">
              Página {page} de {pagination.totalPages}
            </div>
            <button
              disabled={page === pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-md border bg-white font-semibold text-gray-700 disabled:opacity-50 hover:bg-gray-50"
            >
              Próxima
            </button>
          </div>
        ) : null}
      </div>

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
