import "server-only";

import { prisma } from "@/lib/prisma";
import { logCodeVideoPipelineEvent, upsertCodeVideoPipelineStep } from "@/lib/video-code/logger";

function normalize(value: unknown) {
  return String(value || "").trim();
}

function htmlToPlainText(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function clip(text: string, max: number) {
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 3)).trim()}...`;
}

function articleUrlForSlug(slug: string) {
  const base = normalize(process.env.NEXT_PUBLIC_SITE_URL).replace(/\/+$/, "");
  if (!base) return "";
  return `${base}/noticias/${slug}`;
}

function newsVideoEnabled() {
  const raw = normalize(process.env.NEWS_ARTICLE_AUTO_VIDEO_ENABLED).toLowerCase();
  if (!raw) return true;
  return raw !== "false" && raw !== "0" && raw !== "off";
}

function resolveDurationSec(raw: unknown) {
  const value = Number(raw || 60);
  if (!Number.isFinite(value) || value <= 0) return 60;
  return Math.min(60, Math.max(15, Math.round(value)));
}

function resolvePlatforms(config: {
  autoPublishReels?: boolean | null;
  autoPublishTikTok?: boolean | null;
  autoPublishLinkedIn?: boolean | null;
  autoPublishYouTube?: boolean | null;
}) {
  const platforms: string[] = [];
  if (config.autoPublishReels) platforms.push("INSTAGRAM");
  if (config.autoPublishTikTok) platforms.push("TIKTOK");
  if (config.autoPublishLinkedIn) platforms.push("LINKEDIN");
  if (config.autoPublishYouTube) platforms.push("YOUTUBE");
  return Array.from(new Set(platforms));
}

export async function shouldAutoGenerateNewsVideo() {
  if (!newsVideoEnabled()) return { enabled: false as const, reason: "disabled_env" };

  const config = await prisma.scraperConfig.findFirst({
    orderBy: { createdAt: "desc" },
    select: {
      videoDurationSec: true,
      videoStyle: true,
      ttsVoice: true,
      ttsSpeed: true,
      pexelsEnabled: true,
      autoPublishReels: true,
      autoPublishTikTok: true,
      autoPublishLinkedIn: true,
      autoPublishYouTube: true,
    },
  });

  if (!config) return { enabled: false as const, reason: "missing_scraper_config" };

  return {
    enabled: true as const,
    config,
    platforms: resolvePlatforms(config),
  };
}

export async function ensureNewsVideoProjectForPost(postId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      title: true,
      slug: true,
      summary: true,
      content: true,
      coverImage: true,
      status: true,
      createdAt: true,
    },
  });

  if (!post) {
    throw new Error("Post nao encontrado para gerar video-resumo.");
  }

  const automation = await shouldAutoGenerateNewsVideo();
  if (!automation.enabled) {
    return { post, skipped: true as const, reason: automation.reason };
  }

  const existing = await prisma.codeVideoProject.findFirst({
    where: {
      metadataJson: {
        contains: `"postId":"${post.id}"`,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    await logCodeVideoPipelineEvent({
      projectId: existing.id,
      stepName: "QUEUE_FROM_POST",
      message: "Reutilizando projeto de video-engajamento ja existente para este artigo.",
      metadata: { postId: post.id, postStatus: post.status },
    }).catch(() => null);
    return { post, skipped: false as const, project: existing, platforms: automation.platforms };
  }

  const plainContent = clip(htmlToPlainText(post.content || ""), 1600);
  const summary = clip(normalize(post.summary), 420);
  const durationSec = resolveDurationSec(automation.config.videoDurationSec);
  const articleUrl = articleUrlForSlug(post.slug);

  const metadata = {
    sourcePosts: [post.id],
    postId: post.id,
    postSlug: post.slug,
    coverImage: post.coverImage || null,
    articleUrl: articleUrl || null,
    newsAutomation: {
      enabled: true,
      autoScheduleSocial: true,
      platforms: automation.platforms,
      source: "post_create_or_update",
    },
  };

  const ideaPrompt = [
    `Crie um video curto de noticia em portugues do Brasil com no maximo ${durationSec} segundos.`,
    "Objetivo: resumir a noticia com clareza, ritmo alto, boa retencao e linguagem natural para Reels/TikTok/Shorts.",
    "O video deve ter narracao principal, legendas coerentes e cortes visuais profissionais com apoio de imagens/videos contextuais quando fizer sentido.",
    "Estrutura sugerida: gancho forte, contexto essencial, fato principal, impacto/consequencia e fechamento curto.",
    `Titulo da noticia: ${post.title}`,
    summary ? `Resumo editorial: ${summary}` : "",
    plainContent ? `Conteudo base do artigo: ${plainContent}` : "",
    articleUrl ? `URL do artigo completo: ${articleUrl}` : "",
    `Estilo desejado: ${normalize(automation.config.videoStyle) || "journalism"}.`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const project = await prisma.codeVideoProject.create({
    data: {
      projectType: "GENERIC",
      ideaPrompt,
      aspectRatio: "PORTRAIT_9_16",
      videoDurationSec: durationSec,
      ttsVoice: normalize(automation.config.ttsVoice) || "pt-BR-AntonioNeural",
      ttsSpeed: normalize(automation.config.ttsSpeed) || "+5%",
      useExternalMedia: Boolean(automation.config.pexelsEnabled),
      title: clip(post.title, 120),
      description: summary || clip(plainContent, 300),
      metadataJson: JSON.stringify(metadata),
    },
  });

  await upsertCodeVideoPipelineStep({
    projectId: project.id,
    stepName: "QUEUE_FROM_POST",
    status: "SUCCESS",
    attempt: 1,
    startedAt: new Date(),
    finishedAt: new Date(),
    responsePayload: {
      postId: post.id,
      postStatus: post.status,
      platforms: automation.platforms,
    },
  }).catch(() => null);

  await logCodeVideoPipelineEvent({
    projectId: project.id,
    stepName: "QUEUE_FROM_POST",
    message: "Projeto de video-engajamento criado automaticamente a partir do artigo.",
    metadata: {
      postId: post.id,
      postTitle: post.title,
      platforms: automation.platforms,
      durationSec,
    },
  }).catch(() => null);

  return { post, skipped: false as const, project, platforms: automation.platforms };
}
