import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import crypto from "crypto";
import { mercadoLivreAuthHost, mercadoLivreRedirectUri } from "@/lib/mercadoLivreAffiliate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

function base64Url(buffer: Buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function randomBase64Url(bytes = 32) {
  return base64Url(crypto.randomBytes(bytes));
}

function sha256Base64Url(value: string) {
  return base64Url(crypto.createHash("sha256").update(value).digest());
}

export async function GET(req: NextRequest) {
  try {
    const config = await prisma.mercadoLivreAffiliateConfig.findFirst();
    if (!config?.appId || !config?.clientSecret) {
      return NextResponse.json(
        { error: "Configure Client ID e chave secreta do Mercado Livre antes de autenticar." },
        { status: 400 }
      );
    }

    const redirectUri = mercadoLivreRedirectUri(req);
    const state = randomBase64Url(24);
    const codeVerifier = randomBase64Url(48);
    const codeChallenge = sha256Base64Url(codeVerifier);

    const url = new URL("/authorization", mercadoLivreAuthHost(config.siteId));
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", config.appId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("code_challenge", codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");

    const res = NextResponse.redirect(url);
    const secure = redirectUri.startsWith("https://");
    res.cookies.set("ml_oauth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: 10 * 60,
    });
    res.cookies.set("ml_pkce_verifier", codeVerifier, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: 10 * 60,
    });

    return res;
  } catch (error: any) {
    console.error("[api/mercado-livre/auth GET]", error);
    return NextResponse.json(
      { error: error?.message || "Falha ao iniciar autenticacao Mercado Livre." },
      { status: 500 }
    );
  }
}
