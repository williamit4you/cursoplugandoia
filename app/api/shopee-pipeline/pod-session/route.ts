import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runpodOnline } from "@/lib/shopee-pipeline/runpodClient";
import { getToken } from "next-auth/jwt";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

async function isAdminSession(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return false;
  const token = await getToken({ req, secret }).catch(() => null);
  return Boolean(token);
}

export async function GET(req: NextRequest) {
  try {
    const secret = req.nextUrl.searchParams.get("secret");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && secret !== cronSecret) {
      const okSession = await isAdminSession(req);
      if (!okSession) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const session = await prisma.podSession.findFirst({ orderBy: { updatedAt: "desc" } });
    const onlineRes = await runpodOnline(8000).catch((e: any) => ({ ok: false, status: 0, data: { error: e?.message || "online check failed" } }));
    const online =
      onlineRes.ok &&
      (onlineRes.data?.online === true || onlineRes.data?.ok === true || onlineRes.data?.status === "online");

    return NextResponse.json({ ok: true, online, onlineRes, session });
  } catch (error: any) {
    console.error("[api/shopee-pipeline/pod-session GET]", error);
    return NextResponse.json({ error: error?.message || "Falha ao ler status do POD" }, { status: 500 });
  }
}
