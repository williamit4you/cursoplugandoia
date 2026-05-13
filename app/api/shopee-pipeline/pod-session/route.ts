import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrCronSecret } from "@/lib/shopee-pipeline/apiAuth";
import { getRunpodManagerStatus } from "@/lib/shopee-pipeline/runpodManager";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    await requireAdminOrCronSecret(req);

    const session = await prisma.podSession.findFirst({ orderBy: { updatedAt: "desc" } });
    const manager = await getRunpodManagerStatus();

    return NextResponse.json({ ok: true, online: manager.online, manager, session });
  } catch (error: any) {
    console.error("[api/shopee-pipeline/pod-session GET]", error);
    const status = error?.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: error?.message || "Falha ao ler status do POD" }, { status });
  }
}
