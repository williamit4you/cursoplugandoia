import { NextRequest, NextResponse } from "next/server";
import { getInternalCronSchedulerStatusEngagement, startInternalCronSchedulerEngagement } from "@/lib/internalCronSchedulerEngagement";
import { requireAdminOrCronSecret } from "@/lib/shopee-pipeline/apiAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    await requireAdminOrCronSecret(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  startInternalCronSchedulerEngagement();
  return NextResponse.json(getInternalCronSchedulerStatusEngagement());
}
