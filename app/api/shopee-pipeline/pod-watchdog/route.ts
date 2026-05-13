import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runpodOnline, runpodPowerOff } from "@/lib/shopee-pipeline/runpodClient";
import { logPipelineEvent } from "@/lib/shopee-pipeline/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 900;

const IDLE_GRACE_MS = 5 * 60 * 1000;

function now() {
  return new Date();
}

export async function GET(req: NextRequest) {
  try {
    const secret = req.nextUrl.searchParams.get("secret");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && secret !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const onlineRes = await runpodOnline(8000);
    const online = onlineRes.ok && (onlineRes.data?.online === true || onlineRes.data?.ok === true || onlineRes.data?.status === "online");

    const session = await prisma.podSession.findFirst({ orderBy: { updatedAt: "desc" } });
    const current = now();

    const savedSession = session
      ? await prisma.podSession.update({
          where: { id: session.id },
          data: {
            status: online ? ((session.status === "OFFLINE" || session.status === "STOPPING") ? ("ONLINE" as any) : session.status) : ("OFFLINE" as any),
            lastOnlineCheckAt: current,
          },
        })
      : await prisma.podSession.create({
          data: { status: online ? ("ONLINE" as any) : ("OFFLINE" as any), lastOnlineCheckAt: current },
        });

    if (!online) {
      return NextResponse.json({ ok: true, online: false, action: "none", session: savedSession });
    }

    // Existe trabalho imediato que exige POD?
    const needsPodNow = await prisma.coletaDadosShoppe.findFirst({
      where: {
        active: true,
        AND: [
          { OR: [{ pipelineStatus: "WAITING_POD" as any }, { pipelineStatus: "GENERATING_AUDIO" as any }, { pipelineStatus: "GENERATING_COPY_VIDEO" as any }] },
          { OR: [{ nextRunAt: null }, { nextRunAt: { lte: current } }] },
        ],
      },
      select: { id: true },
    });

    const lastActivityAt = savedSession.lastActivityAt || savedSession.updatedAt;
    const idleLongEnough = lastActivityAt ? current.getTime() - new Date(lastActivityAt).getTime() > IDLE_GRACE_MS : false;

    if (!needsPodNow && idleLongEnough) {
      const offRes = await runpodPowerOff(20000);
      await prisma.podSession.update({
        where: { id: savedSession.id },
        data: { status: "STOPPING" as any, shutdownRequestedAt: current, errorMessage: offRes.ok ? null : `desligar HTTP ${offRes.status}` },
      });
      const anyColeta = await prisma.coletaDadosShoppe.findFirst({ select: { id: true } });
      if (anyColeta?.id) {
        await logPipelineEvent({
          coletaId: anyColeta.id,
          level: offRes.ok ? "INFO" : "WARN",
          stepName: "POD_WATCHDOG",
          message: offRes.ok ? "POD desligando por ociosidade." : "Falha ao desligar POD (watchdog).",
          metadata: { offRes },
        }).catch(() => null);
      }

      return NextResponse.json({ ok: true, online: true, action: "power_off", offRes });
    }

    return NextResponse.json({ ok: true, online: true, action: "none", needsPodNow: Boolean(needsPodNow), idleLongEnough });
  } catch (error: any) {
    console.error("[api/shopee-pipeline/pod-watchdog GET]", error);
    return NextResponse.json({ error: error?.message || "Falha no watchdog do POD" }, { status: 500 });
  }
}
