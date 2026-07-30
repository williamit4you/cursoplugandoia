import "server-only";

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { calculateTextSimilarity } from "@/lib/seoGovernance";
import { discoverStoreProduct } from "./scraper";
import { runCommerceEditorialAgents } from "./agents";

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 150);
}

function nextDate(hours: number) {
  return new Date(Date.now() + Math.max(1, hours) * 60 * 60 * 1_000);
}

function json(value: unknown) {
  try { return JSON.stringify(value); } catch { return null; }
}

async function selectStore() {
  const stores = await prisma.affiliateStore.findMany({
    where: { status: "ACTIVE" },
    include: { products: { select: { productUrl: true }, orderBy: { createdAt: "desc" }, take: 200 } },
    orderBy: [{ featured: "desc" }, { updatedAt: "asc" }],
  });
  if (!stores.length) throw new Error("Nenhuma loja ativa está cadastrada");
  const recent = await prisma.commerceEditorialRun.findMany({
    where: { storeId: { in: stores.map((store) => store.id) }, status: { in: ["PUBLISHED", "REVIEW"] } },
    select: { storeId: true, startedAt: true },
    orderBy: { startedAt: "desc" },
    take: stores.length * 2,
  });
  const lastByStore = new Map<string, number>();
  recent.forEach((run) => {
    if (run.storeId && !lastByStore.has(run.storeId)) lastByStore.set(run.storeId, run.startedAt.getTime());
  });
  return stores.sort((a, b) => (lastByStore.get(a.id) || 0) - (lastByStore.get(b.id) || 0))[0];
}

export async function runCommerceEditorialOnce(options: { force?: boolean } = {}) {
  const config = await prisma.commerceEditorialConfig.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
  if (!config.enabled && !options.force) return { ok: true, skipped: true, reason: "Automação editorial desativada" };
  if (!options.force && config.nextRunAt && config.nextRunAt > new Date()) {
    return { ok: true, skipped: true, reason: "Ainda não chegou o horário", nextRunAt: config.nextRunAt };
  }
  if (config.lockedAt && config.lockedAt > new Date(Date.now() - 45 * 60_000)) {
    return { ok: true, skipped: true, reason: "Já existe uma execução em andamento" };
  }

  const lock = new Date();
  const claimed = await prisma.commerceEditorialConfig.updateMany({
    where: { id: "default", OR: [{ lockedAt: null }, { lockedAt: { lt: new Date(Date.now() - 45 * 60_000) } }] },
    data: { lockedAt: lock },
  });
  if (!claimed.count) return { ok: true, skipped: true, reason: "Execução concorrente bloqueada" };

  const run = await prisma.commerceEditorialRun.create({ data: { status: "RUNNING", step: "SELECT_STORE" } });
  try {
    const store = await selectStore();
    await prisma.commerceEditorialRun.update({ where: { id: run.id }, data: { storeId: store.id, step: "DISCOVER_PRODUCT", message: `Pesquisando um produto em ${store.name}` } });
    const product = await discoverStoreProduct(store.baseUrl, store.products.map((item) => item.productUrl).filter(Boolean) as string[]);
    const externalRef = `commerce:${crypto.createHash("sha256").update(product.url).digest("hex")}`;
    const catalog = await prisma.productCatalog.upsert({
      where: { externalRef },
      update: {
        name: product.name, description: product.description, productUrl: product.url, affiliateUrl: store.affiliateUrl,
        imageUrl: product.imageUrl, price: product.price, currency: product.currency || "BRL", category: store.category,
        affiliateStoreId: store.id, metadataJson: json({ brand: product.brand, evidence: product.evidence }),
      },
      create: {
        externalRef, name: product.name, slug: `${slugify(product.name)}-${externalRef.slice(-7)}`, description: product.description,
        productUrl: product.url, affiliateUrl: store.affiliateUrl, imageUrl: product.imageUrl, price: product.price,
        currency: product.currency || "BRL", category: store.category, affiliateStoreId: store.id,
        metadataJson: json({ brand: product.brand, evidence: product.evidence }),
      },
    });
    await prisma.commerceEditorialRun.update({ where: { id: run.id }, data: { productId: catalog.id, sourceUrl: product.url, step: "AI_AGENTS", message: "Produto identificado. Pesquisa, redação e revisão SEO iniciadas." } });

    const existingBriefs = await prisma.seoBrief.findMany({ select: { title: true }, where: { status: { in: ["REVIEW", "APPROVED", "PUBLISHED"] } }, take: 500 });
    const agents = await runCommerceEditorialAgents({
      store: { name: store.name, category: store.category, domain: store.domain },
      product: { ...product },
      existingTitles: existingBriefs.map((item) => item.title),
      minimumWords: config.minimumWords,
    });
    const mostSimilar = existingBriefs.map((item) => ({ title: item.title, score: calculateTextSimilarity(agents.article.title, item.title) })).sort((a, b) => b.score - a.score)[0];
    const duplicate = Number(mostSimilar?.score || 0) >= 0.75;
    const hasSource = product.evidence.length > 0 && Boolean(product.url);
    const approvedByAgent = agents.review?.approved === true && Number(agents.review?.score || 0) >= 75;
    const qualityPassed = approvedByAgent && hasSource && !duplicate && agents.wordCount >= config.minimumWords;
    const status = qualityPassed && config.autoPublish ? "PUBLISHED" : "REVIEW";
    const uniqueSlug = `${slugify(agents.article.title || product.name)}-${catalog.id.slice(-6)}`;
    const brief = await prisma.seoBrief.upsert({
      where: { productId_angle: { productId: catalog.id, angle: "PRODUCT" } },
      update: {
        title: agents.article.title, slug: uniqueSlug, primaryKeyword: agents.article.primaryKeyword,
        intent: String(agents.strategy?.intent || "comercial"), outlineJson: json(agents.article.sections),
        sourcesJson: json([{ source: "STORE_PAGE", collectedAt: new Date().toISOString(), url: product.url, evidence: product.evidence }]),
        reviewNotes: json({ reviewer: agents.review, research: agents.research, strategy: agents.strategy, duplicate: mostSimilar }),
        metaDescription: agents.article.metaDescription, contentJson: json(agents.article), qualityScore: Number(agents.review?.score || 0),
        status, indexable: status === "PUBLISHED", publishedAt: status === "PUBLISHED" ? new Date() : null,
      },
      create: {
        productId: catalog.id, angle: "PRODUCT", status, title: agents.article.title, slug: uniqueSlug,
        primaryKeyword: agents.article.primaryKeyword, intent: String(agents.strategy?.intent || "comercial"),
        outlineJson: json(agents.article.sections), internalLinksJson: json([`/lojas/${store.slug}`, "/produtos"]),
        sourcesJson: json([{ source: "STORE_PAGE", collectedAt: new Date().toISOString(), url: product.url, evidence: product.evidence }]),
        reviewNotes: json({ reviewer: agents.review, research: agents.research, strategy: agents.strategy, duplicate: mostSimilar }),
        metaDescription: agents.article.metaDescription, contentJson: json(agents.article), qualityScore: Number(agents.review?.score || 0),
        indexable: status === "PUBLISHED", publishedAt: status === "PUBLISHED" ? new Date() : null,
      },
    });

    await prisma.commerceEditorialRun.update({
      where: { id: run.id },
      data: {
        briefId: brief.id, status, step: status === "PUBLISHED" ? "SITEMAP_READY" : "EDITORIAL_REVIEW",
        message: status === "PUBLISHED" ? "Artigo aprovado, publicado e liberado para o sitemap." : "Artigo criado, mas retido para revisão.",
        detailsJson: json({ wordCount: agents.wordCount, reviewer: agents.review, duplicate, mostSimilar }),
        completedAt: new Date(),
      },
    });
    const result = { ok: true, runId: run.id, status, store: store.name, product: product.name, briefId: brief.id, wordCount: agents.wordCount, review: agents.review };
    await prisma.commerceEditorialConfig.update({
      where: { id: "default" },
      data: { lockedAt: null, lastRunAt: new Date(), nextRunAt: nextDate(config.runEveryHours), lastResultJson: json(result) },
    });
    return result;
  } catch (error: any) {
    const message = error?.message || "Falha desconhecida no fluxo editorial";
    await prisma.commerceEditorialRun.update({ where: { id: run.id }, data: { status: "FAILED", message, completedAt: new Date() } }).catch(() => null);
    await prisma.commerceEditorialConfig.update({ where: { id: "default" }, data: { lockedAt: null, lastRunAt: new Date(), nextRunAt: nextDate(config.runEveryHours), lastResultJson: json({ ok: false, runId: run.id, error: message }) } }).catch(() => null);
    throw error;
  }
}
