import { NextRequest, NextResponse } from "next/server";
import { getInternalCronSchedulerStatus } from "@/lib/internalCronScheduler";
import { requireAdminOrCronSecret } from "@/lib/shopee-pipeline/apiAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    await requireAdminOrCronSecret(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(getInternalCronSchedulerStatus());
}
