import { NextRequest, NextResponse } from "next/server";

import { requireAdminOrCronSecret } from "@/lib/shopee-pipeline/apiAuth";
import {
  runDailyNewsEditionPipeline,
  syncDailyNewsEditionState,
} from "@/lib/dailyNewsPipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 2100;

function baseUrl(req: NextRequest) {
  const host = req.headers.get("host") || "localhost:3000";
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const protocol = forwardedProto || (host.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    await requireAdminOrCronSecret(req);

    const item = await runDailyNewsEditionPipeline({
      editionId: ctx.params.id,
      baseUrl: baseUrl(req),
    });

    const synced = await syncDailyNewsEditionState(ctx.params.id);
    return NextResponse.json({
      ok: true,
      item: synced || item,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Falha ao executar resumo-noticias." },
      { status: 500 },
    );
  }
}
