import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { google } from "googleapis";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    
    if (!code) {
      return NextResponse.json({ error: "Código de autorização não encontrado na URL." }, { status: 400 });
    }

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

    // Troca o código pelos tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    // Atualiza o banco de dados com os tokens obtidos
    await prisma.integrationSettings.update({
      where: { platform: "YOUTUBE" },
      data: {
        accessToken: tokens.access_token || youtubeIntegration.accessToken,
        refreshToken: tokens.refresh_token || youtubeIntegration.refreshToken,
      },
    });

    // Redireciona de volta para a tela de integrações
    return NextResponse.redirect(`${protocol}://${host}/admin/integrations`);

  } catch (error: any) {
    console.error("Erro no Callback YouTube:", error);
    return NextResponse.json({ error: "Falha ao processar o callback de autenticação." }, { status: 500 });
  }
}
