import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 900;

async function requireSession(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) throw new Error("Unauthorized");
  return token;
}

function baseUrl(req: NextRequest) {
  const host = req.headers.get("host") || "localhost:3000";
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const protocol = forwardedProto || (host.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export async function POST(req: NextRequest) {
  try {
    await requireSession(req);
    const res = await fetch(`${baseUrl(req)}/api/engajamento-pipeline/publisher-runner`, { method: "GET", cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json({ ok: res.ok, status: res.status, data });
  } catch (error: any) {
    const msg = error?.message || "Falha ao executar publisher manualmente";
    const status = msg === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
