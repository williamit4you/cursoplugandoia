import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveAffiliateStoreDestination } from "@/lib/affiliateStores";
import { SalesPageEventType } from "@prisma/client";
import { normalizeSalesEventPayload, upsertSalesSessionFromEvent } from "@/lib/salesAnalyticsServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(value: unknown, max: number) {
  return String(value || "").trim().slice(0, max) || null;
}

function referrerPath(req: NextRequest) {
  const fallback = "/";
  try {
    const value = req.headers.get("referer");
    return value ? new URL(value).pathname || fallback : fallback;
  } catch {
    return fallback;
  }
}

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const slug = String(params.slug || "").trim();
  if (!slug) return NextResponse.redirect(new URL("/ofertas", req.url), 302);

  const store = await prisma.affiliateStore.findFirst({
    where: { slug, status: "ACTIVE" },
    select: { id: true, affiliateUrl: true },
  });

  if (!store) {
    return NextResponse.redirect(new URL("/ofertas?aviso=loja-indisponivel", req.url), 302);
  }

  const ip = clean(req.headers.get("x-forwarded-for")?.split(",")[0], 100);
  await prisma.affiliateStoreClick
    .create({
      data: {
        storeId: store.id,
        source: clean(req.nextUrl.searchParams.get("source"), 80),
        medium: clean(req.nextUrl.searchParams.get("medium"), 80),
        campaign: clean(req.nextUrl.searchParams.get("campaign"), 120),
        referrer: clean(req.headers.get("referer"), 240),
        userAgent: clean(req.headers.get("user-agent"), 240),
        ipHash: ip ? crypto.createHash("sha256").update(ip).digest("hex") : null,
      },
    })
    .catch((error) => console.error("[AFFILIATE_STORE_CLICK]", error));

  try {
    const destination = clean(req.nextUrl.searchParams.get("destination"), 2_000);
    const resolvedDestination = resolveAffiliateStoreDestination(store.affiliateUrl, destination);
    const pagePath = referrerPath(req);
    const payload = normalizeSalesEventPayload(req, {
      pageKey: `commerce:${pagePath}`,
      pagePath,
      eventType: SalesPageEventType.OUTBOUND_CLICK,
      sessionId: req.cookies.get("commerce_session_id")?.value || `server_click_${crypto.randomUUID()}`,
      visitorId: req.cookies.get("commerce_visitor_id")?.value || null,
      source: "compra_esperta",
      checkoutUrl: `${resolvedDestination.origin}${resolvedDestination.pathname}`,
      utmSource: req.nextUrl.searchParams.get("source"),
      utmMedium: req.nextUrl.searchParams.get("medium"),
      utmCampaign: req.nextUrl.searchParams.get("campaign"),
      metadata: {
        site: "compra_esperta",
        storeSlug: slug,
        destinationHost: resolvedDestination.hostname,
        destinationPath: resolvedDestination.pathname,
      },
    });
    const event = await prisma.salesPageEvent.create({ data: payload as any }).catch((error) => {
      console.error("[COMMERCE_OUTBOUND_CLICK]", error);
      return null;
    });
    if (event) {
      await upsertSalesSessionFromEvent({
        pageKey: payload.pageKey,
        pagePath: payload.pagePath,
        sessionId: payload.sessionId!,
        referrer: payload.referrer,
        utmSource: payload.utmSource,
        utmMedium: payload.utmMedium,
        utmCampaign: payload.utmCampaign,
        utmTerm: payload.utmTerm,
        utmContent: payload.utmContent,
        fbclid: payload.fbclid,
        deviceType: payload.deviceType,
        userAgent: payload.userAgent,
        visitorId: payload.visitorId,
        eventType: payload.eventType,
        value: payload.value,
      }).catch((error) => console.error("[COMMERCE_OUTBOUND_SESSION]", error));
    }
    return NextResponse.redirect(resolvedDestination, 302);
  } catch {
    return NextResponse.redirect(new URL("/ofertas?aviso=link-indisponivel", req.url), 302);
  }
}
