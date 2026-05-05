import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { searchShopeeProducts } from "@/lib/shopeeAffiliate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function getConfig() {
  const config = await prisma.shopeeAffiliateConfig.findFirst();
  if (config) return config;
  return null;
}

export async function GET(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "DATABASE_URL is not configured" }, { status: 500 });
    }

    const config = await getConfig();
    if (!config) {
      return NextResponse.json({ error: "Shopee config not found" }, { status: 404 });
    }

    const queryOverride = req.nextUrl.searchParams.get("q");
    const limit = Number(req.nextUrl.searchParams.get("limit") || config.maxProductsPerRun || 1);
    const searchLimit = Math.min(24, Math.max(limit * 4, 12));

    const products = await searchShopeeProducts(config, {
      limit: searchLimit,
      queryOverride,
      randomize: true,
      requestTimeoutMs: 9000,
      enrichDetails: req.nextUrl.searchParams.get("enrich") === "0" ? false : true,
    });

    const items = products.slice(0, Math.max(1, limit));

    return NextResponse.json({ items, source: "public-api", apiError: null, browserError: null });
  } catch (error: any) {
    console.error("[api/shopee/products GET]", error);
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Nao foi possivel buscar produtos na Shopee agora (possivel bloqueio/WAF ou mudanca de endpoint).",
        code: "SHOPEE_SEARCH_UNAVAILABLE",
      },
      { status: 502 }
    );
  }
}
