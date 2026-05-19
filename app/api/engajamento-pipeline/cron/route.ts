import { NextRequest, NextResponse } from "next/server";
import { runEngagementPipelineCron } from "@/lib/engagement-pipeline/cronRunner";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 900;

export async function GET(req: NextRequest) {
  try {
    const secret = req.nextUrl.searchParams.get("secret");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && secret !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(await runEngagementPipelineCron());
  } catch (error: any) {
    console.error("[api/engajamento-pipeline/cron GET]", error);
    return NextResponse.json({ error: error?.message || "Falha no cron Engagement pipeline" }, { status: 500 });
  }
}
