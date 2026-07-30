"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  getCommerceAnalyticsIds,
  SALES_PAGE_EVENT_TYPES,
  trackSalesEvent,
} from "@/lib/salesAnalytics";

type CommerceAnalyticsTrackerProps = {
  commerceHostname: string;
};

function normalizedHostname(value: string) {
  return value.trim().toLowerCase().replace(/^www\./, "");
}

function isTrackingAllowed() {
  if (navigator.doNotTrack === "1") return false;
  try {
    return window.localStorage.getItem("commerce_analytics_consent") !== "denied";
  } catch {
    return true;
  }
}

function pageType(pathname: string) {
  if (pathname === "/" || pathname === "/ofertas") return "HOME";
  if (pathname === "/lojas") return "STORES";
  if (/^\/lojas\/[^/]+\/produtos\/[^/]+$/.test(pathname)) return "PRODUCT_ARTICLE";
  if (/^\/lojas\/[^/]+\/[^/]+$/.test(pathname)) return "STORE_ARTICLE";
  if (/^\/lojas\/[^/]+$/.test(pathname)) return "STORE";
  if (pathname === "/produtos") return "PRODUCTS";
  if (/^\/bio\/categoria\/[^/]+$/.test(pathname)) return "BIO_CATEGORY";
  if (/^\/bio\/[^/]+$/.test(pathname)) return "BIO_PRODUCT";
  if (pathname === "/bio") return "BIO";
  if (/^\/comparativo\/[^/]+$/.test(pathname)) return "COMPARISON";
  if (pathname === "/comparativo") return "COMPARISONS";
  return "OTHER";
}

function storeSlugFromPath(pathname: string) {
  return pathname.match(/^\/lojas\/([^/]+)/)?.[1] || null;
}

function sanitizedDestination(url: URL) {
  return `${url.origin}${url.pathname}`;
}

export default function CommerceAnalyticsTracker({ commerceHostname }: CommerceAnalyticsTrackerProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (normalizedHostname(window.location.hostname) !== normalizedHostname(commerceHostname)) return;
    if (!isTrackingAllowed()) return;

    const { sessionId, visitorId } = getCommerceAnalyticsIds();
    if (!sessionId) return;
    const analyticsPath = pathname === "/ofertas" ? "/" : pathname;

    trackSalesEvent({
      pageKey: `commerce:${analyticsPath}`,
      pagePath: analyticsPath,
      pageTitle: document.title,
      eventType: SALES_PAGE_EVENT_TYPES.PAGE_VIEW,
      sessionId,
      visitorId: visitorId || undefined,
      metadata: {
        site: "compra_esperta",
        pageType: pageType(analyticsPath),
        storeSlug: storeSlugFromPath(analyticsPath),
      },
    });
  }, [commerceHostname, pathname]);

  useEffect(() => {
    if (normalizedHostname(window.location.hostname) !== normalizedHostname(commerceHostname)) return;

    const onClick = (event: MouseEvent) => {
      if (!isTrackingAllowed()) return;
      const target = event.target instanceof Element
        ? event.target.closest("a[href], [data-commerce-outbound-url]")
        : null;
      if (!(target instanceof HTMLElement)) return;

      let destination: URL;
      try {
        const targetUrl = target instanceof HTMLAnchorElement
          ? target.href
          : target.dataset.commerceOutboundUrl || "";
        destination = new URL(targetUrl, window.location.href);
      } catch {
        return;
      }

      // O redirecionador registra estes cliques no servidor para não haver duplicidade.
      if (destination.origin === window.location.origin && destination.pathname.startsWith("/go/loja/")) return;
      if (destination.origin === window.location.origin) return;
      if (!["http:", "https:"].includes(destination.protocol)) return;

      const { sessionId, visitorId } = getCommerceAnalyticsIds();
      if (!sessionId) return;
      const analyticsPath = pathname === "/ofertas" ? "/" : pathname;

      trackSalesEvent({
        pageKey: `commerce:${analyticsPath}`,
        pagePath: analyticsPath,
        pageTitle: document.title,
        eventType: SALES_PAGE_EVENT_TYPES.OUTBOUND_CLICK,
        sessionId,
        visitorId: visitorId || undefined,
        checkoutUrl: sanitizedDestination(destination),
        metadata: {
          site: "compra_esperta",
          pageType: pageType(analyticsPath),
          storeSlug: storeSlugFromPath(analyticsPath),
          destinationHost: destination.hostname,
          destinationPath: destination.pathname,
          productSlug: target.dataset.commerceProductSlug || null,
          linkText: (target.textContent || target.getAttribute("aria-label") || "").trim().slice(0, 160),
          rel: target instanceof HTMLAnchorElement ? target.rel || null : null,
        },
      });
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [commerceHostname, pathname]);

  return null;
}
