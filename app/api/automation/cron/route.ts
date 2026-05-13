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

    // Processa tasks de automação pendentes (Shopee, Mercado Livre via Task Engine)
    const taskRuns = await callJson(`${origin}/api/task-runs/cron${encodedSecret}`);

    // Processa cron do Mercado Livre (pipeline legado)
    const mercadoLivre = await callJson(`${origin}/api/mercado-livre/cron${encodedSecret}`);

    // Publica posts sociais agendados cujo horário já passou
    const social = await callJson(`${origin}/api/social/cron${encodedSecret}`);

    // Orquestrador do pipeline de URLs da Coleta Shopee
    const shopeePipeline = await callJson(`${origin}/api/shopee-pipeline/cron${encodedSecret}`);

    // Watchdog do POD (desliga quando ocioso)
    const shopeePodWatchdog = await callJson(`${origin}/api/shopee-pipeline/pod-watchdog${encodedSecret}`);

    // Publica stories agendados do shopee-video-pipeline
    const shopeePublisher = await callJson(`${origin}/api/shopee-pipeline/publisher-runner${encodedSecret}`);

    const allOk = taskRuns.ok && mercadoLivre.ok && social.ok && shopeePipeline.ok && shopeePodWatchdog.ok && shopeePublisher.ok;

    console.log("[api/automation/cron] Results:", {
      taskRuns: { ok: taskRuns.ok, status: taskRuns.status },
      mercadoLivre: { ok: mercadoLivre.ok, status: mercadoLivre.status },
      social: { ok: social.ok, status: social.status },
      shopeePipeline: { ok: shopeePipeline.ok, status: shopeePipeline.status },
      shopeePodWatchdog: { ok: shopeePodWatchdog.ok, status: shopeePodWatchdog.status },
      shopeePublisher: { ok: shopeePublisher.ok, status: shopeePublisher.status },
    });

    return NextResponse.json({
      ok: allOk,
      taskRuns,
      mercadoLivre,
      social,
      shopeePipeline,
      shopeePodWatchdog,
      shopeePublisher,
    });
  } catch (error: any) {
    console.error("[api/automation/cron GET]", error);
    return NextResponse.json(
      { error: error?.message || "Falha no cron de automacao" },
      { status: 500 }
    );
  }
}
