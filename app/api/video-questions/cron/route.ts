import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const SECRET = process.env.WORKER_SECRET_KEY || "super-secret-worker-key-123";

export const dynamic = "force-dynamic";

function baseUrl(req: NextRequest) {
  const host = req.headers.get("host") || "localhost:3000";
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const protocol = forwardedProto || (host.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export async function GET(req: NextRequest) {
  try {
    const secret = req.nextUrl.searchParams.get("secret");
    const cronSecret = process.env.CRON_SECRET || SECRET;

    // Autoriza se o secret for passado corretamente
    if (secret !== cronSecret && req.headers.get("x-worker-secret") !== SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cfg = await prisma.videoQuestionConfig.findFirst();
    if (!cfg) {
      return NextResponse.json({ message: "Configuração de perguntas não encontrada." });
    }

    if (!cfg.isEnabled) {
      return NextResponse.json({ message: "Automação de perguntas desativada nas configurações." });
    }

    // Verifica se existem perguntas pendentes
    const pendingCount = await prisma.videoQuestion.count({
      where: { status: "PENDING" },
    });

    if (pendingCount === 0) {
      return NextResponse.json({ message: "Nenhuma pergunta pendente na fila." });
    }

    const now = new Date();
    let shouldRun = false;
    let reason = "";

    if (cfg.useScheduledTimes) {
      let scheduledTimes: string[] = [];
      try {
        scheduledTimes = JSON.parse(cfg.scheduledTimes);
      } catch (e) {
        scheduledTimes = [];
      }

      if (scheduledTimes.length === 0) {
        return NextResponse.json({ message: "Horários fixos ativados mas nenhum cadastrado." });
      }

      // Procura se o horário atual está próximo de algum horário fixo (janela de 5 min)
      for (const timeStr of scheduledTimes) {
        const [hourStr, minStr] = timeStr.split(":");
        const hour = parseInt(hourStr, 10);
        const min = parseInt(minStr, 10);

        const scheduledDate = new Date(now);
        scheduledDate.setHours(hour, min, 0, 0);

        const diffMs = Math.abs(now.getTime() - scheduledDate.getTime());
        // Se estiver dentro de 5 minutos do horário agendado
        if (diffMs <= 5 * 60 * 1000) {
          // Verifica se já iniciou algum nas últimas 15 minutos para evitar duplicação no mesmo minuto/execução do cron
          const recentRun = await prisma.videoQuestion.findFirst({
            where: {
              startedAt: {
                gte: new Date(now.getTime() - 15 * 60 * 1000),
              },
            },
          });

          if (!recentRun) {
            shouldRun = true;
            reason = `Horário agendado ${timeStr} atingido (janela de 5 min) e nenhum executado recentemente.`;
            break;
          } else {
            reason = `Horário agendado ${timeStr} atingido, mas uma pergunta já foi processada nos últimos 15 min.`;
          }
        }
      }
    } else {
      // Intervalo em minutos
      const lastRun = await prisma.videoQuestion.findFirst({
        where: {
          startedAt: { not: null },
        },
        orderBy: { startedAt: "desc" },
      });

      if (!lastRun || !lastRun.startedAt) {
        shouldRun = true;
        reason = "Nenhuma pergunta executada anteriormente (primeira execução).";
      } else {
        const diffMin = (now.getTime() - lastRun.startedAt.getTime()) / (60 * 1000);
        if (diffMin >= cfg.intervalMinutes) {
          shouldRun = true;
          reason = `Intervalo de ${cfg.intervalMinutes} minutos atingido desde a última execução (${Math.round(diffMin)} min atrás).`;
        } else {
          reason = `Intervalo de ${cfg.intervalMinutes} minutos não atingido (última execução foi há ${Math.round(diffMin)} min).`;
        }
      }
    }

    if (!shouldRun) {
      return NextResponse.json({ shouldRun: false, reason });
    }

    // Dispara o processamento da próxima pergunta em segundo plano
    const origin = baseUrl(req);
    const triggerRes = await fetch(`${origin}/api/worker/process-next-question`, {
      method: "POST",
      headers: {
        "x-worker-secret": SECRET,
      },
    });

    const triggerData = await triggerRes.json().catch(() => ({}));

    return NextResponse.json({
      shouldRun: true,
      reason,
      triggerResponse: triggerData,
    });
  } catch (error: any) {
    console.error("[api/video-questions/cron GET]", error);
    return NextResponse.json({ error: error?.message || "Erro no cron de perguntas" }, { status: 500 });
  }
}
