import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireServerSession } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const events = await prisma.affiliateComparisonEvent.findMany({
      where: { comparisonId: params.id },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ items: events });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to load events" }, { status: 500 });
  }
}
