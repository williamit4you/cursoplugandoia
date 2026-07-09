"use client";

import { useEffect, useMemo, useState } from "react";
import { signOut } from "next-auth/react";

type JobEvent = {
  id: string;
  createdAt: string;
  level: string;
  stepName: string | null;
  message: string;
};

type Job = {
  id: string;
  originalFilename: string | null;
  status: string;
  progressPercent: number;
  currentStep: string | null;
  estimatedSecondsLeft: number | null;
  createdAt: string;
  inputUrl: string | null;
  outputUrl: string | null;
  affiliateUrl?: string | null;
  logoUrl: string | null;
  instagramHandle: string | null;
  showTopMessage?: boolean;
  audioMode: string;
  audioVolumePercent: number;
  isPublished?: boolean;
  publishedAt?: string | null;
  errorMessage: string | null;
  events?: JobEvent[];
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

function formatEta(seconds: number | null) {
  if (!seconds || seconds <= 0) return "pronto";
  if (seconds < 60) return `${seconds}s`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}m ${sec}s`;
}

function statusBadge(status: string) {
  if (status === "READY") return "bg-emerald-500/15 text-emerald-200 border-emerald-400/20";
  if (status === "FAILED") return "bg-red-500/15 text-red-200 border-red-400/20";
  if (status === "PROCESSING") return "bg-amber-500/15 text-amber-100 border-amber-300/20";
  return "bg-white/10 text-slate-100 border-white/10";
}

const audioModeOptions = [
  { value: "PRESERVE", label: "Preservar", hint: "Mantém o áudio original" },
  { value: "REDUCE", label: "Reduzir", hint: "Diminui o volume" },
  { value: "MUTE", label: "Mutar", hint: "Remove o áudio" },
];

export function LimpezaVideoApp() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [instagramHandle, setInstagramHandle] = useState("@compraesperta.promocoes");
  const [audioMode, setAudioMode] = useState("PRESERVE");
  const [audioVolumePercent, setAudioVolumePercent] = useState(100);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [affiliateUrlDraft, setAffiliateUrlDraft] = useState("");
  const [publishedDraft, setPublishedDraft] = useState(false);
  const [showTopMessage, setShowTopMessage] = useState(true);
  const [showTopMessageDraft, setShowTopMessageDraft] = useState(true);

  async function loadJobs(targetPage = page) {
    const res = await fetch(`/api/limpezavideo/jobs?page=${targetPage}&pageSize=10`, { cache: "no-store" });
    if (!res.ok) throw new Error("Falha ao carregar jobs.");
    const data = await res.json();
    setJobs(data.items || []);
    setPagination(data.pagination || pagination);
    setPage(targetPage);
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadJobs(1)
      .catch((err: any) => {
        if (active) setError(err?.message || "Falha ao carregar.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      loadJobs(page).catch(() => null);
    }, 4000);
    return () => clearInterval(timer);
  }, [page]);

  const selectedJob = useMemo(() => jobs.find((job) => job.id === selectedJobId) || jobs[0] || null, [jobs, selectedJobId]);

  useEffect(() => {
    setAffiliateUrlDraft(selectedJob?.affiliateUrl || "");
    setPublishedDraft(Boolean(selectedJob?.isPublished));
    setShowTopMessageDraft(selectedJob?.showTopMessage ?? true);
  }, [selectedJob?.id, selectedJob?.affiliateUrl, selectedJob?.isPublished, selectedJob?.showTopMessage]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 2200);
    return () => clearTimeout(timer);
  }, [notice]);

  async function handleSubmit() {
    if (!file) {
      setError("Escolha um vídeo antes de enviar.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (logo) formData.append("logo", logo);
      formData.append("instagramHandle", instagramHandle);
      formData.append("showTopMessage", showTopMessage ? "true" : "false");
      formData.append("audioMode", audioMode);
      formData.append("audioVolumePercent", String(audioVolumePercent));

      const createRes = await fetch("/api/limpezavideo/jobs", {
        method: "POST",
        body: formData,
      });
      const createData = await createRes.json().catch(() => ({}));
      if (!createRes.ok) throw new Error(createData?.error || "Falha ao criar job.");

      const createdJob = createData.job as Job;
      setSelectedJobId(createdJob.id);
      setFormOpen(false);
      setFile(null);
      setLogo(null);

      await fetch(`/api/limpezavideo/jobs/${createdJob.id}/process`, {
        method: "POST",
      });

      await loadJobs(1);
      setNotice("Upload enviado e processamento iniciado.");
    } catch (err: any) {
      setError(err?.message || "Falha no upload.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRetry(jobId: string) {
    await fetch(`/api/limpezavideo/jobs/${jobId}/retry`, { method: "POST" });
    await loadJobs(page);
    setNotice("Job reenfileirado.");
  }

  async function handleSaveJobMeta() {
    if (!selectedJob) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/limpezavideo/jobs/${selectedJob.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          affiliateUrl: affiliateUrlDraft,
          isPublished: publishedDraft,
          showTopMessage: showTopMessageDraft,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Falha ao salvar.");
      await loadJobs(page);
      setNotice("Informações salvas.");
    } catch (err: any) {
      setError(err?.message || "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCopyAffiliate() {
    if (!affiliateUrlDraft.trim()) {
      setError("Preencha o link de afiliado antes de copiar.");
      return;
    }
    try {
      await navigator.clipboard.writeText(affiliateUrlDraft.trim());
      setNotice("Link copiado");
    } catch {
      setError("Não foi possível copiar o link.");
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#164e63_0%,#0f172a_42%,#020617_100%)] text-white">
      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4 md:px-6 md:py-8">
        <section className="rounded-[30px] border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100">
                Microsaas independente
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">LimpezaVideo</h1>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-200/80 md:text-base">
                Faça upload do vídeo, opcionalmente envie o logo, e o sistema dispara o pipeline no worker para limpar, recodificar e devolver a URL final tratada no MinIO.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10" onClick={() => setFormOpen((value) => !value)}>
                {formOpen ? "Fechar" : "Novo"}
              </button>
              <button className="rounded-2xl border border-cyan-300/20 bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200" onClick={() => signOut({ callbackUrl: "/limpezavideo/login" })}>
                Sair
              </button>
            </div>
          </div>

          {formOpen ? (
            <div className="mt-6 grid gap-4 rounded-[28px] border border-white/10 bg-slate-950/40 p-4 md:p-5 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-slate-200">
                Vídeo
                <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3" type="file" accept="video/mp4,video/quicktime,video/webm" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </label>
              <label className="grid gap-2 text-sm text-slate-200">
                Logo opcional
                <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setLogo(e.target.files?.[0] || null)} />
              </label>
              <label className="grid gap-2 text-sm text-slate-200">
                Instagram no fechamento
                <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3" value={instagramHandle} onChange={(e) => setInstagramHandle(e.target.value)} />
              </label>
              <div className="grid gap-2 text-sm text-slate-200">
                <span>Mensagem fixa no topo</span>
                <button
                  type="button"
                  onClick={() => setShowTopMessage((value) => !value)}
                  className={`flex min-h-[52px] items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                    showTopMessage ? "border-cyan-300/60 bg-cyan-300/15 text-cyan-50" : "border-white/10 bg-white/5 text-slate-200"
                  }`}
                >
                  <span>{showTopMessage ? "Ativada" : "Desativada"}</span>
                  <span className="text-xs text-slate-300">Siga a pagina, curta e comente Quero Cupom</span>
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2 text-sm text-slate-200">
                  <span>Áudio</span>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {audioModeOptions.map((option) => {
                      const selected = audioMode === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setAudioMode(option.value)}
                          className={`rounded-2xl border px-4 py-3 text-left transition ${
                            selected ? "border-cyan-300/60 bg-cyan-300 text-slate-950" : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                          }`}
                        >
                          <div className="font-semibold">{option.label}</div>
                          <div className={`mt-1 text-xs ${selected ? "text-slate-800/80" : "text-slate-400"}`}>{option.hint}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <label className="grid gap-2 text-sm text-slate-200">
                  Volume % quando reduzir
                  <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3" type="number" min={0} max={100} value={audioVolumePercent} onChange={(e) => setAudioVolumePercent(Number(e.target.value || 100))} />
                </label>
              </div>
              <div className="md:col-span-2 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between">
                <span>Após o upload, o processamento já começa automaticamente.</span>
                <button className="rounded-2xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Enviando..." : "Enviar e processar"}
                </button>
              </div>
            </div>
          ) : null}

          {error ? <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}
          {notice ? <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{notice}</div> : null}
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
          <div className="rounded-[30px] border border-white/10 bg-slate-950/45 p-4 shadow-2xl backdrop-blur-xl md:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Fila de processamento</h2>
              <div className="text-sm text-slate-400">{loading ? "Atualizando..." : `${pagination.total} jobs`}</div>
            </div>

            <div className="hidden overflow-hidden rounded-[24px] border border-white/10 md:block">
              <div className="grid grid-cols-[1.2fr,0.7fr,0.8fr,0.8fr,0.6fr] gap-3 bg-white/5 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
                <span>Arquivo</span>
                <span>Status</span>
                <span>Progresso</span>
                <span>ETA</span>
                <span>Ações</span>
              </div>
              <div className="divide-y divide-white/10">
                {jobs.length === 0 ? <div className="px-4 py-10 text-sm text-slate-400">Envie seu primeiro vídeo para gerar uma versão limpa, recodificada e pronta para uso.</div> : null}
                {jobs.map((job) => (
                  <button key={job.id} className={`grid w-full grid-cols-[1.2fr,0.7fr,0.8fr,0.8fr,0.6fr] gap-3 px-4 py-4 text-left transition hover:bg-white/5 ${selectedJob?.id === job.id ? "bg-white/5" : ""}`} onClick={() => setSelectedJobId(job.id)}>
                    <div>
                      <div className="font-medium text-white">{job.originalFilename || "vídeo sem nome"}</div>
                      <div className="mt-1 text-xs text-slate-400">{new Date(job.createdAt).toLocaleString("pt-BR")}</div>
                    </div>
                    <div>
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge(job.status)}`}>{job.status}</span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{Math.round(job.progressPercent || 0)}%</div>
                      <div className="mt-2 h-2 rounded-full bg-white/10">
                        <div className="h-2 rounded-full bg-cyan-300" style={{ width: `${Math.round(job.progressPercent || 0)}%` }} />
                      </div>
                    </div>
                    <div className="text-sm text-slate-200">{formatEta(job.estimatedSecondsLeft)}</div>
                    <div className="flex flex-wrap gap-2">
                      {job.outputUrl ? (
                        <a href={job.outputUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10" onClick={(e) => e.stopPropagation()}>
                          Abrir
                        </a>
                      ) : null}
                      {job.status === "FAILED" ? (
                        <span className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs font-semibold text-red-100 hover:bg-red-400/20" onClick={(e) => { e.stopPropagation(); handleRetry(job.id).catch(() => null); }}>
                          Retry
                        </span>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 md:hidden">
              {jobs.length === 0 ? <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-8 text-sm text-slate-400">Envie seu primeiro vídeo para gerar uma versão limpa, recodificada e pronta para uso.</div> : null}
              {jobs.map((job) => (
                <button key={job.id} className={`rounded-3xl border p-4 text-left transition ${selectedJob?.id === job.id ? "border-cyan-300/40 bg-cyan-300/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`} onClick={() => setSelectedJobId(job.id)}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-white">{job.originalFilename || "vídeo sem nome"}</div>
                      <div className="mt-1 text-xs text-slate-400">{new Date(job.createdAt).toLocaleString("pt-BR")}</div>
                    </div>
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge(job.status)}`}>{job.status}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-300">
                    <div>Progresso: {Math.round(job.progressPercent || 0)}%</div>
                    <div>ETA: {formatEta(job.estimatedSecondsLeft)}</div>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-white/10">
                    <div className="h-2 rounded-full bg-cyan-300" style={{ width: `${Math.round(job.progressPercent || 0)}%` }} />
                  </div>
                  <div className="mt-4 flex gap-2">
                    {job.outputUrl ? (
                      <a href={job.outputUrl} target="_blank" rel="noreferrer" className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white" onClick={(e) => e.stopPropagation()}>
                        Abrir
                      </a>
                    ) : null}
                    {job.status === "FAILED" ? (
                      <span className="rounded-2xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs font-semibold text-red-100" onClick={(e) => { e.stopPropagation(); handleRetry(job.id).catch(() => null); }}>
                        Retry
                      </span>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-300">
              <button className="rounded-xl border border-white/10 px-3 py-2 disabled:opacity-40" disabled={!pagination.hasPrevPage} onClick={() => loadJobs(page - 1).catch(() => null)}>
                Anterior
              </button>
              <span>Página {pagination.page} de {pagination.totalPages}</span>
              <button className="rounded-xl border border-white/10 px-3 py-2 disabled:opacity-40" disabled={!pagination.hasNextPage} onClick={() => loadJobs(page + 1).catch(() => null)}>
                Próxima
              </button>
            </div>
          </div>

          <aside className="rounded-[30px] border border-white/10 bg-slate-950/45 p-4 shadow-2xl backdrop-blur-xl md:p-5">
            <h2 className="text-lg font-semibold">Detalhe do job</h2>
            {selectedJob ? (
              <div className="mt-5 grid gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Arquivo</div>
                  <div className="mt-2 text-base font-semibold text-white">{selectedJob.originalFilename || "Sem nome"}</div>
                  <div className="mt-3 text-sm text-slate-300">Etapa atual: {selectedJob.currentStep || "aguardando"}</div>
                  <div className="mt-1 text-sm text-slate-300">Áudio: {selectedJob.audioMode}{selectedJob.audioMode === "REDUCE" ? ` (${selectedJob.audioVolumePercent}%)` : ""}</div>
                  <div className="mt-1 text-sm text-slate-300">Instagram: {selectedJob.instagramHandle || "-"}</div>
                  <div className="mt-1 text-sm text-slate-300">Mensagem fixa: {selectedJob.showTopMessage ?? true ? "ativada" : "desativada"}</div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Publicação</div>
                    <button type="button" onClick={() => setPublishedDraft((value) => !value)} className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${publishedDraft ? "border-emerald-400/30 bg-emerald-400/15 text-emerald-100" : "border-white/10 bg-white/5 text-slate-200"}`}>
                      {publishedDraft ? "Publicado" : "Não publicado"}
                    </button>
                  </div>
                  <div className="mt-4 grid gap-3">
                    <button
                      type="button"
                      onClick={() => setShowTopMessageDraft((value) => !value)}
                      className={`flex min-h-[52px] items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition ${
                        showTopMessageDraft ? "border-cyan-300/50 bg-cyan-300/15 text-cyan-50" : "border-white/10 bg-slate-950/50 text-slate-200"
                      }`}
                    >
                      <span>Mensagem no topo</span>
                      <span className="font-semibold">{showTopMessageDraft ? "Ligada" : "Desligada"}</span>
                    </button>
                    <label className="grid gap-2 text-sm text-slate-200">
                      Link de afiliado
                      <input className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white" value={affiliateUrlDraft} onChange={(e) => setAffiliateUrlDraft(e.target.value)} placeholder="https://..." />
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white" onClick={handleCopyAffiliate}>
                        Copiar link
                      </button>
                      <button className="rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60" onClick={handleSaveJobMeta} disabled={saving}>
                        {saving ? "Salvando..." : "Salvar"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">URLs</div>
                  <div className="mt-3 grid gap-2 text-sm">
                    <a className="truncate text-cyan-200 hover:text-cyan-100" href={selectedJob.inputUrl || "#"} target="_blank" rel="noreferrer">Original</a>
                    {selectedJob.outputUrl ? <a className="truncate text-emerald-200 hover:text-emerald-100" href={selectedJob.outputUrl} target="_blank" rel="noreferrer">Final</a> : <span className="text-slate-400">Final ainda indisponível</span>}
                    {selectedJob.logoUrl ? <a className="truncate text-amber-100 hover:text-amber-50" href={selectedJob.logoUrl} target="_blank" rel="noreferrer">Logo</a> : <span className="text-slate-400">Sem logo anexado</span>}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Logs recentes</div>
                  <div className="mt-3 grid gap-3">
                    {(selectedJob.events || []).length === 0 ? <div className="text-sm text-slate-400">Nenhum evento ainda.</div> : null}
                    {(selectedJob.events || []).map((event) => (
                      <div key={event.id} className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-3 text-sm text-slate-200">
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">{event.stepName || event.level}</div>
                        <div className="mt-1 break-words">{event.message}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedJob.errorMessage ? <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-100 break-words">{selectedJob.errorMessage}</div> : null}
              </div>
            ) : (
              <div className="mt-6 text-sm text-slate-400">Selecione um job para ver detalhes.</div>
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}
