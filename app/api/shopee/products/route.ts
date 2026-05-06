import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { searchShopeeAffiliateProducts } from "@/lib/shopee/openApi";

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

    const keyword = String(req.nextUrl.searchParams.get("q") || "").trim() || "ofertas";
    const limit = Math.min(50, Math.max(1, Number(req.nextUrl.searchParams.get("limit") || 24)));
    const listType = Number(req.nextUrl.searchParams.get("listType") || 2);
    const sortType = Number(req.nextUrl.searchParams.get("sortType") || 2);
    const minPrice = Number(req.nextUrl.searchParams.get("minPrice") || 10);
    const minCommissionRate = Number(req.nextUrl.searchParams.get("minCommissionRate") || 5);
    const minSales = Number(req.nextUrl.searchParams.get("minSales") || 100);
    const enrichDetails = req.nextUrl.searchParams.get("enrich") === "0" ? false : true;

    const items = await searchShopeeAffiliateProducts(config, {
      keyword,
      limit,
      listType,
      sortType,
      minPrice,
      minCommissionRate,
      minSales,
      enrichDetails,
      timeoutMs: 15000,
    });

    return NextResponse.json({
      items,
      source: "affiliate-open-api",
      filters: { keyword, limit, listType, sortType, minPrice, minCommissionRate, minSales },
    });
  } catch (error: any) {
    console.error("[api/shopee/products GET]", error);
    return NextResponse.json(
      {
        error: error?.message || "Nao foi possivel buscar produtos na Shopee agora.",
        code: "SHOPEE_AFFILIATE_SEARCH_FAILED",
      },
      { status: 502 }
    );
  }
}
