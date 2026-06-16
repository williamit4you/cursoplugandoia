"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  ArrowLeft,
  Calendar,
  Copy,
  ExternalLink,
  RefreshCcw,
  Save,
  Trash2,
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

export default function SocialPostEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = String(params?.id || "");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
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
      toast.error(err.message || "Falha ao carregar post");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

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
    try {
      const path = publisherPath(form.platform, form.postType);
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socialPostId: id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Falha ao publicar");
      toast.success(data?.stillProcessing ? "Processando na Meta... aguarde." : "Publicação disparada.");
      await load();
    } catch (err: any) {
      toast.error(err.message || "Falha ao publicar");
    } finally {
      setSaving(false);
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
        if (!res.ok) throw new Error(data.error || "Falha ao criar cópia");
        toast.success(`Cópia criada (${platform}).`);
        router.push(`/admin/social/posts/${encodeURIComponent(String(data.id))}`);
      } catch (err: any) {
        toast.error(err.message || "Falha ao criar cópia");
      } finally {
        setSaving(false);
      }
    },
    [form.postType, form.scheduledTo, form.summary, form.videoUrl, post, router]
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
            <div className="text-[11px] font-bold text-amber-700">Alterações não salvas</div>
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
            Publicar agora
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
            title="Volta para SCHEDULED e limpa dados de publicação"
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
                YouTube/TikTok usam este mesmo post como vídeo curto (Shorts/Reels).
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
              <div className="mt-1 text-[10px] text-slate-500">Deixe vazio para não agendar.</div>
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
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Legenda / descrição</label>
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
              As cópias usam o mesmo vídeo/legenda e o mesmo “Agendar para”.
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
              <div className="text-xs text-slate-400">Ainda não publicado.</div>
            )}
            {post?.videoUrl ? (
              <a
                href={String(post.videoUrl)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs font-black text-indigo-700 hover:underline"
              >
                Abrir vídeo <ExternalLink className="w-4 h-4" />
              </a>
            ) : null}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-2">
            <div className="text-xs font-black text-slate-800 uppercase tracking-wider">Log</div>
            <pre className="max-h-60 overflow-auto rounded-xl bg-slate-50 border border-slate-200 p-3 text-[11px] text-slate-700 whitespace-pre-wrap">
              {post?.log ? String(post.log) : "—"}
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
