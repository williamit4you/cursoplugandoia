import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const connectionString = process.env.DATABASE_URL!
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

export async function GET(req: NextRequest) {
  try {
    const urls = await prisma.scrapingSource.findMany({
      where: { isActive: true },
      select: { id: true, url: true, name: true }
    });

    // Vamos buscar também a FLAG de Manual Trigger que pode estar guardada na IntegrationSettings
    const triggerInfo = await prisma.integrationSettings.findUnique({
      where: { platform: "MOTOR_TRIGGER" }
    });

    const isTriggered = triggerInfo?.isActive === true;

    // Se estiver ativa, vamos resetar ela agora que o py tomou consciencia
    if (isTriggered) {
      await prisma.integrationSettings.update({
        where: { platform: "MOTOR_TRIGGER" },
        data: { isActive: false }
      });
    }

    return NextResponse.json({
      sources: urls,
      trigger_now: isTriggered
    });

  } catch (error) {
    return NextResponse.json({ error: "Failed to supply sources" }, { status: 500 });
  }
}
