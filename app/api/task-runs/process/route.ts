import { NextRequest, NextResponse } from "next/server";
import { processNextPendingAutomationRun } from "@/lib/tasks/engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const runId = body?.runId ? String(body.runId).trim() : undefined;
    const host = req.headers.get("host") || "localhost:3000";
    const forwardedProto = req.headers.get("x-forwarded-proto");
    const protocol = forwardedProto || (host.includes("localhost") ? "http" : "https");
    const origin = `${protocol}://${host}`;
    const result = await processNextPendingAutomationRun({ runId, origin });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[api/task-runs/process POST]", error);
    return NextResponse.json({ ok: false, error: error?.message || "Failed to process run" }, { status: 500 });
  }
}
