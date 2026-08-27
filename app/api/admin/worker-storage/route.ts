import { NextRequest, NextResponse } from "next/server";
import { requireServerSession } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function workerBaseUrl() {
  return String(process.env.WORKER_FASTAPI_BASE_URL || process.env.FASTAPI_URL || "http://127.0.0.1:8000").trim().replace(/\/+$/, "");
}

async function workerFetch(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  const secret = String(process.env.WORKER_MAINTENANCE_SECRET || "").trim();
  if (secret) headers.set("x-worker-maintenance-secret", secret);
  return fetch(`${workerBaseUrl()}${path}`, { ...init, headers, cache: "no-store", signal: AbortSignal.timeout(20_000) });
}

async function isAdmin() {
  const session = await requireServerSession();
  return Boolean(session?.user && String((session.user as any).role || "").toUpperCase() === "ADMIN");
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const response = await workerFetch("/maintenance/temp-storage");
    return NextResponse.json(await response.json().catch(() => ({})), { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Worker indisponivel" }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const mode = body?.mode === "all" ? "all" : "older-than-24h";
  try {
    const response = await workerFetch("/maintenance/temp-storage/cleanup", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ mode }).toString(),
    });
    return NextResponse.json(await response.json().catch(() => ({})), { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Falha ao limpar arquivos temporarios" }, { status: 502 });
  }
}
