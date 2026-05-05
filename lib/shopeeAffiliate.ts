export type ShopeeAffiliateConfigLike = {
  id?: string;
  site?: string | null; // br, mx, co, cl...
  domain?: string | null; // shopee.com.br, shopee.com.mx...
  searchTerms?: string | null; // JSON string array or delimited
  minPrice?: number | null;
  maxPrice?: number | null;
  maxProductsPerRun?: number | null;
  appId?: string | null;
  clientSecret?: string | null;
};

export type ShopeeProduct = {
  id: string; // `${shopid}-${itemid}`
  title: string;
  price: number | null;
  currencyId: string | null;
  permalink: string;
  thumbnailUrl: string | null;
  shopId: number | null;
  itemId: number | null;
  soldQuantity: number | null;
  ratingStar: number | null;
  reviewCount: number | null;
  description: string | null;
  imageUrls: string[];
};

export const DEFAULT_SHOPEE_SEARCH_TERMS = ["ofertas"];

export function shuffleShopeeList<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

export function parseJsonStringArray(value: unknown, fallback: string[] = []) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }
  } catch {
    return value
      .split(/[,;\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return fallback;
}

function normalizeDomain(domain: string | null | undefined) {
  const cleaned = String(domain || "").trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  return cleaned || "shopee.com.br";
}

function buildImageUrl(site: string, imageId: string) {
  const normalizedSite = String(site || "br").toLowerCase();
  const host = normalizedSite === "br" ? "down-br.img.susercontent.com" : `down-${normalizedSite}.img.susercontent.com`;
  return `https://${host}/file/${encodeURIComponent(imageId)}`;
}

function normalizeText(value: unknown, max = 180) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function priceFromRaw(raw: any): number | null {
  // Shopee often returns price in 1e5 units (e.g. 1234500000). We normalize heuristically.
  const candidates = [raw?.price, raw?.price_min, raw?.price_max, raw?.price_before_discount];
  for (const value of candidates) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) continue;
    // Most common: price is integer in 1e5 units.
    const normalized = n / 100000;
    if (normalized > 0 && normalized < 1_000_000) return Math.round(normalized * 100) / 100;
    // fallback: cents
    const cents = n / 100;
    if (cents > 0 && cents < 1_000_000) return Math.round(cents * 100) / 100;
  }
  return null;
}

function normalizeShopeeProductFromSearch(params: {
  site: string;
  domain: string;
  raw: any;
}): ShopeeProduct | null {
  const itemBasic = params.raw?.item_basic || params.raw;
  const shopId = Number(itemBasic?.shopid);
  const itemId = Number(itemBasic?.itemid);
  if (!Number.isFinite(shopId) || !Number.isFinite(itemId)) return null;

  const title = normalizeText(itemBasic?.name || itemBasic?.title, 200);
  if (!title) return null;

  const id = `${shopId}-${itemId}`;
  const permalink = `https://${params.domain}/product/${shopId}/${itemId}`;
  const imageId = String(itemBasic?.image || "").trim();
  const images: string[] = [];
  if (imageId) images.push(buildImageUrl(params.site, imageId));

  const soldQuantity = Number.isFinite(Number(itemBasic?.historical_sold)) ? Number(itemBasic.historical_sold) : null;
  const ratingStar = Number.isFinite(Number(itemBasic?.item_rating?.rating_star))
    ? Number(itemBasic.item_rating.rating_star)
    : null;
  const reviewCount = Number.isFinite(Number(itemBasic?.item_rating?.rating_count?.[0]))
    ? Number(itemBasic.item_rating.rating_count[0])
    : null;

  return {
    id,
    title,
    price: priceFromRaw(itemBasic),
    currencyId: "BRL",
    permalink,
    thumbnailUrl: images[0] || null,
    shopId,
    itemId,
    soldQuantity,
    ratingStar,
    reviewCount,
    description: null,
    imageUrls: images,
  };
}

export async function fetchShopeeItemDetail(params: {
  site: string;
  domain: string;
  shopId: number;
  itemId: number;
  requestTimeoutMs?: number;
}): Promise<Pick<ShopeeProduct, "description" | "imageUrls">> {
  const requestTimeoutMs = Math.min(20000, Math.max(3000, Number(params.requestTimeoutMs || 8000)));
  const url = new URL(`https://${params.domain}/api/v4/item/get`);
  url.searchParams.set("shopid", String(params.shopId));
  url.searchParams.set("itemid", String(params.itemId));

  const res = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "PlugandoIA/1.0 (+https://plugandoia.cloud)",
      referer: `https://${params.domain}/product/${params.shopId}/${params.itemId}`,
      "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(requestTimeoutMs),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Shopee item detail failed. HTTP ${res.status} ${data?.error_msg || ""}`.trim());
  }

  const item = data?.data?.item || data?.data || {};
  const description = normalizeText(item?.description, 4000) || null;
  const images: string[] = [];
  const imageIds = Array.isArray(item?.images) ? item.images : [];
  for (const imageId of imageIds) {
    const id = String(imageId || "").trim();
    if (!id) continue;
    images.push(buildImageUrl(params.site, id));
    if (images.length >= 8) break;
  }
  return { description, imageUrls: images };
}

export async function searchShopeeProducts(
  config: ShopeeAffiliateConfigLike,
  options: {
    limit?: number;
    queryOverride?: string | null;
    randomize?: boolean;
    requestTimeoutMs?: number;
    enrichDetails?: boolean;
  } = {}
): Promise<ShopeeProduct[]> {
  const site = String(config.site || "br").trim().toLowerCase() || "br";
  const domain = normalizeDomain(config.domain || "shopee.com.br");
  const limit = Math.min(50, Math.max(1, Number(options.limit || config.maxProductsPerRun || 8)));
  const terms = options.queryOverride
    ? [options.queryOverride]
    : parseJsonStringArray(config.searchTerms, DEFAULT_SHOPEE_SEARCH_TERMS);
  const term = (terms.length > 0 ? terms : DEFAULT_SHOPEE_SEARCH_TERMS)[0] || "ofertas";

  const url = new URL(`https://${domain}/api/v4/search/search_items`);
  url.searchParams.set("by", "relevancy");
  url.searchParams.set("keyword", term);
  url.searchParams.set("limit", String(Math.min(60, Math.max(limit * 3, 24))));
  url.searchParams.set("newest", "0");
  url.searchParams.set("order", "desc");
  url.searchParams.set("page_type", "search");
  url.searchParams.set("scenario", "PAGE_GLOBAL_SEARCH");
  url.searchParams.set("version", "2");

  const requestTimeoutMs = Math.min(20000, Math.max(3000, Number(options.requestTimeoutMs || 8000)));

  const res = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "PlugandoIA/1.0 (+https://plugandoia.cloud)",
      referer: `https://${domain}/search?keyword=${encodeURIComponent(term)}`,
      "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(requestTimeoutMs),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Shopee search failed. HTTP ${res.status} ${data?.error_msg || ""}`.trim());
  }

  const items = Array.isArray(data?.items) ? data.items : Array.isArray(data?.data?.items) ? data.data.items : [];
  const normalized: ShopeeProduct[] = [];
  const seen = new Set<string>();

  for (const raw of items) {
    const product = normalizeShopeeProductFromSearch({ site, domain, raw });
    if (!product || seen.has(product.id)) continue;
    if (config.minPrice != null && product.price != null && product.price < Number(config.minPrice)) continue;
    if (config.maxPrice != null && product.price != null && product.price > Number(config.maxPrice)) continue;
    seen.add(product.id);
    normalized.push(product);
    if (normalized.length >= limit) break;
  }

  const ordered = options.randomize ? shuffleShopeeList(normalized) : normalized;
  const final = ordered.slice(0, limit);

  if (!options.enrichDetails) return final;

  const enriched: ShopeeProduct[] = [];
  for (const product of final) {
    if (!product.shopId || !product.itemId) {
      enriched.push(product);
      continue;
    }
    try {
      const detail = await fetchShopeeItemDetail({
        site,
        domain,
        shopId: product.shopId,
        itemId: product.itemId,
        requestTimeoutMs,
      });
      enriched.push({
        ...product,
        description: detail.description ?? product.description,
        imageUrls: detail.imageUrls.length > 0 ? detail.imageUrls : product.imageUrls,
        thumbnailUrl: detail.imageUrls[0] || product.thumbnailUrl,
      });
    } catch {
      enriched.push(product);
    }
  }

  return enriched;
}

