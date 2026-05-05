import type { MercadoLivreAffiliateConfigLike, MercadoLivreProduct } from "@/lib/mercadoLivreAffiliate";
import {
  DEFAULT_MERCADO_LIVRE_CATEGORY_IDS,
  DEFAULT_MERCADO_LIVRE_SEARCH_TERMS,
  mercadoLivreCategorySearchTerm,
  parseJsonStringArray,
  shuffleMercadoLivreList,
} from "@/lib/mercadoLivreAffiliate";

type BrowserSearchOptions = {
  limit?: number;
  queryOverride?: string | null;
  categoryOverride?: string | null;
  excludeIds?: string[];
  randomize?: boolean;
};

function dynamicRequire(moduleName: string) {
  // Keep puppeteer-core out of normal Next.js static analysis.
  // eslint-disable-next-line no-eval
  const req = eval("require") as (name: string) => any;
  return req(moduleName);
}

function executableCandidates() {
  return [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.REMOTION_CHROME_BIN,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
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
      // try next candidate
    }
  }
  return null;
}

function normalizeUrl(value: string) {
  try {
    const url = new URL(value);
    url.hash = "";
    return url.toString();
  } catch {
    return value;
  }
}

function normalizeImageUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (!/^https?:$/i.test(url.protocol)) return null;
    if (!/mlstatic\.com|mercadolivre\.com|mercadolibre\.com/i.test(url.hostname)) return null;
    if (/\.svg(\?|$)/i.test(url.pathname)) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function extractIdFromUrl(url: string) {
  const match = url.match(/\bMLB-?(\d{6,})\b/i);
  return match ? `MLB${match[1]}` : `BROWSER-${Buffer.from(url).toString("base64url").slice(0, 24)}`;
}

function buildSearchUrl(siteId: string, query: string, categoryId?: string | null) {
  const categoryTerm = mercadoLivreCategorySearchTerm(categoryId);
  const fullQuery = [categoryTerm, query].filter(Boolean).join(" ").trim() || "ofertas";
  const slug = encodeURIComponent(fullQuery.replace(/\s+/g, "-"));
  if (siteId === "MLA") return `https://lista.mercadolibre.com.ar/${slug}`;
  if (siteId === "MLM") return `https://listado.mercadolibre.com.mx/${slug}`;
  return `https://lista.mercadolivre.com.br/${slug}`;
}

function parsePrice(value: string) {
  const clean = value
    .replace(/[^\d,\.]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  const n = Number(clean);
  return Number.isFinite(n) ? n : null;
}

export async function searchMercadoLivreProductsWithBrowser(
  config: MercadoLivreAffiliateConfigLike,
  options: BrowserSearchOptions = {}
): Promise<MercadoLivreProduct[]> {
  const executablePath = await firstExistingExecutable();
  if (!executablePath) {
    throw new Error("Chrome/Chromium nao encontrado para busca via navegador.");
  }

  const puppeteer = dynamicRequire("puppeteer-core");
  const siteId = String(config.siteId || "MLB").trim() || "MLB";
  const limit = Math.min(24, Math.max(1, Number(options.limit || config.maxProductsPerRun || 8)));
  const terms = options.queryOverride
    ? [options.queryOverride]
    : parseJsonStringArray(config.searchTerms, DEFAULT_MERCADO_LIVRE_SEARCH_TERMS);
  const categories = options.categoryOverride
    ? [options.categoryOverride]
    : parseJsonStringArray(config.categoryIds, DEFAULT_MERCADO_LIVRE_CATEGORY_IDS);
  const excluded = new Set((options.excludeIds || []).map((item) => String(item)));

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

    const products: MercadoLivreProduct[] = [];
    const seen = new Set<string>();
    const searchTargets = [];
    for (const category of categories.length > 0 ? categories : [""]) {
      for (const term of terms.length > 0 ? terms : DEFAULT_MERCADO_LIVRE_SEARCH_TERMS) {
        searchTargets.push({ category, term });
      }
    }

    const targetsToUse = options.randomize ? shuffleMercadoLivreList(searchTargets) : searchTargets;

    for (const target of targetsToUse.slice(0, 10)) {
      const url = buildSearchUrl(siteId, target.term, target.category);
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });

      // Mercado Livre sometimes serves a JS challenge first. Give it a moment to set cookies and redirect.
      await new Promise((resolve) => setTimeout(resolve, 4500));
      try {
        await page.waitForSelector("a[href]", { timeout: 10000 });
      } catch {
        // continue to extraction; the page may still have anchors
      }

      const extracted = await page.evaluate(() => {
        function ownText(node: Element | null) {
          return (node?.textContent || "").replace(/\s+/g, " ").trim();
        }

        function closestCard(anchor: HTMLAnchorElement) {
          return (
            anchor.closest("li") ||
            anchor.closest("article") ||
            anchor.closest("[class*='ui-search']") ||
            anchor.closest("[class*='poly-card']") ||
            anchor.parentElement
          );
        }

        const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"));
        const items: Array<{ title: string; href: string; priceText: string; thumbnailUrl: string | null }> = [];

        for (const anchor of anchors) {
          const href = anchor.href || "";
          if (!href.includes("mercadolivre.com") && !href.includes("mercadolibre.com")) continue;
          if (!/MLB-?\d{6,}|\/p\/MLB|produto\.mercadolivre/i.test(href)) continue;

          const card = closestCard(anchor);
          const titleNode =
            card?.querySelector("[class*='title']") ||
            card?.querySelector("h2") ||
            card?.querySelector("h3") ||
            anchor;
          const priceNode =
            card?.querySelector("[class*='price'] [class*='fraction']") ||
            card?.querySelector("[class*='price']") ||
            card?.querySelector("[aria-label*='reais']");
          const img = card?.querySelector<HTMLImageElement>("img");
          const title = ownText(titleNode || null) || anchor.getAttribute("title") || anchor.getAttribute("aria-label") || "";
          const priceText = ownText(priceNode || null);
          const thumbnailUrl =
            img?.currentSrc ||
            img?.src ||
            img?.getAttribute("data-src") ||
            img?.getAttribute("data-original") ||
            null;

          if (title.length >= 8) {
            items.push({ title, href, priceText, thumbnailUrl });
          }
        }

        return items;
      });

      for (const item of extracted) {
        const permalink = normalizeUrl(item.href);
        const id = extractIdFromUrl(permalink);
        if (seen.has(id) || seen.has(permalink) || excluded.has(id)) continue;
        const price = parsePrice(item.priceText);
        if (config.minPrice != null && price != null && price < Number(config.minPrice)) continue;
        if (config.maxPrice != null && price != null && price > Number(config.maxPrice)) continue;
        seen.add(id);
        seen.add(permalink);

        products.push({
          id,
          title: item.title.slice(0, 180),
          price,
          currencyId: "BRL",
          permalink,
          thumbnailUrl: normalizeImageUrl(item.thumbnailUrl),
          categoryId: target.category || null,
          soldQuantity: null,
          condition: null,
          shippingFree: /frete gratis|frete grátis/i.test(item.title),
        });

        if (products.length >= limit) break;
      }

      if (products.length >= limit) break;
    }

    if (products.length === 0) {
      throw new Error("Busca via navegador nao encontrou produtos. Pode haver challenge, login ou mudanca no HTML do Mercado Livre.");
    }

    return (options.randomize ? shuffleMercadoLivreList(products) : products).slice(0, limit);
  } finally {
    await browser.close();
  }
}

export async function getMercadoLivreProductImageUrlsWithBrowser(productUrl: string, limit = 4): Promise<string[]> {
  const executablePath = await firstExistingExecutable();
  if (!executablePath) return [];

  const puppeteer = dynamicRequire("puppeteer-core");
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

    await page.goto(productUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise((resolve) => setTimeout(resolve, 2500));

    const urls = await page.evaluate(() => {
      const values: string[] = [];
      const push = (value: string | null | undefined) => {
        if (value) values.push(value);
      };

      push(document.querySelector<HTMLMetaElement>("meta[property='og:image']")?.content);
      push(document.querySelector<HTMLMetaElement>("meta[name='twitter:image']")?.content);

      for (const script of Array.from(document.querySelectorAll<HTMLScriptElement>("script[type='application/ld+json']"))) {
        try {
          const parsed = JSON.parse(script.textContent || "{}");
          const image = parsed?.image;
          if (Array.isArray(image)) image.forEach((item) => push(String(item || "")));
          else push(String(image || ""));
        } catch {
          // ignore malformed json-ld
        }
      }

      const selectors = [
        "img.ui-pdp-image",
        "figure img",
        "[class*='gallery'] img",
        "[class*='pdp'] img",
        "img[src*='mlstatic']",
      ];
      for (const img of Array.from(document.querySelectorAll<HTMLImageElement>(selectors.join(",")))) {
        push(img.currentSrc);
        push(img.src);
        push(img.getAttribute("data-src"));
        push(img.getAttribute("data-original"));
        const srcset = img.getAttribute("srcset") || "";
        for (const part of srcset.split(",")) {
          push(part.trim().split(/\s+/)[0]);
        }
      }

      return values;
    });

    const seen = new Set<string>();
    const normalized: string[] = [];
    for (const url of urls) {
      const imageUrl = normalizeImageUrl(url);
      if (!imageUrl || seen.has(imageUrl)) continue;
      seen.add(imageUrl);
      normalized.push(imageUrl);
      if (normalized.length >= limit) break;
    }

    return normalized;
  } catch {
    return [];
  } finally {
    await browser.close();
  }
}
