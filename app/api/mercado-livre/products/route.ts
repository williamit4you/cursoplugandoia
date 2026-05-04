import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import {
  buildMercadoLivreAffiliateUrl,
  refreshMercadoLivreAccessToken,
  searchMercadoLivreProducts,
  shouldRefreshMercadoLivreToken,
} from "@/lib/mercadoLivreAffiliate";

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
    const limit = Number(req.nextUrl.searchParams.get("limit") || config.maxProductsPerRun || 8);
    const products = await searchMercadoLivreProducts(config, {
      limit,
      queryOverride,
      accessToken: config.accessToken,
    });

    const items = products.map((product) => {
      const affiliate = buildMercadoLivreAffiliateUrl(product, config);
      return {
        ...product,
        affiliateUrl: affiliate.url,
        affiliateMode: affiliate.mode,
        affiliateWarning: affiliate.warning,
      };
    });

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("[api/mercado-livre/products GET]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch Mercado Livre products" },
      { status: 500 }
    );
  }
}
