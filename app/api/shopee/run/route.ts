import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import {
  DEFAULT_SHOPEE_SEARCH_TERMS,
  parseJsonStringArray,
  searchShopeeProducts,
  shuffleShopeeList,
  type ShopeeProduct,
} from "@/lib/shopeeAffiliate";
import { normalizeMercadoLivrePlatforms } from "@/lib/mercadoLivreAffiliate";
import { prepareShopeeProductAssets } from "@/lib/shopeeProductAssets";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 900;

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function formatShopeePrice(product: Pick<ShopeeProduct, "price" | "currencyId">) {
  if (product.price == null) return "Preco nao informado";
  const currency = product.currencyId || "BRL";
  try {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(product.price);
  } catch {
    return `${currency} ${product.price}`.trim();
  }
}

function buildProductPrompt(product: ShopeeProduct) {
  const price = formatShopeePrice(product);
  return [
    `Crie uma propaganda curta e vendedora para o produto "${product.title}".`,
    `Produto Shopee: ${product.permalink}`,
    `Link que deve ir na descricao: ${product.permalink}`,
    `Preco atual: ${price}`,
    product.soldQuantity != null ? `Vendidos (historico): ${product.soldQuantity}` : "",
    product.ratingStar != null ? `Nota media: ${product.ratingStar}` : "",
    "A descricao precisa convidar o usuario a clicar no link da descricao do video.",
    "Nao prometa desconto se nao for garantido; use beneficio, praticidade e oportunidade.",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildMetadata(params: {
  product: ShopeeProduct;
  scheduledTo: Date;
  platforms: string[];
  autoScheduleSocial: boolean;
  assets: Array<{ url: string; kind?: "IMAGE" | "VIDEO"; name?: string }>;
}) {
  const { product, scheduledTo, platforms } = params;
  const price = formatShopeePrice(product);

  return {
    productName: product.title,
    productDescription: product.description || "",
    productTechnicalDetails: [
      `Preco atual: ${price}`,
      product.soldQuantity != null ? `Vendidos (historico): ${product.soldQuantity}` : "",
      product.ratingStar != null ? `Nota media: ${product.ratingStar}` : "",
      product.reviewCount != null ? `Avaliacoes: ${product.reviewCount}` : "",
      `Link do produto: ${product.permalink}`,
    ]
      .filter(Boolean)
      .join("\n"),
    productUseCases: "",
    targetAudience: "",
    productUrl: product.permalink,
    ctaText: "Confira o produto pelo link na descricao do video.",
    youtubeTags: "",
    primaryBgColor: "#ee4d2d",
    primaryTextColor: "#ffffff",
    assets: params.assets,
    shopee: {
      itemId: product.itemId,
      shopId: product.shopId,
      permalink: product.permalink,
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

async function saveFoundProducts(products: ShopeeProduct[], metadata: Record<string, unknown>) {
  if (products.length === 0) return;

  const existing = await prisma.shopeeAffiliatePick.findMany({
    where: { shopeeItemId: { in: products.map((item) => item.id) } },
    select: { shopeeItemId: true, codeVideoProjectId: true },
  });
  const existingMap = new Map(existing.map((item) => [item.shopeeItemId, item]));

  for (const product of products) {
    const current = existingMap.get(product.id);
    if (current?.codeVideoProjectId) continue;

    await prisma.shopeeAffiliatePick.upsert({
      where: { shopeeItemId: product.id },
      create: {
        shopeeItemId: product.id,
        title: product.title,
        price: product.price,
        currencyId: product.currencyId,
        permalink: product.permalink,
        thumbnailUrl: product.thumbnailUrl,
        status: "FOUND",
        metadataJson: JSON.stringify(metadata),
      },
      update: {
        title: product.title,
        price: product.price,
        currencyId: product.currencyId,
        permalink: product.permalink,
        thumbnailUrl: product.thumbnailUrl,
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
    const config = await prisma.shopeeAffiliateConfig.findFirst();

    if (!config) {
      return NextResponse.json({ error: "Configure Shopee first" }, { status: 400 });
    }

    if (!config.isEnabled && !force) {
      return NextResponse.json(
        { error: "Shopee routine is disabled. Enable it or run with force=true." },
        { status: 400 }
      );
    }

    const maxProducts = Math.min(24, Math.max(1, Number(config.maxProductsPerRun || 1)));

    const productsWithVideo = await prisma.shopeeAffiliatePick.findMany({
      where: { codeVideoProjectId: { not: null } },
      select: { shopeeItemId: true },
    });
    const usedIds = new Set(productsWithVideo.map((item) => item.shopeeItemId));

    const searchTerms = shuffleShopeeList(parseJsonStringArray(config.searchTerms, DEFAULT_SHOPEE_SEARCH_TERMS));
    const selected: ShopeeProduct[] = [];
    const candidatesById = new Map<string, ShopeeProduct>();
    const searchErrors: string[] = [];

    for (const term of searchTerms.length > 0 ? searchTerms : DEFAULT_SHOPEE_SEARCH_TERMS) {
      if (selected.length >= maxProducts) break;
      try {
        const products = await searchShopeeProducts(config, {
          queryOverride: term,
          limit: Math.min(24, Math.max(maxProducts * 10, 12)),
          randomize: true,
          requestTimeoutMs: 9000,
          enrichDetails: true,
        });

        for (const product of products) candidatesById.set(product.id, product);
        await saveFoundProducts(products, { source: "public-api", term, foundAt: new Date().toISOString() });

        for (const product of shuffleShopeeList(products)) {
          if (selected.length >= maxProducts) break;
          if (usedIds.has(product.id) || selected.some((item) => item.id === product.id)) continue;
          selected.push(product);
          usedIds.add(product.id);
        }
      } catch (error: any) {
        searchErrors.push(`${term}: ${error?.message || "falha na busca"}`);
      }
    }

    const candidates = Array.from(candidatesById.values());
    const skippedExisting = productsWithVideo.length;

    if (selected.length === 0) {
      return NextResponse.json(
        {
          error: "A rotina pesquisou os termos configurados, mas nao encontrou produto novo sem video criado.",
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

    for (const [index, product] of selected.entries()) {
      const scheduledTo = addHours(startAt, index * intervalHours);
      const productAssets = await prepareShopeeProductAssets(product, 4);

      const metadata = buildMetadata({
        product,
        scheduledTo,
        platforms,
        autoScheduleSocial: Boolean(config.autoEnqueueSocial),
        assets: productAssets,
      });

      const project = await prisma.codeVideoProject.create({
        data: {
          projectType: "PRODUCT_AD",
          ideaPrompt: buildProductPrompt(product),
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

      await prisma.shopeeAffiliatePick.upsert({
        where: { shopeeItemId: product.id },
        create: {
          shopeeItemId: product.id,
          title: product.title,
          price: product.price,
          currencyId: product.currencyId,
          permalink: product.permalink,
          affiliateUrl: null,
          thumbnailUrl: product.thumbnailUrl,
          status: "PROJECT_CREATED",
          scheduledBaseAt: scheduledTo,
          codeVideoProjectId: project.id,
          metadataJson: JSON.stringify({
            platforms,
            assetCount: productAssets.length,
            shopId: product.shopId,
            itemId: product.itemId,
          }),
        },
        update: {
          title: product.title,
          price: product.price,
          currencyId: product.currencyId,
          permalink: product.permalink,
          affiliateUrl: null,
          thumbnailUrl: product.thumbnailUrl,
          status: "PROJECT_CREATED",
          scheduledBaseAt: scheduledTo,
          codeVideoProjectId: project.id,
          errorMessage: null,
          metadataJson: JSON.stringify({
            platforms,
            assetCount: productAssets.length,
            shopId: product.shopId,
            itemId: product.itemId,
          }),
        },
      });

      const itemResult: any = {
        productId: product.id,
        projectId: project.id,
        title: product.title,
        scheduledTo,
        permalink: product.permalink,
        assetCount: productAssets.length,
      };

      if (config.autoGenerateScript) {
        const generated = await callProjectAction(req, "/api/video-code/generate", project.id);
        itemResult.generated = generated.ok;
        if (!generated.ok) {
          itemResult.generateError = generated.error;
          await prisma.shopeeAffiliatePick.update({
            where: { shopeeItemId: product.id },
            data: { status: "FAILED", errorMessage: generated.error },
          });
        } else {
          await prisma.shopeeAffiliatePick.update({
            where: { shopeeItemId: product.id },
            data: { status: "GENERATED", errorMessage: null },
          });
        }
      }

      if (config.autoGenerateScript && config.autoRenderVideo && itemResult.generated !== false) {
        const rendered = await callProjectAction(req, "/api/video-code/render", project.id);
        itemResult.rendered = rendered.ok;
        if (!rendered.ok) {
          itemResult.renderError = rendered.error;
          await prisma.shopeeAffiliatePick.update({
            where: { shopeeItemId: product.id },
            data: { status: "FAILED", errorMessage: rendered.error },
          });
        }
      }

      results.push(itemResult);
    }

    await prisma.shopeeAffiliateConfig.update({
      where: { id: config.id },
      data: { lastRunAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      source: "public-api",
      found: candidates.length,
      created: results.length,
      skippedExisting,
      results,
    });
  } catch (error: any) {
    console.error("[api/shopee/run POST]", error);
    return NextResponse.json({ error: error?.message || "Failed to run Shopee routine" }, { status: 500 });
  }
}

