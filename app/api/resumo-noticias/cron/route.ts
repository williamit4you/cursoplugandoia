import { NextRequest, NextResponse } from "next/server";

import { dailyNewsUnavailableResponse, isDailyNewsSchemaMissing } from "@/lib/dailyNewsAvailability";
import { requireAdminOrCronSecret } from "@/lib/shopee-pipeline/apiAuth";
import { runTodayDailyNewsAutomation } from "@/lib/dailyNewsPipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 2100;

function baseUrl(req: NextRequest) {
  const host = req.headers.get("host") || "localhost:3000";
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const protocol = forwardedProto || (host.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export async function GET(req: NextRequest) {
  try {
    await requireAdminOrCronSecret(req);
    const result = await runTodayDailyNewsAutomation(baseUrl(req));
    return NextResponse.json(result);
  } catch (error: any) {
    if (isDailyNewsSchemaMissing(error)) {
      return dailyNewsUnavailableResponse(
        "A automacao diaria foi bloqueada porque a base ainda nao possui as tabelas do modulo.",
      );
    }
    return NextResponse.json(
      { error: error?.message || "Falha no cron do resumo-noticias." },
      { status: 500 },
    );
  }
}
