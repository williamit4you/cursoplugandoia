import { getStoreNameFromHost } from "@/lib/comparisons/constants";
import { safeJsonParse, stripHtml, trimText } from "@/lib/comparisons/utils";

type ScrapedComparisonProduct = {
  canonicalUrl: string | null;
  storeName: string;
  productTitle: string | null;
  brand: string | null;
  priceText: string | null;
  priceValue: number | null;
  currency: string | null;
  imageUrl: string | null;
  ratingText: string | null;
  reviewCountText: string | null;
  shortDescription: string | null;
  bulletPoints: string[];
  specs: Record<string, string>;
  pros: string[];
  cons: string[];
  rawPayload: Record<string, any>;
  normalizedPayload: Record<string, any>;
};

function deriveTitleFromUrl(url: string) {
  try {
    const pathname = new URL(url).pathname;
    const slug = pathname.split("/").filter(Boolean).pop() || "";
    const cleaned = slug.replace(/-i\.\d+\.\d+.*$/i, "").replace(/[-_]+/g, " ").trim();
    if (!cleaned) return "Produto Shopee";
    return cleaned
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  } catch {
    return "Produto Shopee";
  }
}

function isSuspiciousShopeeTitle(value: unknown) {
  const text = String(value || "").trim();
  if (!text) return true;
  if (text.toLowerCase() === "shopee__domain") return true;
  if (/^\d[\d\s\-_.]{5,}$/i.test(text)) return true;
  if (text.length < 6) return true;
  return false;
}

function isShopeeDomain(hostname: string) {
  const host = hostname.toLowerCase();
  return host.includes("shopee.");
}

async function scrapeShopeeViaRenderService(sourceUrl: string): Promise<ScrapedComparisonProduct> {
  const renderServiceUrl = String(process.env.VIDEO_RENDER_SERVICE_URL || "http://127.0.0.1:3010")
    .trim()
    .replace(/\/+$/, "");

  const res = await fetch(`${renderServiceUrl}/shopee/scrape`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url: sourceUrl }),
    signal: AbortSignal.timeout(180000),
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || `Shopee render-service HTTP ${res.status}`);
  }

  const imageUrl = Array.isArray(data?.linksMedia)
    ? String(data.linksMedia.find((item: any) => item?.tipo === "IMAGE")?.url || "").trim() || null
    : null;

  const description = trimText(String(data?.descricao || data?.detalhes || "").replace(/\s+/g, " ").trim(), 320) || null;
  const resolvedTitle = isSuspiciousShopeeTitle(data?.titulo)
    ? deriveTitleFromUrl(sourceUrl)
    : trimText(String(data?.titulo || "").replace(/\s+/g, " ").trim(), 160) || deriveTitleFromUrl(sourceUrl);

  const normalizedPayload = {
    productTitle: resolvedTitle,
    brand: null,
    storeName: "Shopee",
    priceText: null,
    priceValue: null,
    currency: "BRL",
    imageUrl,
    ratingText: null,
    reviewCountText: null,
    shortDescription: description,
    bulletPoints: [],
    specs: data?.detalhes ? { detalhes: trimText(String(data.detalhes), 300) } : {},
    pros: data?.descricao ? [trimText(String(data.descricao), 120)] : [],
    cons: [],
  };

  if (!normalizedPayload.productTitle) {
    throw new Error("Shopee nao retornou titulo suficiente para o comparativo.");
  }

  return {
    canonicalUrl: sourceUrl,
    storeName: "Shopee",
    productTitle: normalizedPayload.productTitle,
    brand: null,
    priceText: null,
    priceValue: null,
    currency: "BRL",
    imageUrl,
    ratingText: null,
    reviewCountText: null,
    shortDescription: description,
    bulletPoints: [],
    specs: normalizedPayload.specs,
    pros: normalizedPayload.pros,
    cons: [],
    rawPayload: data || {},
    normalizedPayload,
  };
}

function extractMeta(html: string, key: string, attr: "name" | "property" | "itemprop" = "property") {
  const regex = new RegExp(
    `<meta[^>]+${attr}=["']${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "i"
  );
  return regex.exec(html)?.[1]?.trim() || null;
}

function extractTitle(html: string) {
  return html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim() || null;
}

function extractCanonical(html: string) {
  return html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1]?.trim() || null;
}

function extractJsonLdBlocks(html: string) {
  const matches = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  return matches
    .map((block) => {
      const content = block.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "").trim();
      return safeJsonParse<any>(content, null);
    })
    .filter(Boolean);
}

function flattenJsonLd(input: any): any[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.flatMap(flattenJsonLd);
  if (typeof input !== "object") return [];
  const graph = Array.isArray(input["@graph"]) ? input["@graph"] : [];
  return [input, ...graph.flatMap(flattenJsonLd)];
}

function findProductJsonLd(blocks: any[]) {
  const nodes = blocks.flatMap(flattenJsonLd);
  for (const node of nodes) {
    const type = Array.isArray(node?.["@type"]) ? node["@type"].join(",") : String(node?.["@type"] || "");
    if (/Product/i.test(type)) return node;
  }
  return null;
}

function parsePriceValue(value: string | number | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = String(value || "").replace(/[^\d,.-]/g, "").trim();
  if (!text) return null;
  const normalized = text.includes(",") && text.includes(".")
    ? text.replace(/\./g, "").replace(",", ".")
    : text.replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function inferBulletsFromHtml(html: string) {
  const matches = Array.from(html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi))
    .map((match) => stripHtml(match[1]))
    .filter((item) => item.length >= 12 && item.length <= 180);
  return Array.from(new Set(matches)).slice(0, 8);
}

function inferSpecsFromHtml(html: string) {
  const specs: Record<string, string> = {};
  const rowMatches = Array.from(html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)).slice(0, 20);
  for (const row of rowMatches) {
    const cells = Array.from(row[1].matchAll(/<(th|td)[^>]*>([\s\S]*?)<\/(th|td)>/gi))
      .map((cell) => stripHtml(cell[2]))
      .filter(Boolean);
    if (cells.length >= 2) {
      const key = trimText(cells[0], 60);
      const value = trimText(cells[1], 100);
      if (key && value && !specs[key]) specs[key] = value;
    }
  }
  return specs;
}

function inferBrand(title: string | null, productJsonLd: any) {
  const brand = productJsonLd?.brand?.name || productJsonLd?.brand || null;
  if (brand) return trimText(String(brand), 80);
  if (!title) return null;
  const firstToken = title.split(" ").filter(Boolean)[0];
  return firstToken && firstToken.length >= 3 ? firstToken : null;
}

function inferProsCons(data: {
  bulletPoints: string[];
  specs: Record<string, string>;
  priceText: string | null;
  ratingText: string | null;
  reviewCountText: string | null;
}) {
  const pros = data.bulletPoints.slice(0, 4);
  const cons: string[] = [];
  if (!data.priceText) cons.push("Preco nao encontrado claramente na pagina.");
  if (Object.keys(data.specs).length === 0) cons.push("Especificacoes tecnicas pouco detalhadas na pagina.");
  if (!data.ratingText && !data.reviewCountText) cons.push("A pagina nao deixa avaliacao de usuarios clara.");
  return { pros, cons: cons.slice(0, 3) };
}

export async function scrapeComparisonProduct(sourceUrl: string, timeoutMs = 30000): Promise<ScrapedComparisonProduct> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    try {
      const sourceHost = new URL(sourceUrl).hostname;
      if (isShopeeDomain(sourceHost)) {
        return await scrapeShopeeViaRenderService(sourceUrl);
      }
    } catch {
      // fall through to generic scraping
    }

    const res = await fetch(sourceUrl, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36",
        "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Scraping HTTP ${res.status}`);
    }

    const finalUrl = res.url || sourceUrl;
    const html = await res.text();
    const url = new URL(finalUrl);
    const storeName = getStoreNameFromHost(url.hostname);
    const canonicalUrl = extractCanonical(html) || finalUrl;
    const metaTitle = extractMeta(html, "og:title") || extractTitle(html);
    const metaDescription = extractMeta(html, "og:description") || extractMeta(html, "description", "name");
    const imageUrl = extractMeta(html, "og:image");
    const priceText =
      extractMeta(html, "product:price:amount") ||
      extractMeta(html, "og:price:amount") ||
      extractMeta(html, "price", "itemprop");
    const currency =
      extractMeta(html, "product:price:currency") ||
      extractMeta(html, "og:price:currency") ||
      "BRL";

    const jsonLdBlocks = extractJsonLdBlocks(html);
    const productJsonLd = findProductJsonLd(jsonLdBlocks);
    const offers = Array.isArray(productJsonLd?.offers) ? productJsonLd.offers[0] : productJsonLd?.offers;
    const aggregateRating = productJsonLd?.aggregateRating || null;
    const ratingText = aggregateRating?.ratingValue ? String(aggregateRating.ratingValue) : null;
    const reviewCountText = aggregateRating?.reviewCount ? String(aggregateRating.reviewCount) : null;
    const bulletPoints = inferBulletsFromHtml(html);
    const specs = inferSpecsFromHtml(html);
    const productTitle = trimText(
      String(productJsonLd?.name || metaTitle || "").replace(/\s+/g, " ").trim(),
      160
    ) || null;
    const brand = inferBrand(productTitle, productJsonLd);
    const normalizedPriceText = String(offers?.price || priceText || "").trim() || null;
    const shortDescription = trimText(
      String(productJsonLd?.description || metaDescription || "").replace(/\s+/g, " ").trim(),
      320
    ) || null;

    const inferred = inferProsCons({
      bulletPoints,
      specs,
      priceText: normalizedPriceText,
      ratingText,
      reviewCountText,
    });

    const normalizedPayload = {
      productTitle,
      brand,
      storeName,
      priceText: normalizedPriceText,
      priceValue: parsePriceValue(offers?.price || priceText),
      currency: String(offers?.priceCurrency || currency || "BRL"),
      imageUrl: String(productJsonLd?.image?.[0] || productJsonLd?.image || imageUrl || "").trim() || null,
      ratingText,
      reviewCountText,
      shortDescription,
      bulletPoints,
      specs,
      pros: inferred.pros,
      cons: inferred.cons,
    };

    return {
      canonicalUrl,
      storeName,
      productTitle,
      brand,
      priceText: normalizedPayload.priceText,
      priceValue: normalizedPayload.priceValue,
      currency: normalizedPayload.currency,
      imageUrl: normalizedPayload.imageUrl,
      ratingText,
      reviewCountText,
      shortDescription,
      bulletPoints,
      specs,
      pros: inferred.pros,
      cons: inferred.cons,
      rawPayload: {
        finalUrl,
        metaTitle,
        metaDescription,
        imageUrl,
        priceText,
        currency,
        productJsonLd,
      },
      normalizedPayload,
    };
  } finally {
    clearTimeout(timer);
  }
}
