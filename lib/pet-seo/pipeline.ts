import "server-only";

import { prisma } from "@/lib/prisma";
import { calculateTextSimilarity } from "@/lib/seoGovernance";
import { bootstrapPetSeoProgram, getValidatedCobasiStore } from "./bootstrap";
import { hasForbiddenCobasiUrl } from "./affiliateRules";
import { petArticleWordCount, runPetSeoAgents, type PetSeoArticle } from "./agents";

function safeJson(value: unknown) {
  try { return JSON.stringify(value); } catch { return null; }
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  try { return JSON.parse(value || "") as T; } catch { return fallback; }
}

function nextDate(hours: number, from = new Date()) {
  return new Date(from.getTime() + Math.max(1, hours) * 60 * 60 * 1_000);
}

export async function validatePetPageForPublication(pageId: string) {
  const page = await prisma.petContentPage.findUnique({
    where: { id: pageId },
    include: { affiliateStore: true, location: { include: { units: { where: { status: "ACTIVE" } } } } },
  });
  if (!page) throw new Error("Conteúdo SEO Pet não encontrado");
  const store = await getValidatedCobasiStore();
  if (page.affiliateStoreId !== store.id || page.affiliateStore.slug !== "cobasi") throw new Error("Conteúdo não está vinculado ao afiliado Cobasi");
  if (!page.contentJson || !page.seoTitle || !page.metaDescription) throw new Error("Conteúdo, title ou meta description ausente");
  if (hasForbiddenCobasiUrl(page.contentJson) || hasForbiddenCobasiUrl(page.outlineJson)) throw new Error("Link direto da Cobasi encontrado no conteúdo");
  const article = parseJson<PetSeoArticle | null>(page.contentJson, null);
  if (!article || !Array.isArray(article.sections) || article.sections.length < 3) throw new Error("Estrutura H2 do conteúdo está incompleta");
  if (petArticleWordCount(article) < 700) throw new Error("Conteúdo abaixo do mínimo editorial para publicação");
  if (Number(page.qualityScore || 0) < 80) throw new Error("Nota de qualidade abaixo de 80");
  if (page.type === "LOCAL") {
    if (page.location?.status !== "VERIFIED" || !page.location.sourceUrl || !page.location.verifiedAt) throw new Error("Cidade ainda não possui verificação e fonte");
    if (!page.location.units.length) throw new Error("Página local precisa de ao menos uma unidade verificada");
  }
  return page;
}

export async function runPetSeoOnce(options: { force?: boolean } = {}) {
  await bootstrapPetSeoProgram();
  const config = await prisma.petSeoConfig.findUniqueOrThrow({ where: { id: "cobasi" } });
  if (!config.enabled && !options.force) return { ok: true, skipped: true, reason: "Automação SEO Pet pausada" };
  if (!options.force && config.nextRunAt && config.nextRunAt > new Date()) return { ok: true, skipped: true, reason: "Aguardando próxima execução", nextRunAt: config.nextRunAt };
  if (config.lockedAt && config.lockedAt > new Date(Date.now() - 45 * 60_000)) return { ok: true, skipped: true, reason: "Execução já em andamento" };

  const lock = new Date();
  const claimedConfig = await prisma.petSeoConfig.updateMany({
    where: { id: "cobasi", OR: [{ lockedAt: null }, { lockedAt: { lt: new Date(Date.now() - 45 * 60_000) } }] },
    data: { lockedAt: lock },
  });
  if (!claimedConfig.count) return { ok: true, skipped: true, reason: "Concorrência bloqueada" };

  let runId: string | null = null;
  try {
    const candidate = await prisma.petContentPage.findFirst({
      where: { status: "QUEUED", OR: [{ scheduledAt: null }, { scheduledAt: { lte: new Date() } }] },
      include: { location: { include: { units: { where: { status: "ACTIVE" } } } } },
      orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
    });
    if (!candidate) {
      const result = { ok: true, skipped: true, reason: "Fila editorial vazia" };
      await prisma.petSeoConfig.update({ where: { id: "cobasi" }, data: { lockedAt: null, lastRunAt: new Date(), nextRunAt: nextDate(config.runEveryHours), lastResultJson: safeJson(result) } });
      return result;
    }
    if (candidate.type === "LOCAL" && candidate.location?.status !== "VERIFIED") {
      await prisma.petContentPage.update({ where: { id: candidate.id }, data: { status: "DRAFT", lastError: "Cidade aguardando verificação" } });
      throw new Error("Página local selecionada sem cidade verificada");
    }
    const claimed = await prisma.petContentPage.updateMany({ where: { id: candidate.id, status: "QUEUED" }, data: { status: "GENERATING", attemptCount: { increment: 1 }, lastError: null } });
    if (!claimed.count) throw new Error("Pauta já foi selecionada por outra execução");
    const run = await prisma.petSeoRun.create({ data: { pageId: candidate.id, status: "RUNNING", step: "AI_STRATEGY", message: `Produzindo ${candidate.title}` } });
    runId = run.id;

    const existing = await prisma.petContentPage.findMany({ where: { id: { not: candidate.id }, status: { in: ["REVIEW", "PUBLISHED"] } }, select: { title: true, contentJson: true }, take: 500 });
    const sources = parseJson<unknown[]>(candidate.sourcesJson, []);
    const internalLinks = parseJson<string[]>(candidate.internalLinksJson, []);
    const agents = await runPetSeoAgents({
      page: { type: candidate.type, title: candidate.title, primaryKeyword: candidate.primaryKeyword, searchIntent: candidate.searchIntent, path: candidate.path },
      location: candidate.location ? {
        city: candidate.location.city,
        state: candidate.location.state,
        facts: parseJson(candidate.location.factsJson, {}),
        units: candidate.location.units,
      } : null,
      sources,
      internalLinks,
      existingTitles: existing.map((item) => item.title),
      minimumWords: config.minimumWords,
    });
    const similarity = existing.map((item) => ({ title: item.title, score: calculateTextSimilarity(JSON.stringify(agents.article), item.contentJson || item.title) })).sort((a, b) => b.score - a.score)[0];
    const forbiddenUrl = hasForbiddenCobasiUrl(agents.article);
    const qualityPassed = agents.review?.approved === true && Number(agents.review?.score || 0) >= config.minimumScore && agents.wordCount >= config.minimumWords && Number(similarity?.score || 0) < 0.72 && !forbiddenUrl;
    const autoPublishEligible = qualityPassed && config.autoPublish && candidate.type !== "LOCAL";
    const nextStatus = autoPublishEligible ? "PUBLISHED" : "REVIEW";
    const now = new Date();
    await prisma.petContentPage.update({
      where: { id: candidate.id },
      data: {
        status: nextStatus,
        seoTitle: String(agents.strategy?.seoTitle || candidate.title).slice(0, 180),
        metaDescription: String(agents.strategy?.metaDescription || agents.article.intro).slice(0, 300),
        outlineJson: safeJson(agents.strategy?.outline || []),
        contentJson: safeJson(agents.article),
        reviewJson: safeJson({ review: agents.review, research: agents.research, strategy: agents.strategy, similarity, forbiddenUrl }),
        qualityScore: Number(agents.review?.score || 0),
        reviewedAt: now,
        publishedAt: autoPublishEligible ? now : null,
        indexable: autoPublishEligible,
        expiresAt: candidate.type === "LOCAL" ? new Date(now.getTime() + 90 * 86400_000) : new Date(now.getTime() + 180 * 86400_000),
        lastError: qualityPassed ? null : "Retido pelo preflight editorial; consulte a revisão",
      },
    });
    const result = { ok: true, runId, pageId: candidate.id, path: candidate.path, status: nextStatus, wordCount: agents.wordCount, score: Number(agents.review?.score || 0), similarity };
    await Promise.all([
      prisma.petSeoRun.update({ where: { id: runId }, data: { status: nextStatus, step: autoPublishEligible ? "SITEMAP_READY" : "EDITORIAL_REVIEW", message: autoPublishEligible ? "Publicado e liberado para sitemap" : "Rascunho produzido e enviado para revisão", detailsJson: safeJson(result), completedAt: now } }),
      prisma.petSeoConfig.update({ where: { id: "cobasi" }, data: { lockedAt: null, lastRunAt: now, nextRunAt: nextDate(config.runEveryHours, now), lastResultJson: safeJson(result) } }),
    ]);
    return result;
  } catch (error: any) {
    const message = error?.message || "Falha no pipeline SEO Pet";
    if (runId) await prisma.petSeoRun.update({ where: { id: runId }, data: { status: "FAILED", step: "FAILED", message, completedAt: new Date() } }).catch(() => null);
    await prisma.petSeoConfig.update({ where: { id: "cobasi" }, data: { lockedAt: null, lastRunAt: new Date(), nextRunAt: nextDate(config.runEveryHours), lastResultJson: safeJson({ ok: false, runId, error: message }) } }).catch(() => null);
    throw error;
  }
}

