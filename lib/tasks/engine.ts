import "server-only";

import { prisma } from "@/lib/prisma";
import { safeJsonParse } from "@/lib/tasks/catalog";
import { searchShopeeAffiliateProducts } from "@/lib/shopee/openApi";
import { computeNextScheduleTimes, parseTimeSlots } from "@/lib/tasks/schedule";
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
}): Promise<{ output: JsonObject; summary?: string }> {
  const { task, run, stepKey, sourceConfig, publishConfig, origin } = params;

  if (stepKey === "COLLECT_SOURCE") {
    if (task.type === "SHOPEE_VIDEO") {
      const keyword = getFirstSearchTerm(sourceConfig);
      const minPrice = Number(sourceConfig.minPrice ?? 10);
      const minCommissionRate = Number(sourceConfig.minCommissionRate ?? 5);
      const minSales = Number(sourceConfig.minSales ?? 100);
      const limit = Math.min(50, Math.max(1, Number(sourceConfig.limit ?? 20)));

      const items = await searchShopeeAffiliateProducts(task, {
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

    const outputSnapshot = safeJsonParse<JsonObject>(run.outputSnapshotJson, {});
    const collected = outputSnapshot.COLLECT_SOURCE as any;
    const items = Array.isArray(collected?.items) ? collected.items : [];
    const first = items[0] || null;
    if (!first) {
      throw new Error("Sem itens coletados para montar assets.");
    }

    const title = String(first.title || first.productName || "").trim() || "Produto Shopee";
    const affiliateUrl =
      String(first.offerLink || first.affiliateUrl || "").trim() || null;
    const productUrl =
      String(first.originUrl || first.productLink || first.permalink || "").trim() || null;
    const description = String(first.description || "").trim() || null;
    const images = Array.isArray(first.imageUrls) ? first.imageUrls : Array.isArray(first.images) ? first.images : [];

    const ideaPrompt = [
      `Crie uma propaganda curta e vendedora para o produto "${title}".`,
      productUrl ? `Produto Shopee: ${productUrl}` : "",
      affiliateUrl ? `Link que deve ir na descricao: ${affiliateUrl}` : "",
      first.price != null ? `Preco atual: ${first.price}` : "",
      first.soldQuantity != null ? `Vendidos (historico): ${first.soldQuantity}` : "",
      "A descricao precisa convidar o usuario a clicar no link da descricao do video.",
    ]
      .filter(Boolean)
      .join("\n");

    const project = await prisma.codeVideoProject.create({
      data: {
        projectType: "PRODUCT_AD",
        ideaPrompt,
        aspectRatio: "PORTRAIT_9_16",
        videoDurationSec: 30,
        ttsVoice: "pt-BR-AntonioNeural",
        ttsSpeed: "+5%",
        useExternalMedia: false,
        title,
        description: "",
        metadataJson: JSON.stringify(
          {
            productUrl: affiliateUrl || productUrl,
            shopee: { permalink: productUrl, affiliateUrl },
            assets: (images || []).slice(0, 6).map((url: string, idx: number) => ({ url, kind: "IMAGE", name: `img-${idx + 1}` })),
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
    const outputSnapshot = safeJsonParse<JsonObject>(run.outputSnapshotJson, {});
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
    const outputSnapshot = safeJsonParse<JsonObject>(run.outputSnapshotJson, {});
    const renderInfo = outputSnapshot.RENDER_VIDEO as any;
    const prepared = outputSnapshot.PREPARE_ASSETS as any;
    const projectId = String(prepared?.codeVideoProjectId || "").trim() || null;
    const videoUrl = String(renderInfo?.videoUrl || "").trim() || null;
    if (!projectId || !videoUrl) {
      return { output: { ok: true, skipped: true, reason: "Sem videoUrl ou projectId" } };
    }

    const bundle = await prisma.automationAssetBundle.findUnique({ where: { taskRunId: run.id } }).catch(() => null);
    const summary = bundle?.title ? `Video: ${bundle.title}` : `Video ${projectId}`;

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
      const social = await prisma.socialPost.create({
        data: {
          postId: null,
          codeVideoProjectId: projectId,
          summary,
          videoUrl,
          status: "SCHEDULED",
          scheduledTo: scheduleTimes[index] || new Date(Date.now() + (index + 1) * 60_000),
          platform: platform === "INSTAGRAM_REELS" || platform === "INSTAGRAM_STORIES" ? "META" : platform,
          postType: platform === "INSTAGRAM_STORIES" ? "STORY" : "REEL",
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
