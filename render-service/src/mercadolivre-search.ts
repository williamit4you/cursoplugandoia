export type MercadoLivreSearchRequest = {
  siteId?: string | null;
  searchTerms?: string[] | null;
  categoryIds?: string[] | null;
  minPrice?: number | null;
  maxPrice?: number | null;

  limit?: number | null;
  queryOverride?: string | null;
  categoryOverride?: string | null;
  excludeIds?: string[] | null;
  randomize?: boolean | null;
  maxTargets?: number | null;
  gotoTimeoutMs?: number | null;
  settleDelayMs?: number | null;
  waitForAnchorsTimeoutMs?: number | null;
};

export type MercadoLivreProduct = {
  id: string;
  title: string;
  price: number | null;
  currencyId: string | null;
  permalink: string;
  thumbnailUrl: string | null;
  categoryId: string | null;
  soldQuantity: number | null;
  condition: string | null;
  shippingFree: boolean | null;
};

export type MercadoLivreImagesRequest = {
  url: string;
  limit?: number | null;
};

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
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
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

function shuffleList<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function parseJsonStringArray(value: unknown, fallback: string[] = []) {
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
  const fullQuery = [categoryId ? `cat ${categoryId}` : "", query].filter(Boolean).join(" ").trim() || "ofertas";
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

export async function mercadoLivreBrowserSearch(body: MercadoLivreSearchRequest): Promise<MercadoLivreProduct[]> {
  const executablePath = await firstExistingExecutable();
  if (!executablePath) throw new Error("Chrome/Chromium nao encontrado para busca via navegador.");

  const puppeteer = dynamicRequire("puppeteer-core");
  const siteId = String(body.siteId || "MLB").trim() || "MLB";
  const limit = Math.min(24, Math.max(1, Number(body.limit || 8)));
  const terms = body.queryOverride
    ? [String(body.queryOverride)]
    : parseJsonStringArray(body.searchTerms, ["ofertas"]);
  const categories = body.categoryOverride
    ? [String(body.categoryOverride)]
    : parseJsonStringArray(body.categoryIds, []);
  const excluded = new Set((body.excludeIds || []).map((item) => String(item)));

  const maxTargets = Math.min(10, Math.max(1, Number(body.maxTargets || 10)));
  const gotoTimeoutMs = Math.min(45000, Math.max(5000, Number(body.gotoTimeoutMs || 45000)));
  const settleDelayMs = Math.min(10000, Math.max(0, Number(body.settleDelayMs || 4500)));
  const waitForAnchorsTimeoutMs = Math.min(15000, Math.max(1000, Number(body.waitForAnchorsTimeoutMs || 10000)));

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

    const targets: Array<{ term: string; category: string | null }> = [];
    for (const term of terms) {
      if (categories.length === 0) targets.push({ term, category: null });
      for (const cat of categories) targets.push({ term, category: cat });
    }

    const shuffledTargets = shuffleList(targets).slice(0, maxTargets);
    const products: MercadoLivreProduct[] = [];
    const seen = new Set<string>();

    for (const target of shuffledTargets) {
      await page.goto(buildSearchUrl(siteId, target.term, target.category), {
        waitUntil: "domcontentloaded",
        timeout: gotoTimeoutMs,
      });
      if (settleDelayMs > 0) await new Promise((resolve) => setTimeout(resolve, settleDelayMs));

      try {
        await page.waitForSelector("a[href]", { timeout: waitForAnchorsTimeoutMs });
      } catch {
        // continue even if selector times out
      }

      const extracted = await page.evaluate(`(() => {
        const anchors = Array.from(document.querySelectorAll("a[href]"));
        const items = [];
        const push = (href, title, priceText, thumbnailUrl) => {
          if (!href || !title) return;
          items.push({ href, title, priceText, thumbnailUrl });
        };

        for (const a of anchors) {
          const href = a.href || "";
          if (!href) continue;
          if (!/\\/MLB-?\\d+/i.test(href)) continue;
          const title =
            a.querySelector("[class*='title']")?.textContent ||
            a.getAttribute("title") ||
            a.textContent ||
            "";
          const priceText =
            a.querySelector("[class*='price']")?.textContent ||
            a.closest("article")?.querySelector("[class*='price']")?.textContent ||
            "";
          const img =
            a.querySelector("img") ||
            a.closest("article")?.querySelector("img") ||
            null;
          const thumbnailUrl = img?.currentSrc || img?.src || img?.getAttribute("data-src") || "";
          push(href, String(title || "").trim(), String(priceText || "").trim(), String(thumbnailUrl || "").trim());
        }

        return items;
      })()`);

      for (const item of extracted) {
        const permalink = normalizeUrl(item.href);
        const id = extractIdFromUrl(permalink);
        if (seen.has(id) || seen.has(permalink) || excluded.has(id)) continue;

        const price = parsePrice(item.priceText);
        if (body.minPrice != null && price != null && price < Number(body.minPrice)) continue;
        if (body.maxPrice != null && price != null && price > Number(body.maxPrice)) continue;

        seen.add(id);
        seen.add(permalink);

        products.push({
          id,
          title: String(item.title || "").slice(0, 180),
          price,
          currencyId: "BRL",
          permalink,
          thumbnailUrl: normalizeImageUrl(item.thumbnailUrl),
          categoryId: target.category || null,
          soldQuantity: null,
          condition: null,
          shippingFree: /frete gratis|frete grÃ¡tis/i.test(item.title || ""),
        });

        if (products.length >= limit) break;
      }

      if (products.length >= limit) break;
    }

    if (products.length === 0) {
      let debug = "";
      try {
        const pageInfo = await page.evaluate(`(() => ({
          title: document.title || "",
          robots: document.querySelector("meta[name='robots']")?.content || "",
          hasCaptcha:
            Boolean(document.querySelector("[data-sitekey]")) ||
            /captcha|robot|verifica/i.test(document.body?.innerText || ""),
        }))()`);
        debug = ` title="${String(pageInfo.title).slice(0, 80)}" robots="${String(pageInfo.robots).slice(0, 80)}" captcha=${pageInfo.hasCaptcha}`;
      } catch {
        // ignore
      }
      throw new Error(
        `Busca via navegador nao encontrou produtos. Pode haver challenge, login ou mudanca no HTML do Mercado Livre.${debug ? " Debug:" + debug : ""}`
      );
    }

    const ordered = body.randomize ? shuffleList(products) : products;
    return ordered.slice(0, limit);
  } finally {
    await browser.close();
  }
}

export async function mercadoLivreBrowserImages(body: MercadoLivreImagesRequest): Promise<string[]> {
  const executablePath = await firstExistingExecutable();
  if (!executablePath) return [];

  const puppeteer = dynamicRequire("puppeteer-core");
  const limit = Math.min(12, Math.max(1, Number(body.limit || 4)));

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

    await page.goto(body.url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise((resolve) => setTimeout(resolve, 2500));

    const urls = await page.evaluate(`(() => {
      const values = [];
      const push = (value) => {
        if (value) values.push(value);
      };

      push(document.querySelector("meta[property='og:image']")?.content);
      push(document.querySelector("meta[name='twitter:image']")?.content);

      for (const script of Array.from(
        document.querySelectorAll("script[type='application/ld+json']")
      )) {
        try {
          const parsed = JSON.parse(script.textContent || "{}");
          const image = parsed?.image;
          if (Array.isArray(image)) image.forEach((item) => push(String(item || "")));
          else push(String(image || ""));
        } catch {
          // ignore
        }
      }

      const selectors = [
        "img.ui-pdp-image",
        "figure img",
        "[class*='gallery'] img",
        "[class*='pdp'] img",
        "img[src*='mlstatic']",
      ];
      for (const img of Array.from(document.querySelectorAll(selectors.join(",")))) {
        push(img.currentSrc);
        push(img.src);
        push(img.getAttribute("data-src"));
        push(img.getAttribute("data-original"));
        const srcset = img.getAttribute("srcset") || "";
        for (const part of srcset.split(",")) {
          push(part.trim().split(/\\s+/)[0]);
        }
      }

      return values;
    })()`);

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

