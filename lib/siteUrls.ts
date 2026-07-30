const DEFAULT_PORTAL_SITE_URL = "https://plugandoia.cloud";
const DEFAULT_COMMERCE_SITE_URL = "https://compraesperta-promocoes.shop";

function normalizeOrigin(value: string | undefined, fallback: string) {
  try {
    const parsed = new URL(String(value || fallback).trim());
    if (!["http:", "https:"].includes(parsed.protocol)) return fallback;
    return parsed.origin;
  } catch {
    return fallback;
  }
}

export function getPortalSiteUrl() {
  return normalizeOrigin(process.env.PORTAL_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL, DEFAULT_PORTAL_SITE_URL);
}

export function getCommerceSiteUrl() {
  return normalizeOrigin(process.env.COMMERCE_SITE_URL, DEFAULT_COMMERCE_SITE_URL);
}

export function normalizeHostname(value: string | null | undefined) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .split(",")[0]
    .split(":")[0]
    .replace(/\.$/, "");
}

export function hostnameFromSiteUrl(value: string) {
  try {
    return normalizeHostname(new URL(value).hostname);
  } catch {
    return "";
  }
}

export function isCommerceHostname(hostname: string | null | undefined) {
  const current = normalizeHostname(hostname);
  const configured = hostnameFromSiteUrl(getCommerceSiteUrl());
  return Boolean(current && configured && (current === configured || current === `www.${configured}`));
}
