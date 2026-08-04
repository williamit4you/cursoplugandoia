"use client";

import { useEffect, useRef } from "react";

const SESSION_STORAGE_KEY = "portal_news_session_id";
const VISITOR_STORAGE_KEY = "portal_news_visitor_id";

function randomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function ensureStorageId(key: string) {
  if (typeof window === "undefined") return null;
  try {
    const current = window.localStorage.getItem(key);
    if (current) return current;
    const next = randomId();
    window.localStorage.setItem(key, next);
    return next;
  } catch {
    return null;
  }
}

function detectDevice() {
  if (typeof window === "undefined") return "UNKNOWN";
  const width = window.innerWidth || 0;
  if (width <= 768) return "MOBILE";
  if (width <= 1024) return "TABLET";
  return "DESKTOP";
}

function detectBrowser() {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/edg/i.test(ua)) return "Edge";
  if (/opr\//i.test(ua) || /opera/i.test(ua)) return "Opera";
  if (/chrome/i.test(ua) && !/edg/i.test(ua)) return "Chrome";
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return "Safari";
  if (/firefox/i.test(ua)) return "Firefox";
  return "Other";
}

function campaignData() {
  if (typeof window === "undefined") return { source: null, medium: null, campaign: null };
  const params = new URLSearchParams(window.location.search);
  return {
    source: params.get("utm_source"),
    medium: params.get("utm_medium"),
    campaign: params.get("utm_campaign"),
  };
}

async function sendJson(url: string, method: "POST" | "PUT", payload: unknown) {
  try {
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {}
}

export default function ClientPostTracker({ postId }: { postId: string }) {
  const trackedView = useRef(false);
  const trackedRead = useRef(false);

  useEffect(() => {
    const sessionId = ensureStorageId(SESSION_STORAGE_KEY);
    const visitorId = ensureStorageId(VISITOR_STORAGE_KEY);
    const campaign = campaignData();
    const metadata = {
      device: detectDevice(),
      browser: detectBrowser(),
      visitorId,
      pathname: window.location.pathname,
      scrollDepth: 0,
    };

    if (!trackedView.current) {
      trackedView.current = true;
      void sendJson(`/api/posts/${postId}/views`, "PUT", {
        sessionId,
        source: campaign.source,
        medium: campaign.medium,
        campaign: campaign.campaign,
        metadata,
      });
    }

    let maxScroll = 0;
    let stayedLongEnough = false;

    const maybeTrackRead = () => {
      if (trackedRead.current) return;
      if (!stayedLongEnough || maxScroll < 55) return;
      trackedRead.current = true;
      void sendJson(`/api/metrics/event`, "POST", {
        eventType: "article_engaged",
        postId,
        sessionId,
        source: campaign.source,
        medium: campaign.medium,
        campaign: campaign.campaign,
        metadata: {
          ...metadata,
          scrollDepth: maxScroll,
        },
      });
    };

    const onScroll = () => {
      const doc = document.documentElement;
      const total = Math.max(1, doc.scrollHeight - window.innerHeight);
      const current = Math.min(100, Math.round((window.scrollY / total) * 100));
      if (current > maxScroll) maxScroll = current;
      maybeTrackRead();
    };

    const timer = window.setTimeout(() => {
      stayedLongEnough = true;
      maybeTrackRead();
    }, 25000);

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [postId]);

  return null;
}
