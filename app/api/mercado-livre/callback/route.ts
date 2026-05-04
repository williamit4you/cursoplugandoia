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

function normalizeOrigin(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (url.hostname === "0.0.0.0") return null;
    return url.origin;
  } catch {
    return null;
  }
}

function publicOriginFromRequest(req: NextRequest) {
  const savedOrigin = normalizeOrigin(req.cookies.get("ml_oauth_origin")?.value);
  if (savedOrigin) return savedOrigin;

  const envOrigin = normalizeOrigin(
    process.env.NEXT_PUBLIC_APP_URL ||
      process.env.PUBLIC_APP_URL ||
      process.env.APP_BASE_URL ||
      process.env.NEXTAUTH_URL
  );
  if (envOrigin) return envOrigin;

  const forwardedHost = req.headers.get("x-forwarded-host");
  const forwardedProto = req.headers.get("x-forwarded-proto") || "https";
  const forwardedOrigin = forwardedHost ? normalizeOrigin(`${forwardedProto}://${forwardedHost}`) : null;
  if (forwardedOrigin) return forwardedOrigin;

  return normalizeOrigin(req.url) || "https://plugandoia.cloud";
}

function redirectBack(req: NextRequest, status: string, message?: string) {
  const redirectUrl = new URL("/admin/mercado-livre", publicOriginFromRequest(req));
  redirectUrl.searchParams.set("mlAuth", status);
  if (message) redirectUrl.searchParams.set("message", message.slice(0, 240));

  const res = NextResponse.redirect(redirectUrl);
  res.cookies.delete("ml_oauth_state");
  res.cookies.delete("ml_pkce_verifier");
  res.cookies.delete("ml_oauth_origin");
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
    const savedOrigin = req.cookies.get("ml_oauth_origin")?.value;

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
      redirectUri: mercadoLivreRedirectUri(req, savedOrigin),
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
