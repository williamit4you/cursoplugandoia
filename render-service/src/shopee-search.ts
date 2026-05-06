type ShopeeSearchRequest = {
  domain?: string | null; // e.g. shopee.com.br
  site?: string | null; // br, mx...
  q?: string | null;
  limit?: number | null;
  enrich?: boolean | null;
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

function normalizeDomain(domain: string | null | undefined) {
  return String(domain || "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "") || "shopee.com.br";
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
  const candidates = [raw?.price, raw?.price_min, raw?.price_max, raw?.price_before_discount];
  for (const value of candidates) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) continue;
    const normalized = n / 100000;
    if (normalized > 0 && normalized < 1_000_000) return Math.round(normalized * 100) / 100;
    const cents = n / 100;
    if (cents > 0 && cents < 1_000_000) return Math.round(cents * 100) / 100;
  }
  return null;
}

function dynamicRequire(moduleName: string) {
  // eslint-disable-next-line no-eval
  const req = eval("require") as (name: string) => any;
  return req(moduleName);
}

function executableCandidates() {
  return [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.REMOTION_CHROME_BIN,
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
  ].filter(Boolean) as string[];
}

async function firstExistingExecutable() {
  const fs = await import("fs/promises");
  for (const candidate of executableCandidates()) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // try next
    }
  }
  return null;
}

function buildApiSearchUrl(domain: string, keyword: string, limit: number) {
  const url = new URL(`https://${domain}/api/v4/search/search_items`);
  url.searchParams.set("by", "relevancy");
  url.searchParams.set("keyword", keyword);
  url.searchParams.set("limit", String(Math.min(60, Math.max(1, limit))));
  url.searchParams.set("newest", "0");
  url.searchParams.set("order", "desc");
  url.searchParams.set("page_type", "search");
  url.searchParams.set("scenario", "PAGE_GLOBAL_SEARCH");
  url.searchParams.set("version", "2");
  return url.toString();
}

function buildApiItemUrl(domain: string, shopId: number, itemId: number) {
  const url = new URL(`https://${domain}/api/v4/item/get`);
  url.searchParams.set("shopid", String(shopId));
  url.searchParams.set("itemid", String(itemId));
  return url.toString();
}

function normalizeProduct(params: {
  site: string;
  domain: string;
  itemBasic: any;
  itemDetail?: any | null;
}): ShopeeProduct | null {
  const shopId = Number(params.itemBasic?.shopid);
  const itemId = Number(params.itemBasic?.itemid);
  if (!Number.isFinite(shopId) || !Number.isFinite(itemId)) return null;

  const title = normalizeText(params.itemBasic?.name || params.itemBasic?.title, 200);
  if (!title) return null;

  const id = `${shopId}-${itemId}`;
  const permalink = `https://${params.domain}/product/${shopId}/${itemId}`;
  const soldQuantity = Number.isFinite(Number(params.itemBasic?.historical_sold))
    ? Number(params.itemBasic.historical_sold)
    : null;
  const ratingStar = Number.isFinite(Number(params.itemBasic?.item_rating?.rating_star))
    ? Number(params.itemBasic.item_rating.rating_star)
    : null;
  const reviewCount = Number.isFinite(Number(params.itemBasic?.item_rating?.rating_count?.[0]))
    ? Number(params.itemBasic.item_rating.rating_count[0])
    : null;

  const imageUrls: string[] = [];
  const primaryImage = String(params.itemBasic?.image || "").trim();
  if (primaryImage) imageUrls.push(buildImageUrl(params.site, primaryImage));

  const detailImages = Array.isArray(params.itemDetail?.images) ? params.itemDetail.images : [];
  for (const imageId of detailImages) {
    const value = String(imageId || "").trim();
    if (!value) continue;
    imageUrls.push(buildImageUrl(params.site, value));
    if (imageUrls.length >= 8) break;
  }

  return {
    id,
    title,
    price: priceFromRaw(params.itemBasic),
    currencyId: "BRL",
    permalink,
    thumbnailUrl: imageUrls[0] || null,
    shopId,
    itemId,
    soldQuantity,
    ratingStar,
    reviewCount,
    description: params.itemDetail?.description ? normalizeText(params.itemDetail.description, 4000) : null,
    imageUrls,
  };
}

export async function shopeeBrowserSearch(body: ShopeeSearchRequest) {
  const executablePath = await firstExistingExecutable();
  if (!executablePath) throw new Error("Chrome/Chromium nao encontrado no render-service.");

  const puppeteer = dynamicRequire("puppeteer-core");
  const domain = normalizeDomain(body.domain);
  const site = String(body.site || "br").trim().toLowerCase() || "br";
  const keyword = String(body.q || "ofertas").trim() || "ofertas";
  const limit = Math.min(24, Math.max(1, Number(body.limit || 8)));
  const enrich = body.enrich !== false;

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1365, height: 900 });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    );
    await page.setExtraHTTPHeaders({
      "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    });

    // Load the search page first to get cookies/session before hitting the API.
    await page.goto(`https://${domain}/search?keyword=${encodeURIComponent(keyword)}`, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await new Promise((r) => setTimeout(r, 1200));

    const search = await page.evaluate(async ({ apiUrl }: { apiUrl: string }) => {
      const res = await fetch(apiUrl, { credentials: "include" });
      const text = await res.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }
      return { ok: res.ok, status: res.status, data };
    }, { apiUrl: buildApiSearchUrl(domain, keyword, Math.min(60, Math.max(24, limit * 3))) });

    if (!search?.ok) {
      throw new Error(`Shopee browser search failed (HTTP ${search?.status || "?"})`);
    }

    const items = Array.isArray(search?.data?.items)
      ? search.data.items
      : Array.isArray(search?.data?.data?.items)
        ? search.data.data.items
        : [];

    const products: ShopeeProduct[] = [];
    const seen = new Set<string>();
    for (const raw of items) {
      const itemBasic = raw?.item_basic || raw;
      const shopId = Number(itemBasic?.shopid);
      const itemId = Number(itemBasic?.itemid);
      if (!Number.isFinite(shopId) || !Number.isFinite(itemId)) continue;
      const key = `${shopId}-${itemId}`;
      if (seen.has(key)) continue;
      seen.add(key);

      let itemDetail: any = null;
      if (enrich) {
        try {
          const detail = await page.evaluate(async ({ itemUrl }: { itemUrl: string }) => {
            const res = await fetch(itemUrl, { credentials: "include" });
            const text = await res.text();
            let data: any = null;
            try {
              data = text ? JSON.parse(text) : {};
            } catch {
              data = {};
            }
            return { ok: res.ok, status: res.status, data };
          }, { itemUrl: buildApiItemUrl(domain, shopId, itemId) });
          if (detail?.ok) itemDetail = detail?.data?.data?.item || detail?.data?.data || null;
        } catch {
          itemDetail = null;
        }
      }

      const product = normalizeProduct({ site, domain, itemBasic, itemDetail });
      if (!product) continue;
      products.push(product);
      if (products.length >= limit) break;
    }

    if (products.length === 0) {
      throw new Error("Shopee browser search returned 0 items.");
    }

    return products;
  } finally {
    await browser.close();
  }
}

