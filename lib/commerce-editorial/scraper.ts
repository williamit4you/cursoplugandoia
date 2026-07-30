import "server-only";

type ProductCandidate = {
  name: string;
  url: string;
  description: string | null;
  imageUrl: string | null;
  price: number | null;
  currency: string;
  brand: string | null;
  evidence: string[];
};

const PRODUCT_PATH = /(produto|product|item|p\/|dp\/|shop|oferta)/i;

function cleanText(value: unknown, max = 5_000) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function safeExternalUrl(value: string, base?: string) {
  const url = new URL(value, base);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Protocolo de URL não permitido");
  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  ) throw new Error("Destino privado não permitido");
  return url;
}

async function download(url: string) {
  const safe = safeExternalUrl(url);
  const response = await fetch(safe, {
    redirect: "follow",
    signal: AbortSignal.timeout(25_000),
    headers: {
      "user-agent": "CompraEspertaEditorialBot/1.0 (+https://compraesperta-promocoes.shop)",
      accept: "text/html,application/xhtml+xml",
    },
  });
  if (!response.ok) throw new Error(`A loja respondeu HTTP ${response.status}`);
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) throw new Error("A URL não retornou uma página HTML");
  return { html: (await response.text()).slice(0, 2_000_000), finalUrl: response.url };
}

function meta(html: string, key: string) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return cleanText(match[1], 1_000);
  }
  return "";
}

function samePagePath(left: string, right: string) {
  try {
    const a = new URL(left);
    const b = new URL(right);
    return a.origin === b.origin && (a.pathname || "/") === (b.pathname || "/");
  } catch {
    return left === right;
  }
}

function looksLikeProductPage(url: string) {
  try {
    const parsed = new URL(url);
    return PRODUCT_PATH.test(parsed.pathname) || /-\d{4,}|\/[a-z0-9-]{20,}/i.test(parsed.pathname);
  } catch {
    return false;
  }
}

function jsonLdObjects(html: string) {
  const values: any[] = [];
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(match[1].trim());
      values.push(parsed);
    } catch {}
  }
  const flat: any[] = [];
  const visit = (value: any) => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) return value.forEach(visit);
    flat.push(value);
    if (Array.isArray(value["@graph"])) value["@graph"].forEach(visit);
    if (Array.isArray(value.itemListElement)) value.itemListElement.forEach((item: any) => visit(item?.item || item));
  };
  values.forEach(visit);
  return flat;
}

function productFromJsonLd(objects: any[], pageUrl: string): ProductCandidate | null {
  const item = objects.find((value) => {
    const types = Array.isArray(value?.["@type"]) ? value["@type"] : [value?.["@type"]];
    return types.some((type: unknown) => String(type).toLowerCase() === "product");
  });
  if (!item?.name) return null;
  const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers || {};
  const rawPrice = offer.price ?? offer.lowPrice ?? item.price;
  const price = Number(String(rawPrice || "").replace(",", "."));
  const brand = typeof item.brand === "object" ? item.brand?.name : item.brand;
  const image = Array.isArray(item.image) ? item.image[0] : item.image;
  return {
    name: cleanText(item.name, 180),
    url: safeExternalUrl(item.url || offer.url || pageUrl, pageUrl).toString(),
    description: cleanText(item.description, 2_000) || null,
    imageUrl: image ? safeExternalUrl(String(image), pageUrl).toString() : null,
    price: Number.isFinite(price) && price > 0 ? price : null,
    currency: cleanText(offer.priceCurrency || "BRL", 8),
    brand: cleanText(brand, 100) || null,
    evidence: ["JSON-LD Product", pageUrl],
  };
}

function candidateLinks(html: string, pageUrl: string) {
  const base = safeExternalUrl(pageUrl);
  const links: Array<{ url: string; label: string; score: number }> = [];
  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    try {
      const url = safeExternalUrl(match[1], pageUrl);
      if (url.hostname.replace(/^www\./, "") !== base.hostname.replace(/^www\./, "")) continue;
      const label = cleanText(match[2], 180);
      if (label.length < 4) continue;
      const score = (PRODUCT_PATH.test(url.pathname) ? 3 : 0) + (/\d/.test(url.pathname) ? 1 : 0) + (label.length > 15 ? 1 : 0);
      if (score >= 3) links.push({ url: url.toString(), label, score });
    } catch {}
  }
  return [...new Map(links.sort((a, b) => b.score - a.score).map((item) => [item.url, item])).values()].slice(0, 30);
}

async function inspectProductPage(url: string, fallbackName?: string) {
  const page = await download(url);
  const objects = jsonLdObjects(page.html);
  const structured = productFromJsonLd(objects, page.finalUrl);
  if (structured) return structured;
  const title = meta(page.html, "og:title") || cleanText(page.html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1], 180) || cleanText(page.html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1], 180) || fallbackName || "";
  const description = meta(page.html, "description") || meta(page.html, "og:description");
  const image = meta(page.html, "og:image");
  const rawPrice = meta(page.html, "product:price:amount");
  const price = Number(String(rawPrice || "").replace(",", "."));
  if (!title) throw new Error("Não foi possível identificar o nome do produto");
  return {
    name: title,
    url: page.finalUrl,
    description: description || null,
    imageUrl: image ? safeExternalUrl(image, page.finalUrl).toString() : null,
    price: Number.isFinite(price) && price > 0 ? price : null,
    currency: meta(page.html, "product:price:currency") || "BRL",
    brand: null,
    evidence: ["metadados HTML", page.finalUrl],
  } satisfies ProductCandidate;
}

export async function discoverStoreProduct(storeUrl: string, excludedUrls: string[] = []) {
  const root = await download(storeUrl);
  const rootProduct = productFromJsonLd(jsonLdObjects(root.html), root.finalUrl);
  if (
    rootProduct &&
    !excludedUrls.includes(rootProduct.url) &&
    (!samePagePath(rootProduct.url, root.finalUrl) || looksLikeProductPage(rootProduct.url))
  ) {
    return rootProduct;
  }

  const excluded = new Set(excludedUrls);
  const candidates = candidateLinks(root.html, root.finalUrl).filter((item) => !excluded.has(item.url));
  const failures: string[] = [];
  for (const candidate of candidates.slice(0, 8)) {
    try {
      const product = await inspectProductPage(candidate.url, candidate.label);
      if (product.description || product.price || product.evidence.includes("JSON-LD Product")) return product;
    } catch (error: any) {
      failures.push(`${candidate.url}: ${error?.message || "falha"}`);
    }
  }
  throw new Error(`Nenhum produto verificável foi encontrado na página da loja.${failures.length ? ` Tentativas: ${failures.slice(0, 3).join(" | ")}` : ""}`);
}

export type { ProductCandidate };
