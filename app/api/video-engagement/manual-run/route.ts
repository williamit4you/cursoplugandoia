import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { runVideoEngagementOnce } from "@/lib/video-engagement/cronRunner";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 900;

async function requireSession(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) throw new Error("Unauthorized");
  return token;
}

export async function POST(req: NextRequest) {
  try {
    await requireSession(req);
    const result = await runVideoEngagementOnce();
    return NextResponse.json({ ok: true, result });
  } catch (error: any) {
    const msg = error?.message || "Falha ao executar manualmente";
    const status = msg === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
