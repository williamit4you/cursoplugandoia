import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const connectionString = process.env.DATABASE_URL!
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

export async function POST(req: NextRequest) {
  try {
    // Apenas guardamos no banco de dados a flag "isActive": true simulando que o botão foi apertado!
    await prisma.integrationSettings.upsert({
      where: { platform: "MOTOR_TRIGGER" },
      update: { isActive: true },
      create: { platform: "MOTOR_TRIGGER", isActive: true }
    });

    return NextResponse.json({ success: true, message: "Manual scrape test queued" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to trigger" }, { status: 500 });
  }
}
