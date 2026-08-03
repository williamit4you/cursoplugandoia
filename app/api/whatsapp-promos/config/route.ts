import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateCrmSettings } from "@/lib/crmSettings";
import { requireServerSession } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const session = await requireServerSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await getOrCreateCrmSettings();
  return NextResponse.json({
    offersCronEnabled: settings.offersCronEnabled,
    offersGroupTargetId: settings.offersGroupTargetId || "",
    offersGroupLabel: settings.offersGroupLabel || "",
    offersPublishIntervalMin: settings.offersPublishIntervalMin,
    offersDailyStartHour: settings.offersDailyStartHour,
    offersDailyEndHour: settings.offersDailyEndHour,
    offersRequireApproval: settings.offersRequireApproval,
    offersLastRunAt: settings.offersLastRunAt,
    offersNextRunAt: settings.offersNextRunAt,
    evolutionEnabled: settings.evolutionEnabled,
  });
}

export async function POST(req: NextRequest) {
  const session = await requireServerSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const settings = await getOrCreateCrmSettings();
    const body = await req.json().catch(() => ({}));
    const updated = await prisma.crmSettings.update({
      where: { id: settings.id },
      data: {
        offersCronEnabled: body.offersCronEnabled ?? settings.offersCronEnabled,
        offersGroupTargetId: body.offersGroupTargetId ?? settings.offersGroupTargetId,
        offersGroupLabel: body.offersGroupLabel ?? settings.offersGroupLabel,
        offersPublishIntervalMin: Number(body.offersPublishIntervalMin ?? settings.offersPublishIntervalMin),
        offersDailyStartHour: Number(body.offersDailyStartHour ?? settings.offersDailyStartHour),
        offersDailyEndHour: Number(body.offersDailyEndHour ?? settings.offersDailyEndHour),
        offersRequireApproval: body.offersRequireApproval ?? settings.offersRequireApproval,
      },
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Falha ao salvar configuracao" }, { status: 500 });
  }
}
