import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import {
  refreshMercadoLivreAccessToken,
  resolveMercadoLivreAffiliateUrl,
  searchMercadoLivreProducts,
  shouldRefreshMercadoLivreToken,
} from "@/lib/mercadoLivreAffiliate";
import { searchMercadoLivreProductsWithBrowser } from "@/lib/mercadoLivreBrowserSearch";

export const dynamic = "force-dynamic";

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

export async function GET(req: NextRequest) {
  try {
    const config = await getConfigWithFreshToken();
    if (!config) {
      return NextResponse.json({ error: "Mercado Livre config not found" }, { status: 404 });
    }

    const queryOverride = req.nextUrl.searchParams.get("q");
    const limit = Number(req.nextUrl.searchParams.get("limit") || config.maxProductsPerRun || 1);
    const searchLimit = Math.min(24, Math.max(limit * 5, 8));
    const used = await prisma.mercadoLivreAffiliatePick.findMany({
      where: { codeVideoProjectId: { not: null } },
      select: { mercadoLivreItemId: true },
    });
    const usedIds = used.map((item) => item.mercadoLivreItemId);
    let products;
    let source = "api";
    let apiError: string | null = null;
    try {
      products = await searchMercadoLivreProducts(config, {
        limit: searchLimit,
        queryOverride,
        accessToken: config.accessToken,
        excludeIds: usedIds,
        randomize: true,
      });
    } catch (error: any) {
      apiError = error?.message || "API search failed";
      products = await searchMercadoLivreProductsWithBrowser(config, {
        limit: searchLimit,
        queryOverride,
        excludeIds: usedIds,
        randomize: true,
      });
      source = "browser";
    }

    const activeConfig = { ...config };
    const items: any[] = [];
    for (const product of products.slice(0, limit)) {
      const affiliate = await resolveMercadoLivreAffiliateUrl(product, activeConfig);
      if (affiliate.updatedCookie) activeConfig.linkBuilderCookie = affiliate.updatedCookie;
      items.push({
        ...product,
        affiliateUrl: affiliate.url,
        affiliateMode: affiliate.mode,
        affiliateWarning: affiliate.warning,
      });
    }

    if (activeConfig.linkBuilderCookie && activeConfig.linkBuilderCookie !== config.linkBuilderCookie) {
      await prisma.mercadoLivreAffiliateConfig.update({
        where: { id: config.id },
        data: { linkBuilderCookie: activeConfig.linkBuilderCookie },
      });
    }

    return NextResponse.json({ items, source, apiError });
  } catch (error: any) {
    console.error("[api/mercado-livre/products GET]", error);
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
      { error: error?.message || "Failed to fetch Mercado Livre products" },
      { status: 500 }
    );
  }
}
