import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import {
  DEFAULT_MERCADO_LIVRE_CATEGORY_IDS,
  DEFAULT_MERCADO_LIVRE_SEARCH_TERMS,
  formatMercadoLivrePrice,
  normalizeMercadoLivrePlatforms,
  parseJsonStringArray,
  refreshMercadoLivreAccessToken,
  resolveMercadoLivreAffiliateUrl,
  rotateMercadoLivreList,
  searchMercadoLivreProducts,
  shuffleMercadoLivreList,
  shouldRefreshMercadoLivreToken,
  isMercadoLivreAffiliateTemplateDynamic,
  type MercadoLivreProduct,
} from "@/lib/mercadoLivreAffiliate";
import { searchMercadoLivreProductsWithBrowser } from "@/lib/mercadoLivreBrowserSearch";
import { prepareMercadoLivreProductAssets, type MercadoLivrePreparedAsset } from "@/lib/mercadoLivreProductAssets";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 900;

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function getConfigWithFreshToken() {
  const config = await prisma.mercadoLivreAffiliateConfig.findFirst();
  if (!config) return null;

  if (!shouldRefreshMercadoLivreToken(config)) return config;

  const refreshed = await refreshMercadoLivreAccessToken(config);
  if (!refreshed) return config;

  return prisma.mercadoLivreAffiliateConfig.update({
    where: { id: config.id },
    data: {
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      tokenExpiresAt: refreshed.tokenExpiresAt,
    },
  });
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function buildProductPrompt(product: MercadoLivreProduct, affiliateUrl: string) {
  const price = formatMercadoLivrePrice(product);
  const freeShipping = product.shippingFree ? "Sim" : "Nao informado";
  return [
    `Crie uma propaganda curta e vendedora para o produto "${product.title}".`,
    `Produto Mercado Livre: ${product.permalink}`,
    `Link que deve ir na descricao: ${affiliateUrl}`,
    `Preco atual: ${price}`,
    `Frete gratis: ${freeShipping}`,
    `Categoria Mercado Livre: ${product.categoryId || "nao informada"}`,
    "A descricao precisa convidar o usuario a clicar no link da descricao do video.",
    "Nao prometa desconto se o link nao trouxer desconto real; use oportunidade, praticidade e beneficio.",
  ].join("\n");
}

function buildMetadata(params: {
  product: MercadoLivreProduct;
  affiliateUrl: string;
  affiliateMode: string;
  affiliateWarning: string | null;
  scheduledTo: Date;
  platforms: string[];
  autoScheduleSocial: boolean;
  assets: MercadoLivrePreparedAsset[];
}) {
  const { product, affiliateUrl, affiliateMode, affiliateWarning, scheduledTo, platforms } = params;
  const price = formatMercadoLivrePrice(product);

  return {
    productName: product.title,
    productDescription: "",
    productTechnicalDetails: [
      `Preco atual: ${price}`,
      product.shippingFree ? "Frete gratis informado pelo Mercado Livre." : "Frete gratis nao informado.",
      product.condition ? `Condicao: ${product.condition}` : "",
      product.categoryId ? `Categoria: ${product.categoryId}` : "",
      product.soldQuantity != null ? `Vendas indicadas pela busca: ${product.soldQuantity}` : "",
      `Link original: ${product.permalink}`,
      `Link para descricao: ${affiliateUrl}`,
    ]
      .filter(Boolean)
      .join("\n"),
    productUseCases: "",
    targetAudience: "",
    productUrl: affiliateUrl,
    ctaText: "Confira o produto pelo link na descricao do video.",
    youtubeTags: "",
    primaryBgColor: "#1d4ed8",
    primaryTextColor: "#ffffff",
    assets: params.assets,
    mercadoLivre: {
      itemId: product.id,
      permalink: product.permalink,
      affiliateUrl,
      affiliateMode,
      affiliateWarning,
      scheduledTo: scheduledTo.toISOString(),
      platforms,
      autoScheduleSocial: params.autoScheduleSocial,
    },
  };
}

async function callProjectAction(req: NextRequest, pathname: string, projectId: string) {
  const url = new URL(pathname, req.url);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data, error: data?.error || `HTTP ${res.status}` };
}

async function searchProductsForRoutine(params: {
  config: NonNullable<Awaited<ReturnType<typeof getConfigWithFreshToken>>>;
  categoryId: string;
  term: string;
  limit: number;
  excludeIds: string[];
}) {
  const { config, categoryId, term, limit, excludeIds } = params;

  try {
    const products = await searchMercadoLivreProducts(config, {
      limit,
      accessToken: config.accessToken,
      categoryOverride: categoryId,
      queryOverride: term,
      excludeIds,
      randomize: true,
    });
    return { products, source: "api", apiError: null as string | null };
  } catch (error: any) {
    const apiError = error?.message || "API search failed";
    const products = await searchMercadoLivreProductsWithBrowser(config, {
      limit,
      categoryOverride: categoryId,
      queryOverride: term,
      excludeIds,
      randomize: true,
    });
    return { products, source: "browser", apiError };
  }
}

async function saveFoundProducts(products: MercadoLivreProduct[], metadata: Record<string, unknown>) {
  if (products.length === 0) return;

  const existing = await prisma.mercadoLivreAffiliatePick.findMany({
    where: { mercadoLivreItemId: { in: products.map((item) => item.id) } },
    select: { mercadoLivreItemId: true, codeVideoProjectId: true },
  });
  const existingMap = new Map(existing.map((item) => [item.mercadoLivreItemId, item]));

  for (const product of products) {
    const current = existingMap.get(product.id);
    if (current?.codeVideoProjectId) continue;

    await prisma.mercadoLivreAffiliatePick.upsert({
      where: { mercadoLivreItemId: product.id },
      create: {
        mercadoLivreItemId: product.id,
        title: product.title,
        price: product.price,
        currencyId: product.currencyId,
        permalink: product.permalink,
        thumbnailUrl: product.thumbnailUrl,
        categoryId: product.categoryId,
        status: "FOUND",
        metadataJson: JSON.stringify(metadata),
      },
      update: {
        title: product.title,
        price: product.price,
        currencyId: product.currencyId,
        permalink: product.permalink,
        thumbnailUrl: product.thumbnailUrl,
        categoryId: product.categoryId,
        status: "FOUND",
        errorMessage: null,
        metadataJson: JSON.stringify(metadata),
      },
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const force = Boolean(body?.force);
    const config = await getConfigWithFreshToken();

    if (!config) {
      return NextResponse.json({ error: "Configure Mercado Livre first" }, { status: 400 });
    }

    if (!config.isEnabled && !force) {
      return NextResponse.json(
        { error: "Mercado Livre routine is disabled. Enable it or run with force=true." },
        { status: 400 }
      );
    }

    const maxProducts = Math.min(24, Math.max(1, Number(config.maxProductsPerRun || 1)));
    if (
      config.affiliateLinkMode === "MANUAL_TEMPLATE" &&
      config.affiliateUrlTemplate &&
      !isMercadoLivreAffiliateTemplateDynamic(config.affiliateUrlTemplate)
    ) {
      return NextResponse.json(
        {
          error:
            "O template de URL afiliada precisa conter {{url}}, {{encodedUrl}}, {{itemId}} ou {{tag}}. Um link meli.la fixo vale apenas para um produto.",
        },
        { status: 400 }
      );
    }

    const productsWithVideo = await prisma.mercadoLivreAffiliatePick.findMany({
      where: { codeVideoProjectId: { not: null } },
      select: { mercadoLivreItemId: true },
    });
    const usedIds = new Set(productsWithVideo.map((item) => item.mercadoLivreItemId));
    const categoryIds = parseJsonStringArray(config.categoryIds, DEFAULT_MERCADO_LIVRE_CATEGORY_IDS);
    const searchTerms = shuffleMercadoLivreList(
      parseJsonStringArray(config.searchTerms, DEFAULT_MERCADO_LIVRE_SEARCH_TERMS)
    );
    const createdCount = productsWithVideo.length;
    const categoriesToTry = rotateMercadoLivreList(
      categoryIds.length > 0 ? categoryIds : DEFAULT_MERCADO_LIVRE_CATEGORY_IDS,
      createdCount
    );
    const selected: MercadoLivreProduct[] = [];
    const candidatesById = new Map<string, MercadoLivreProduct>();
    const searchErrors: string[] = [];
    const sources = new Set<string>();
    let apiError: string | null = null;

    for (const categoryId of categoriesToTry) {
      for (const term of searchTerms.length > 0 ? searchTerms : DEFAULT_MERCADO_LIVRE_SEARCH_TERMS) {
        if (selected.length >= maxProducts) break;

        try {
          const batch = await searchProductsForRoutine({
            config,
            categoryId,
            term,
            limit: Math.min(24, Math.max(maxProducts * 8, 8)),
            excludeIds: Array.from(usedIds),
          });
          sources.add(batch.source);
          if (batch.apiError) apiError = batch.apiError;

          for (const product of batch.products) candidatesById.set(product.id, product);
          await saveFoundProducts(batch.products, {
            source: batch.source,
            categoryId,
            term,
            foundAt: new Date().toISOString(),
          });

          for (const product of shuffleMercadoLivreList(batch.products)) {
            if (selected.length >= maxProducts) break;
            if (usedIds.has(product.id) || selected.some((item) => item.id === product.id)) continue;
            selected.push(product);
            usedIds.add(product.id);
          }
        } catch (error: any) {
          searchErrors.push(`${categoryId}/${term}: ${error?.message || "falha na busca"}`);
        }
      }

      if (selected.length >= maxProducts) break;
    }

    const candidates = Array.from(candidatesById.values());
    const source = sources.size > 0 ? Array.from(sources).join("+") : "none";
    const skippedExisting = productsWithVideo.length;

    if (selected.length === 0) {
      return NextResponse.json(
        {
          error:
            "A rotina pesquisou as categorias configuradas, mas nao encontrou produto novo sem video criado.",
          found: candidates.length,
          skippedExisting,
          searchErrors: searchErrors.slice(-8),
        },
        { status: 404 }
      );
    }
    const platforms = normalizeMercadoLivrePlatforms(config.preferredPlatforms, ["YOUTUBE", "INSTAGRAM"]);
    const intervalHours = Math.min(24, Math.max(1, Number(config.postIntervalHours || 3)));
    const startAt = body?.startAt ? new Date(body.startAt) : new Date();
    const results: any[] = [];
    const activeConfig = { ...config };

    for (const [index, product] of selected.entries()) {
      const affiliate = await resolveMercadoLivreAffiliateUrl(product, activeConfig);
      if (affiliate.updatedCookie) activeConfig.linkBuilderCookie = affiliate.updatedCookie;
      const productAssets = await prepareMercadoLivreProductAssets(product, 4);
      const scheduledTo = addHours(startAt, index * intervalHours);
      const metadata = buildMetadata({
        product,
        affiliateUrl: affiliate.url,
        affiliateMode: affiliate.mode,
        affiliateWarning: affiliate.warning,
        scheduledTo,
        platforms,
        autoScheduleSocial: Boolean(config.autoEnqueueSocial),
        assets: productAssets,
      });

      const project = await prisma.codeVideoProject.create({
        data: {
          projectType: "PRODUCT_AD",
          ideaPrompt: buildProductPrompt(product, affiliate.url),
          aspectRatio: "PORTRAIT_9_16",
          videoDurationSec: 30,
          ttsVoice: "pt-BR-AntonioNeural",
          ttsSpeed: "+5%",
          useExternalMedia: false,
          title: product.title,
          description: "",
          metadataJson: JSON.stringify(metadata),
        },
      });

      await prisma.mercadoLivreAffiliatePick.upsert({
        where: { mercadoLivreItemId: product.id },
        create: {
          mercadoLivreItemId: product.id,
          title: product.title,
          price: product.price,
          currencyId: product.currencyId,
          permalink: product.permalink,
          affiliateUrl: affiliate.url,
          thumbnailUrl: product.thumbnailUrl,
          categoryId: product.categoryId,
          status: "PROJECT_CREATED",
          scheduledBaseAt: scheduledTo,
          codeVideoProjectId: project.id,
          metadataJson: JSON.stringify({
            affiliateMode: affiliate.mode,
            affiliateWarning: affiliate.warning,
            platforms,
            assetCount: productAssets.length,
          }),
        },
        update: {
          title: product.title,
          price: product.price,
          currencyId: product.currencyId,
          permalink: product.permalink,
          affiliateUrl: affiliate.url,
          thumbnailUrl: product.thumbnailUrl,
          categoryId: product.categoryId,
          status: "PROJECT_CREATED",
          scheduledBaseAt: scheduledTo,
          codeVideoProjectId: project.id,
          errorMessage: null,
          metadataJson: JSON.stringify({
            affiliateMode: affiliate.mode,
            affiliateWarning: affiliate.warning,
            platforms,
            assetCount: productAssets.length,
          }),
        },
      });

      const itemResult: any = {
        productId: product.id,
        projectId: project.id,
        title: product.title,
        scheduledTo,
        affiliateUrl: affiliate.url,
        affiliateWarning: affiliate.warning,
        assetCount: productAssets.length,
      };

      if (config.autoGenerateScript) {
        const generated = await callProjectAction(req, "/api/video-code/generate", project.id);
        itemResult.generated = generated.ok;
        if (!generated.ok) {
          itemResult.generateError = generated.error;
          await prisma.mercadoLivreAffiliatePick.update({
            where: { mercadoLivreItemId: product.id },
            data: { status: "FAILED", errorMessage: generated.error },
          });
        } else {
          await prisma.mercadoLivreAffiliatePick.update({
            where: { mercadoLivreItemId: product.id },
            data: { status: "GENERATED", errorMessage: null },
          });
        }
      }

      if (config.autoGenerateScript && config.autoRenderVideo && itemResult.generated !== false) {
        const rendered = await callProjectAction(req, "/api/video-code/render", project.id);
        itemResult.rendered = rendered.ok;
        if (!rendered.ok) {
          itemResult.renderError = rendered.error;
          await prisma.mercadoLivreAffiliatePick.update({
            where: { mercadoLivreItemId: product.id },
            data: { status: "FAILED", errorMessage: rendered.error },
          });
        }
      }

      results.push(itemResult);
    }

    await prisma.mercadoLivreAffiliateConfig.update({
      where: { id: config.id },
      data: {
        lastRunAt: new Date(),
        ...(activeConfig.linkBuilderCookie && activeConfig.linkBuilderCookie !== config.linkBuilderCookie
          ? { linkBuilderCookie: activeConfig.linkBuilderCookie }
          : {}),
      },
    });

    return NextResponse.json({
      success: true,
      source,
      apiError,
      found: candidates.length,
      created: results.length,
      skippedExisting,
      results,
    });
  } catch (error: any) {
    console.error("[api/mercado-livre/run POST]", error);
    const message = String(error?.message || "");
    if (message.toLowerCase().includes("forbidden")) {
      return NextResponse.json(
        {
          error:
            "O Mercado Livre bloqueou o endpoint oficial de busca (/sites/MLB/search) com 403. O sistema tentou com token + User-Agent e tambem a consulta publica com User-Agent. Se persistir, provavelmente e bloqueio de IP/WAF ou permissao do app.",
          detail: message,
          code: "MERCADO_LIVRE_SEARCH_FORBIDDEN",
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: error?.message || "Failed to run Mercado Livre routine" },
      { status: 500 }
    );
  }
}
