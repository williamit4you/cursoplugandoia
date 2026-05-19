import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRunpodManagerStatus, stopCurrentRunpodPod } from "@/lib/shopee-pipeline/runpodManager";
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

    const manager = await getRunpodManagerStatus();
    const online = Boolean(manager.online);

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
      return NextResponse.json({ ok: true, online: false, action: "none", session: savedSession, manager });
    }

    // Existe trabalho imediato que exige POD?
    const needsPodNow = await prisma.coletaDadosShoppe.findFirst({
      where: {
        pipelineKind: "ENGAGEMENT" as any,
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
      const offRes = await stopCurrentRunpodPod();
      await prisma.podSession.update({
        where: { id: savedSession.id },
        data: { status: "STOPPING" as any, shutdownRequestedAt: current, errorMessage: offRes.ok ? null : "desligar falhou" },
      });
      const anyColeta = await prisma.coletaDadosShoppe.findFirst({
        where: { pipelineKind: "ENGAGEMENT" as any },
        select: { id: true },
      });
      if (anyColeta?.id) {
        await logPipelineEvent({
          coletaId: anyColeta.id,
          level: offRes.ok ? "INFO" : "WARN",
          stepName: "POD_WATCHDOG",
          message: offRes.ok ? "POD desligando por ociosidade." : "Falha ao desligar POD (watchdog).",
          metadata: { offRes },
        }).catch(() => null);
      }

      return NextResponse.json({ ok: true, online: true, action: "power_off", offRes, manager });
    }

    return NextResponse.json({ ok: true, online: true, action: "none", needsPodNow: Boolean(needsPodNow), idleLongEnough, manager });
  } catch (error: any) {
    console.error("[api/engajamento-pipeline/pod-watchdog GET]", error);
    return NextResponse.json({ error: error?.message || "Falha no watchdog do POD" }, { status: 500 });
  }
}
