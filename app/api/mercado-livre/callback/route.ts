import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import {
  exchangeMercadoLivreAuthorizationCode,
  mercadoLivreRedirectUri,
} from "@/lib/mercadoLivreAffiliate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

function redirectBack(req: NextRequest, status: string, message?: string) {
  const redirectUrl = new URL("/admin/mercado-livre", req.url);
  redirectUrl.searchParams.set("mlAuth", status);
  if (message) redirectUrl.searchParams.set("message", message.slice(0, 240));

  const res = NextResponse.redirect(redirectUrl);
  res.cookies.delete("ml_oauth_state");
  res.cookies.delete("ml_pkce_verifier");
  return res;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const expectedState = req.cookies.get("ml_oauth_state")?.value;
    const codeVerifier = req.cookies.get("ml_pkce_verifier")?.value;

    if (error) {
      return redirectBack(req, "error", error);
    }

    if (!code) {
      return redirectBack(req, "error", "Codigo de autorizacao nao encontrado.");
    }

    if (!expectedState || !state || state !== expectedState) {
      return redirectBack(req, "error", "State OAuth invalido. Tente autenticar novamente.");
    }

    const config = await prisma.mercadoLivreAffiliateConfig.findFirst();
    if (!config?.appId || !config?.clientSecret) {
      return redirectBack(req, "error", "Credenciais Mercado Livre nao configuradas.");
    }

    const token = await exchangeMercadoLivreAuthorizationCode({
      clientId: config.appId,
      clientSecret: config.clientSecret,
      code,
      redirectUri: mercadoLivreRedirectUri(req),
      codeVerifier,
    });

    await prisma.mercadoLivreAffiliateConfig.update({
      where: { id: config.id },
      data: {
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        tokenExpiresAt: token.tokenExpiresAt,
      },
    });

    return redirectBack(req, "success");
  } catch (error: any) {
    console.error("[api/mercado-livre/callback GET]", error);
    return redirectBack(req, "error", error?.message || "Falha ao concluir autenticacao.");
  }
}
