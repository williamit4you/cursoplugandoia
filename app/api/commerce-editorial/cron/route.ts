import { NextRequest, NextResponse } from "next/server";
import { runCommerceEditorialOnce } from "@/lib/commerce-editorial/pipeline";
import { requireAdminOrCronSecret } from "@/lib/shopee-pipeline/apiAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  try {
    await requireAdminOrCronSecret(req);
    const force = req.nextUrl.searchParams.get("force") === "1";
    const result = await runCommerceEditorialOnce({ force });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[api/commerce-editorial/cron]", error);
    return NextResponse.json({ ok: false, error: error?.message || "Falha no cron editorial" }, { status: 500 });
  }
}
