import { NextRequest, NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/shopee-pipeline/apiAuth";
import { runTechnicalContentFunnel } from "@/lib/technicalContentPipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 900;

export async function POST(req: NextRequest) {
  if (!(await hasAdminSession(req))) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const results: Array<{ funnel: string; ok: boolean; result?: unknown; error?: string }> = [];
  for (const funnel of ["TOP", "MIDDLE", "BOTTOM"] as const) {
    try { results.push({ funnel, ok: true, result: await runTechnicalContentFunnel(funnel, { force: true }) }); }
    catch (error: any) { results.push({ funnel, ok: false, error: error?.message || "Falha ao gerar artigo." }); }
  }
  return NextResponse.json({ ok: results.every((item) => item.ok), results }, { status: results.every((item) => item.ok) ? 200 : 207 });
}
