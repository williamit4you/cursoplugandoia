import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { google } from "googleapis";

export const dynamic = "force-dynamic";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function GET(req: NextRequest) {
  try {
    const youtubeIntegration = await prisma.integrationSettings.findUnique({
      where: { platform: "YOUTUBE" },
    });

    if (!youtubeIntegration || !youtubeIntegration.apiKey || !youtubeIntegration.apiSecret) {
      return NextResponse.json(
        { error: "Credenciais do YouTube (Client ID e Secret) não configuradas no banco." },
        { status: 400 }
      );
    }

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const redirectUri = `${protocol}://${host}/api/integrations/youtube/callback`;

    const oauth2Client = new google.auth.OAuth2(
      youtubeIntegration.apiKey,
      youtubeIntegration.apiSecret,
      redirectUri
    );

    const scopes = [
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube", // general management
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline", // Necessário para receber o refreshToken
      prompt: "consent",      // Força a tela de consentimento para garantir que o refreshToken venha
      scope: scopes,
    });

    return NextResponse.redirect(url);
  } catch (error: any) {
    console.error("Erro no Auth YouTube:", error);
    return NextResponse.json({ error: "Falha ao iniciar autenticação." }, { status: 500 });
  }
}
