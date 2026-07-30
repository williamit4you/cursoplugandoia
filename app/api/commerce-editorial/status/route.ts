import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrCronSecret } from "@/lib/shopee-pipeline/apiAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdminOrCronSecret(req);
    const [config, runs, publications] = await Promise.all([
      prisma.commerceEditorialConfig.findUnique({ where: { id: "default" } }),
      prisma.commerceEditorialRun.findMany({ orderBy: { startedAt: "desc" }, take: 50 }),
      prisma.seoBrief.findMany({
        where: { product: { affiliateStoreId: { not: null } } },
        include: { product: { include: { affiliateStore: { select: { name: true, slug: true } } } } },
        orderBy: { updatedAt: "desc" },
        take: 100,
      }),
    ]);
    return NextResponse.json({ ok: true, config, runs, publications });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Falha ao consultar automação editorial" }, { status: 500 });
  }
}
