import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { generateShopeeAffiliateShortLink } from "@/lib/shopee/openApi";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

export async function POST(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "DATABASE_URL is not configured" }, { status: 500 });
    }

    const config = await prisma.shopeeAffiliateConfig.findFirst();
    if (!config) {
      return NextResponse.json({ error: "Shopee config not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const originUrl = String(body?.originUrl || body?.origin_url || "").trim();
    const subIds = Array.isArray(body?.subIds) ? body.subIds : [];

    if (!originUrl) {
      return NextResponse.json({ error: "originUrl is required" }, { status: 400 });
    }

    const shortLink = await generateShopeeAffiliateShortLink({
      config,
      originUrl,
      subIds,
      timeoutMs: 15000,
    });

    return NextResponse.json({ shortLink, originUrl });
  } catch (error: any) {
    console.error("[api/shopee/generate-link POST]", error);
    return NextResponse.json(
      { error: error?.message || "Nao foi possivel gerar o link curto da Shopee." },
      { status: 502 }
    );
  }
}
