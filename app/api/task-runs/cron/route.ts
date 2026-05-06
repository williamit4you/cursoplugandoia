import { NextRequest, NextResponse } from "next/server";
import { processNextPendingAutomationRun } from "@/lib/tasks/engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function originFromReq(req: NextRequest) {
  const host = req.headers.get("host") || "localhost:3000";
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const protocol = forwardedProto || (host.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export async function GET(req: NextRequest) {
  try {
    const secret = req.nextUrl.searchParams.get("secret");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && secret !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limit = Math.min(50, Math.max(1, Number(req.nextUrl.searchParams.get("limit") || 5)));
    const origin = originFromReq(req);

    const results: any[] = [];
    for (let i = 0; i < limit; i += 1) {
      const result = await processNextPendingAutomationRun({ origin });
      results.push(result);
      if (!result.processed) break;
      if (result.ok === false) break;
    }

    return NextResponse.json({ ok: true, processed: results.filter((r) => r.processed).length, results });
  } catch (error: any) {
    console.error("[api/task-runs/cron GET]", error);
    return NextResponse.json({ error: error?.message || "Failed task run cron" }, { status: 500 });
  }
}

