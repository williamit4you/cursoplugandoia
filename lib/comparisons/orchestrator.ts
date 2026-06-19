import { prisma } from "@/lib/prisma";
import { generateComparisonArticle, reviewComparisonArticle } from "@/lib/comparisons/ai";
import { COMPARISON_PIPELINE_STEPS, getStoreNameFromHost, isSupportedComparisonUrl } from "@/lib/comparisons/constants";
import { logComparisonEvent, upsertComparisonStep } from "@/lib/comparisons/logger";
import { scrapeComparisonProduct } from "@/lib/comparisons/scrape";
import { buildComparisonTitle, comparisonSlugify, currentComparisonYear, normalizeTheme, safeJsonParse } from "@/lib/comparisons/utils";

async function ensureConfig() {
  const existing = await prisma.affiliateComparisonConfig.findFirst();
  if (existing) return existing;
  return prisma.affiliateComparisonConfig.create({ data: {} });
}

async function ensureUniqueSlug(baseSlug: string, comparisonId: string) {
  let slug = baseSlug || `comparativo-${comparisonId.slice(-6)}`;
  for (let i = 0; i < 50; i++) {
    const existing = await prisma.affiliateComparison.findFirst({
      where: {
        slug,
        NOT: { id: comparisonId },
      },
      select: { id: true },
    });
    if (!existing) return slug;
    slug = `${baseSlug}-${i + 2}`;
  }
  return `${baseSlug}-${Date.now().toString().slice(-5)}`;
}

export async function enqueueComparisonRun(comparisonId: string) {
  await prisma.affiliateComparison.update({
    where: { id: comparisonId },
    data: {
      status: "QUEUED",
      errorMessage: null,
      lastError: null,
      attemptCount: { increment: 1 },
    },
  });

  Promise.resolve()
    .then(() => runComparisonPipeline(comparisonId))
    .catch((error) => console.error("[comparisons pipeline]", error));
}

export async function runComparisonPipeline(comparisonId: string) {
  const config = await ensureConfig();
  const comparison = await prisma.affiliateComparison.findUnique({
    where: { id: comparisonId },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      steps: true,
    },
  });

  if (!comparison) throw new Error("Comparativo nao encontrado");

  try {
    const validateStartedAt = new Date();
    await upsertComparisonStep({
      comparisonId,
      stepName: COMPARISON_PIPELINE_STEPS[0],
      status: "RUNNING",
      startedAt: validateStartedAt,
    });
    const validItems = comparison.items.filter((item) => isSupportedComparisonUrl(item.sourceUrl));
    const invalidItems = comparison.items.filter((item) => !isSupportedComparisonUrl(item.sourceUrl));

    for (const item of invalidItems) {
      await prisma.affiliateComparisonItem.update({
        where: { id: item.id },
        data: { status: "FAILED", errorMessage: "Dominio ainda nao suportado neste modulo." },
      });
      await logComparisonEvent({
        comparisonId,
        itemId: item.id,
        stepName: COMPARISON_PIPELINE_STEPS[0],
        level: "WARN",
        message: "Link ignorado por dominio nao suportado.",
      });
    }

    await upsertComparisonStep({
      comparisonId,
      stepName: COMPARISON_PIPELINE_STEPS[0],
      status: "SUCCESS",
      startedAt: validateStartedAt,
      finishedAt: new Date(),
      responsePayload: { accepted: validItems.length, rejected: invalidItems.length },
    });

    await prisma.affiliateComparison.update({
      where: { id: comparisonId },
      data: { status: "SCRAPING" },
    });

    const scrapeStartedAt = new Date();
    await upsertComparisonStep({
      comparisonId,
      stepName: COMPARISON_PIPELINE_STEPS[1],
      status: "RUNNING",
      startedAt: scrapeStartedAt,
    });

    for (const item of validItems) {
      await prisma.affiliateComparisonItem.update({
        where: { id: item.id },
        data: { status: "FETCHING", errorMessage: null },
      });
      await logComparisonEvent({
        comparisonId,
        itemId: item.id,
        stepName: COMPARISON_PIPELINE_STEPS[1],
        message: "Iniciando scraping do produto.",
      });

      try {
        const scraped = await scrapeComparisonProduct(item.sourceUrl, config.requestTimeoutMs);
        await prisma.affiliateComparisonItem.update({
          where: { id: item.id },
          data: {
            canonicalUrl: scraped.canonicalUrl,
            storeName: scraped.storeName || getStoreNameFromHost(new URL(item.sourceUrl).hostname),
            productTitle: scraped.productTitle,
            brand: scraped.brand,
            priceText: scraped.priceText,
            priceValue: scraped.priceValue,
            currency: scraped.currency,
            imageUrl: scraped.imageUrl,
            ratingText: scraped.ratingText,
            reviewCountText: scraped.reviewCountText,
            shortDescription: scraped.shortDescription,
            bulletPointsJson: JSON.stringify(scraped.bulletPoints),
            specsJson: JSON.stringify(scraped.specs),
            prosJson: JSON.stringify(scraped.pros),
            consJson: JSON.stringify(scraped.cons),
            scrapingPayloadJson: JSON.stringify(scraped.rawPayload),
            normalizedPayloadJson: JSON.stringify(scraped.normalizedPayload),
            status: "SCRAPED",
            scrapedAt: new Date(),
            errorMessage: null,
          },
        });
        await logComparisonEvent({
          comparisonId,
          itemId: item.id,
          stepName: COMPARISON_PIPELINE_STEPS[1],
          level: "INFO",
          message: "Produto raspado com sucesso.",
          metadata: { productTitle: scraped.productTitle, storeName: scraped.storeName },
        });
      } catch (error: any) {
        await prisma.affiliateComparisonItem.update({
          where: { id: item.id },
          data: {
            status: "FAILED",
            errorMessage: error?.message || "Falha ao raspar produto",
          },
        });
        await logComparisonEvent({
          comparisonId,
          itemId: item.id,
          stepName: COMPARISON_PIPELINE_STEPS[1],
          level: "ERROR",
          message: error?.message || "Falha ao raspar produto",
        });
      }
    }

    await upsertComparisonStep({
      comparisonId,
      stepName: COMPARISON_PIPELINE_STEPS[1],
      status: "SUCCESS",
      startedAt: scrapeStartedAt,
      finishedAt: new Date(),
    });

    const refreshed = await prisma.affiliateComparison.findUnique({
      where: { id: comparisonId },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });
    if (!refreshed) throw new Error("Comparativo nao encontrado apos scraping");

    const normalizedStartedAt = new Date();
    await prisma.affiliateComparison.update({
      where: { id: comparisonId },
      data: { status: "ENRICHING" },
    });
    await upsertComparisonStep({
      comparisonId,
      stepName: COMPARISON_PIPELINE_STEPS[2],
      status: "RUNNING",
      startedAt: normalizedStartedAt,
    });

    const normalizedItems = refreshed.items.filter((item) => item.status === "SCRAPED" && item.productTitle);
    for (const item of normalizedItems) {
      await prisma.affiliateComparisonItem.update({
        where: { id: item.id },
        data: { status: "NORMALIZED" },
      });
    }

    await upsertComparisonStep({
      comparisonId,
      stepName: COMPARISON_PIPELINE_STEPS[2],
      status: "SUCCESS",
      startedAt: normalizedStartedAt,
      finishedAt: new Date(),
      responsePayload: { normalizedItems: normalizedItems.length },
    });

    if (normalizedItems.length < 2) {
      throw new Error("Foram encontrados menos de 2 produtos validos para montar o comparativo.");
    }

    await upsertComparisonStep({
      comparisonId,
      stepName: COMPARISON_PIPELINE_STEPS[3],
      status: "SUCCESS",
      startedAt: new Date(),
      finishedAt: new Date(),
      responsePayload: {
        productCount: normalizedItems.length,
        theme: refreshed.theme,
      },
    });

    await prisma.affiliateComparison.update({
      where: { id: comparisonId },
      data: {
        status: "WRITING",
        validSourceCount: normalizedItems.length,
      },
    });

    const writeStartedAt = new Date();
    await upsertComparisonStep({
      comparisonId,
      stepName: COMPARISON_PIPELINE_STEPS[4],
      status: "RUNNING",
      startedAt: writeStartedAt,
    });

    const article = await generateComparisonArticle(
      {
        theme: refreshed.theme,
        targetYear: refreshed.targetYear || currentComparisonYear(),
        items: normalizedItems.map((item) => ({
          id: item.id,
          sortOrder: item.sortOrder,
          affiliateUrl: item.affiliateUrl,
          sourceDomain: item.sourceDomain,
          storeName: item.storeName,
          productTitle: item.productTitle,
          brand: item.brand,
          priceText: item.priceText,
          shortDescription: item.shortDescription,
          bulletPointsJson: item.bulletPointsJson,
          specsJson: item.specsJson,
          prosJson: item.prosJson,
          consJson: item.consJson,
        })),
      },
      config.aiModel,
      config.writerTemperature
    );

    await upsertComparisonStep({
      comparisonId,
      stepName: COMPARISON_PIPELINE_STEPS[4],
      status: "SUCCESS",
      startedAt: writeStartedAt,
      finishedAt: new Date(),
      responsePayload: { model: article.model },
    });

    await prisma.affiliateComparison.update({
      where: { id: comparisonId },
      data: {
        status: "REVIEWING",
        generationModel: article.model,
        generationNotes: article.model === "fallback-template" ? "Artigo gerado em modo fallback local." : null,
      },
    });

    const reviewStartedAt = new Date();
    await upsertComparisonStep({
      comparisonId,
      stepName: COMPARISON_PIPELINE_STEPS[5],
      status: "RUNNING",
      startedAt: reviewStartedAt,
    });

    const review = await reviewComparisonArticle({
      theme: refreshed.theme,
      targetYear: refreshed.targetYear,
      validCount: normalizedItems.length,
      article,
    });

    if (!review.approved) {
      article.title = buildComparisonTitle(refreshed.theme, normalizedItems.length, refreshed.targetYear || currentComparisonYear());
      if (!String(article.contentHtml || "").includes("Onde comprar")) {
        article.contentHtml = `${article.contentHtml}\n<section><h2>Onde comprar</h2><ul>${normalizedItems
          .map(
            (item, index) =>
              `<li><a href="${item.affiliateUrl}" target="_blank" rel="nofollow sponsored noopener noreferrer">${index + 1}. ${item.productTitle || `Produto ${index + 1}`}</a></li>`
          )
          .join("")}</ul></section>`;
      }
    }

    await upsertComparisonStep({
      comparisonId,
      stepName: COMPARISON_PIPELINE_STEPS[5],
      status: "SUCCESS",
      startedAt: reviewStartedAt,
      finishedAt: new Date(),
      responsePayload: { approved: review.approved, corrections: review.corrections },
    });

    const baseSlug = comparisonSlugify(article.slugSuggestion || `${normalizeTheme(refreshed.theme)}-${refreshed.targetYear || currentComparisonYear()}`);
    const slug = await ensureUniqueSlug(baseSlug, comparisonId);
    const publishedAt = config.autoPublish ? new Date() : null;

    await upsertComparisonStep({
      comparisonId,
      stepName: COMPARISON_PIPELINE_STEPS[6],
      status: "RUNNING",
      startedAt: new Date(),
    });

    await prisma.affiliateComparison.update({
      where: { id: comparisonId },
      data: {
        title: article.title || buildComparisonTitle(refreshed.theme, normalizedItems.length, refreshed.targetYear || currentComparisonYear()),
        slug,
        introSummary: article.introSummary || null,
        seoTitle: article.seoTitle || null,
        metaDescription: article.metaDescription || null,
        heroTitle: article.heroTitle || article.title || null,
        heroSubtitle: article.heroSubtitle || article.introSummary || null,
        contentHtml: String(article.contentHtml || ""),
        faqJson: JSON.stringify(article.faqJson ?? []),
        schemaJson: JSON.stringify(article.schemaJson ?? {}),
        sourceCount: refreshed.items.length,
        validSourceCount: normalizedItems.length,
        status: config.autoPublish ? "PUBLISHED" : "REVIEWING",
        publishedAt,
        errorMessage: null,
        lastError: null,
      },
    });

    await upsertComparisonStep({
      comparisonId,
      stepName: COMPARISON_PIPELINE_STEPS[6],
      status: "SUCCESS",
      startedAt: new Date(),
      finishedAt: new Date(),
      responsePayload: { slug, autoPublish: config.autoPublish },
    });

    await logComparisonEvent({
      comparisonId,
      stepName: COMPARISON_PIPELINE_STEPS[6],
      message: "Comparativo concluido e publicado.",
      metadata: { slug },
    });
  } catch (error: any) {
    const message = error?.message || "Falha ao processar comparativo";
    await prisma.affiliateComparison.update({
      where: { id: comparisonId },
      data: {
        status: "FAILED",
        errorMessage: message,
        lastError: message,
      },
    });
    await logComparisonEvent({
      comparisonId,
      level: "ERROR",
      message,
    });
    throw error;
  }
}
