import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  getCommerceSiteUrl,
  getPortalSiteUrl,
  hostnameFromSiteUrl,
  isCommerceHostname,
  normalizeHostname,
} from "@/lib/siteUrls";

const COMMERCE_PREFIXES = ["/ofertas", "/lojas", "/produtos", "/bio", "/comparativo", "/go/loja"];

function isCommercePath(pathname: string) {
  return COMMERCE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function redirectKeepingRequest(req: NextRequest, origin: string, pathname = req.nextUrl.pathname) {
  const destination = new URL(`${pathname}${req.nextUrl.search}`, origin);
  return NextResponse.redirect(destination, 308);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const requestHost = normalizeHostname(req.headers.get("x-forwarded-host") || req.headers.get("host"));
  const commerceSiteUrl = getCommerceSiteUrl();
  const portalSiteUrl = getPortalSiteUrl();
  const commerceHost = hostnameFromSiteUrl(commerceSiteUrl);
  const commerceRequest = isCommerceHostname(requestHost);

  if (requestHost === `www.${commerceHost}`) {
    return redirectKeepingRequest(req, commerceSiteUrl);
  }

  if (commerceRequest) {
    if (pathname === "/") {
      const storefront = req.nextUrl.clone();
      storefront.pathname = "/ofertas";
      return NextResponse.rewrite(storefront);
    }

    if (pathname === "/ofertas") {
      return redirectKeepingRequest(req, commerceSiteUrl, "/");
    }

    if (pathname === "/api/bio/click" || pathname === "/api/sales/events") {
      return NextResponse.next();
    }

    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (isCommercePath(pathname)) {
      return NextResponse.next();
    }

    return redirectKeepingRequest(req, portalSiteUrl);
  }

  if (isCommercePath(pathname)) {
    const commercePath = pathname === "/ofertas" ? "/" : pathname;
    return redirectKeepingRequest(req, commerceSiteUrl, commercePath);
  }

  const isAdminArea = pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");
  const isCrmArea = pathname.startsWith("/crm") && !pathname.startsWith("/crm/login");
  const isLimpezaVideoArea = pathname.startsWith("/limpezavideo") && !pathname.startsWith("/limpezavideo/login");

  if (!isAdminArea && !isCrmArea && !isLimpezaVideoArea) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (token) {
    return NextResponse.next();
  }

  const loginPath = isCrmArea ? "/crm/login" : isLimpezaVideoArea ? "/limpezavideo/login" : "/admin/login";
  const url = new URL(loginPath, req.url);
  url.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.[a-zA-Z0-9]+$).*)"],
};
