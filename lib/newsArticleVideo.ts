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
  const unique = Array.from(new Set(platforms));
  if (unique.length > 0) return unique;
  return ["INSTAGRAM", "TIKTOK", "YOUTUBE"];
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

  const existing = await prisma.codeVideoProject.findMany({
    where: {
      OR: [
        { postId: post.id },
        { metadataJson: { contains: `"postId":"${post.id}"` } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  const plainContent = clip(htmlToPlainText(post.content || ""), 1600);
  const summary = clip(normalize(post.summary), 420);
  const durationSec = resolveDurationSec(automation.config.videoDurationSec);
  const articleUrl = articleUrlForSlug(post.slug);

  const baseIdeaPrompt = [
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

  const variants = [
    { key: "BROLL", useExternalMedia: true, platforms: ["YOUTUBE"] },
    { key: "PRESENTER", useExternalMedia: false, platforms: ["INSTAGRAM", "TIKTOK", "YOUTUBE"] },
  ] as const;
  const projects = [] as any[];

  for (const variant of variants) {
    const legacyMatch = existing.find((item) => !item.newsVariant && item.metadataJson.includes(`"postId":"${post.id}"`));
    const found = existing.find((item) => item.newsVariant === variant.key) || (variant.key === "PRESENTER" ? legacyMatch : undefined);
    if (found) {
      projects.push(found);
      continue;
    }

    const metadata = {
      sourcePosts: [post.id],
      postId: post.id,
      postSlug: post.slug,
      coverImage: post.coverImage || null,
      articleUrl: articleUrl || null,
      newsVariant: variant.key,
      newsAutomation: {
        enabled: true,
        autoScheduleSocial: true,
        platforms: variant.platforms,
        source: "post_create_or_update",
      },
    };
    const project = await prisma.codeVideoProject.create({
      data: {
        postId: post.id,
        newsVariant: variant.key,
        projectType: "GENERIC",
        ideaPrompt: `${baseIdeaPrompt}\n\nVARIANTE: ${variant.key === "BROLL" ? "imagens e videos contextuais gratuitos, sem apresentadora" : "apresentadora com imagem animada"}.`,
        aspectRatio: "PORTRAIT_9_16",
        videoDurationSec: durationSec,
        ttsVoice: normalize(automation.config.ttsVoice) || "pt-BR-AntonioNeural",
        ttsSpeed: normalize(automation.config.ttsSpeed) || "+5%",
        useExternalMedia: variant.useExternalMedia && Boolean(automation.config.pexelsEnabled),
        title: clip(post.title, 120),
        description: summary || clip(plainContent, 300),
        metadataJson: JSON.stringify(metadata),
      },
    });
    await upsertCodeVideoPipelineStep({ projectId: project.id, stepName: "QUEUE_FROM_POST", status: "SUCCESS", attempt: 1, startedAt: new Date(), finishedAt: new Date(), responsePayload: { postId: post.id, variant: variant.key, platforms: variant.platforms } }).catch(() => null);
    await logCodeVideoPipelineEvent({ projectId: project.id, stepName: "QUEUE_FROM_POST", message: `Projeto ${variant.key} criado automaticamente a partir do artigo.`, metadata: { postId: post.id, postTitle: post.title, variant: variant.key, platforms: variant.platforms, durationSec } }).catch(() => null);
    projects.push(project);
  }

  return { post, skipped: false as const, projects, platforms: automation.platforms };
}
