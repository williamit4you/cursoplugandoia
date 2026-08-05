import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrCronSecret } from "@/lib/shopee-pipeline/apiAuth";
import { runAffiliateProgramsCron } from "@/lib/affiliate-programs/operations";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  try {
    await requireAdminOrCronSecret(req);
    const result = await runAffiliateProgramsCron();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[api/affiliate-programs/cron]", error);
    return NextResponse.json({ ok: false, error: error?.message || "Falha no cron de programas afiliados" }, { status: 500 });
  }
}
