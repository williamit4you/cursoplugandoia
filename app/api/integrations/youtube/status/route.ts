import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { google } from "googleapis";
import { requireAdminOrCronSecret } from "@/lib/shopee-pipeline/apiAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

function originFromReq(req: NextRequest) {
  const host = req.headers.get("host") || "localhost:3000";
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const protocol = forwardedProto || (host.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

function formatGoogleError(err: any) {
  const code = err?.code || err?.response?.status || null;
  const rawMsg =
    err?.response?.data?.error_description ||
    err?.response?.data?.error?.message ||
    err?.message ||
    "Falha desconhecida ao validar autenticação do YouTube";

  let message = rawMsg;
  const isInvalidGrant =
    rawMsg.toLowerCase().includes("invalid_grant") ||
    rawMsg.toLowerCase().includes("expired") ||
    rawMsg.toLowerCase().includes("revoked") ||
    String(err?.response?.data?.error).includes("invalid_grant");

  if (isInvalidGrant) {
    message = "Erro de autenticação (invalid_grant): O token de acesso expirou ou foi revogado. Se a sua tela de consentimento OAuth do Google Cloud Console estiver em modo 'Teste' (Testing), o Google expira o refresh token automaticamente após 7 dias. Solução: Clique no botão 'Autenticar com YouTube' abaixo para reautenticar. Para resolver isso de forma permanente, mude o status de publicação da tela de consentimento OAuth no console do Google Cloud para 'Em Produção' (In Production).";
  }

  const causeMessage = err?.cause?.message || null;
  return { code, message, causeMessage };
}

export async function GET(req: NextRequest) {
  try {
    await requireAdminOrCronSecret(req);
    const check = req.nextUrl.searchParams.get("check") === "1";

    const settings = await prisma.integrationSettings.findUnique({ where: { platform: "YOUTUBE" } });
    const basic = {
      isActive: Boolean(settings?.isActive),
      hasClientId: Boolean(settings?.apiKey),
      hasClientSecret: Boolean(settings?.apiSecret),
      hasRefreshToken: Boolean(settings?.refreshToken),
      updatedAt: settings?.updatedAt ? new Date(settings.updatedAt).toISOString() : null,
    };

    if (!check) return NextResponse.json({ ok: true, basic });

    if (!settings?.apiKey || !settings?.apiSecret || !settings?.refreshToken) {
      return NextResponse.json(
        { ok: false, basic, error: "Credenciais incompletas (clientId/clientSecret/refreshToken)." },
        { status: 400 }
      );
    }

    const redirectUri = `${originFromReq(req)}/api/integrations/youtube/callback`;
    const oauth2Client = new google.auth.OAuth2(settings.apiKey, settings.apiSecret, redirectUri);
    oauth2Client.setCredentials({ refresh_token: settings.refreshToken });

    // Tenta obter/renovar o access token
    const accessToken = await oauth2Client.getAccessToken();
    const tokenValue = typeof accessToken === "string" ? accessToken : accessToken?.token;

    if (!tokenValue) {
      return NextResponse.json(
        { ok: false, basic, error: "Não foi possível obter access token a partir do refresh token." },
        { status: 401 }
      );
    }

    // Executa chamada real para testar permissão da API do YouTube
    const youtube = google.youtube({ version: "v3", auth: oauth2Client });
    const channelRes = await youtube.channels.list({
      part: ["snippet"],
      mine: true,
    });

    const channelName = channelRes.data.items?.[0]?.snippet?.title || "Canal não identificado";

    return NextResponse.json({ ok: true, basic, authOk: true, channelName });
  } catch (error: any) {
    const status = error?.message === "Unauthorized" ? 401 : 500;
    const formatted = formatGoogleError(error);
    return NextResponse.json({ ok: false, error: formatted.message, details: formatted }, { status });
  }
}

