import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import {
  DEFAULT_MERCADO_LIVRE_CATEGORY_IDS,
  DEFAULT_MERCADO_LIVRE_SEARCH_TERMS,
  normalizeMercadoLivrePlatforms,
  parseJsonStringArray,
  refreshMercadoLivreAccessToken,
  shouldRefreshMercadoLivreToken,
} from "@/lib/mercadoLivreAffiliate";

export const dynamic = "force-dynamic";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

function jsonArrayText(value: unknown, fallback: string[]) {
  return JSON.stringify(parseJsonStringArray(value, fallback));
}

function numberOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function intInRange(value: unknown, fallback: number, min: number, max: number) {
  const n = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

async function getOrCreateConfig() {
  const existing = await prisma.mercadoLivreAffiliateConfig.findFirst();
  if (existing) return existing;

  return prisma.mercadoLivreAffiliateConfig.create({
    data: {
      isEnabled: true,
      searchTerms: JSON.stringify(DEFAULT_MERCADO_LIVRE_SEARCH_TERMS),
      categoryIds: JSON.stringify(DEFAULT_MERCADO_LIVRE_CATEGORY_IDS),
      maxProductsPerRun: 1,
      postIntervalHours: 3,
      preferredPlatforms: JSON.stringify(["YOUTUBE", "INSTAGRAM"]),
      autoGenerateScript: true,
      autoRenderVideo: true,
      autoEnqueueSocial: true,
      affiliateLinkMode: "LINK_BUILDER",
    },
  });
}

export async function GET() {
  try {
    const config = await getOrCreateConfig();
    return NextResponse.json(config);
  } catch (error: any) {
    console.error("[api/mercado-livre/config GET]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch Mercado Livre config" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const existing = await getOrCreateConfig();

    const preferredPlatforms = normalizeMercadoLivrePlatforms(body.preferredPlatforms, ["YOUTUBE", "INSTAGRAM"]);

    const updateData = {
      isEnabled: Boolean(body.isEnabled ?? false),
      siteId: String(body.siteId || "MLB").trim() || "MLB",
      searchTerms: jsonArrayText(body.searchTerms, DEFAULT_MERCADO_LIVRE_SEARCH_TERMS),
      categoryIds: jsonArrayText(body.categoryIds, DEFAULT_MERCADO_LIVRE_CATEGORY_IDS),
      minPrice: numberOrNull(body.minPrice),
      maxPrice: numberOrNull(body.maxPrice),
      sort: String(body.sort || "relevance").trim() || "relevance",
      maxProductsPerRun: intInRange(body.maxProductsPerRun, 1, 1, 24),
      postIntervalHours: intInRange(body.postIntervalHours, 3, 1, 24),
      preferredPlatforms: JSON.stringify(preferredPlatforms),
      autoGenerateScript: Boolean(body.autoGenerateScript ?? true),
      autoRenderVideo: Boolean(body.autoRenderVideo ?? false),
      autoEnqueueSocial: Boolean(body.autoEnqueueSocial ?? true),
      affiliateLinkMode: String(body.affiliateLinkMode || "MANUAL_TEMPLATE").trim(),
      affiliateTag: body.affiliateTag ? String(body.affiliateTag).trim() : null,
      affiliateUrlTemplate: body.affiliateUrlTemplate
        ? String(body.affiliateUrlTemplate).trim()
        : null,
      linkBuilderCookie: body.linkBuilderCookie ? String(body.linkBuilderCookie).trim() : null,
      appId: body.appId ? String(body.appId).trim() : null,
      clientSecret: body.clientSecret ? String(body.clientSecret).trim() : null,
      accessToken: body.accessToken ? String(body.accessToken).trim() : null,
      refreshToken: body.refreshToken ? String(body.refreshToken).trim() : null,
      tokenExpiresAt: body.tokenExpiresAt ? new Date(body.tokenExpiresAt) : null,
    };

    const saved = await prisma.mercadoLivreAffiliateConfig.update({
      where: { id: existing.id },
      data: updateData,
    });

    if (body.refreshNow && shouldRefreshMercadoLivreToken(saved)) {
      const refreshed = await refreshMercadoLivreAccessToken(saved);
      if (refreshed) {
        const updated = await prisma.mercadoLivreAffiliateConfig.update({
          where: { id: saved.id },
          data: {
            accessToken: refreshed.accessToken,
            refreshToken: refreshed.refreshToken,
            tokenExpiresAt: refreshed.tokenExpiresAt,
          },
        });
        return NextResponse.json(updated);
      }
    }

    return NextResponse.json(saved);
  } catch (error: any) {
    console.error("[api/mercado-livre/config POST]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to save Mercado Livre config" },
      { status: 500 }
    );
  }
}
