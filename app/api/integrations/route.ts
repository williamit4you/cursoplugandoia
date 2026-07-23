import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const connectionString = process.env.DATABASE_URL!
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

function normalizeText(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

function looksLikePlaceholder(value: string | null, minLength = 2) {
  if (!value) return true;
  const normalized = value.trim().toLowerCase();
  if (normalized.length < minLength) return true;
  return ["1", "null", "undefined", "teste", "test", "xxx", "changeme"].includes(normalized);
}

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
    const platform = String(body?.platform || "").trim().toUpperCase();
    const webhookUrl = normalizeText(body?.webhookUrl);
    const isActive = Boolean(body?.isActive);
    const apiKey = normalizeText(body?.apiKey);
    const appId = normalizeText(body?.appId);
    const apiSecret = normalizeText(body?.apiSecret);
    const pageId = normalizeText(body?.pageId);
    const instagramId = normalizeText(body?.instagramId);
    const accessToken = normalizeText(body?.accessToken);
    const refreshToken = normalizeText(body?.refreshToken);

    if (!platform) {
      return NextResponse.json({ error: "Platform is required" }, { status: 400 });
    }

    if (platform === "META" && isActive) {
      if (looksLikePlaceholder(pageId, 3)) {
        return NextResponse.json({ error: "Facebook Page ID invalido para a Meta." }, { status: 400 });
      }
      if (looksLikePlaceholder(instagramId, 3)) {
        return NextResponse.json({ error: "Instagram Business Account ID invalido para a Meta." }, { status: 400 });
      }
      if (looksLikePlaceholder(accessToken, 20)) {
        return NextResponse.json({ error: "Access Token da Meta invalido ou placeholder." }, { status: 400 });
      }
    }

    if (platform === "YOUTUBE" && isActive) {
      if (looksLikePlaceholder(apiKey, 10)) {
        return NextResponse.json({ error: "Client ID do YouTube invalido." }, { status: 400 });
      }
      if (looksLikePlaceholder(apiSecret, 8)) {
        return NextResponse.json({ error: "Client Secret do YouTube invalido." }, { status: 400 });
      }
    }

    const upserted = await prisma.integrationSettings.upsert({
      where: { platform },
      update: { webhookUrl, isActive, apiKey, appId, apiSecret, pageId, instagramId, accessToken, refreshToken },
      create: { platform, webhookUrl, isActive, apiKey, appId, apiSecret, pageId, instagramId, accessToken, refreshToken }
    });

    return NextResponse.json(upserted);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update integration" }, { status: 500 });
  }
}
