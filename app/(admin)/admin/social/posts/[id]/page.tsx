"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Copy,
  ExternalLink,
  LoaderCircle,
  Logs,
  RefreshCcw,
  Save,
  Trash2,
  XCircle,
} from "lucide-react";

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad2 = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function fromDateTimeLocal(value: string) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function publisherPath(platform: string, postType?: string) {
  const p = String(platform || "").toUpperCase();
  if (p === "YOUTUBE") return "/api/social/publish-youtube";
  if (p === "TIKTOK") return "/api/social/publish-tiktok";
  if (p === "META") {
    return String(postType || "").toUpperCase() === "STORY" ? "/api/social/publish-story" : "/api/social/publish";
  }
  if (p === "INSTAGRAM") {
    return String(postType || "").toUpperCase() === "STORY" ? "/api/social/publish-story" : "/api/social/publish";
  }
  return "/api/social/publish";
}

const TIKTOK_PROGRESS_STEPS = [
  { key: "start", label: "Requisicao disparada", match: ["Iniciando publicacao no TikTok"] },
  { key: "auth", label: "Conectando na conta", match: ["Authenticating browser with cookies", "Authenticating browser with sessionid"] },
  { key: "browser", label: "Browser aberto", match: ["Create a chromium browser instance", "chromium browser instance"] },
  { key: "upload-page", label: "Abrindo tela de upload", match: ["Navigating to upload page"] },
  { key: "upload-file", label: "Enviando video", match: ["Uploading video file", "Posting /tmp", "Posting "] },
  { key: "description", label: "Preenchendo descricao", match: ["Setting description"] },
  { key: "post", label: "Clicando em publicar", match: ["Clicking the post button", "Trying to click on the button again"] },
  { key: "confirmed", label: "Confirmado pelo TikTok", match: ["TIKTOK_UPLOAD_CONFIRMED", "TikTok enviado via browser"] },
];

function parseLogLines(log?: string | null) {
  return String(log || "").split("\n").map((line) => line.trim()).filter(Boolean);
}

function buildTikTokProgress(log?: string | null, status?: string | null) {
  const lines = parseLogLines(log);
  const failed = String(status || "").toUpperCase() === "FAILED" || lines.some((line) => /falha ao publicar no tiktok|traceback|failed to upload|error:/i.test(line));
  const completed = String(status || "").toUpperCase() === "POSTED" && lines.some((line) => /TikTok enviado via browser|TIKTOK_UPLOAD_CONFIRMED/i.test(line));
  const steps = TIKTOK_PROGRESS_STEPS.map((step) => {
    const detail = lines.find((line) => step.match.some((snippet) => line.includes(snippet))) || "";
    return { ...step, detail, state: detail ? "done" : "pending" as "done" | "pending" | "active" | "error" };
  });
  const lastDoneIndex = steps.reduce((acc, step, index) => (step.state === "done" ? index : acc), -1);
  if (!failed && !completed && lastDoneIndex >= 0 && lastDoneIndex < steps.length - 1) {
    steps[lastDoneIndex + 1].state = "active";
  }
  if (failed) {
    const errorIndex = Math.min(lastDoneIndex + 1, steps.length - 1);
    if (errorIndex >= 0) steps[errorIndex].state = "error";
  }
  if (completed) {
    const confirmedIndex = steps.findIndex((step) => step.key === "confirmed");
    if (confirmedIndex >= 0) steps[confirmedIndex].state = "done";
  }
  return { steps, lines };
}

export default function SocialPostEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = String(params?.id || "");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [post, setPost] = useState<any | null>(null);

  const [form, setForm] = useState<{
    platform: string;
    postType: string;
    status: string;
    scheduledTo: string;
    videoUrl: string;
    summary: string;
  }>({
    platform: "META",
    postType: "REEL",
    status: "SCHEDULED",
    scheduledTo: "",
    videoUrl: "",
    summary: "",
  });

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!id) return;
    if (!opts?.silent) setLoading(true);
    try {
      const res = await fetch(`/api/social/posts?id=${encodeURIComponent(id)}`, { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || data?.error) throw new Error(data?.error || "Falha ao carregar post");
      setPost(data);
      setForm({
        platform: String(data.platform || "META"),
        postType: String(data.postType || "REEL"),
        status: String(data.status || "SCHEDULED"),
        scheduledTo: toDateTimeLocal(data.scheduledTo || null),
        videoUrl: String(data.videoUrl || ""),
        summary: String(data.summary || ""),
      });
    } catch (err: any) {
      if (!opts?.silent) toast.error(err.message || "Falha ao carregar post");
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!publishing || !id) return;
    const interval = setInterval(() => {
      void load({ silent: true });
    }, 2000);
    return () => clearInterval(interval);
  }, [publishing, id, load]);

  const dirty = useMemo(() => {
    if (!post) return false;
    return (
      String(form.platform) !== String(post.platform || "META") ||
      String(form.postType) !== String(post.postType || "REEL") ||
      String(form.status) !== String(post.status || "SCHEDULED") ||
      String(form.videoUrl) !== String(post.videoUrl || "") ||
      String(form.summary) !== String(post.summary || "") ||
      String(form.scheduledTo) !== toDateTimeLocal(post.scheduledTo || null)
    );
  }, [form, post]);

  const save = useCallback(
    async (opts?: { resetPublication?: boolean }) => {
      if (!id) return;
      setSaving(true);
      try {
        const payload: any = {
          platform: form.platform,
          postType: form.postType,
          status: form.status,
          videoUrl: form.videoUrl,
          summary: form.summary,
          scheduledTo: fromDateTimeLocal(form.scheduledTo),
        };
        if (opts?.resetPublication) payload.resetPublication = true;

        const res = await fetch(`/api/social/posts/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Falha ao salvar");
        toast.success(opts?.resetPublication ? "Reagendado e resetado." : "Salvo.");
        await load();
      } catch (err: any) {
        toast.error(err.message || "Falha ao salvar");
      } finally {
        setSaving(false);
      }
    },
    [form, id, load]
  );

  const publishNow = useCallback(async () => {
    if (!id) return;
    setSaving(true);
    setPublishing(true);
    try {
      const path = publisherPath(form.platform, form.postType);
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socialPostId: id, bypassTimeCheck: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Falha ao publicar");
      toast.success(data?.stillProcessing ? "Processando na Meta... aguarde." : "Publicacao disparada.");
      await load();
    } catch (err: any) {
      toast.error(err.message || "Falha ao publicar");
    } finally {
      setSaving(false);
      setPublishing(false);
      await load({ silent: true });
    }
  }, [form.platform, form.postType, id, load]);

  const cloneTo = useCallback(
    async (platform: string) => {
      if (!post) return;
      setSaving(true);
      try {
        const res = await fetch("/api/social/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            platform,
            postType: platform === "META" ? form.postType : "REEL",
            status: "SCHEDULED",
            scheduledTo: fromDateTimeLocal(form.scheduledTo),
            videoUrl: form.videoUrl,
            summary: form.summary,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Falha ao criar copia");
        toast.success(`Copia criada (${platform}).`);
        router.push(`/admin/social/posts/${encodeURIComponent(String(data.id))}`);
      } catch (err: any) {
        toast.error(err.message || "Falha ao criar copia");
      } finally {
        setSaving(false);
      }
    },
    [form.postType, form.scheduledTo, form.summary, form.videoUrl, post, router]
  );

  const tiktokProgress = useMemo(
    () => (String(form.platform).toUpperCase() === "TIKTOK" ? buildTikTokProgress(post?.log, post?.status) : null),
    [form.platform, post?.log, post?.status]
  );

  const remove = useCallback(async () => {
    if (!id) return;
    if (!confirm("Deletar este post da fila social?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/social/posts/${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Falha ao deletar");
      toast.success("Post deletado.");
      router.push("/admin/social");
    } catch (err: any) {
      toast.error(err.message || "Falha ao deletar");
    } finally {
      setSaving(false);
    }
  }, [id, router]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <ToastContainer theme="colored" position="bottom-right" />

      <div className="flex items-start justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/social"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Link>
            <h1 className="text-2xl font-black tracking-tight text-slate-800">Editor de Post</h1>
          </div>
          <div className="text-xs font-mono text-slate-500 break-all">{id}</div>
          {dirty ? (
            <div className="text-[11px] font-bold text-amber-700">Alteracoes nao salvas</div>
          ) : (
            <div className="text-[11px] font-bold text-emerald-700">Sincronizado</div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            onClick={publishNow}
            disabled={saving || loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-black hover:bg-slate-800 disabled:opacity-50"
            title="Publicar agora (ou checar status)"
          >
            <RefreshCcw className={`w-4 h-4 ${saving ? "animate-spin" : ""}`} />
            {publishing ? "Publicando..." : "Publicar agora"}
          </button>
          <button
            onClick={() => save()}
            disabled={saving || loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Salvar
          </button>
          <button
            onClick={() => save({ resetPublication: true })}
            disabled={saving || loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black hover:bg-indigo-700 disabled:opacity-50"
            title="Volta para SCHEDULED e limpa dados de publicacao"
          >
            <Calendar className="w-4 h-4" />
            Reagendar + reset
          </button>
          <button
            onClick={remove}
            disabled={saving || loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-black hover:bg-rose-700 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Deletar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Plataforma</label>
              <select
                value={form.platform}
                onChange={(e) => setForm((s) => ({ ...s, platform: e.target.value }))}
                className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-50"
              >
                <option value="META">Meta (Instagram)</option>
                <option value="YOUTUBE">YouTube</option>
                <option value="TIKTOK">TikTok</option>
                <option value="LINKEDIN">LinkedIn</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Tipo</label>
              <select
                value={form.postType}
                onChange={(e) => setForm((s) => ({ ...s, postType: e.target.value }))}
                className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-50"
              >
                <option value="REEL">REEL</option>
                <option value="STORY">STORY</option>
              </select>
              <div className="mt-1 text-[10px] text-slate-500">
                YouTube/TikTok usam este mesmo post como video curto (Shorts/Reels).
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}
                className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-50"
              >
                <option value="DRAFT">DRAFT</option>
                <option value="SCHEDULED">SCHEDULED</option>
                <option value="PROCESSING_MEDIA">PROCESSING_MEDIA</option>
                <option value="PUBLISHING">PUBLISHING</option>
                <option value="POSTED">POSTED</option>
                <option value="FAILED">FAILED</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Agendar para</label>
              <input
                type="datetime-local"
                value={form.scheduledTo}
                onChange={(e) => setForm((s) => ({ ...s, scheduledTo: e.target.value }))}
                className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-50"
              />
              <div className="mt-1 text-[10px] text-slate-500">Deixe vazio para nao agendar.</div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Video URL</label>
            <input
              type="text"
              value={form.videoUrl}
              onChange={(e) => setForm((s) => ({ ...s, videoUrl: e.target.value }))}
              className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-50"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Legenda / descricao</label>
            <textarea
              value={form.summary}
              onChange={(e) => setForm((s) => ({ ...s, summary: e.target.value }))}
              rows={10}
              className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-50"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
            <div className="text-xs font-black text-slate-800 uppercase tracking-wider">Clonar para</div>
            <div className="mt-3 grid grid-cols-1 gap-2">
              <button
                onClick={() => cloneTo("YOUTUBE")}
                disabled={saving || loading}
                className="inline-flex items-center justify-between gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                YouTube
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={() => cloneTo("TIKTOK")}
                disabled={saving || loading}
                className="inline-flex items-center justify-between gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                TikTok
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={() => cloneTo("META")}
                disabled={saving || loading}
                className="inline-flex items-center justify-between gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Meta (IG)
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-2 text-[10px] text-slate-500">
              As copias usam o mesmo video/legenda e o mesmo "Agendar para".
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-2">
            <div className="text-xs font-black text-slate-800 uppercase tracking-wider">Links</div>
            {String(form.platform).toUpperCase() === "TIKTOK" ? (
              <div className="rounded-xl border border-cyan-100 bg-cyan-50 px-3 py-2 text-[11px] text-cyan-900">
                Para publicar no TikTok por esta tela, o Hub de Integracoes precisa estar com o TikTok ativado e com o Session ID salvo.
              </div>
            ) : null}
            {post?.postUrl ? (
              <a
                href={String(post.postUrl)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs font-black text-emerald-700 hover:underline"
              >
                Abrir publicado <ExternalLink className="w-4 h-4" />
              </a>
            ) : (
              <div className="text-xs text-slate-400">Ainda nao publicado.</div>
            )}
            {post?.videoUrl ? (
              <a
                href={String(post.videoUrl)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs font-black text-indigo-700 hover:underline"
              >
                Abrir video <ExternalLink className="w-4 h-4" />
              </a>
            ) : null}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-2">
            <div className="text-xs font-black text-slate-800 uppercase tracking-wider">Log</div>
            {String(form.platform).toUpperCase() === "TIKTOK" && tiktokProgress ? (
              <div className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-800">
                  <Logs className="h-4 w-4" />
                  Fluxo da Publicacao
                </div>
                <div className="mt-3 space-y-2">
                  {tiktokProgress.steps.map((step) => (
                    <div
                      key={step.key}
                      className={`flex items-start gap-3 rounded-xl border px-3 py-2 text-xs ${
                        step.state === "done"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                          : step.state === "active"
                            ? "border-indigo-200 bg-indigo-50 text-indigo-900"
                            : step.state === "error"
                              ? "border-rose-200 bg-rose-50 text-rose-900"
                              : "border-slate-200 bg-white text-slate-500"
                      }`}
                    >
                      {step.state === "done" ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                      ) : step.state === "active" ? (
                        <LoaderCircle className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
                      ) : step.state === "error" ? (
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      ) : (
                        <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-slate-300" />
                      )}
                      <div className="space-y-1">
                        <div className="font-black">{step.label}</div>
                        {step.detail ? <div className="text-[11px] opacity-80">{step.detail}</div> : null}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-[11px] font-medium text-slate-600">
                  {publishing ? "Atualizando automaticamente a cada 2 segundos..." : "Ao publicar, as etapas vao aparecendo aqui em tempo real."}
                </div>
              </div>
            ) : null}
            <pre className="max-h-60 overflow-auto rounded-xl bg-slate-50 border border-slate-200 p-3 text-[11px] text-slate-700 whitespace-pre-wrap">
              {post?.log ? String(post.log) : "-"}
            </pre>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-xs text-slate-500 font-bold">Carregando...</div>
      ) : null}
    </div>
  );
}
