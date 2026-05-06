import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 900;

function baseUrl(req: NextRequest) {
  const host = req.headers.get("host") || "localhost:3000";
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const protocol = forwardedProto || (host.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

async function callJson(url: string) {
  const res = await fetch(url, { method: "GET", cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export async function GET(req: NextRequest) {
  try {
    const secret = req.nextUrl.searchParams.get("secret");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && secret !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const origin = baseUrl(req);
    const encodedSecret = secret ? `?secret=${encodeURIComponent(secret)}` : "";

    const mercadoLivre = await callJson(`${origin}/api/mercado-livre/cron${encodedSecret}`);
    const social = await callJson(`${origin}/api/social/cron${encodedSecret}`);

    return NextResponse.json({
      ok: mercadoLivre.ok && social.ok,
      mercadoLivre,
      social,
    });
  } catch (error: any) {
    console.error("[api/automation/cron GET]", error);
    return NextResponse.json(
      { error: error?.message || "Falha no cron de automacao" },
      { status: 500 }
    );
  }
}
