"use client";
import { useEffect } from "react";

export function TechnicalContentTracker({ page, postId }: { page: "hub" | "article"; postId?: string }) {
  useEffect(() => {
    const key = "plugando_technical_session";
    let sessionId = localStorage.getItem(key);
    if (!sessionId) { sessionId = crypto.randomUUID(); localStorage.setItem(key, sessionId); }
    const query = new URLSearchParams(window.location.search);
    fetch("/api/technical-content/analytics", { method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true, body: JSON.stringify({ page, postId, sessionId, utmSource: query.get("utm_source"), utmMedium: query.get("utm_medium"), utmCampaign: query.get("utm_campaign") }) }).catch(() => null);
  }, [page, postId]);
  return null;
}
