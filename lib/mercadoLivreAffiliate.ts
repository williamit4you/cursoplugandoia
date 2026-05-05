export type MercadoLivreAffiliateConfigLike = {
  id?: string;
  siteId?: string;
  searchTerms?: string;
  categoryIds?: string;
  minPrice?: number | null;
  maxPrice?: number | null;
  sort?: string | null;
  maxProductsPerRun?: number | null;
  postIntervalHours?: number | null;
  preferredPlatforms?: string;
  affiliateLinkMode?: string | null;
  affiliateTag?: string | null;
  affiliateUrlTemplate?: string | null;
  linkBuilderCookie?: string | null;
  appId?: string | null;
  clientSecret?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  tokenExpiresAt?: Date | string | null;
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
  shippingFree: boolean;
};

export type MercadoLivreTokenRefresh = {
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date;
  userId?: number;
};

export type MercadoLivreTokenExchange = MercadoLivreTokenRefresh & {
  scope?: string;
};

export const DEFAULT_MERCADO_LIVRE_SEARCH_TERMS = ["ofertas"];

export const DEFAULT_MERCADO_LIVRE_CATEGORY_PRESETS = [
  { id: "MLB1648", name: "Informatica", searchTerm: "informatica" },
  { id: "MLB1051", name: "Celulares e Telefones", searchTerm: "celulares telefones" },
  { id: "MLB1000", name: "Eletronicos, Audio e Video", searchTerm: "eletronicos audio video" },
  { id: "MLB1144", name: "Games", searchTerm: "games consoles" },
  { id: "MLB5726", name: "Eletrodomesticos", searchTerm: "eletrodomesticos" },
  { id: "MLB1574", name: "Casa, Moveis e Decoracao", searchTerm: "casa moveis decoracao" },
  { id: "MLB1276", name: "Esportes e Fitness", searchTerm: "esportes fitness" },
  { id: "MLB1246", name: "Beleza e Cuidado Pessoal", searchTerm: "beleza cuidado pessoal" },
  { id: "MLB1132", name: "Brinquedos e Hobbies", searchTerm: "brinquedos hobbies" },
  { id: "MLB407134", name: "Ferramentas", searchTerm: "ferramentas" },
];

export const DEFAULT_MERCADO_LIVRE_CATEGORY_IDS = DEFAULT_MERCADO_LIVRE_CATEGORY_PRESETS.map(
  (item) => item.id
);

export function mercadoLivreCategorySearchTerm(categoryId: string | null | undefined) {
  const category = DEFAULT_MERCADO_LIVRE_CATEGORY_PRESETS.find(
    (item) => item.id.toUpperCase() === String(categoryId || "").toUpperCase()
  );
  return category?.searchTerm || "";
}

export function shuffleMercadoLivreList<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

export function rotateMercadoLivreList<T>(items: T[], startIndex: number) {
  if (items.length === 0) return [];
  const normalized = ((startIndex % items.length) + items.length) % items.length;
  return [...items.slice(normalized), ...items.slice(0, normalized)];
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

export function normalizeMercadoLivrePlatforms(value: unknown, fallback = ["YOUTUBE", "INSTAGRAM", "TIKTOK"]) {
  const allowed = new Set(["YOUTUBE", "INSTAGRAM", "TIKTOK"]);
  const parsed = parseJsonStringArray(value, fallback);
  const normalized = parsed
    .map((item) => item.toUpperCase())
    .filter((item) => allowed.has(item));
  return normalized.length > 0 ? Array.from(new Set(normalized)) : fallback;
}

export function mercadoLivreAuthHost(siteId: string | null | undefined) {
  switch (String(siteId || "MLB").toUpperCase()) {
    case "MLA":
      return "https://auth.mercadolibre.com.ar";
    case "MLM":
      return "https://auth.mercadolibre.com.mx";
    case "MLB":
    default:
      return "https://auth.mercadolivre.com.br";
  }
}

export function mercadoLivreRedirectUri(req: Request, originOverride?: string | null) {
  if (originOverride && /^https?:\/\/[^/]+$/i.test(originOverride)) {
    return `${originOverride}/api/mercado-livre/callback`;
  }

  const host = req.headers.get("host") || "localhost:3000";
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const protocol = forwardedProto || (host.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}/api/mercado-livre/callback`;
}

export async function exchangeMercadoLivreAuthorizationCode(params: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
  codeVerifier?: string | null;
}): Promise<MercadoLivreTokenExchange> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: params.clientId,
    client_secret: params.clientSecret,
    code: params.code,
    redirect_uri: params.redirectUri,
  });

  if (params.codeVerifier) {
    body.set("code_verifier", params.codeVerifier);
  }

  const res = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || data?.error_description || data?.error || "Mercado Livre token exchange failed");
  }

  const expiresIn = Number(data?.expires_in || 10800);
  return {
    accessToken: String(data.access_token || ""),
    refreshToken: String(data.refresh_token || ""),
    tokenExpiresAt: new Date(Date.now() + Math.max(60, expiresIn - 120) * 1000),
    userId: Number.isFinite(Number(data.user_id)) ? Number(data.user_id) : undefined,
    scope: data?.scope ? String(data.scope) : undefined,
  };
}

export async function refreshMercadoLivreAccessToken(
  config: MercadoLivreAffiliateConfigLike
): Promise<MercadoLivreTokenRefresh | null> {
  if (!config.appId || !config.clientSecret || !config.refreshToken) return null;

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: config.appId,
    client_secret: config.clientSecret,
    refresh_token: config.refreshToken,
  });

  const res = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || data?.error_description || "Mercado Livre token refresh failed");
  }

  const expiresIn = Number(data?.expires_in || 10800);
  return {
    accessToken: String(data.access_token || ""),
    refreshToken: String(data.refresh_token || ""),
    tokenExpiresAt: new Date(Date.now() + Math.max(60, expiresIn - 120) * 1000),
    userId: Number.isFinite(Number(data.user_id)) ? Number(data.user_id) : undefined,
  };
}

export function shouldRefreshMercadoLivreToken(config: MercadoLivreAffiliateConfigLike) {
  if (!config.refreshToken || !config.appId || !config.clientSecret) return false;
  if (!config.accessToken) return true;
  if (!config.tokenExpiresAt) return false;
  const expiry = new Date(config.tokenExpiresAt).getTime();
  return Number.isFinite(expiry) && expiry <= Date.now() + 5 * 60 * 1000;
}

function appendQueryParam(url: string, key: string, value: string) {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set(key, value);
    return parsed.toString();
  } catch {
    const joiner = url.includes("?") ? "&" : "?";
    return `${url}${joiner}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
  }
}

export function isMercadoLivreAffiliateTemplateDynamic(template: string | null | undefined) {
  const value = String(template || "");
  return ["{{url}}", "{{permalink}}", "{{encodedUrl}}", "{{itemId}}", "{{tag}}"].some((token) =>
    value.includes(token)
  );
}

function mergeCookieStrings(currentCookie: string, setCookieHeaders: string[]) {
  const cookieMap = new Map<string, string>();

  for (const part of currentCookie.split(";")) {
    const [key, ...valueParts] = part.trim().split("=");
    if (key && valueParts.length > 0) cookieMap.set(key, valueParts.join("="));
  }

  for (const setCookie of setCookieHeaders) {
    const cookiePart = setCookie.split(";")[0] || "";
    const [key, ...valueParts] = cookiePart.trim().split("=");
    if (key && valueParts.length > 0) cookieMap.set(key, valueParts.join("="));
  }

  return Array.from(cookieMap.entries())
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");
}

function getCookieValue(cookie: string, key: string) {
  for (const part of cookie.split(";")) {
    const [cookieKey, ...valueParts] = part.trim().split("=");
    if (cookieKey === key) return valueParts.join("=");
  }
  return "";
}

function collectStringValues(value: unknown, out: string[] = []) {
  if (typeof value === "string") {
    out.push(value);
    return out;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStringValues(item, out);
    return out;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectStringValues(item, out);
  }
  return out;
}

function pickAffiliateLinkFromResponse(data: unknown, originalUrl: string) {
  const strings = collectStringValues(data);
  const normalizedOriginal = originalUrl.replace(/\/+$/, "");
  const candidates = strings
    .map((item) => item.trim())
    .filter((item) => /^https?:\/\//i.test(item))
    .filter((item) => item.replace(/\/+$/, "") !== normalizedOriginal);

  return (
    candidates.find((item) => /meli\.la/i.test(item)) ||
    candidates.find((item) => /mercadolivre\.com\.br|mercadolibre\.com/i.test(item)) ||
    null
  );
}

export async function createMercadoLivreAffiliateLink(params: {
  productUrl: string;
  tag?: string | null;
  cookie?: string | null;
}) {
  const cookie = String(params.cookie || "").trim();
  const tag = String(params.tag || "").trim();
  const productUrl = String(params.productUrl || "").trim();

  if (!cookie) {
    return { url: productUrl, updatedCookie: null, warning: "Cookie do Link Builder nao configurado." };
  }
  if (!tag) {
    return { url: productUrl, updatedCookie: null, warning: "Etiqueta/tag de afiliado nao configurada." };
  }

  const bootstrapRes = await fetch("https://www.mercadolivre.com.br/afiliados/linkbuilder", {
    method: "GET",
    headers: {
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      cookie,
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    },
    redirect: "manual",
  });

  const headers = bootstrapRes.headers as Headers & { getSetCookie?: () => string[] };
  const singleSetCookie = bootstrapRes.headers.get("set-cookie");
  const setCookie =
    typeof headers.getSetCookie === "function"
      ? headers.getSetCookie()
      : singleSetCookie
        ? [singleSetCookie]
        : [];
  const updatedCookie = mergeCookieStrings(cookie, setCookie);
  const csrfToken = decodeURIComponent(getCookieValue(updatedCookie, "_csrf"));

  const res = await fetch("https://www.mercadolivre.com.br/affiliate-program/api/v2/affiliates/createLink", {
    method: "POST",
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
      "content-type": "application/json",
      origin: "https://www.mercadolivre.com.br",
      referer: "https://www.mercadolivre.com.br/afiliados/linkbuilder",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "x-csrf-token": csrfToken,
      cookie: updatedCookie,
    },
    body: JSON.stringify({ urls: [productUrl], tag }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.message || data?.error || `HTTP ${res.status}`;
    return {
      url: productUrl,
      updatedCookie,
      warning: `Link Builder Mercado Livre falhou: ${message}`,
      status: res.status,
    };
  }

  const affiliateUrl = pickAffiliateLinkFromResponse(data, productUrl);
  if (!affiliateUrl) {
    return {
      url: productUrl,
      updatedCookie,
      warning: "Link Builder respondeu, mas nao encontrei o link gerado na resposta.",
      raw: data,
    };
  }

  return { url: affiliateUrl, updatedCookie, warning: null as string | null, raw: data };
}

export async function resolveMercadoLivreAffiliateUrl(
  product: Pick<MercadoLivreProduct, "id" | "permalink">,
  config: MercadoLivreAffiliateConfigLike
) {
  const fallback = buildMercadoLivreAffiliateUrl(product, config);
  const cookie = String(config.linkBuilderCookie || "").trim();

  if (!cookie) return { ...fallback, updatedCookie: null as string | null };

  const generated = await createMercadoLivreAffiliateLink({
    productUrl: product.permalink,
    tag: config.affiliateTag,
    cookie,
  });

  if (!generated.warning) {
    return {
      url: generated.url,
      mode: "LINK_BUILDER",
      warning: null as string | null,
      updatedCookie: generated.updatedCookie,
    };
  }

  if (fallback.mode !== "RAW_PERMALINK" && fallback.mode !== "INVALID_STATIC_TEMPLATE") {
    return {
      ...fallback,
      mode: `LINK_BUILDER_FALLBACK_${fallback.mode}`,
      warning: `${generated.warning} Usando fallback configurado: ${fallback.mode}.`,
      updatedCookie: generated.updatedCookie,
    };
  }

  return {
    url: product.permalink,
    mode: "LINK_BUILDER_FALLBACK",
    warning: generated.warning,
    updatedCookie: generated.updatedCookie,
  };
}

export function buildMercadoLivreAffiliateUrl(
  product: Pick<MercadoLivreProduct, "id" | "permalink">,
  config: MercadoLivreAffiliateConfigLike
) {
  const permalink = product.permalink;
  const tag = String(config.affiliateTag || "").trim();
  const template = String(config.affiliateUrlTemplate || "").trim();
  const mode = String(config.affiliateLinkMode || "MANUAL_TEMPLATE").trim();

  if (template) {
    if (!isMercadoLivreAffiliateTemplateDynamic(template)) {
      return {
        url: permalink,
        mode: "INVALID_STATIC_TEMPLATE",
        warning:
          "Template afiliado sem tokens dinamicos. O sistema usou o permalink comum para nao apontar todos os produtos para o mesmo link.",
      };
    }

    const url = template
      .replaceAll("{{url}}", permalink)
      .replaceAll("{{permalink}}", permalink)
      .replaceAll("{{encodedUrl}}", encodeURIComponent(permalink))
      .replaceAll("{{itemId}}", product.id)
      .replaceAll("{{tag}}", encodeURIComponent(tag));

    return { url, mode: "TEMPLATE", warning: null as string | null };
  }

  if (mode === "LINK_BUILDER") {
    return {
      url: permalink,
      mode: "LINK_BUILDER_NOT_CONFIGURED",
      warning: "Cookie do Link Builder nao configurado. O sistema usou o permalink comum do produto.",
    };
  }

  if (mode === "AFF_ID_PARAM" && tag) {
    return {
      url: appendQueryParam(permalink, "aff_id", tag),
      mode,
      warning:
        "Modo aff_id configurado pelo usuario. Confirme no Portal do Afiliado se este parametro credita sua conta.",
    };
  }

  return {
    url: permalink,
    mode: "RAW_PERMALINK",
    warning:
      "Link afiliado automatico ainda nao configurado. O sistema usou o permalink comum do produto.",
  };
}

function normalizeProduct(raw: any): MercadoLivreProduct | null {
  const id = String(raw?.id || "").trim();
  const title = String(raw?.title || "").trim();
  const permalink = String(raw?.permalink || "").trim();
  if (!id || !title || !permalink) return null;

  return {
    id,
    title,
    price: Number.isFinite(Number(raw?.price)) ? Number(raw.price) : null,
    currencyId: raw?.currency_id ? String(raw.currency_id) : null,
    permalink,
    thumbnailUrl: raw?.thumbnail ? String(raw.thumbnail) : null,
    categoryId: raw?.category_id ? String(raw.category_id) : null,
    soldQuantity: Number.isFinite(Number(raw?.sold_quantity)) ? Number(raw.sold_quantity) : null,
    condition: raw?.condition ? String(raw.condition) : null,
    shippingFree: Boolean(raw?.shipping?.free_shipping),
  };
}

export async function searchMercadoLivreProducts(
  config: MercadoLivreAffiliateConfigLike,
  options: {
    limit?: number;
    accessToken?: string | null;
    queryOverride?: string | null;
    categoryOverride?: string | null;
    excludeIds?: string[];
    randomize?: boolean;
  } = {}
) {
  const siteId = String(config.siteId || "MLB").trim() || "MLB";
  const limit = Math.min(50, Math.max(1, Number(options.limit || config.maxProductsPerRun || 8)));
  const terms = options.queryOverride
    ? [options.queryOverride]
    : parseJsonStringArray(config.searchTerms, DEFAULT_MERCADO_LIVRE_SEARCH_TERMS);
  const categories = options.categoryOverride
    ? [options.categoryOverride]
    : parseJsonStringArray(config.categoryIds, DEFAULT_MERCADO_LIVRE_CATEGORY_IDS);
  const products: MercadoLivreProduct[] = [];
  const seen = new Set<string>();
  const excluded = new Set((options.excludeIds || []).map((item) => String(item)));
  const requests: URL[] = [];

  const termsToUse = terms.length > 0 ? terms : DEFAULT_MERCADO_LIVRE_SEARCH_TERMS;
  const categoriesToUse = categories.length > 0 ? categories : [""];

  for (const term of termsToUse) {
    for (const category of categoriesToUse) {
      const url = new URL(`https://api.mercadolibre.com/sites/${siteId}/search`);
      url.searchParams.set("q", term);
      url.searchParams.set("limit", String(Math.min(50, Math.max(limit * 2, 12))));
      if (category) url.searchParams.set("category", category);
      if (config.sort && config.sort !== "relevance") url.searchParams.set("sort", String(config.sort));
      if (config.minPrice != null || config.maxPrice != null) {
        const from = config.minPrice != null ? String(config.minPrice) : "";
        const to = config.maxPrice != null ? String(config.maxPrice) : "";
        url.searchParams.set("price", `${from}-${to}`);
      }
      requests.push(url);
    }
  }

  const failures: string[] = [];
  const headerVariants: Array<{ label: string; headers: Record<string, string> }> = [];
  if (options.accessToken) {
    headerVariants.push({
      label: "token+user-agent",
      headers: {
        accept: "application/json",
        "user-agent": "PlugandoIA/1.0 (+https://plugandoia.cloud)",
        authorization: `Bearer ${options.accessToken}`,
      },
    });
  }
  headerVariants.push({
    label: "public+user-agent",
    headers: {
      accept: "application/json",
      "user-agent": "PlugandoIA/1.0 (+https://plugandoia.cloud)",
    },
  });

  const requestsToUse = options.randomize ? shuffleMercadoLivreList(requests) : requests;

  for (const url of requestsToUse.slice(0, 8)) {
    let data: any = null;
    let ok = false;

    for (const variant of headerVariants) {
      const res = await fetch(url, { headers: variant.headers, cache: "no-store" });
      data = await res.json().catch(() => ({}));
      if (res.ok) {
        ok = true;
        break;
      }
      failures.push(`${variant.label}: HTTP ${res.status} ${data?.message || data?.error || ""}`.trim());
      if (res.status !== 401 && res.status !== 403) break;
    }

    if (!ok) {
      throw new Error(
        `Mercado Livre search failed. ${Array.from(new Set(failures)).slice(-6).join(" | ")}`
      );
    }

    const results = Array.isArray(data?.results) ? data.results : [];
    for (const raw of results) {
      const product = normalizeProduct(raw);
      if (!product || seen.has(product.id) || excluded.has(product.id)) continue;
      seen.add(product.id);
      products.push(product);
      if (products.length >= limit * 3) break;
    }
    if (products.length >= limit * 3) break;
  }

  const ordered = options.randomize
    ? shuffleMercadoLivreList(products)
    : products.sort((a, b) => (b.soldQuantity || 0) - (a.soldQuantity || 0));

  return ordered.slice(0, limit);
}

export function formatMercadoLivrePrice(product: MercadoLivreProduct) {
  if (product.price == null) return "Preco nao informado";
  const currency = product.currencyId === "BRL" || !product.currencyId ? "BRL" : product.currencyId;
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
    }).format(product.price);
  } catch {
    return `${product.currencyId || ""} ${product.price}`.trim();
  }
}
