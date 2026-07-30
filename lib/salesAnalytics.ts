export const SALES_PAGE_EVENT_TYPES = {
  PAGE_VIEW: "PAGE_VIEW",
  VIEW_CONTENT: "VIEW_CONTENT",
  INITIATE_CHECKOUT: "INITIATE_CHECKOUT",
  OUTBOUND_CLICK: "OUTBOUND_CLICK",
  LEAD: "LEAD",
  PURCHASE: "PURCHASE",
} as const;

export type SalesPageEventType = (typeof SALES_PAGE_EVENT_TYPES)[keyof typeof SALES_PAGE_EVENT_TYPES];

export type SalesPageTrackPayload = {
  pageKey: string;
  pagePath: string;
  pageTitle?: string;
  eventType: SalesPageEventType;
  sessionId?: string;
  visitorId?: string;
  checkoutUrl?: string;
  currency?: string;
  value?: number;
  orderId?: string;
  metadata?: Record<string, unknown>;
};

const SESSION_STORAGE_KEY = "sales_page_session_id";
const COMMERCE_SESSION_STORAGE_KEY = "commerce_analytics_session_id";
const COMMERCE_VISITOR_STORAGE_KEY = "commerce_analytics_visitor_id";
const COMMERCE_SESSION_COOKIE = "commerce_session_id";
const COMMERCE_VISITOR_COOKIE = "commerce_visitor_id";

function safeWindow() {
  if (typeof window === "undefined") {
    return null;
  }

  return window;
}

export function getSalesSessionId() {
  const win = safeWindow();
  if (!win) {
    return null;
  }

  try {
    const existing = win.localStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) {
      return existing;
    }

    const created = win.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    win.localStorage.setItem(SESSION_STORAGE_KEY, created);
    return created;
  } catch {
    return null;
  }
}

function randomId(prefix: string) {
  const win = safeWindow();
  const value = win?.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${value}`;
}

function persistCommerceCookie(name: string, value: string) {
  try {
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=15552000; SameSite=Lax; Secure`;
  } catch {
    // O cookie serve apenas como fallback para cliques processados no servidor.
  }
}

export function getCommerceAnalyticsIds() {
  const win = safeWindow();
  if (!win) return { sessionId: null, visitorId: null };

  try {
    let sessionId = win.sessionStorage.getItem(COMMERCE_SESSION_STORAGE_KEY);
    if (!sessionId) {
      sessionId = randomId("cas");
      win.sessionStorage.setItem(COMMERCE_SESSION_STORAGE_KEY, sessionId);
    }

    let visitorId = win.localStorage.getItem(COMMERCE_VISITOR_STORAGE_KEY);
    if (!visitorId) {
      visitorId = randomId("cav");
      win.localStorage.setItem(COMMERCE_VISITOR_STORAGE_KEY, visitorId);
    }

    persistCommerceCookie(COMMERCE_SESSION_COOKIE, sessionId);
    persistCommerceCookie(COMMERCE_VISITOR_COOKIE, visitorId);
    return { sessionId, visitorId };
  } catch {
    return { sessionId: randomId("cas"), visitorId: null };
  }
}

export function inferDeviceType(userAgent?: string | null) {
  const value = (userAgent || "").toLowerCase();

  if (!value) return "UNKNOWN";
  if (value.includes("bot") || value.includes("crawler") || value.includes("spider")) return "BOT";
  if (value.includes("ipad") || value.includes("tablet")) return "TABLET";
  if (
    value.includes("mobile") ||
    value.includes("android") ||
    value.includes("iphone") ||
    value.includes("phone")
  ) {
    return "MOBILE";
  }

  return "DESKTOP";
}

function getContextFromBrowser() {
  const win = safeWindow();
  if (!win) {
    return {};
  }

  const url = new URL(win.location.href);
  const params = url.searchParams;

  return {
    referrer: document.referrer || null,
    userAgent: navigator.userAgent || null,
    deviceType: inferDeviceType(navigator.userAgent),
    utmSource: params.get("utm_source"),
    utmMedium: params.get("utm_medium"),
    utmCampaign: params.get("utm_campaign"),
    utmTerm: params.get("utm_term"),
    utmContent: params.get("utm_content"),
    fbclid: params.get("fbclid"),
  };
}

export async function trackSalesEvent(payload: SalesPageTrackPayload) {
  const win = safeWindow();
  if (!win) {
    return;
  }

  const sessionId = payload.sessionId ?? getSalesSessionId();
  if (!sessionId) {
    return;
  }

  const body = {
    ...payload,
    sessionId,
    ...getContextFromBrowser(),
  };

  try {
    await fetch("/api/sales/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    });
  } catch {
    // Analytics interno nao deve quebrar a UX da landing.
  }
}
