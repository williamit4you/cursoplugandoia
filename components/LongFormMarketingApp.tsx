"use client";

import { useEffect, useMemo, useState } from "react";

type Project = {
  id: string;
  status: string;
  title?: string | null;
  ideaPrompt: string;
  metadataJson: string;
  videoUrl?: string | null;
  thumbUrl?: string | null;
  errorMessage?: string | null;
  renderProgress?: number;
  createdAt: string;
  updatedAt: string;
};

type FormState = {
  id?: string;
  title: string;
  stage: "TOPO" | "MEIO" | "FUNDO";
  subtopics: string[];
};

const MAX_SUBTOPICS = 50;
const emptyForm = (): FormState => ({
  title: "",
  stage: "TOPO",
  subtopics: [""],
});

const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  DRAFT: { label: "Rascunho", className: "bg-slate-100 text-slate-700" },
  GENERATING: {
    label: "Gerando roteiro",
    className: "bg-blue-100 text-blue-700",
  },
  READY: {
    label: "Roteiro pronto",
    className: "bg-violet-100 text-violet-700",
  },
  RENDERING: {
    label: "Renderizando",
    className: "bg-amber-100 text-amber-800",
  },
  DONE: { label: "Concluido", className: "bg-emerald-100 text-emerald-700" },
  FAILED: { label: "Falhou", className: "bg-red-100 text-red-700" },
};

function parseMetadata(project: Project) {
  try {
    return JSON.parse(project.metadataJson || "{}");
  } catch {
    return {};
  }
}

function projectTitle(project: Project) {
  return project.title || project.ideaPrompt || "Video sem titulo";
}

function cleanImportedLine(value: string) {
  return value
    .replace(/\*\*/g, "")
    .replace(/^[\s•◦○\-–—*]+/, "")
    .replace(/^\d+[.)]\s*/, "")
    .trim();
}

function parseAiBriefing(text: string) {
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const numberedSubtopics: string[] = [];

  for (const line of lines) {
    const cleaned = cleanImportedLine(line);
    const match = cleaned.match(
      /^subt[ií]tulo\s*\d+\s*[:.)-]\s*(.+)$/i,
    );
    if (match?.[1]) numberedSubtopics.push(match[1].trim());
  }

  let title = "";
  const titleLabelIndex = lines.findIndex((line) =>
    /t[ií]tulo[- ]?base/i.test(line),
  );
  if (titleLabelIndex >= 0) {
    const sameLine = cleanImportedLine(lines[titleLabelIndex]).match(
      /t[ií]tulo[- ]?base(?:\s*\([^)]*\))?\s*[:\-]\s*(.+)$/i,
    );
    if (sameLine?.[1]) {
      title = sameLine[1].trim();
    } else {
      const nextLine = lines[titleLabelIndex + 1];
      if (nextLine && !/subt[ií]tulos?/i.test(nextLine)) {
        title = cleanImportedLine(nextLine);
      }
    }
  }

  if (numberedSubtopics.length) {
    return {
      title,
      subtopics: Array.from(new Set(numberedSubtopics)).slice(
        0,
        MAX_SUBTOPICS,
      ),
    };
  }

  const plainSubtopics = lines
    .map(cleanImportedLine)
    .filter(
      (line) =>
        line.length >= 5 &&
        !/^t[ií]tulo[- ]?base/i.test(line) &&
        !/^subt[ií]tulos?(?:\s|\(|$)/i.test(line) &&
        !/^a ia\b/i.test(line) &&
        !/^\(.*\)$/.test(line) &&
        !/^essa estrutura\b/i.test(line) &&
        line !== title,
    );

  return {
    title,
    subtopics: Array.from(new Set(plainSubtopics)).slice(
      0,
      MAX_SUBTOPICS,
    ),
  };
}

export function LongFormMarketingApp() {
  const [items, setItems] = useState<Project[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [form, setForm] = useState<FormState | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [actioningIds, setActioningIds] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [showBulkPaste, setShowBulkPaste] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [details, setDetails] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const call = async (url: string, options?: RequestInit) => {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Falha na operacao.");
    }
    return data.project || data;
  };

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await call("/api/videos-longos", { cache: "no-store" });
      setItems(data.items || []);
      setSelectedIds((current) =>
        current.filter((id) =>
          (data.items || []).some((item: Project) => item.id === id),
        ),
      );
    } catch (loadError: any) {
      setError(loadError.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(true), 5000);
    return () => window.clearInterval(timer);
  }, []);

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
    return items.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        projectTitle(item).toLocaleLowerCase("pt-BR").includes(normalizedSearch);
      const matchesStatus =
        statusFilter === "TODOS" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [items, search, statusFilter]);

  const allVisibleSelected =
    filteredItems.length > 0 &&
    filteredItems.every((item) => selectedIds.includes(item.id));

  const openCreate = () => {
    setError("");
    setBulkText("");
    setShowBulkPaste(false);
    setForm(emptyForm());
  };

  const openEdit = (project: Project) => {
    const metadata = parseMetadata(project);
    setError("");
    setBulkText("");
    setShowBulkPaste(false);
    setForm({
      id: project.id,
      title: project.ideaPrompt || project.title || "",
      stage: metadata.funnelStage || "TOPO",
      subtopics:
        Array.isArray(metadata.subtopics) && metadata.subtopics.length
          ? metadata.subtopics
          : [""],
    });
  };

  const addSubtopic = () => {
    setForm((current) =>
      current && current.subtopics.length < MAX_SUBTOPICS
        ? { ...current, subtopics: [...current.subtopics, ""] }
        : current,
    );
  };

  const removeSubtopic = (index: number) => {
    setForm((current) => {
      if (!current || current.subtopics.length <= 1) return current;
      return {
        ...current,
        subtopics: current.subtopics.filter(
          (_, itemIndex) => itemIndex !== index,
        ),
      };
    });
  };

  const updateSubtopic = (index: number, value: string) => {
    setForm((current) =>
      current
        ? {
            ...current,
            subtopics: current.subtopics.map((topic, itemIndex) =>
              itemIndex === index ? value : topic,
            ),
          }
        : current,
    );
  };

  const importAiBriefing = () => {
    const imported = parseAiBriefing(bulkText);
    if (!imported.subtopics.length) {
      setError(
        "Nao encontrei subtitulos. Cole linhas como: Subtitulo 1: assunto.",
      );
      return;
    }
    setForm((current) =>
      current
        ? {
            ...current,
            title: current.title.trim() || imported.title || current.title,
            subtopics: imported.subtopics,
          }
        : current,
    );
    setError("");
    setNotice(`${imported.subtopics.length} subtitulo(s) importado(s).`);
    setBulkText("");
    setShowBulkPaste(false);
  };

  const processProject = async (id: string) => {
    setProcessingIds((current) =>
      current.includes(id) ? current : [...current, id],
    );
    setError("");
    setNotice("Processamento iniciado. A lista atualiza automaticamente.");
    await load(true);
    try {
      await call(`/api/videos-longos/${id}/process`, { method: "POST" });
      setNotice("Video criado com sucesso.");
    } catch (processError: any) {
      setError(processError.message);
    } finally {
      setProcessingIds((current) =>
        current.filter((projectId) => projectId !== id),
      );
      await load(true);
    }
  };

  const runProjectAction = async (
    id: string,
    action: "approve-planning" | "approve-final" | "schedule",
    successMessage: string,
  ) => {
    setActioningIds((current) =>
      current.includes(id) ? current : [...current, id],
    );
    setError("");
    try {
      if (action === "schedule") {
        await call(`/api/videos-longos/${id}/schedule`, { method: "POST" });
      } else {
        await call(`/api/videos-longos/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
      }
      setNotice(successMessage);
      await load(true);
      if (details?.id === id) {
        await openDetails(id, true);
      }
    } catch (actionError: any) {
      setError(actionError.message);
    } finally {
      setActioningIds((current) => current.filter((item) => item !== id));
    }
  };

  const openDetails = async (id: string, silent = false) => {
    if (!silent) setDetailsLoading(true);
    setError("");
    try {
      setDetails(await call(`/api/videos-longos/${id}`, { cache: "no-store" }));
    } catch (detailsError: any) {
      setError(detailsError.message);
    } finally {
      if (!silent) setDetailsLoading(false);
    }
  };

  useEffect(() => {
    if (
      !details?.id ||
      !["GENERATING", "RENDERING"].includes(details.status)
    ) {
      return;
    }
    const timer = window.setInterval(
      () => void openDetails(details.id, true),
      5000,
    );
    return () => window.clearInterval(timer);
  }, [details?.id, details?.status]);

  const saveForm = async (reprocess: boolean) => {
    if (!form) return;
    const subtopics = form.subtopics
      .map((topic) => topic.trim())
      .filter(Boolean);
    if (form.title.trim().length < 5) {
      setError("Informe um titulo com pelo menos 5 caracteres.");
      return;
    }
    if (!subtopics.length) {
      setError("Informe pelo menos um subtitulo.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      let project: Project;
      if (form.id) {
        project = await call(`/api/videos-longos/${form.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workingTitle: form.title,
            subtopics,
            funnelStage: form.stage,
          }),
        });
        setNotice("Alteracoes salvas.");
      } else {
        project = await call("/api/videos-longos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workingTitle: form.title,
            subtopics,
            funnelStage: form.stage,
            externalMediaPolicy: "PEXELS_AND_UPLOADS",
          }),
        });
        setNotice("Video salvo como rascunho.");
      }
      setForm(null);
      await load(true);
      if (reprocess) void processProject(project.id);
    } catch (saveError: any) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteProjects = async (ids: string[]) => {
    if (!ids.length) return;
    if (
      !window.confirm(
        `Excluir ${ids.length} video(s)? Essa acao remove os registros ainda nao publicados.`,
      )
    ) {
      return;
    }
    setError("");
    try {
      await call("/api/videos-longos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      setSelectedIds([]);
      setNotice(`${ids.length} video(s) excluido(s).`);
      await load(true);
    } catch (deleteError: any) {
      setError(deleteError.message);
    }
  };

  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      const visibleIds = new Set(filteredItems.map((item) => item.id));
      setSelectedIds((current) =>
        current.filter((id) => !visibleIds.has(id)),
      );
      return;
    }
    setSelectedIds((current) =>
      Array.from(
        new Set([...current, ...filteredItems.map((item) => item.id)]),
      ),
    );
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 rounded-3xl bg-gradient-to-br from-slate-950 via-zinc-900 to-red-950 p-7 text-white md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black tracking-[.25em] text-red-300">
            PLUGANDO IA • EDUCACAO
          </p>
          <h1 className="mt-2 text-3xl font-black">Videos Longos</h1>
          <p className="mt-2 text-sm text-zinc-300">
            Crie, edite e reprocesse videos a partir de um titulo e seus
            subtitulos.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white shadow-lg hover:bg-red-700"
        >
          + Criar video
        </button>
      </header>

      {notice ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {notice}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por titulo..."
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-red-400"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold"
          >
            <option value="TODOS">Todos os status</option>
            {Object.entries(statusConfig).map(([value, config]) => (
              <option key={value} value={value}>
                {config.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold"
          >
            Atualizar
          </button>
          <button
            type="button"
            disabled={!selectedIds.length}
            onClick={() => void deleteProjects(selectedIds)}
            className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Excluir selecionados ({selectedIds.length})
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAllVisible}
                    aria-label="Selecionar videos visiveis"
                  />
                </th>
                <th className="px-4 py-3">Video</th>
                <th className="px-4 py-3">Subtitulos</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Atualizado em</th>
                <th className="px-4 py-3 text-right">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">
                    Carregando videos...
                  </td>
                </tr>
              ) : null}
              {!loading && !filteredItems.length ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <p className="font-bold text-slate-700">
                      Nenhum video encontrado.
                    </p>
                    <button
                      type="button"
                      onClick={openCreate}
                      className="mt-3 text-sm font-black text-red-700"
                    >
                      Criar o primeiro video
                    </button>
                  </td>
                </tr>
              ) : null}
              {filteredItems.map((project) => {
                const metadata = parseMetadata(project);
                const subtopicCount = Array.isArray(metadata.subtopics)
                  ? metadata.subtopics.length
                  : 0;
                const processing =
                  processingIds.includes(project.id) ||
                  ["GENERATING", "RENDERING"].includes(project.status);
                const status =
                  statusConfig[project.status] || statusConfig.DRAFT;
                return (
                  <tr key={project.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-4 align-top">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(project.id)}
                        onChange={() =>
                          setSelectedIds((current) =>
                            current.includes(project.id)
                              ? current.filter((id) => id !== project.id)
                              : [...current, project.id],
                          )
                        }
                        aria-label={`Selecionar ${projectTitle(project)}`}
                      />
                    </td>
                    <td className="max-w-[420px] px-4 py-4 align-top">
                      <div className="flex gap-3">
                        {project.thumbUrl ? (
                          <img
                            src={project.thumbUrl}
                            alt=""
                            className="h-14 w-24 rounded-lg border object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-24 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-400">
                            16:9
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-900">
                            {projectTitle(project)}
                          </p>
                          {project.errorMessage ? (
                            <p
                              className="mt-1 line-clamp-2 text-xs text-red-600"
                              title={project.errorMessage}
                            >
                              {project.errorMessage}
                            </p>
                          ) : (
                            <p className="mt-1 text-xs text-slate-500">
                              Criado em{" "}
                              {new Date(project.createdAt).toLocaleString(
                                "pt-BR",
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top text-sm font-semibold text-slate-700">
                      {subtopicCount}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${status.className}`}
                      >
                        {status.label}
                      </span>
                      {project.status === "RENDERING" ? (
                        <p className="mt-1 text-xs text-slate-500">
                          {Math.round(Number(project.renderProgress || 0))}%
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 align-top text-sm text-slate-600">
                      {new Date(project.updatedAt).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex justify-end gap-2">
                        {project.videoUrl ? (
                          <a
                            href={project.videoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg border px-3 py-2 text-xs font-bold text-emerald-700"
                          >
                            Ver video
                          </a>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => void openDetails(project.id)}
                          className="rounded-lg border px-3 py-2 text-xs font-bold text-blue-700"
                        >
                          Detalhes
                        </button>
                        <button
                          type="button"
                          disabled={processing}
                          onClick={() => openEdit(project)}
                          className="rounded-lg border px-3 py-2 text-xs font-bold disabled:opacity-40"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          disabled={processing}
                          onClick={() => void processProject(project.id)}
                          className="rounded-lg bg-red-600 px-3 py-2 text-xs font-black text-white disabled:opacity-40"
                        >
                          {processing
                            ? "Processando..."
                            : project.status === "DRAFT"
                              ? "Criar video"
                              : "Reprocessar"}
                        </button>
                        <button
                          type="button"
                          disabled={processing}
                          onClick={() => void deleteProjects([project.id])}
                          className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 disabled:opacity-40"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {form ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-5">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  {form.id ? "Editar video" : "Criar video longo"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Informe o titulo e os assuntos que devem ser explicados.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setForm(null)}
                className="rounded-full border px-3 py-1.5 text-lg text-slate-500"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              <label className="block text-sm font-bold text-slate-700">
                Titulo do video
                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                  placeholder="Ex.: Como fazer sua primeira venda na Shopee"
                  className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-semibold outline-none focus:border-red-400"
                />
              </label>

              <div>
                <p className="text-sm font-bold text-slate-700">
                  Etapa do funil
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {(["TOPO", "MEIO", "FUNDO"] as const).map((stage) => (
                    <button
                      key={stage}
                      type="button"
                      onClick={() => setForm({ ...form, stage })}
                      className={`rounded-xl p-2.5 text-xs font-black ${
                        form.stage === stage
                          ? "bg-red-600 text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {stage}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-700">Subtitulos</p>
                  <span className="text-xs font-bold text-slate-500">
                    {form.subtopics.length}/{MAX_SUBTOPICS}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBulkPaste((current) => !current)}
                  className="mt-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-black text-violet-700"
                >
                  {showBulkPaste ? "Fechar importacao" : "Colar lista da IA"}
                </button>
                {showBulkPaste ? (
                  <div className="mt-3 rounded-2xl border border-violet-200 bg-violet-50/50 p-4">
                    <p className="text-xs font-semibold text-slate-600">
                      Cole a resposta inteira. O sistema reconhece linhas como
                      “Subtitulo 1: ...” e ignora as explicacoes da IA.
                    </p>
                    <textarea
                      value={bulkText}
                      onChange={(event) => setBulkText(event.target.value)}
                      placeholder={
                        "Subtitulo 1: Primeiro assunto\n(A IA vai explicar...)\n\nSubtitulo 2: Segundo assunto"
                      }
                      className="mt-3 h-44 w-full rounded-xl border border-violet-200 bg-white p-3 text-sm outline-none focus:border-violet-500"
                    />
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        disabled={!bulkText.trim()}
                        onClick={importAiBriefing}
                        className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-black text-white disabled:opacity-40"
                      >
                        Importar todos os subtitulos
                      </button>
                    </div>
                  </div>
                ) : null}
                <div className="mt-2 space-y-2">
                  {form.subtopics.map((topic, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        value={topic}
                        onChange={(event) =>
                          updateSubtopic(index, event.target.value)
                        }
                        placeholder={`Subtitulo ${index + 1}`}
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-red-400"
                      />
                      <button
                        type="button"
                        disabled={form.subtopics.length <= 1}
                        onClick={() => removeSubtopic(index)}
                        className="rounded-xl border px-3 font-bold text-slate-500 disabled:opacity-30"
                        aria-label={`Remover subtitulo ${index + 1}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={form.subtopics.length >= MAX_SUBTOPICS}
                  onClick={addSubtopic}
                  className="mt-3 text-sm font-black text-red-700 disabled:opacity-40"
                >
                  + Adicionar subtitulo
                </button>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={saving}
                onClick={() => setForm(null)}
                className="rounded-xl border bg-white px-4 py-2.5 text-sm font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveForm(false)}
                className="rounded-xl border bg-white px-4 py-2.5 text-sm font-bold disabled:opacity-40"
              >
                Salvar rascunho
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveForm(true)}
                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-black text-white disabled:opacity-40"
              >
                {saving
                  ? "Salvando..."
                  : form.id
                    ? "Salvar e reprocessar"
                    : "Criar video"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {detailsLoading ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="rounded-2xl bg-white px-6 py-5 font-bold text-slate-700 shadow-xl">
            Carregando detalhes...
          </div>
        </div>
      ) : null}

      {details ? (
        <ProjectDetails
          project={details}
          onClose={() => setDetails(null)}
          onRefresh={() => void openDetails(details.id)}
          onReprocess={() => {
            const id = details.id;
            setDetails(null);
            void processProject(id);
          }}
          onApprovePlanning={() =>
            void runProjectAction(
              details.id,
              "approve-planning",
              "Planejamento aprovado.",
            )
          }
          onApproveFinal={() =>
            void runProjectAction(
              details.id,
              "approve-final",
              "Aprovacao final registrada.",
            )
          }
          onSchedule={() =>
            void runProjectAction(
              details.id,
              "schedule",
              "Video enviado para a fila do YouTube.",
            )
          }
          isActioning={actioningIds.includes(details.id)}
        />
      ) : null}
    </div>
  );
}

function ProjectDetails({
  project,
  onClose,
  onRefresh,
  onReprocess,
  onApprovePlanning,
  onApproveFinal,
  onSchedule,
  isActioning,
}: {
  project: any;
  onClose: () => void;
  onRefresh: () => void;
  onReprocess: () => void;
  onApprovePlanning: () => void;
  onApproveFinal: () => void;
  onSchedule: () => void;
  isActioning: boolean;
}) {
  const metadata = parseMetadata(project);
  const status = statusConfig[project.status] || statusConfig.DRAFT;
  const wordCount = String(project.narrationText || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const steps = Array.isArray(project.pipelineSteps)
    ? project.pipelineSteps
    : [];
  const events = Array.isArray(project.pipelineEvents)
    ? project.pipelineEvents
    : [];
  const renderSegments = Array.isArray(metadata.renderSegments)
    ? metadata.renderSegments
    : [];
  const planningApproved = metadata.planningApproved === true;
  const finalApproved = metadata.finalApproved === true;
  const canApprovePlanning =
    Boolean(String(project.narrationText || "").trim()) && !planningApproved;
  const canApproveFinal =
    planningApproved && Boolean(project.videoUrl) && !finalApproved;
  const canSchedule = planningApproved && finalApproved && Boolean(project.videoUrl);
  const standardSteps = [
    {
      key: "BRIEFING",
      label: "Briefing salvo",
      state: "SUCCESS",
      message: `${metadata.subtopics?.length || 0} subtitulo(s) recebido(s)`,
    },
    {
      key: "LONG_FORM_PLAN",
      label: "Roteiro e planejamento",
      state:
        steps.find((step: any) => step.stepName === "LONG_FORM_PLAN")?.status ||
        (project.status === "GENERATING" ? "RUNNING" : "PENDING"),
      message:
        steps.find((step: any) => step.stepName === "LONG_FORM_PLAN")
          ?.errorMessage || "",
    },
    {
      key: "RENDER_VIDEO",
      label: "Audio, legendas e render",
      state:
        steps.find((step: any) => step.stepName === "RENDER_VIDEO")?.status ||
        (project.status === "RENDERING" ? "RUNNING" : "PENDING"),
      message:
        steps.find((step: any) => step.stepName === "RENDER_VIDEO")
          ?.errorMessage || "",
    },
    {
      key: "DONE",
      label: "MP4 final",
      state: project.videoUrl
        ? "SUCCESS"
        : project.status === "FAILED"
          ? "FAILED"
          : "PENDING",
      message: project.videoUrl ? "Video disponivel" : "",
    },
  ];

  const stepStyle: Record<string, string> = {
    SUCCESS: "border-emerald-200 bg-emerald-50 text-emerald-800",
    RUNNING: "border-blue-200 bg-blue-50 text-blue-800",
    FAILED: "border-red-200 bg-red-50 text-red-800",
    PENDING: "border-slate-200 bg-slate-50 text-slate-500",
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/55">
      <div className="flex h-full w-full max-w-5xl flex-col bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b px-6 py-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-black text-slate-900">
                {projectTitle(project)}
              </h2>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-black ${status.className}`}
              >
                {status.label}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              ID: {project.id} • Atualizado em{" "}
              {new Date(project.updatedAt).toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onRefresh}
              className="rounded-xl border px-3 py-2 text-sm font-bold"
            >
              Atualizar
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border px-3 py-2 text-lg text-slate-500"
              aria-label="Fechar detalhes"
            >
              ×
            </button>
          </div>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {project.errorMessage ? (
            <section className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-red-800">
                    Motivo da falha
                  </p>
                  <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-sm text-red-700">
                    {project.errorMessage}
                  </pre>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    void navigator.clipboard.writeText(project.errorMessage)
                  }
                  className="shrink-0 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700"
                >
                  Copiar erro
                </button>
              </div>
            </section>
          ) : null}

          <section>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">
                Progresso da criacao
              </h3>
              {project.status === "RENDERING" ? (
                <span className="text-sm font-bold text-amber-700">
                  {Math.round(Number(project.renderProgress || 0))}%
                </span>
              ) : null}
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-4">
              {standardSteps.map((step, index) => (
                <article
                  key={step.key}
                  className={`rounded-2xl border p-4 ${
                    stepStyle[step.state] || stepStyle.PENDING
                  }`}
                >
                  <p className="text-xs font-black uppercase">
                    {index + 1}. {step.label}
                  </p>
                  <p className="mt-2 text-xs font-semibold">
                    {step.state === "SUCCESS"
                      ? "Concluido"
                      : step.state === "RUNNING"
                        ? "Em andamento"
                        : step.state === "FAILED"
                          ? "Falhou"
                          : "Aguardando"}
                  </p>
                  {step.message ? (
                    <p className="mt-1 line-clamp-3 text-xs">{step.message}</p>
                  ) : null}
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <article className={`rounded-2xl border p-4 ${planningApproved ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
              <p className="text-xs font-black uppercase tracking-wide text-slate-600">
                Aprovacao do planejamento
              </p>
              <p className={`mt-2 text-sm font-black ${planningApproved ? "text-emerald-800" : "text-amber-800"}`}>
                {planningApproved ? "Aprovado" : "Pendente"}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                {planningApproved
                  ? `${metadata.planningApprovedBy || "admin"} em ${new Date(metadata.planningApprovedAt).toLocaleString("pt-BR")}`
                  : "O render final fica bloqueado ate a aprovacao do planejamento."}
              </p>
            </article>
            <article className={`rounded-2xl border p-4 ${finalApproved ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}>
              <p className="text-xs font-black uppercase tracking-wide text-slate-600">
                Aprovacao final
              </p>
              <p className={`mt-2 text-sm font-black ${finalApproved ? "text-emerald-800" : "text-slate-800"}`}>
                {finalApproved ? "Aprovado" : "Pendente"}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                {finalApproved
                  ? `${metadata.finalApprovedBy || "admin"} em ${new Date(metadata.finalApprovedAt).toLocaleString("pt-BR")}`
                  : "O agendamento no YouTube fica bloqueado ate a aprovacao final."}
              </p>
            </article>
          </section>

          <section className="rounded-2xl border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
              <div>
                <h3 className="font-black text-slate-900">
                  Partes do video
                </h3>
                <p className="text-xs text-slate-500">
                  Cada parte tem aproximadamente um minuto e fica disponivel
                  assim que termina.
                </p>
              </div>
              {renderSegments.length ? (
                <span className="text-xs font-black text-slate-600">
                  {
                    renderSegments.filter(
                      (segment: any) => segment.status === "SUCCESS",
                    ).length
                  }
                  /{renderSegments.length} concluidas • Merge:{" "}
                  {metadata.mergeStatus || "PENDING"}
                </span>
              ) : null}
            </div>
            {renderSegments.length ? (
              <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                {renderSegments.map((segment: any) => {
                  const segmentStatus =
                    segment.status === "SUCCESS"
                      ? "Concluida"
                      : segment.audioStatus === "RUNNING"
                        ? "Gerando audio"
                      : segment.status === "RUNNING"
                        ? "Renderizando video"
                        : segment.status === "FAILED"
                          ? "Falhou"
                          : "Aguardando";
                  return (
                    <article
                      key={segment.index}
                      className={`rounded-xl border p-3 ${
                        stepStyle[segment.status] || stepStyle.PENDING
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-black">
                          {segment.label || `Parte ${segment.index + 1}`}
                        </p>
                        <span className="text-[11px] font-bold">
                          {Math.round(Number(segment.durationSec || 0))}s
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-semibold">
                        {segmentStatus}
                      </p>
                      {segment.errorMessage ? (
                        <p className="mt-1 line-clamp-3 text-xs">
                          {segment.errorMessage}
                        </p>
                      ) : null}
                      {segment.videoUrl ? (
                        <a
                          href={segment.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex rounded-lg bg-white px-2.5 py-1.5 text-xs font-black text-emerald-700"
                        >
                          Assistir parte
                        </a>
                      ) : null}
                      {segment.audioUrl ? (
                        <a
                          href={segment.audioUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-2 mt-2 inline-flex rounded-lg bg-white px-2.5 py-1.5 text-xs font-black text-violet-700"
                        >
                          Ouvir audio
                        </a>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="p-5 text-sm text-slate-500">
                As partes aparecerao aqui quando o render segmentado iniciar.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
              <div>
                <h3 className="font-black text-slate-900">Roteiro gerado</h3>
                <p className="text-xs text-slate-500">
                  {wordCount
                    ? `${wordCount.toLocaleString("pt-BR")} palavras`
                    : "O roteiro ainda nao foi concluido."}
                </p>
              </div>
              {project.narrationText ? (
                <button
                  type="button"
                  onClick={() =>
                    void navigator.clipboard.writeText(project.narrationText)
                  }
                  className="rounded-lg border px-3 py-2 text-xs font-bold"
                >
                  Copiar roteiro
                </button>
              ) : null}
            </div>
            {project.narrationText ? (
              <div className="max-h-96 overflow-y-auto whitespace-pre-wrap p-4 text-sm leading-7 text-slate-700">
                {project.narrationText}
              </div>
            ) : (
              <div className="p-6 text-sm text-slate-500">
                Quando a etapa “Roteiro e planejamento” terminar, o texto
                completo aparecerá aqui.
              </div>
            )}
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-4">
              <h3 className="font-black text-slate-900">
                Subtitulos recebidos
              </h3>
              <ol className="mt-3 max-h-64 list-decimal space-y-2 overflow-y-auto pl-5 text-sm text-slate-700">
                {(metadata.subtopics || []).map((topic: string) => (
                  <li key={topic}>{topic}</li>
                ))}
              </ol>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <h3 className="font-black text-slate-900">Artefatos</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {renderSegments
                  .filter((segment: any) => segment.videoUrl)
                  .map((segment: any) => (
                    <a
                      key={segment.index}
                      href={segment.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black text-blue-700"
                    >
                      Abrir parte {Number(segment.index) + 1}
                    </a>
                  ))}
                {renderSegments
                  .filter((segment: any) => segment.audioUrl)
                  .map((segment: any) => (
                    <a
                      key={`audio-${segment.index}`}
                      href={segment.audioUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-black text-violet-700"
                    >
                      Ouvir audio {Number(segment.index) + 1}
                    </a>
                  ))}
                {project.videoUrl ? (
                  <a
                    href={project.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white"
                  >
                    Abrir MP4
                  </a>
                ) : null}
                {project.audioUrl ? (
                  <a
                    href={project.audioUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border px-3 py-2 text-xs font-bold"
                  >
                    Abrir audio
                  </a>
                ) : null}
                {project.captionsUrl ? (
                  <a
                    href={project.captionsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border px-3 py-2 text-xs font-bold"
                  >
                    Abrir legendas
                  </a>
                ) : null}
                {project.thumbUrl ? (
                  <a
                    href={project.thumbUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border px-3 py-2 text-xs font-bold"
                  >
                    Abrir capa
                  </a>
                ) : null}
                {!renderSegments.some(
                  (segment: any) => segment.videoUrl || segment.audioUrl,
                ) &&
                !project.videoUrl &&
                !project.audioUrl &&
                !project.captionsUrl &&
                !project.thumbUrl ? (
                  <p className="text-sm text-slate-500">
                    Nenhum artefato concluido.
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200">
            <div className="border-b px-4 py-3">
              <h3 className="font-black text-slate-900">
                Logs do processamento
              </h3>
              <p className="text-xs text-slate-500">
                Eventos mais recentes primeiro.
              </p>
            </div>
            <div className="max-h-80 divide-y overflow-y-auto">
              {events.length ? (
                events.map((event: any) => (
                  <article
                    key={event.id}
                    className="grid gap-1 px-4 py-3 text-sm md:grid-cols-[160px_150px_1fr]"
                  >
                    <time className="text-xs text-slate-500">
                      {new Date(event.createdAt).toLocaleString("pt-BR")}
                    </time>
                    <span
                      className={`text-xs font-black ${
                        event.level === "ERROR"
                          ? "text-red-700"
                          : event.level === "WARN"
                            ? "text-amber-700"
                            : "text-blue-700"
                      }`}
                    >
                      {event.stepName || event.level}
                    </span>
                    <p className="whitespace-pre-wrap break-words text-xs text-slate-700">
                      {event.message}
                    </p>
                  </article>
                ))
              ) : (
                <p className="p-6 text-sm text-slate-500">
                  Nenhum evento foi registrado ainda.
                </p>
              )}
            </div>
          </section>
        </div>

        <footer className="flex flex-wrap justify-end gap-2 border-t bg-slate-50 px-6 py-4">
          <button
            type="button"
            disabled={!canApprovePlanning || isActioning}
            onClick={onApprovePlanning}
            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-black text-amber-800 disabled:opacity-40"
          >
            Aprovar planejamento
          </button>
          <button
            type="button"
            disabled={!canApproveFinal || isActioning}
            onClick={onApproveFinal}
            className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-black text-blue-800 disabled:opacity-40"
          >
            Aprovar final
          </button>
          <button
            type="button"
            disabled={!canSchedule || isActioning}
            onClick={onSchedule}
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-black text-emerald-800 disabled:opacity-40"
          >
            Agendar YouTube
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border bg-white px-4 py-2.5 text-sm font-bold"
          >
            Fechar
          </button>
          <button
            type="button"
            disabled={["GENERATING", "RENDERING"].includes(project.status)}
            onClick={onReprocess}
            className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-black text-white disabled:opacity-40"
          >
            Reprocessar video
          </button>
        </footer>
      </div>
    </div>
  );
}
