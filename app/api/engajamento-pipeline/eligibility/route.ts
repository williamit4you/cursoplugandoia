import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrCronSecret } from "@/lib/shopee-pipeline/apiAuth";
import { getEngagementPipelineEligibilityDiagnostics } from "@/lib/engagement-pipeline/orchestrator";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    await requireAdminOrCronSecret(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const diagnostics = await getEngagementPipelineEligibilityDiagnostics();
  return NextResponse.json({ ok: true, diagnostics });
}
