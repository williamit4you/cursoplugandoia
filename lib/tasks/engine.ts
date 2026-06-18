import "server-only";

import { prisma } from "@/lib/prisma";
import { safeJsonParse } from "@/lib/tasks/catalog";
import { searchShopeeAffiliateProducts } from "@/lib/shopee/openApi";
import { computeNextScheduleTimes, parseTimeSlots } from "@/lib/tasks/schedule";
import { computeNextSocialQueueTime } from "@/lib/socialQueueSchedule";
import {
  refreshMercadoLivreAccessToken,
  resolveMercadoLivreAffiliateUrl,
  searchMercadoLivreProducts,
  shouldRefreshMercadoLivreToken,
} from "@/lib/mercadoLivreAffiliate";

type JsonObject = Record<string, unknown>;

function now() {
  return new Date();
}

function mergeJson(a: unknown, b: unknown) {
  const left = (typeof a === "object" && a && !Array.isArray(a) ? (a as JsonObject) : {}) as JsonObject;
  const right = (typeof b === "object" && b && !Array.isArray(b) ? (b as JsonObject) : {}) as JsonObject;
  return { ...left, ...right };
}

function getFirstSearchTerm(sourceConfig: JsonObject) {
  const terms = Array.isArray(sourceConfig.searchTerms) ? sourceConfig.searchTerms : [];
  const cleaned = terms.map((t) => String(t || "").trim()).filter(Boolean);
  if (cleaned.length === 0) return "ofertas";
  if (cleaned.length === 1) return cleaned[0] || "ofertas";
  return cleaned[Math.floor(Math.random() * cleaned.length)] || cleaned[0] || "ofertas";
}

function parsePlatforms(publishConfig: JsonObject) {
  const platforms = Array.isArray(publishConfig.platforms) ? publishConfig.platforms : [];
  return platforms.map((p) => String(p || "").trim().toUpperCase()).filter(Boolean);
}

function parsedTimeSlotsFromConfig(publishConfig: JsonObject) {
  return parseTimeSlots((publishConfig as any).timeSlots);
}

async function handleStep(params: {
  task: any;
  run: any;
  stepKey: string;
  sourceConfig: JsonObject;
  creativeConfig: JsonObject;
  publishConfig: JsonObject;
  executionConfig: JsonObject;
  origin?: string;
  currentOutputSnapshot?: JsonObject; // Added this
}): Promise<{ output: JsonObject; summary?: string }> {
  const { task, run, stepKey, sourceConfig, publishConfig, origin, currentOutputSnapshot } = params;

  if (stepKey === "COLLECT_SOURCE") {
    if (task.type === "SHOPEE_VIDEO") {
      const config = await prisma.shopeeAffiliateConfig.findFirst();
      if (!config) throw new Error("Shopee config not found. Configure /admin/shopee primeiro.");

      const keyword = getFirstSearchTerm(sourceConfig);
      const minPrice = Number(sourceConfig.minPrice ?? 10);
      const minCommissionRate = Number(sourceConfig.minCommissionRate ?? 5);
      const minSales = Number(sourceConfig.minSales ?? 100);
      const limit = Math.min(50, Math.max(1, Number(sourceConfig.limit ?? 20)));

      console.log(`[ENGINE:SHOPEE] Starting collection for keyword: "${keyword}"`, { minPrice, minCommissionRate, minSales, limit });

      const rawItems = await searchShopeeAffiliateProducts(config, {
        keyword,
        limit,
        listType: 2,
        sortType: 2,
        minPrice,
        minCommissionRate,
        minSales,
        enrichDetails: true,
        timeoutMs: 15000,
      });

      console.log(`[ENGINE:SHOPEE] Collection finished. Found ${rawItems.length} items after filtering.`);

      const items: any[] = [];
      const { generateShopeeAffiliateShortLink } = await import("@/lib/shopee/openApi");

      for (const product of rawItems) {
        let affiliateUrl = product.offerLink || null;
        if (!affiliateUrl && product.originUrl) {
          try {
            affiliateUrl = await generateShopeeAffiliateShortLink({
              config,
              originUrl: product.originUrl,
              timeoutMs: 8000,
            });
          } catch (err) {
            console.error("Failed to generate short link for shopee product", err);
          }
        }
        items.push({
          ...product,
          affiliateUrl,
        });
      }

      return {
        output: {
          source: "shopee-affiliate-api",
          keyword,
          count: items.length,
          items,
        },
        summary: `Shopee: ${items.length} item(ns) para "${keyword}"`,
      };
    }

    if (task.type === "MERCADO_LIVRE_VIDEO") {
      const config = await prisma.mercadoLivreAffiliateConfig.findFirst();
      if (!config) throw new Error("Mercado Livre config not found. Configure /admin/mercado-livre primeiro.");

      let activeConfig: any = config;
      if (shouldRefreshMercadoLivreToken(config)) {
        const refreshed = await refreshMercadoLivreAccessToken(config).catch(() => null);
        if (refreshed) {
          activeConfig = await prisma.mercadoLivreAffiliateConfig.update({
            where: { id: config.id },
            data: {
              accessToken: refreshed.accessToken,
              refreshToken: refreshed.refreshToken,
              tokenExpiresAt: refreshed.tokenExpiresAt,
            },
          });
        }
      }

      const keyword = getFirstSearchTerm(sourceConfig);
      const limit = Math.min(50, Math.max(1, Number(sourceConfig.limit ?? 20)));

      const products = await searchMercadoLivreProducts(activeConfig, {
        limit,
        queryOverride: keyword,
        accessToken: activeConfig.accessToken,
        randomize: true,
        requestTimeoutMs: 8000,
      });

      const items: any[] = [];
      for (const product of products) {
        const affiliate = await resolveMercadoLivreAffiliateUrl(product, activeConfig);
        if (affiliate.updatedCookie) activeConfig.linkBuilderCookie = affiliate.updatedCookie;
        items.push({
          ...product,
          originUrl: product.permalink,
          affiliateUrl: affiliate.url,
          affiliateMode: affiliate.mode,
          affiliateWarning: affiliate.warning,
          imageUrls: product.thumbnailUrl ? [product.thumbnailUrl] : [],
          description: null,
        });
      }

      if (activeConfig.linkBuilderCookie && activeConfig.linkBuilderCookie !== config.linkBuilderCookie) {
        await prisma.mercadoLivreAffiliateConfig.update({
          where: { id: config.id },
          data: { linkBuilderCookie: activeConfig.linkBuilderCookie },
        });
      }

      return {
        output: { source: "mercado-livre-api", keyword, count: items.length, items },
        summary: `ML: ${items.length} item(ns) para "${keyword}"`,
      };
    }

    if (task.type === "NEWS_VIDEO") {
      const posts = await prisma.post.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        take: 3,
      });
      if (posts.length === 0) throw new Error("Nenhum post publicado encontrado para News Video.");
      return {
        output: { source: "post-database", count: posts.length, items: posts },
        summary: `News: ${posts.length} artigo(s) coletados`,
      };
    }

    if (task.type === "QA_VIDEO") {
      const question = await prisma.videoQuestion.findFirst({
        where: { status: "PENDING" },
        orderBy: { createdAt: "asc" },
      });
      if (!question) throw new Error("Nenhuma VideoQuestion PENDING encontrada.");
      
      await prisma.videoQuestion.update({
        where: { id: question.id },
        data: { status: "PROCESSING", startedAt: new Date() },
      });
      
      return {
        output: { source: "video-question", count: 1, items: [question] },
        summary: `QA: Pergunta selecionada (${question.id})`,
      };
    }

    return { output: { source: "noop", reason: `No adapter yet for task type ${task.type}` } };
  }

  if (stepKey === "NORMALIZE_SOURCE") {
    return { output: { ok: true } };
  }

  if (stepKey === "GENERATE_COPY") {
    return { output: { ok: true } };
  }

  if (stepKey === "PREPARE_ASSETS") {
    const existing = await prisma.automationAssetBundle.findUnique({ where: { taskRunId: run.id } }).catch(() => null);
    if (existing) {
      return {
        output: { ok: true, reused: true, assetBundleId: existing.id, codeVideoProjectId: existing.codeVideoProjectId },
      };
    }

    const outputSnapshot = currentOutputSnapshot || safeJsonParse<JsonObject>(run.outputSnapshotJson, {});
    const collected = outputSnapshot.COLLECT_SOURCE as any;
    const items = Array.isArray(collected?.items) ? collected.items : [];
    const first = items[0] || null;
    if (!first) {
      console.error(`[ENGINE:PREPARE_ASSETS] No items found in COLLECT_SOURCE snapshot for run ${run.id}. Snapshot:`, JSON.stringify(collected, null, 2));
      throw new Error("Sem itens coletados para montar assets.");
    }

    const title = String(first.title || first.productName || "").trim() || "Produto Shopee";
    const affiliateUrl =
      String(first.offerLink || first.affiliateUrl || "").trim() || null;
    const productUrl =
      String(first.originUrl || first.productLink || first.permalink || "").trim() || null;
    const description = String(first.description || "").trim() || null;
    const images = Array.isArray(first.imageUrls) ? first.imageUrls : Array.isArray(first.images) ? first.images : [];

    if (task.type === "NEWS_VIDEO") {
      const ideaPrompt = [
        "Crie um vídeo viral de notícias resumindo os seguintes artigos:",
        ...items.map((post: any, idx: number) => `Notícia ${idx + 1}:\nTítulo: ${post.title}\nResumo: ${post.summary}`),
      ].join("\n\n");
      
      const project = await prisma.codeVideoProject.create({
        data: {
          projectType: "GENERIC",
          ideaPrompt,
          aspectRatio: "PORTRAIT_9_16",
          videoDurationSec: 30, // Or get from creativeConfig
          ttsVoice: "pt-BR-AntonioNeural",
          useExternalMedia: true,
          title: "Giro de Notícias",
          metadataJson: JSON.stringify({
             sourcePosts: items.map((i: any) => i.id)
          })
        }
      });
      const bundle = await prisma.automationAssetBundle.create({
        data: { taskId: task.id, taskRunId: run.id, title: "Giro de Notícias", codeVideoProjectId: project.id }
      });
      return { output: { ok: true, assetBundleId: bundle.id, codeVideoProjectId: project.id }, summary: `Assets: News Video` };
    }

    if (task.type === "QA_VIDEO") {
      const question = items[0];
      const ideaPrompt = [
        "Gere um vídeo respondendo a essa dúvida do público:",
        `Pergunta: ${question.questionText}`,
        "Seja informativo e use tom dinâmico."
      ].join("\n");
      
      const project = await prisma.codeVideoProject.create({
        data: {
          projectType: "GENERIC",
          ideaPrompt,
          aspectRatio: "PORTRAIT_9_16",
          videoDurationSec: 30,
          ttsVoice: "pt-BR-AntonioNeural",
          useExternalMedia: true,
          title: "Dúvida do Público",
          metadataJson: JSON.stringify({ questionId: question.id })
        }
      });
      
      await prisma.videoQuestion.update({
        where: { id: question.id },
        data: { codeVideoProjectId: project.id }
      });

      const bundle = await prisma.automationAssetBundle.create({
        data: { taskId: task.id, taskRunId: run.id, title: "QA Video", codeVideoProjectId: project.id }
      });
      return { output: { ok: true, assetBundleId: bundle.id, codeVideoProjectId: project.id }, summary: `Assets: QA Video` };
    }

    const ideaPrompt = [
      `Crie uma propaganda curta, profissional e ALTAMENTE vendedora para o produto "${title}".`,
      productUrl ? `Produto: ${productUrl}` : "",
      affiliateUrl ? `Link Afiliado (CTA): ${affiliateUrl}` : "",
      first.price != null ? `Preço: ${first.price}` : "",
      first.soldQuantity != null ? `Histórico de Vendas: ${first.soldQuantity}` : "",
      first.rating != null ? `Avaliação: ${first.rating} estrelas` : "",
      description ? `Detalhes do Produto: ${description}` : "",
      "\nESTRUTURA DESEJADA:",
      "1. Gancho inicial impactante (problema ou desejo).",
      "2. Apresentação das características principais do produto.",
      "3. Benefícios reais para o usuário.",
      "4. CTA forte convidando para clicar no link ou comentar 'QUERO'.",
    ]
      .filter(Boolean)
      .join("\n");

    const project = await prisma.codeVideoProject.create({
      data: {
        projectType: "PRODUCT_AD",
        ideaPrompt,
        aspectRatio: "PORTRAIT_9_16",
        videoDurationSec: 60, // Aumentado para 60s para anúncios de produto
        ttsVoice: "pt-BR-AntonioNeural",
        ttsSpeed: "+5%",
        useExternalMedia: false,
        title,
        description: "",
        metadataJson: JSON.stringify(
          {
            productUrl: affiliateUrl || productUrl,
            productName: title,
            productDescription: description,
            shopee: { permalink: productUrl, affiliateUrl },
            assets: (images || []).slice(0, 8).map((url: string, idx: number) => ({ url, kind: "IMAGE", name: `img-${idx + 1}` })),
          },
          null,
          2
        ),
      },
    });

    const bundle = await prisma.automationAssetBundle.create({
      data: {
        taskId: task.id,
        taskRunId: run.id,
        title,
        description,
        sourceItemsJson: JSON.stringify({ items }, null, 2),
        imagesJson: JSON.stringify((images || []).slice(0, 10), null, 2),
        metadataJson: JSON.stringify({ collectedAt: new Date().toISOString() }, null, 2),
        affiliateUrl,
        productUrl,
        codeVideoProjectId: project.id,
      },
    });

    return {
      output: { ok: true, assetBundleId: bundle.id, codeVideoProjectId: project.id },
      summary: `Assets: bundle ${bundle.id}`,
    };
  }

  if (stepKey === "RENDER_VIDEO") {
    const outputSnapshot = currentOutputSnapshot || safeJsonParse<JsonObject>(run.outputSnapshotJson, {});
    const prepared = outputSnapshot.PREPARE_ASSETS as any;
    const projectId = String(prepared?.codeVideoProjectId || "").trim();
    if (!projectId) {
      return { output: { ok: true, skipped: true, reason: "Sem codeVideoProjectId" } };
    }
    if (!origin) {
      return { output: { ok: true, skipped: true, reason: "Sem origin/baseUrl para chamar APIs internas" } };
    }

    const generateRes = await fetch(`${origin}/api/video-code/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    });
    const generateData = await generateRes.json().catch(() => ({}));
    if (!generateRes.ok) {
      throw new Error(generateData?.error || `Falha ao gerar roteiro (HTTP ${generateRes.status})`);
    }

    const renderRes = await fetch(`${origin}/api/video-code/render`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    });
    const renderData = await renderRes.json().catch(() => ({}));
    if (!renderRes.ok) {
      throw new Error(renderData?.error || `Falha ao renderizar (HTTP ${renderRes.status})`);
    }

    const refreshed = await prisma.codeVideoProject.findUnique({
      where: { id: projectId },
      select: { videoUrl: true, thumbUrl: true, status: true },
    });

    await prisma.automationAssetBundle.updateMany({
      where: { taskRunId: run.id },
      data: { finalVideoUrl: refreshed?.videoUrl || null, thumbUrl: refreshed?.thumbUrl || null },
    });

    return {
      output: { ok: true, generated: true, rendered: true, projectId, videoUrl: refreshed?.videoUrl || null, status: refreshed?.status || null },
      summary: `Render: ${refreshed?.status || "ok"}`,
    };
  }

  if (stepKey === "CREATE_PUBLISH_SCHEDULES") {
    const outputSnapshot = currentOutputSnapshot || safeJsonParse<JsonObject>(run.outputSnapshotJson, {});
    const renderInfo = outputSnapshot.RENDER_VIDEO as any;
    const prepared = outputSnapshot.PREPARE_ASSETS as any;
    const projectId = String(prepared?.codeVideoProjectId || "").trim() || null;
    const videoUrl = String(renderInfo?.videoUrl || "").trim() || null;
    if (!projectId || !videoUrl) {
      return { output: { ok: true, skipped: true, reason: "Sem videoUrl ou projectId" } };
    }

    const bundle = await prisma.automationAssetBundle.findUnique({ where: { taskRunId: run.id } }).catch(() => null);

    // Monta legenda com CTA e link afiliado quando disponível
    const affiliateUrl = bundle?.affiliateUrl || null;
    const productTitle = bundle?.title || null;

    const ctaBlock = affiliateUrl
      ? `\n\n🔥 Comente "QUERO" para receber o link!\n\n🛒 Compre aqui com desconto:\n${affiliateUrl}`
      : `\n\n🔥 Link com desconto na descrição!`;

    const summary = productTitle
      ? `${productTitle}${ctaBlock}`
      : `Video ${projectId}${ctaBlock}`;

    const platforms = parsePlatforms(publishConfig);
    const created: Array<{ id: string; platform: string }> = [];
    const timeZone = String(task.timezone || "America/Sao_Paulo").trim() || "America/Sao_Paulo";
    const timeSlots = parsedTimeSlotsFromConfig(publishConfig);
    const baseline = (() => {
      const d = new Date();
      d.setSeconds(0, 0);
      return new Date(d.getTime() + 60_000);
    })();
    const scheduleTimes = computeNextScheduleTimes({
      timeZone,
      slots: timeSlots,
      count: platforms.length,
      from: baseline,
    });

    for (const [index, platform] of platforms.entries()) {
      const normalizedPlatform = platform === "INSTAGRAM_REELS" || platform === "INSTAGRAM_STORIES" ? "META" : platform;
      const normalizedPostType = platform === "INSTAGRAM_STORIES" ? "STORY" : "REEL";
      const queuedAt = await computeNextSocialQueueTime({
        platform: normalizedPlatform,
        desiredAt: scheduleTimes[index] || new Date(Date.now() + (index + 1) * 60_000),
      });
      const social = await prisma.socialPost.create({
        data: {
          postId: null,
          codeVideoProjectId: projectId,
          summary,
          videoUrl,
          status: "SCHEDULED",
          scheduledTo: queuedAt,
          platform: normalizedPlatform,
          postType: normalizedPostType,
          log: `[${new Date().toLocaleTimeString("pt-BR")}] Agendado via AutomationTask ${task.slug}`,
          automationTaskId: task.id,
          automationTaskRunId: run.id,
        },
      });
      created.push({ id: social.id, platform });
    }

    return { output: { ok: true, scheduled: created }, summary: `Agendamentos: ${created.length}` };
  }

  return { output: { ok: true, skipped: true, reason: "Unknown stepKey" } };
}

export async function processNextPendingAutomationRun(params: { runId?: string; origin?: string } = {}) {
  const run = params.runId
    ? await prisma.automationTaskRun.findUnique({
        where: { id: params.runId },
        include: { task: true, steps: { orderBy: { stepOrder: "asc" } } },
      })
    : await prisma.automationTaskRun.findFirst({
        where: { status: "PENDING" },
        orderBy: [{ createdAt: "asc" }],
        include: { task: true, steps: { orderBy: { stepOrder: "asc" } } },
      });

  if (!run) {
    return { ok: true, processed: false, reason: "No pending runs" };
  }

  if (!run.task) {
    await prisma.automationTaskRun.update({
      where: { id: run.id },
      data: { status: "FAILED", finishedAt: now(), errorMessage: "Task not found for run" },
    });
    return { ok: false, processed: true, error: "Task not found for run" };
  }

  const task = run.task;
  const sourceConfig = safeJsonParse<JsonObject>(task.sourceConfigJson, {});
  const creativeConfig = safeJsonParse<JsonObject>(task.creativeConfigJson, {});
  const publishConfig = safeJsonParse<JsonObject>(task.publishConfigJson, {});
  const executionConfig = safeJsonParse<JsonObject>(task.executionConfigJson, {});

  await prisma.automationTaskRun.update({
    where: { id: run.id },
    data: { status: "RUNNING", startedAt: run.startedAt ?? now(), errorMessage: null },
  });

  let summaryParts: string[] = [];
  let outputSnapshot: JsonObject = safeJsonParse(run.outputSnapshotJson, {});

  try {
    for (const step of run.steps) {
      if (step.status === "COMPLETED" || step.status === "SKIPPED") continue;

      await prisma.automationTaskStepRun.update({
        where: { id: step.id },
        data: { status: "RUNNING", startedAt: step.startedAt ?? now(), errorMessage: null },
      });

      const stepResult = await handleStep({
        task,
        run,
        stepKey: step.stepKey,
        sourceConfig,
        creativeConfig,
        publishConfig,
        executionConfig,
        origin: params.origin,
        currentOutputSnapshot: outputSnapshot, // Pass the fresh snapshot
      });

      if (stepResult.summary) summaryParts.push(stepResult.summary);

      outputSnapshot = mergeJson(outputSnapshot, { [step.stepKey]: stepResult.output });

      await prisma.automationTaskStepRun.update({
        where: { id: step.id },
        data: {
          status: "COMPLETED",
          finishedAt: now(),
          outputJson: JSON.stringify(stepResult.output ?? {}, null, 2),
        },
      });
    }

    const summary = summaryParts.filter(Boolean).join(" | ").slice(0, 4000) || null;

    const updated = await prisma.automationTaskRun.update({
      where: { id: run.id },
      data: {
        status: "COMPLETED",
        finishedAt: now(),
        summary,
        outputSnapshotJson: JSON.stringify(outputSnapshot ?? {}, null, 2),
      },
      include: { steps: { orderBy: { stepOrder: "asc" } }, task: true },
    });

    return { ok: true, processed: true, run: updated };
  } catch (error: any) {
    const message = error?.message || "Unknown error";

    await prisma.automationTaskRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        finishedAt: now(),
        errorMessage: message,
        outputSnapshotJson: JSON.stringify(outputSnapshot ?? {}, null, 2),
      },
    });

    const currentStep = await prisma.automationTaskStepRun.findFirst({
      where: { taskRunId: run.id, status: "RUNNING" },
      orderBy: { stepOrder: "asc" },
    });

    if (currentStep) {
      await prisma.automationTaskStepRun.update({
        where: { id: currentStep.id },
        data: { status: "FAILED", finishedAt: now(), errorMessage: message },
      });
    }

    return { ok: false, processed: true, error: message };
  }
}
