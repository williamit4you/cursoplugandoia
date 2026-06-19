export function comparisonSlugify(input: string) {
  return String(input || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 90);
}

export function normalizeTheme(input: string) {
  return String(input || "").replace(/\s+/g, " ").trim();
}

export function currentComparisonYear() {
  return new Date().getFullYear();
}

export function buildComparisonTitle(theme: string, count: number, year?: number | null) {
  const safeTheme = normalizeTheme(theme);
  const safeYear = year || currentComparisonYear();
  return `${count} melhores ${safeTheme} em ${safeYear}`;
}

export function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  try {
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)));
}

export function decodeHtmlEntities(input: string) {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

export function stripHtml(input: string) {
  return decodeHtmlEntities(
    String(input || "")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

export function escapeHtml(input: string) {
  return String(input || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function trimText(input: string, max = 220) {
  const text = String(input || "").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 3)).trim()}...`;
}

export function absoluteUrlFromRequest(host: string | null, proto: string | null, path: string) {
  const safeHost = host || "localhost:3000";
  const protocol = proto || (safeHost.includes("localhost") ? "http" : "https");
  return `${protocol}://${safeHost}${path}`;
}

export function normalizeComparisonProductUrl(input: string) {
  const raw = String(input || "").trim();
  if (!raw) return raw;

  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();

    if (host.includes("shopee.")) {
      const opaanlpMatch = url.pathname.match(/^\/opaanlp\/(\d+)\/(\d+)/i);
      if (opaanlpMatch) {
        return `${url.protocol}//${url.hostname}/product/${opaanlpMatch[1]}/${opaanlpMatch[2]}`;
      }

      const productMatch = url.pathname.match(/^\/product\/(\d+)\/(\d+)/i);
      if (productMatch) {
        return `${url.protocol}//${url.hostname}/product/${productMatch[1]}/${productMatch[2]}`;
      }

      const itemMatch = url.pathname.match(/-i\.(\d+)\.(\d+)/i);
      if (itemMatch) {
        return `${url.protocol}//${url.hostname}/product/${itemMatch[1]}/${itemMatch[2]}`;
      }
    }

    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return raw;
  }
}
