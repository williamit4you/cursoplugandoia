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

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

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
    const forceBrowserFallback = req.nextUrl.searchParams.get("forceBrowser") === "1";
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
    let browserError: string | null = null;
    try {
      products = await searchMercadoLivreProducts(config, {
        limit: searchLimit,
        queryOverride,
        accessToken: config.accessToken,
        excludeIds: usedIds,
        randomize: true,
        requestTimeoutMs: 7000,
      });
    } catch (error: any) {
      apiError = error?.message || "API search failed";

      const apiErrorLower = String(apiError || "").toLowerCase();
      const looksForbidden =
        apiErrorLower.includes("http 401") ||
        apiErrorLower.includes("http 403") ||
        apiErrorLower.includes("forbidden");
      if (looksForbidden && !forceBrowserFallback) {
        return NextResponse.json(
          {
            error:
              "O Mercado Livre bloqueou a busca oficial (403/401). Para evitar derrubar o servico tentando Chromium (alto custo), o fallback via navegador foi desativado para este erro. Se quiser tentar mesmo assim, use ?forceBrowser=1.",
            apiError,
            browserError: null,
            code: "MERCADO_LIVRE_SEARCH_FORBIDDEN",
          },
          { status: 502 }
        );
      }

      try {
        const renderServiceUrl = (process.env.VIDEO_RENDER_SERVICE_URL || "http://127.0.0.1:3010")
          .trim()
          .replace(/\/+$/, "");
        const targetUrl = `${renderServiceUrl}/mercadolivre/search`;
        const browserRes = await fetch(targetUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            siteId: config.siteId,
            searchTerms: config.searchTerms ? JSON.parse(String(config.searchTerms)) : null,
            categoryIds: config.categoryIds ? JSON.parse(String(config.categoryIds)) : null,
            minPrice: config.minPrice,
            maxPrice: config.maxPrice,
            limit: searchLimit,
            queryOverride,
            excludeIds: usedIds,
            randomize: true,
            maxTargets: 2,
            gotoTimeoutMs: 12000,
            settleDelayMs: 1800,
            waitForAnchorsTimeoutMs: 2500,
          }),
          signal: AbortSignal.timeout(60000),
        });
        const browserJson = await browserRes.json().catch(() => ({}));
        if (!browserRes.ok) throw new Error(browserJson?.error || `HTTP ${browserRes.status}`);
        products = Array.isArray(browserJson?.items) ? browserJson.items : [];
        source = "browser";
      } catch (browserErr: any) {
        browserError = browserErr?.message || "Browser search failed";
        // Give a clear, actionable error instead of a generic 500.
        return NextResponse.json(
          {
            error:
              "Nao foi possivel buscar produtos no Mercado Livre agora. A API oficial falhou e a busca via navegador tambem nao retornou resultados (provavel bloqueio/WAF/challenge ou falta de Chrome no servidor).",
            apiError,
            browserError,
            code: "MERCADO_LIVRE_SEARCH_UNAVAILABLE",
          },
          { status: 502 }
        );
      }
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

    return NextResponse.json({ items, source, apiError, browserError });
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
