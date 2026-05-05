import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 900;

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

function publicBaseUrl(req: NextRequest) {
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const host = req.headers.get("host") || "localhost:3000";
  return `${protocol}://${host}`;
}

export async function GET(req: NextRequest) {
  try {
    const secret = req.nextUrl.searchParams.get("secret");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && secret !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const config = await prisma.mercadoLivreAffiliateConfig.findFirst();
    if (!config) {
      return NextResponse.json({ skipped: true, reason: "Mercado Livre config not found" });
    }

    if (!config.isEnabled) {
      return NextResponse.json({ skipped: true, reason: "Rotina Mercado Livre desativada" });
    }

    const intervalMs = Math.min(24, Math.max(1, Number(config.postIntervalHours || 3))) * 60 * 60 * 1000;
    const lastRunAt = config.lastRunAt ? new Date(config.lastRunAt).getTime() : 0;
    const nextRunAt = lastRunAt + intervalMs;

    if (lastRunAt > 0 && nextRunAt > Date.now()) {
      return NextResponse.json({
        skipped: true,
        reason: "Ainda nao chegou o horario da proxima rodada",
        nextRunAt: new Date(nextRunAt).toISOString(),
      });
    }

    const response = await fetch(`${publicBaseUrl(req)}/api/mercado-livre/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ force: false }),
    });
    const result = await response.json().catch(() => ({}));

    return NextResponse.json({ trigger: "cron", ok: response.ok, ...result }, { status: response.status });
  } catch (error: any) {
    console.error("[api/mercado-livre/cron GET]", error);
    return NextResponse.json(
      { error: error?.message || "Falha no cron Mercado Livre" },
      { status: 500 }
    );
  }
}
