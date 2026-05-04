import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import {
  buildMercadoLivreAffiliateUrl,
  formatMercadoLivrePrice,
  normalizeMercadoLivrePlatforms,
  refreshMercadoLivreAccessToken,
  searchMercadoLivreProducts,
  shouldRefreshMercadoLivreToken,
  type MercadoLivreProduct,
} from "@/lib/mercadoLivreAffiliate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
    assets: product.thumbnailUrl
      ? [{ url: product.thumbnailUrl, kind: "IMAGE", name: `${product.id}.jpg` }]
      : [],
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

    const maxProducts = Math.min(24, Math.max(1, Number(config.maxProductsPerRun || 8)));
    const candidates = await searchMercadoLivreProducts(config, {
      limit: Math.min(50, maxProducts * 3),
      accessToken: config.accessToken,
    });

    const existing = await prisma.mercadoLivreAffiliatePick.findMany({
      where: { mercadoLivreItemId: { in: candidates.map((item) => item.id) } },
      select: { mercadoLivreItemId: true, codeVideoProjectId: true },
    });
    const blocked = new Set(
      existing
        .filter((item) => item.codeVideoProjectId)
        .map((item) => item.mercadoLivreItemId)
    );

    const selected = candidates.filter((item) => !blocked.has(item.id)).slice(0, maxProducts);
    const platforms = normalizeMercadoLivrePlatforms(config.preferredPlatforms);
    const intervalHours = Math.min(24, Math.max(1, Number(config.postIntervalHours || 2)));
    const startAt = body?.startAt ? new Date(body.startAt) : new Date();
    const results: any[] = [];

    for (const [index, product] of selected.entries()) {
      const affiliate = buildMercadoLivreAffiliateUrl(product, config);
      const scheduledTo = addHours(startAt, index * intervalHours);
      const metadata = buildMetadata({
        product,
        affiliateUrl: affiliate.url,
        affiliateMode: affiliate.mode,
        affiliateWarning: affiliate.warning,
        scheduledTo,
        platforms,
        autoScheduleSocial: Boolean(config.autoEnqueueSocial),
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
      data: { lastRunAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      found: candidates.length,
      created: results.length,
      skippedExisting: blocked.size,
      results,
    });
  } catch (error: any) {
    console.error("[api/mercado-livre/run POST]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to run Mercado Livre routine" },
      { status: 500 }
    );
  }
}
