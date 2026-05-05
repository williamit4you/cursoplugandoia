import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { DEFAULT_SHOPEE_SEARCH_TERMS, parseJsonStringArray } from "@/lib/shopeeAffiliate";
import { normalizeMercadoLivrePlatforms } from "@/lib/mercadoLivreAffiliate";

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
  const existing = await prisma.shopeeAffiliateConfig.findFirst();
  if (existing) return existing;

  return prisma.shopeeAffiliateConfig.create({
    data: {
      isEnabled: true,
      site: "br",
      domain: "shopee.com.br",
      searchTerms: JSON.stringify(DEFAULT_SHOPEE_SEARCH_TERMS),
      maxProductsPerRun: 1,
      postIntervalHours: 3,
      preferredPlatforms: JSON.stringify(["YOUTUBE", "INSTAGRAM"]),
      autoGenerateScript: true,
      autoRenderVideo: true,
      autoEnqueueSocial: true,
      appId: process.env.SHOPEE_APP_ID || null,
      clientSecret: process.env.SHOPEE_SECRET_KEY || null,
    },
  });
}

export async function GET() {
  try {
    const config = await getOrCreateConfig();
    return NextResponse.json(config);
  } catch (error: any) {
    console.error("[api/shopee/config GET]", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch Shopee config" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const existing = await getOrCreateConfig();

    const preferredPlatforms = normalizeMercadoLivrePlatforms(body.preferredPlatforms, ["YOUTUBE", "INSTAGRAM"]);

    const updateData = {
      isEnabled: Boolean(body.isEnabled ?? false),
      site: String(body.site || "br").trim().toLowerCase() || "br",
      domain: String(body.domain || "shopee.com.br").trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "") || "shopee.com.br",
      searchTerms: jsonArrayText(body.searchTerms, DEFAULT_SHOPEE_SEARCH_TERMS),
      minPrice: numberOrNull(body.minPrice),
      maxPrice: numberOrNull(body.maxPrice),
      maxProductsPerRun: intInRange(body.maxProductsPerRun, 1, 1, 24),
      postIntervalHours: intInRange(body.postIntervalHours, 3, 1, 24),
      preferredPlatforms: JSON.stringify(preferredPlatforms),
      autoGenerateScript: Boolean(body.autoGenerateScript ?? true),
      autoRenderVideo: Boolean(body.autoRenderVideo ?? false),
      autoEnqueueSocial: Boolean(body.autoEnqueueSocial ?? true),
      appId: body.appId ? String(body.appId).trim() : null,
      clientSecret: body.clientSecret ? String(body.clientSecret).trim() : null,
    };

    const saved = await prisma.shopeeAffiliateConfig.update({
      where: { id: existing.id },
      data: updateData,
    });

    return NextResponse.json(saved);
  } catch (error: any) {
    console.error("[api/shopee/config POST]", error);
    return NextResponse.json({ error: error?.message || "Failed to save Shopee config" }, { status: 500 });
  }
}

