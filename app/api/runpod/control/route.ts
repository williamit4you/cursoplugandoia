import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrCronSecret } from "@/lib/shopee-pipeline/apiAuth";
import { getRunpodManagerDefaults, getRunpodManagerStatus, startOrCreateRunpodPod, stopCurrentRunpodPod } from "@/lib/shopee-pipeline/runpodManager";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 900;

export async function GET(req: NextRequest) {
  try {
    await requireAdminOrCronSecret(req);
    const status = await getRunpodManagerStatus();
    return NextResponse.json({
      ok: true,
      defaults: getRunpodManagerDefaults(),
      ...status,
      docsUrl: `${req.nextUrl.origin}/api/runpod/control/docs`,
      openApiUrl: `${req.nextUrl.origin}/api/runpod/control/openapi`,
    });
  } catch (error: any) {
    const status = error?.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ ok: false, error: error?.message || "Failed to read Runpod status" }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminOrCronSecret(req);
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || "").trim().toLowerCase();
    const timeoutMs = Math.max(30_000, Number(body?.timeoutMs || 180_000));

    if (!["ligar", "ligarnovo", "desligar"].includes(action)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid action. Use ligar, ligarnovo or desligar.",
        },
        { status: 400 }
      );
    }

    if (action === "desligar") {
      const result = await stopCurrentRunpodPod();
      return NextResponse.json({ ok: true, result });
    }

    const result = await startOrCreateRunpodPod({
      forceCreateNew: action === "ligarnovo",
      timeoutMs,
    });

    return NextResponse.json({ ok: true, result });
  } catch (error: any) {
    const status = error?.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ ok: false, error: error?.message || "Failed to control Runpod pod" }, { status });
  }
}
