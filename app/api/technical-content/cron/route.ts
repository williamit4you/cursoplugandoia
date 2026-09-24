import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrCronSecret } from "@/lib/shopee-pipeline/apiAuth";
import { runTechnicalContentFunnel } from "@/lib/technicalContentPipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  try {
    await requireAdminOrCronSecret(req);
    const funnel = String(req.nextUrl.searchParams.get("funnel") || "").toUpperCase();
    const force = req.nextUrl.searchParams.get("force") === "true";
    const funnels = funnel ? [funnel] : ["TOP", "MIDDLE", "BOTTOM"];
    if (funnels.some((item) => !["TOP", "MIDDLE", "BOTTOM"].includes(item))) return NextResponse.json({ error: "Funil inválido." }, { status: 400 });
    const results = [];
    for (const item of funnels) results.push(await runTechnicalContentFunnel(item as "TOP" | "MIDDLE" | "BOTTOM", { force }));
    return NextResponse.json({ ok: true, results });
  } catch (error: any) {
    console.error("[technical-content cron]", error);
    return NextResponse.json({ error: error?.message || "Falha na automação de artigos técnicos." }, { status: 500 });
  }
}
