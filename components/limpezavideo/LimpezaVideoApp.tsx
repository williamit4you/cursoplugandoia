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
  logoUrl: string | null;
  instagramHandle: string | null;
  audioMode: string;
  audioVolumePercent: number;
  errorMessage: string | null;
  events?: JobEvent[];
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

export function LimpezaVideoApp() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [instagramHandle, setInstagramHandle] = useState("@compraesperta.promocoes");
  const [audioMode, setAudioMode] = useState("PRESERVE");
  const [audioVolumePercent, setAudioVolumePercent] = useState(100);

  async function loadJobs() {
    const res = await fetch("/api/limpezavideo/jobs", { cache: "no-store" });
    if (!res.ok) {
      throw new Error("Falha ao carregar jobs.");
    }
    const data = await res.json();
    setJobs(data.items || []);
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadJobs()
      .catch((err: any) => {
        if (active) setError(err?.message || "Falha ao carregar.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const timer = setInterval(() => {
      loadJobs().catch(() => null);
    }, 4000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const selectedJob = useMemo(() => jobs.find((job) => job.id === selectedJobId) || jobs[0] || null, [jobs, selectedJobId]);

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
      formData.append("audioMode", audioMode);
      formData.append("audioVolumePercent", String(audioVolumePercent));

      const createRes = await fetch("/api/limpezavideo/jobs", {
        method: "POST",
        body: formData,
      });
      const createData = await createRes.json().catch(() => ({}));
      if (!createRes.ok) {
        throw new Error(createData?.error || "Falha ao criar job.");
      }

      const createdJob = createData.job as Job;
      setJobs((prev) => [createdJob, ...prev]);
      setSelectedJobId(createdJob.id);
      setFormOpen(false);
      setFile(null);
      setLogo(null);

      await fetch(`/api/limpezavideo/jobs/${createdJob.id}/process`, {
        method: "POST",
      });

      await loadJobs();
    } catch (err: any) {
      setError(err?.message || "Falha no upload.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRetry(jobId: string) {
    await fetch(`/api/limpezavideo/jobs/${jobId}/retry`, { method: "POST" });
    await loadJobs();
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#164e63_0%,#0f172a_42%,#020617_100%)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <section className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100">Microsaas independente</div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">LimpezaVideo</h1>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-200/80 md:text-base">
                Faça upload do vídeo, opcionalmente envie o logo, e o sistema já dispara o pipeline no worker para limpar, recodificar e devolver a URL final tratada no MinIO.
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
            <div className="mt-8 grid gap-4 rounded-[28px] border border-white/10 bg-slate-950/40 p-5 md:grid-cols-2">
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
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm text-slate-200">
                  Áudio
                  <select className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3" value={audioMode} onChange={(e) => setAudioMode(e.target.value)}>
                    <option value="PRESERVE">Preservar</option>
                    <option value="REDUCE">Reduzir</option>
                    <option value="MUTE">Mutar</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm text-slate-200">
                  Volume % quando reduzir
                  <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3" type="number" min={0} max={100} value={audioVolumePercent} onChange={(e) => setAudioVolumePercent(Number(e.target.value || 100))} />
                </label>
              </div>
              <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-300">
                <span>Após o upload, o processamento já começa automaticamente.</span>
                <button className="rounded-2xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Enviando..." : "Enviar e processar"}
                </button>
              </div>
            </div>
          ) : null}

          {error ? <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.25fr,0.75fr]">
          <div className="rounded-[30px] border border-white/10 bg-slate-950/45 p-4 shadow-2xl backdrop-blur-xl md:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Fila de processamento</h2>
              <div className="text-sm text-slate-400">{loading ? "Atualizando..." : `${jobs.length} jobs`}</div>
            </div>

            <div className="overflow-hidden rounded-[24px] border border-white/10">
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
          </div>

          <aside className="rounded-[30px] border border-white/10 bg-slate-950/45 p-5 shadow-2xl backdrop-blur-xl">
            <h2 className="text-lg font-semibold">Detalhe do job</h2>
            {selectedJob ? (
              <div className="mt-5 grid gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Arquivo</div>
                  <div className="mt-2 text-base font-semibold text-white">{selectedJob.originalFilename || "Sem nome"}</div>
                  <div className="mt-3 text-sm text-slate-300">Etapa atual: {selectedJob.currentStep || "aguardando"}</div>
                  <div className="mt-1 text-sm text-slate-300">Áudio: {selectedJob.audioMode}{selectedJob.audioMode === "REDUCE" ? ` (${selectedJob.audioVolumePercent}%)` : ""}</div>
                  <div className="mt-1 text-sm text-slate-300">Instagram: {selectedJob.instagramHandle || "-"}</div>
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
                        <div className="mt-1">{event.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {selectedJob.errorMessage ? <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-100">{selectedJob.errorMessage}</div> : null}
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
