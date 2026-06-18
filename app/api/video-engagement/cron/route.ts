import { NextRequest, NextResponse } from "next/server";
import { runVideoEngagementCron } from "@/lib/video-engagement/cronRunner";
import { requireAdminOrCronSecret } from "@/lib/shopee-pipeline/apiAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 900;

export async function GET(req: NextRequest) {
  try {
    await requireAdminOrCronSecret(req);
    return NextResponse.json(await runVideoEngagementCron());
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Falha no cron Video Engagement" }, { status: 500 });
  }
}
