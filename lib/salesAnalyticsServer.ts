import crypto from "crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { SalesPageDeviceType, SalesPageEventType } from "@prisma/client";

const DEFAULT_PAGE_KEY = "curso-fundamentos-ia";

function trimString(value: unknown, maxLength = 255) {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized.slice(0, maxLength) : null;
}

function numberOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDateParam(value: string | null, boundary: "start" | "end") {
  if (!value) {
    return null;
  }

  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  if (!isDateOnly) {
    return new Date(value);
  }

  const suffix = boundary === "start" ? "T00:00:00.000" : "T23:59:59.999";
  return new Date(`${value}${suffix}`);
}

export function getRangeFromRequest(req: NextRequest) {
  const fromParam = trimString(req.nextUrl.searchParams.get("from"), 64);
  const toParam = trimString(req.nextUrl.searchParams.get("to"), 64);
  const now = new Date();

  const fallbackFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const from = parseDateParam(fromParam, "start") ?? fallbackFrom;
  const to = parseDateParam(toParam, "end") ?? now;

  return {
    from: Number.isNaN(from.getTime()) ? fallbackFrom : from,
    to: Number.isNaN(to.getTime()) ? now : to,
  };
}

export function getPageKeyFromRequest(req: NextRequest) {
  return trimString(req.nextUrl.searchParams.get("pageKey"), 120) || DEFAULT_PAGE_KEY;
}

export function getClientIp(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for") || "";
  const first = forwarded.split(",")[0]?.trim();
  return first || null;
}

export function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function detectBrowser(userAgent: string | null) {
  const ua = (userAgent || "").toLowerCase();

  if (ua.includes("edg")) return "Edge";
  if (ua.includes("opr") || ua.includes("opera")) return "Opera";
  if (ua.includes("chrome")) return "Chrome";
  if (ua.includes("firefox")) return "Firefox";
  if (ua.includes("safari")) return "Safari";
  if (ua.includes("trident") || ua.includes("msie")) return "Internet Explorer";

  return null;
}

export function detectOs(userAgent: string | null) {
  const ua = (userAgent || "").toLowerCase();

  if (ua.includes("windows")) return "Windows";
  if (ua.includes("mac os")) return "macOS";
  if (ua.includes("android")) return "Android";
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ios")) return "iOS";
  if (ua.includes("linux")) return "Linux";

  return null;
}

export function detectDeviceType(userAgent: string | null): SalesPageDeviceType {
  const ua = (userAgent || "").toLowerCase();

  if (!ua) return SalesPageDeviceType.UNKNOWN;
  if (ua.includes("bot") || ua.includes("crawler") || ua.includes("spider")) return SalesPageDeviceType.BOT;
  if (ua.includes("ipad") || ua.includes("tablet")) return SalesPageDeviceType.TABLET;
  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) return SalesPageDeviceType.MOBILE;

  return SalesPageDeviceType.DESKTOP;
}

export function normalizeSalesEventPayload(req: NextRequest, body: any) {
  const userAgent = trimString(body?.userAgent || req.headers.get("user-agent"), 500);
  const ip = getClientIp(req);

  return {
    pageKey: trimString(body?.pageKey, 120) || DEFAULT_PAGE_KEY,
    pagePath: trimString(body?.pagePath, 255) || "/curso-fundamentos-ia",
    pageTitle: trimString(body?.pageTitle, 255),
    eventType: trimString(body?.eventType, 80) as SalesPageEventType,
    sessionId: trimString(body?.sessionId, 120),
    visitorId: trimString(body?.visitorId, 120),
    source: trimString(body?.source, 80) || "site",
    referrer: trimString(body?.referrer, 500),
    userAgent,
    ipHash: ip ? sha256(ip) : null,
    deviceType: detectDeviceType(userAgent),
    browser: detectBrowser(userAgent),
    os: detectOs(userAgent),
    utmSource: trimString(body?.utmSource, 255),
    utmMedium: trimString(body?.utmMedium, 255),
    utmCampaign: trimString(body?.utmCampaign, 255),
    utmTerm: trimString(body?.utmTerm, 255),
    utmContent: trimString(body?.utmContent, 255),
    fbclid: trimString(body?.fbclid, 255),
    metaEventName: trimString(body?.metaEventName, 120),
    checkoutUrl: trimString(body?.checkoutUrl, 1000),
    currency: trimString(body?.currency, 16),
    value: numberOrNull(body?.value),
    orderId: trimString(body?.orderId, 120),
    metadataJson: JSON.stringify(body?.metadata || {}),
  };
}

export async function upsertSalesSessionFromEvent(event: {
  pageKey: string;
  pagePath: string;
  sessionId: string;
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
  fbclid: string | null;
  deviceType: SalesPageDeviceType;
  userAgent: string | null;
  visitorId: string | null;
  eventType: SalesPageEventType;
  value: number | null;
}) {
  const incrementData = {
    pageViewCount: event.eventType === SalesPageEventType.PAGE_VIEW ? 1 : 0,
    viewContentCount: event.eventType === SalesPageEventType.VIEW_CONTENT ? 1 : 0,
    initiateCheckoutCount: event.eventType === SalesPageEventType.INITIATE_CHECKOUT ? 1 : 0,
    leadCount: event.eventType === SalesPageEventType.LEAD ? 1 : 0,
    purchaseCount: event.eventType === SalesPageEventType.PURCHASE ? 1 : 0,
    revenueTotal: event.eventType === SalesPageEventType.PURCHASE && event.value ? event.value : 0,
  };

  await prisma.salesPageSession.upsert({
    where: { sessionId: event.sessionId },
    create: {
      sessionId: event.sessionId,
      pageKey: event.pageKey,
      landingPath: event.pagePath,
      firstReferrer: event.referrer,
      firstUtmSource: event.utmSource,
      firstUtmMedium: event.utmMedium,
      firstUtmCampaign: event.utmCampaign,
      firstUtmTerm: event.utmTerm,
      firstUtmContent: event.utmContent,
      firstFbclid: event.fbclid,
      firstDeviceType: event.deviceType,
      firstUserAgent: event.userAgent,
      visitorId: event.visitorId,
      lastSeenAt: new Date(),
      ...incrementData,
    },
    update: {
      lastSeenAt: new Date(),
      visitorId: event.visitorId || undefined,
      pageViewCount: { increment: incrementData.pageViewCount },
      viewContentCount: { increment: incrementData.viewContentCount },
      initiateCheckoutCount: { increment: incrementData.initiateCheckoutCount },
      leadCount: { increment: incrementData.leadCount },
      purchaseCount: { increment: incrementData.purchaseCount },
      revenueTotal: { increment: incrementData.revenueTotal },
    },
  });
}
