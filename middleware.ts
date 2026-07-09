import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
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
  matcher: ["/admin/:path*", "/crm/:path*", "/limpezavideo/:path*"],
};
