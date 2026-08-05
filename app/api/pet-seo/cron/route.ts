import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrCronSecret } from "@/lib/shopee-pipeline/apiAuth";
import { runPetSeoOnce } from "@/lib/pet-seo/pipeline";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  try {
    await requireAdminOrCronSecret(req);
    const result = await runPetSeoOnce({ force: req.nextUrl.searchParams.get("force") === "1" });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[api/pet-seo/cron]", error);
    return NextResponse.json({ ok: false, error: error?.message || "Falha no cron SEO Pet" }, { status: 500 });
  }
}
