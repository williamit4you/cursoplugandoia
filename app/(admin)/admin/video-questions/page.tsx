"use client";

import { useEffect, useMemo, useState } from "react";

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
  const [questionText, setQuestionText] = useState("");
  const [useExternalMedia, setUseExternalMedia] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [enqueueing, setEnqueueing] = useState<string | null>(null);

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

  const enqueueSocial = async (id: string, platform: "META" | "TIKTOK" | "LINKEDIN" | "YOUTUBE") => {
    setEnqueueing(id + platform);
    try {
      const res = await fetch(`/api/video-questions/${id}/enqueue-social`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-worker-secret": SECRET },
        body: JSON.stringify({ platform }),
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

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Perguntas → vídeos</h1>
          <p className="text-sm text-gray-600">
            Armazene perguntas, gere vídeos automaticamente no intervalo configurado e acompanhe o checklist.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Concluídos: <b>{doneCount}</b> / {questions.length} {refreshing ? "• atualizando..." : ""}
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-5 mb-4 space-y-3">
        <div className="text-sm font-semibold">Adicionar pergunta</div>
        <textarea
          className="w-full rounded-md border px-3 py-2 min-h-[100px]"
          placeholder='Ex.: "Explique o que é um banco de dados"'
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
            <input type="checkbox" checked={useExternalMedia} onChange={(e) => setUseExternalMedia(e.target.checked)} />
            Usar mídias externas (Pexels)
          </label>
          <button
            onClick={create}
            disabled={creating || questionText.trim().length === 0}
            className="rounded-md bg-indigo-600 px-4 py-2 text-white font-semibold disabled:opacity-50"
          >
            {creating ? "Criando..." : "Salvar pergunta"}
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
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <StatusPill status={q.status} />
                  <span className="text-xs text-gray-500">{new Date(q.createdAt).toLocaleString("pt-BR")}</span>
                </div>
                <div className="mt-2 font-bold text-gray-900">{q.questionText}</div>
                {q.errorMessage ? (
                  <div className="mt-2 text-sm text-red-700 whitespace-pre-wrap">{q.errorMessage}</div>
                ) : null}
                {q.codeVideoProject?.videoUrl ? (
                  <div className="mt-2 text-sm">
                    <a className="text-indigo-700 underline font-bold" href={q.codeVideoProject.videoUrl} target="_blank" rel="noreferrer">
                      Abrir MP4
                    </a>
                  </div>
                ) : null}
                {q.codeVideoProjectId ? (
                   <div className="mt-1 text-sm">
                    <a className="text-indigo-600 underline" href={`/admin/video-code/${q.codeVideoProjectId}`}>
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

              <div className="flex flex-col gap-2 min-w-[220px]">
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input type="checkbox" readOnly checked={q.status === "DONE"} />
                  Vídeo concluído
                </label>

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => enqueueSocial(q.id, "META")}
                    disabled={enqueueing != null}
                    className="rounded-md border px-3 py-1 text-xs font-semibold"
                    title="Envia para a fila social (Meta)"
                  >
                    Meta
                  </button>
                  <button
                    onClick={() => enqueueSocial(q.id, "TIKTOK")}
                    disabled={enqueueing != null}
                    className="rounded-md border px-3 py-1 text-xs font-semibold"
                  >
                    TikTok
                  </button>
                  <button
                    onClick={() => enqueueSocial(q.id, "LINKEDIN")}
                    disabled={enqueueing != null}
                    className="rounded-md border px-3 py-1 text-xs font-semibold"
                  >
                    LinkedIn
                  </button>
                  <button
                    onClick={() => enqueueSocial(q.id, "YOUTUBE")}
                    disabled={enqueueing != null}
                    className="rounded-md border px-3 py-1 text-xs font-semibold"
                    title="Em breve"
                  >
                    YouTube
                  </button>
                </div>

                <button
                  onClick={() => del(q.id)}
                  className="rounded-md border px-3 py-1 text-xs font-semibold text-red-700 border-red-200"
                >
                  Excluir
                </button>
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
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 rounded border bg-white disabled:opacity-50"
            >
              Anterior
            </button>
            <div className="text-sm font-semibold">
              Página {page} de {pagination.totalPages}
            </div>
            <button
              disabled={page === pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 rounded border bg-white disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

