import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrCronSecret } from "@/lib/shopee-pipeline/apiAuth";

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

function internalSchedulersEnabled() {
  const value = String(process.env.INTERNAL_CRON_ENABLED || "").trim().toLowerCase();
  return ["1", "true", "yes", "on"].includes(value);
}

export async function GET(req: NextRequest) {
  try {
    const secret = req.nextUrl.searchParams.get("secret");
    await requireAdminOrCronSecret(req);

    const origin = baseUrl(req);
    const encodedSecret = secret ? `?secret=${encodeURIComponent(secret)}` : "";
    const internalOwnsPipelines = internalSchedulersEnabled();

    // Chamadas internas via fetch não enviam cookies/sessão. Sem `secret`, os demais crons vão falhar.
    // Para debug manual no admin, rode apenas o Social Cron.
    if (!secret) {
      const social = await callJson(`${origin}/api/social/cron`);
      return NextResponse.json({ ok: social.ok, social, note: "Executed only /api/social/cron (missing ?secret=...)" });
    }

    // Processa tasks de automação pendentes (Shopee, Mercado Livre via Task Engine)
    const taskRuns = await callJson(`${origin}/api/task-runs/cron${encodedSecret}`);

    // Processa cron do Mercado Livre (pipeline legado)
    const mercadoLivre = await callJson(`${origin}/api/mercado-livre/cron${encodedSecret}`);

    // Publica posts sociais agendados cujo horário já passou
    const social = internalOwnsPipelines ? { ok: true, status: 200, data: { skipped: true, owner: "internal_scheduler" } } : await callJson(`${origin}/api/social/cron${encodedSecret}`);

    // Orquestrador do pipeline de URLs da Coleta Shopee
    const shopeePipeline = internalOwnsPipelines ? { ok: true, status: 200, data: { skipped: true, owner: "internal_scheduler" } } : await callJson(`${origin}/api/shopee-pipeline/cron${encodedSecret}`);

    // Publica stories agendados do shopee-video-pipeline
    const shopeePublisher = await callJson(`${origin}/api/shopee-pipeline/publisher-runner${encodedSecret}`);

    // Orquestrador do pipeline de engajamento
    const engajamentoPipeline = internalOwnsPipelines ? { ok: true, status: 200, data: { skipped: true, owner: "internal_scheduler" } } : await callJson(`${origin}/api/engajamento-pipeline/cron${encodedSecret}`);

    // Publica stories do pipeline de engajamento
    const engajamentoPublisher = await callJson(`${origin}/api/engajamento-pipeline/publisher-runner${encodedSecret}`);

    // Processa cron de perguntas para vídeos
    const videoQuestions = await callJson(`${origin}/api/video-questions/cron${encodedSecret}`);

    const allOk =
      taskRuns.ok &&
      mercadoLivre.ok &&
      social.ok &&
      shopeePipeline.ok &&
      shopeePublisher.ok &&
      engajamentoPipeline.ok &&
      engajamentoPublisher.ok &&
      videoQuestions.ok;

    console.log("[api/automation/cron] Results:", {
      taskRuns: { ok: taskRuns.ok, status: taskRuns.status },
      mercadoLivre: { ok: mercadoLivre.ok, status: mercadoLivre.status },
      social: { ok: social.ok, status: social.status },
      shopeePipeline: { ok: shopeePipeline.ok, status: shopeePipeline.status },
      shopeePublisher: { ok: shopeePublisher.ok, status: shopeePublisher.status },
      engajamentoPipeline: { ok: engajamentoPipeline.ok, status: engajamentoPipeline.status },
      engajamentoPublisher: { ok: engajamentoPublisher.ok, status: engajamentoPublisher.status },
      videoQuestions: { ok: videoQuestions.ok, status: videoQuestions.status },
    });

    return NextResponse.json({
      ok: allOk,
      taskRuns,
      mercadoLivre,
      social,
      shopeePipeline,
      shopeePublisher,
      engajamentoPipeline,
      engajamentoPublisher,
      videoQuestions,
    });
  } catch (error: any) {
    console.error("[api/automation/cron GET]", error);
    return NextResponse.json(
      { error: error?.message || "Falha no cron de automacao" },
      { status: 500 }
    );
  }
}
