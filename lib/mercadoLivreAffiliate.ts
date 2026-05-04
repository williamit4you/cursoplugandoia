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

export function normalizeMercadoLivrePlatforms(value: unknown) {
  const allowed = new Set(["YOUTUBE", "INSTAGRAM", "TIKTOK"]);
  const parsed = parseJsonStringArray(value, ["YOUTUBE", "INSTAGRAM", "TIKTOK"]);
  const normalized = parsed
    .map((item) => item.toUpperCase())
    .filter((item) => allowed.has(item));
  return normalized.length > 0 ? Array.from(new Set(normalized)) : ["YOUTUBE", "INSTAGRAM", "TIKTOK"];
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
  options: { limit?: number; accessToken?: string | null; queryOverride?: string | null } = {}
) {
  const siteId = String(config.siteId || "MLB").trim() || "MLB";
  const limit = Math.min(50, Math.max(1, Number(options.limit || config.maxProductsPerRun || 8)));
  const terms = options.queryOverride
    ? [options.queryOverride]
    : parseJsonStringArray(config.searchTerms, ["ofertas"]);
  const categories = parseJsonStringArray(config.categoryIds, []);
  const products: MercadoLivreProduct[] = [];
  const seen = new Set<string>();
  const requests: URL[] = [];

  const termsToUse = terms.length > 0 ? terms : ["ofertas"];
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

  for (const url of requests.slice(0, 8)) {
    const headers: Record<string, string> = { accept: "application/json" };
    if (options.accessToken) headers.Authorization = `Bearer ${options.accessToken}`;

    const res = await fetch(url, { headers, cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.message || data?.error || `Mercado Livre search failed (${res.status})`);
    }

    const results = Array.isArray(data?.results) ? data.results : [];
    for (const raw of results) {
      const product = normalizeProduct(raw);
      if (!product || seen.has(product.id)) continue;
      seen.add(product.id);
      products.push(product);
      if (products.length >= limit * 3) break;
    }
    if (products.length >= limit * 3) break;
  }

  return products
    .sort((a, b) => (b.soldQuantity || 0) - (a.soldQuantity || 0))
    .slice(0, limit);
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
