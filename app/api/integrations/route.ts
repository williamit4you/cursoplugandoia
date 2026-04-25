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
    const integrations = await prisma.integrationSettings.findMany();
    return NextResponse.json(integrations);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { platform, webhookUrl, isActive, apiKey, appId, apiSecret, pageId, instagramId, accessToken, refreshToken } = body;

    const upserted = await prisma.integrationSettings.upsert({
      where: { platform: platform },
      update: { webhookUrl, isActive, apiKey, appId, apiSecret, pageId, instagramId, accessToken, refreshToken },
      create: { platform, webhookUrl, isActive, apiKey, appId, apiSecret, pageId, instagramId, accessToken, refreshToken }
    });

    return NextResponse.json(upserted);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update integration" }, { status: 500 });
  }
}
