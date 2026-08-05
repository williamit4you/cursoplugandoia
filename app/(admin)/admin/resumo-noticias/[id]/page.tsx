"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Alert } from "@mui/material";
import { ArrowLeft, ExternalLink, FileText, PlayCircle, Video } from "lucide-react";

type EditionDetail = {
  id: string;
  editionDate: string;
  timezone: string;
  status: string;
  title?: string | null;
  description?: string | null;
  scriptText?: string | null;
  targetDurationSec: number;
  measuredDurationSec?: number | null;
  previewVideoUrl?: string | null;
  finalVideoUrl?: string | null;
  thumbnailUrl?: string | null;
  captionsUrl?: string | null;
  scriptApprovedAt?: string | null;
  scriptApprovedBy?: string | null;
  finalApprovedAt?: string | null;
  finalApprovedBy?: string | null;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  youtubePostUrl?: string | null;
  errorMessage?: string | null;
  codeVideoProject?: {
    id: string;
    status: string;
    videoUrl?: string | null;
    thumbUrl?: string | null;
    socialPosts?: Array<{
      id: string;
      platform: string;
      status: string;
      postUrl?: string | null;
      youtubePostUrl?: string | null;
    }>;
    pipelineEvents?: Array<{
      id: string;
      stepName?: string | null;
      level: string;
      message: string;
      createdAt: string;
    }>;
  } | null;
  items: Array<{
    id: string;
    position: number;
    category?: string | null;
    titleSnapshot: string;
    sourceName?: string | null;
    sourceUrl?: string | null;
    publishedAtSnapshot?: string | null;
    verificationJson?: {
      hasSource?: boolean;
      sensitive?: boolean;
      warnings?: string[];
    } | null;
    post: {
      id: string;
      slug?: string | null;
      status: string;
      summary?: string | null;
      coverImage?: string | null;
    };
    assets: Array<{
      id: string;
      assetType: string;
      status: string;
      stableUrl?: string | null;
    }>;
  }>;
  assets: Array<{
    id: string;
    assetType: string;
    status: string;
    stableUrl?: string | null;
  }>;
};

function formatDate(value: string | null | undefined, withTime = false) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("pt-BR", withTime ? undefined : { day: "2-digit", month: "2-digit", year: "numeric" });
}

function durationLabel(seconds: number | null | undefined) {
  if (!seconds || !Number.isFinite(seconds)) return "-";
  const total = Math.max(0, Math.round(seconds));
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return `${min}m ${String(sec).padStart(2, "0")}s`;
}

function publicPostUrl(slug: string | null | undefined) {
  const clean = String(slug || "").trim();
  return clean ? `/noticias/${clean}` : null;
}

function statusTone(status: string) {
  const normalized = String(status || "").toUpperCase();
  if (["PUBLISHED", "APPROVED"].includes(normalized)) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (["FAILED", "REJECTED", "CANCELED"].includes(normalized)) return "bg-rose-50 text-rose-700 border-rose-200";
  if (["RENDERING", "GENERATING_AUDIO", "PLANNING_VISUALS", "SCRIPTING", "CURATING"].includes(normalized)) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

export default function NewsSummaryDetailPage() {
  const params = useParams();
  const [item, setItem] = useState<EditionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/resumo-noticias/${params.id}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (!data?.item) {
          throw new Error(data?.error || "Edicao nao encontrada.");
        }
        setItem(data.item);
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err?.message || "Falha ao carregar a edicao.");
        setLoading(false);
      });
  }, [params.id]);

  const cards = useMemo(() => {
    if (!item) return [];
    return [
      { label: "Noticias", value: String(item.items.length), tone: "bg-indigo-50 text-indigo-700 border-indigo-200" },
      { label: "Assets", value: String(item.assets.length + item.items.reduce((acc, current) => acc + current.assets.length, 0)), tone: "bg-violet-50 text-violet-700 border-violet-200" },
      { label: "Preview", value: item.previewVideoUrl ? "Disponivel" : "Pendente", tone: item.previewVideoUrl ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-700 border-slate-200" },
      { label: "YouTube", value: item.youtubePostUrl ? "Publicado" : "Nao enviado", tone: item.youtubePostUrl ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-slate-100 text-slate-700 border-slate-200" },
    ];
  }, [item]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="space-y-4">
        <Alert severity="error">{error || "Edicao nao encontrada."}</Alert>
        <Link href="/admin/resumo-noticias" className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">
          Voltar
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/resumo-noticias"
                className="rounded-xl border border-white/15 bg-white/10 p-2 text-white transition-colors hover:bg-white/15"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-indigo-300">
                Resumo de Noticias
              </p>
              <span className={`rounded-full border px-3 py-1 text-[11px] font-black ${statusTone(item.status)}`}>
                {item.status}
              </span>
            </div>
            <h1 className="mt-4 line-clamp-2 text-3xl font-black tracking-tight">
              {item.title || "Edicao sem titulo"}
            </h1>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
              {item.description || "Edicao preparada para resumo diario com timeline, pauta, assets e envio para YouTube."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-200">
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1">
                Data: {formatDate(item.editionDate)}
              </span>
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1">
                Alvo: {durationLabel(item.targetDurationSec)}
              </span>
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1">
                Real: {durationLabel(item.measuredDurationSec)}
              </span>
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1">
                Roteiro: {item.scriptApprovedAt ? `OK • ${item.scriptApprovedBy || "admin"}` : "Pendente"}
              </span>
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1">
                Final: {item.finalApprovedAt ? `OK • ${item.finalApprovedBy || "admin"}` : "Pendente"}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {item.youtubePostUrl ? (
              <a
                href={item.youtubePostUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-rose-300/30 bg-rose-400/10 px-4 py-2.5 text-sm font-black text-rose-100"
              >
                <Video className="h-4 w-4" />
                Abrir YouTube
              </a>
            ) : null}
            {item.finalVideoUrl || item.codeVideoProject?.videoUrl ? (
              <a
                href={item.finalVideoUrl || item.codeVideoProject?.videoUrl || "#"}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-violet-300/30 bg-violet-400/10 px-4 py-2.5 text-sm font-black text-violet-100"
              >
                <PlayCircle className="h-4 w-4" />
                Abrir MP4
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {error ? (
        <Alert severity="error" className="rounded-xl border border-rose-200/50 shadow-sm">
          {error}
        </Alert>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className={`rounded-2xl border p-5 ${card.tone}`}>
            <p className="text-xs font-black uppercase tracking-wide">{card.label}</p>
            <p className="mt-2 text-2xl font-black">{card.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">Pauta da edicao</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Noticias selecionadas para o resumo diario, com ordem, categoria e links de origem.
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-4">
              {item.items.length ? item.items.map((news) => (
                <article key={news.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-black text-indigo-700">
                          #{news.position}
                        </span>
                        {news.category ? (
                          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black text-slate-600">
                            {news.category}
                          </span>
                        ) : null}
                        {(news.verificationJson?.warnings || []).map((warning) => (
                          <span
                            key={`${news.id}-${warning}`}
                            className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-black text-amber-700"
                          >
                            {warning}
                          </span>
                        ))}
                      </div>
                      <h3 className="mt-3 text-sm font-black text-slate-900">{news.titleSnapshot}</h3>
                      <p className="mt-2 text-xs leading-6 text-slate-500">
                        {news.post.summary || "Sem resumo da noticia."}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500">
                        <span>Fonte: {news.sourceName || "Sem fonte"}</span>
                        <span>Data: {formatDate(news.publishedAtSnapshot)}</span>
                        <span>Assets: {news.assets.length}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {publicPostUrl(news.post.slug) ? (
                        <Link
                          href={publicPostUrl(news.post.slug)!}
                          target="_blank"
                          className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-[11px] font-black text-indigo-700"
                        >
                          Artigo
                        </Link>
                      ) : null}
                      {news.sourceUrl ? (
                        <a
                          href={news.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-black text-emerald-700"
                        >
                          Fonte
                        </a>
                      ) : null}
                    </div>
                  </div>
                </article>
              )) : (
                <p className="text-sm text-slate-400">Nenhuma noticia foi vinculada a esta edicao ainda.</p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">Artefatos e publicacao</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {[
                { label: "Preview", url: item.previewVideoUrl },
                { label: "Video final", url: item.finalVideoUrl || item.codeVideoProject?.videoUrl || null },
                { label: "Thumbnail", url: item.thumbnailUrl || item.codeVideoProject?.thumbUrl || null },
                { label: "Legenda", url: item.captionsUrl },
                { label: "YouTube", url: item.youtubePostUrl },
              ].map((artifact) => (
                <div key={artifact.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">{artifact.label}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    {artifact.url ? "Disponivel" : "Pendente"}
                  </p>
                  {artifact.url ? (
                    <a
                      href={artifact.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-2 text-xs font-black text-indigo-600"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Abrir
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">Roteiro e observacoes</h2>
            <div className="mt-4 space-y-4 text-sm text-slate-600">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">Descricao</p>
                <p className="mt-1 leading-6">{item.description || "Sem descricao operacional."}</p>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">Roteiro</p>
                <p className="mt-1 whitespace-pre-wrap leading-6">
                  {item.scriptText || "Roteiro ainda nao gerado."}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">Eventos e erros</h2>
            <div className="mt-4 space-y-3">
              {item.errorMessage ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
                  {item.errorMessage}
                </div>
              ) : null}
              {item.codeVideoProject?.pipelineEvents?.length ? (
                item.codeVideoProject.pipelineEvents.map((event) => (
                  <article key={event.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                        {event.stepName || event.level}
                      </p>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {formatDate(event.createdAt, true)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-700">{event.message}</p>
                  </article>
                ))
              ) : (
                <p className="text-sm text-slate-400">Sem eventos recentes registrados.</p>
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
