import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { normalizeMercadoLivrePlatforms, resolveMercadoLivreAffiliateUrl } from "@/lib/mercadoLivreAffiliate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

type ManualProduct = {
  id: string;
  title: string;
  permalink: string;
  price: number | null;
  currencyId: string | null;
  thumbnailUrl: string | null;
  categoryId: string | null;
  soldQuantity: number | null;
  condition: string | null;
  shippingFree: boolean;
};

function extractProductId(url: string) {
  const match = url.match(/\bMLB-?(\d{6,})\b/i);
  return match ? `MLB${match[1]}` : null;
}

function titleFromUrl(url: string, fallback: string) {
  try {
    const parsed = new URL(url);
    const clean = parsed.pathname
      .split("/")
      .filter(Boolean)
      .find((part) => part.includes("_JM") || part.includes("MLB-"));
    const source = clean || parsed.pathname.split("/").filter(Boolean).at(-1) || fallback;
    const withoutId = source
      .replace(/_JM.*$/i, "")
      .replace(/MLB-?\d+/gi, "")
      .replace(/-/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return withoutId || fallback;
  } catch {
    return fallback;
  }
}

function normalizeUrl(value: unknown) {
  const text = String(value || "").trim();
  if (!text) return null;
  try {
    const url = new URL(text);
    if (!/mercadolivre\.com\.br|mercadolibre\.com|meli\.la/i.test(url.hostname)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function buildProductPrompt(product: ManualProduct, affiliateUrl: string) {
  return [
    `Crie uma propaganda curta e vendedora para o produto "${product.title}".`,
    `Link do produto: ${product.permalink}`,
    `Link que deve ir na descricao: ${affiliateUrl}`,
    "A descricao precisa convidar o usuario a clicar no link da descricao do video.",
    "Use linguagem comercial, mas sem prometer desconto se o link nao trouxer desconto real.",
  ].join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawUrls = Array.isArray(body?.urls)
      ? body.urls
      : String(body?.urls || "")
          .split(/\r?\n/)
          .map((item) => item.trim());

    const urls = Array.from(new Set(rawUrls.map(normalizeUrl).filter(Boolean))) as string[];
    if (urls.length === 0) {
      return NextResponse.json({ error: "Cole pelo menos um link valido do Mercado Livre." }, { status: 400 });
    }

    const config = await prisma.mercadoLivreAffiliateConfig.findFirst();
    if (!config) {
      return NextResponse.json({ error: "Configure Mercado Livre antes de importar links." }, { status: 400 });
    }

    const platforms = normalizeMercadoLivrePlatforms(config.preferredPlatforms, ["YOUTUBE", "INSTAGRAM"]);
    const intervalHours = Math.min(24, Math.max(1, Number(config.postIntervalHours || 3)));
    const startAt = body?.startAt ? new Date(body.startAt) : new Date();
    const results: any[] = [];
    const activeConfig = { ...config };

    for (const [index, url] of urls.entries()) {
      const itemId = extractProductId(url) || `MANUAL-${Buffer.from(url).toString("base64url").slice(0, 24)}`;
      const title = titleFromUrl(url, `Produto Mercado Livre ${index + 1}`);
      const product: ManualProduct = {
        id: itemId,
        title,
        permalink: url,
        price: null,
        currencyId: "BRL",
        thumbnailUrl: null,
        categoryId: null,
        soldQuantity: null,
        condition: null,
        shippingFree: false,
      };

      const affiliate = await resolveMercadoLivreAffiliateUrl(product, activeConfig);
      if (affiliate.updatedCookie) activeConfig.linkBuilderCookie = affiliate.updatedCookie;
      const scheduledTo = addHours(startAt, index * intervalHours);
      const metadata = {
        productName: title,
        productDescription: "",
        productTechnicalDetails: [`Link original: ${url}`, `Link para descricao: ${affiliate.url}`].join("\n"),
        productUseCases: "",
        targetAudience: "",
        productUrl: affiliate.url,
        ctaText: "Confira o produto pelo link na descricao do video.",
        youtubeTags: "",
        primaryBgColor: "#1d4ed8",
        primaryTextColor: "#ffffff",
        assets: [],
        mercadoLivre: {
          itemId,
          permalink: url,
          affiliateUrl: affiliate.url,
          affiliateMode: affiliate.mode,
          affiliateWarning: affiliate.warning,
          scheduledTo: scheduledTo.toISOString(),
          platforms,
          autoScheduleSocial: Boolean(config.autoEnqueueSocial),
          manualImport: true,
        },
      };

      const project = await prisma.codeVideoProject.create({
        data: {
          projectType: "PRODUCT_AD",
          ideaPrompt: buildProductPrompt(product, affiliate.url),
          aspectRatio: "PORTRAIT_9_16",
          videoDurationSec: 30,
          ttsVoice: "pt-BR-AntonioNeural",
          ttsSpeed: "+5%",
          useExternalMedia: false,
          title,
          description: "",
          metadataJson: JSON.stringify(metadata),
        },
      });

      await prisma.mercadoLivreAffiliatePick.upsert({
        where: { mercadoLivreItemId: itemId },
        create: {
          mercadoLivreItemId: itemId,
          title,
          price: null,
          currencyId: "BRL",
          permalink: url,
          affiliateUrl: affiliate.url,
          thumbnailUrl: null,
          categoryId: null,
          status: "PROJECT_CREATED",
          scheduledBaseAt: scheduledTo,
          codeVideoProjectId: project.id,
          metadataJson: JSON.stringify({
            affiliateMode: affiliate.mode,
            affiliateWarning: affiliate.warning,
            platforms,
            manualImport: true,
          }),
        },
        update: {
          title,
          permalink: url,
          affiliateUrl: affiliate.url,
          status: "PROJECT_CREATED",
          scheduledBaseAt: scheduledTo,
          codeVideoProjectId: project.id,
          errorMessage: null,
        },
      });

      if (config.autoGenerateScript) {
        const generateUrl = new URL("/api/video-code/generate", req.url);
        const res = await fetch(generateUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId: project.id }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          await prisma.mercadoLivreAffiliatePick.update({
            where: { mercadoLivreItemId: itemId },
            data: { status: "FAILED", errorMessage: data?.error || `HTTP ${res.status}` },
          });
          results.push({
            url,
            projectId: project.id,
            generated: false,
            affiliateUrl: affiliate.url,
            affiliateWarning: affiliate.warning,
            error: data?.error || `HTTP ${res.status}`,
          });
          continue;
        }

        await prisma.mercadoLivreAffiliatePick.update({
          where: { mercadoLivreItemId: itemId },
          data: { status: "GENERATED", errorMessage: null },
        });
      }

      results.push({
        url,
        projectId: project.id,
        title,
        scheduledTo,
        generated: Boolean(config.autoGenerateScript),
        affiliateUrl: affiliate.url,
        affiliateWarning: affiliate.warning,
      });
    }

    if (activeConfig.linkBuilderCookie && activeConfig.linkBuilderCookie !== config.linkBuilderCookie) {
      await prisma.mercadoLivreAffiliateConfig.update({
        where: { id: config.id },
        data: { linkBuilderCookie: activeConfig.linkBuilderCookie },
      });
    }

    return NextResponse.json({ success: true, created: results.length, results });
  } catch (error: any) {
    console.error("[api/mercado-livre/manual-products POST]", error);
    return NextResponse.json(
      { error: error?.message || "Falha ao importar links manuais." },
      { status: 500 }
    );
  }
}
