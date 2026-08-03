import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrCronSecret } from "@/lib/shopee-pipeline/apiAuth";
import { runWhatsappPromoCron } from "@/lib/whatsappPromos";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    await requireAdminOrCronSecret(req);
    return NextResponse.json(await runWhatsappPromoCron());
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Falha no cron de promocoes WhatsApp" }, { status: 500 });
  }
}
