import "server-only";

import { createShopeeAuthorizationHeader } from "@/lib/shopee/auth";
import { fetchShopeeItemDetail, type ShopeeAffiliateConfigLike } from "@/lib/shopeeAffiliate";

export type ShopeeAffiliateCredentials = {
  appId: string;
  appSecret: string;
};

export type ShopeeAffiliateProduct = {
  id: string;
  itemId: number;
  shopId: number | null;
  title: string;
  originUrl: string;
  offerLink: string | null;
  thumbnailUrl: string | null;
  imageUrls: string[];
  price: number | null;
  currencyId: string | null;
  soldQuantity: number | null;
  ratingStar: number | null;
  reviewCount: number | null;
  description: string | null;
  commissionRate: number | null;
  sellerCommissionRate: number | null;
  shopeeCommissionRate: number | null;
  estimatedCommission: number | null;
  priceDiscountRate: number | null;
  shopName: string | null;
  shopType: number | null;
};

type ProductOfferNode = {
  itemId?: number | string | null;
  productName?: string | null;
  productLink?: string | null;
  offerLink?: string | null;
  imageUrl?: string | null;
  priceMin?: number | string | null;
  priceMax?: number | string | null;
  sales?: number | string | null;
  ratingStar?: number | string | null;
  commissionRate?: number | string | null;
  sellerCommissionRate?: number | string | null;
  shopeeCommissionRate?: number | string | null;
  commission?: number | string | null;
  shopId?: number | string | null;
  shopName?: string | null;
  shopType?: number | string | null;
  priceDiscountRate?: number | string | null;
};

type ProductOfferResponse = {
  productOfferV2?: {
    nodes?: ProductOfferNode[] | null;
    pageInfo?: {
      hasNextPage?: boolean | null;
    } | null;
  } | null;
};

function normalizeDomain(domain: string | null | undefined) {
  return String(domain || "shopee.com.br")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "") || "shopee.com.br";
}

function normalizeSite(site: string | null | undefined) {
  return String(site || "br").trim().toLowerCase() || "br";
}

function normalizeText(value: unknown, max = 200) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function numberOrNull(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseCommissionPercent(value: unknown) {
  const parsed = numberOrNull(value);
  if (parsed == null) return null;
  if (parsed <= 1) return Math.round(parsed * 10000) / 100;
  return Math.round(parsed * 100) / 100;
}

function parseMoney(value: unknown) {
  const parsed = numberOrNull(value);
  if (parsed == null) return null;
  if (parsed > 0 && parsed >= 100000) {
    const normalized = parsed / 100000;
    if (normalized < 1_000_000) return Math.round(normalized * 100) / 100;
  }
  return Math.round(parsed * 100) / 100;
}

function buildOriginUrl(domain: string, shopId: number | null, itemId: number) {
  if (shopId != null) {
    return `https://${domain}/product/${shopId}/${itemId}`;
  }
  return `https://${domain}/product/unknown/${itemId}`;
}

export function resolveShopeeAffiliateCredentials(
  config?: Pick<ShopeeAffiliateConfigLike, "appId" | "clientSecret"> | null
): ShopeeAffiliateCredentials {
  const appId = String(process.env.SHOPEE_APP_ID || config?.appId || "").trim();
  const appSecret = String(process.env.SHOPEE_APP_SECRET || process.env.SHOPEE_SECRET_KEY || config?.clientSecret || "").trim();

  if (!appId || !appSecret) {
    throw new Error("Shopee Affiliate API credentials are missing. Configure SHOPEE_APP_ID and SHOPEE_APP_SECRET.");
  }

  return { appId, appSecret };
}

function getShopeeAffiliateGraphqlUrl(domain: string) {
  return `https://open-api.affiliate.${normalizeDomain(domain)}/graphql`;
}

async function shopeeAffiliateGraphqlRequest<TData>(params: {
  config: ShopeeAffiliateConfigLike;
  query: string;
  variables?: Record<string, unknown>;
  operationName?: string;
  timeoutMs?: number;
}): Promise<TData> {
  const credentials = resolveShopeeAffiliateCredentials(params.config);
  const payloadObject = {
    query: params.query,
    ...(params.operationName ? { operationName: params.operationName } : {}),
    ...(params.variables ? { variables: params.variables } : {}),
  };
  const payload = JSON.stringify(payloadObject);
  const auth = createShopeeAuthorizationHeader({
    appId: credentials.appId,
    appSecret: credentials.appSecret,
    payload,
  });

  const res = await fetch(getShopeeAffiliateGraphqlUrl(params.config.domain || "shopee.com.br"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth.authorization,
    },
    body: payload,
    cache: "no-store",
    signal: AbortSignal.timeout(Math.min(45000, Math.max(5000, Number(params.timeoutMs || 15000)))),
  });

  const rawText = await res.text();
  let data: { data?: TData; errors?: Array<{ message?: string; extensions?: { code?: number; message?: string } }> } =
    {};
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    throw new Error(`Shopee Affiliate API returned non-JSON response (HTTP ${res.status}).`);
  }

  if (!res.ok) {
    const errorMessage =
      data?.errors?.[0]?.extensions?.message || data?.errors?.[0]?.message || `Shopee Affiliate API HTTP ${res.status}`;
    throw new Error(errorMessage);
  }

  if (Array.isArray(data.errors) && data.errors.length > 0) {
    const first = data.errors[0];
    const message = first?.extensions?.message || first?.message || "Shopee Affiliate API returned an error.";
    throw new Error(message);
  }

  if (!data.data) {
    throw new Error("Shopee Affiliate API returned an empty data payload.");
  }

  return data.data;
}

function normalizeOfferNode(params: {
  domain: string;
  raw: ProductOfferNode;
}): ShopeeAffiliateProduct | null {
  const itemId = Number(params.raw.itemId);
  if (!Number.isFinite(itemId)) return null;

  const shopId = numberOrNull(params.raw.shopId);
  const title = normalizeText(params.raw.productName, 200);
  if (!title) return null;

  const originUrl = String(params.raw.productLink || "").trim() || buildOriginUrl(params.domain, shopId, itemId);
  const imageUrl = String(params.raw.imageUrl || "").trim() || null;

  return {
    id: shopId != null ? `${shopId}-${itemId}` : String(itemId),
    itemId,
    shopId,
    title,
    originUrl,
    offerLink: String(params.raw.offerLink || "").trim() || null,
    thumbnailUrl: imageUrl,
    imageUrls: imageUrl ? [imageUrl] : [],
    price: parseMoney(params.raw.priceMin ?? params.raw.priceMax),
    currencyId: "BRL",
    soldQuantity: numberOrNull(params.raw.sales),
    ratingStar: numberOrNull(params.raw.ratingStar),
    reviewCount: null,
    description: null,
    commissionRate: parseCommissionPercent(params.raw.commissionRate),
    sellerCommissionRate: parseCommissionPercent(params.raw.sellerCommissionRate),
    shopeeCommissionRate: parseCommissionPercent(params.raw.shopeeCommissionRate),
    estimatedCommission: parseMoney(params.raw.commission),
    priceDiscountRate: parseCommissionPercent(params.raw.priceDiscountRate),
    shopName: normalizeText(params.raw.shopName, 120) || null,
    shopType: numberOrNull(params.raw.shopType),
  };
}

export async function searchShopeeAffiliateProducts(
  config: ShopeeAffiliateConfigLike,
  params: {
    keyword: string;
    limit?: number;
    listType?: number;
    sortType?: number;
    minPrice?: number;
    minCommissionRate?: number;
    minSales?: number;
    enrichDetails?: boolean;
    timeoutMs?: number;
  }
): Promise<ShopeeAffiliateProduct[]> {
  const keyword = normalizeText(params.keyword, 120);
  if (!keyword) return [];

  const pageSize = Math.min(50, Math.max(1, Number(params.limit || 50)));
  const minPrice = Number.isFinite(Number(params.minPrice)) ? Number(params.minPrice) : 10;
  const minCommissionRate = Number.isFinite(Number(params.minCommissionRate)) ? Number(params.minCommissionRate) : 5;
  const minSales = Number.isFinite(Number(params.minSales)) ? Number(params.minSales) : 100;
  const domain = normalizeDomain(config.domain || "shopee.com.br");
  const site = normalizeSite(config.site || "br");

  const query = `
    query ProductOffer($keyword: String!, $listType: Int!, $sortType: Int!, $page: Int!, $limit: Int!) {
      productOfferV2(keyword: $keyword, listType: $listType, sortType: $sortType, page: $page, limit: $limit) {
        nodes {
          itemId
          productName
          productLink
          offerLink
          imageUrl
          priceMin
          priceMax
          priceDiscountRate
          sales
          ratingStar
          commissionRate
          sellerCommissionRate
          shopeeCommissionRate
          commission
          shopId
          shopName
          shopType
        }
        pageInfo {
          hasNextPage
        }
      }
    }
  `;

  const data = await shopeeAffiliateGraphqlRequest<ProductOfferResponse>({
    config,
    query,
    operationName: "ProductOffer",
    variables: {
      keyword,
      listType: Number.isFinite(Number(params.listType)) ? Number(params.listType) : 2,
      sortType: Number.isFinite(Number(params.sortType)) ? Number(params.sortType) : 2,
      page: 1,
      limit: pageSize,
    },
    timeoutMs: params.timeoutMs,
  });

  const nodes = Array.isArray(data.productOfferV2?.nodes) ? data.productOfferV2?.nodes || [] : [];
  console.log(`[SHOPEE_API] Received ${nodes.length} nodes from API for keyword "${keyword}"`);

  const normalized = nodes
    .map((raw) => normalizeOfferNode({ domain, raw }))
    .filter((item): item is ShopeeAffiliateProduct => Boolean(item));
  
  console.log(`[SHOPEE_API] Normalized: ${normalized.length} products`);

  const priceFiltered = normalized.filter((item) => (item.price ?? 0) >= minPrice);
  console.log(`[SHOPEE_API] After price filter (>= ${minPrice}): ${priceFiltered.length}`);

  const commFiltered = priceFiltered.filter((item) => (item.commissionRate ?? 0) >= minCommissionRate);
  console.log(`[SHOPEE_API] After commission filter (>= ${minCommissionRate}%): ${commFiltered.length}`);

  const salesFiltered = commFiltered.filter((item) => (item.soldQuantity ?? 0) >= minSales);
  console.log(`[SHOPEE_API] After sales filter (>= ${minSales}): ${salesFiltered.length}`);

  const filtered = salesFiltered.slice(0, pageSize);

  if (!params.enrichDetails) return filtered;

  const enriched: ShopeeAffiliateProduct[] = [];
  for (const product of filtered) {
    if (!product.shopId) {
      enriched.push(product);
      continue;
    }

    try {
      const detail = await fetchShopeeItemDetail({
        site,
        domain,
        shopId: product.shopId,
        itemId: product.itemId,
        requestTimeoutMs: Math.min(20000, Math.max(3000, Number(params.timeoutMs || 10000))),
      });

      enriched.push({
        ...product,
        description: detail.description || product.description,
        imageUrls: detail.imageUrls.length > 0 ? detail.imageUrls : product.imageUrls,
        thumbnailUrl: detail.imageUrls[0] || product.thumbnailUrl,
      });
    } catch {
      enriched.push(product);
    }
  }

  return enriched;
}

export async function generateShopeeAffiliateShortLink(params: {
  config: ShopeeAffiliateConfigLike;
  originUrl: string;
  subIds?: string[];
  timeoutMs?: number;
}) {
  const originUrl = String(params.originUrl || "").trim();
  if (!originUrl) {
    throw new Error("originUrl is required to generate a Shopee short link.");
  }

  const sanitizedSubIds = (params.subIds || [])
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .slice(0, 5);

  const query = `
    mutation GenerateShortLink($originUrl: String!, $subIds: [String!]) {
      generateShortLink(input: { originUrl: $originUrl, subIds: $subIds }) {
        shortLink
      }
    }
  `;

  const data = await shopeeAffiliateGraphqlRequest<{
    generateShortLink?: {
      shortLink?: string | null;
    } | null;
  }>({
    config: params.config,
    query,
    operationName: "GenerateShortLink",
    variables: {
      originUrl,
      subIds: sanitizedSubIds.length > 0 ? sanitizedSubIds : null,
    },
    timeoutMs: params.timeoutMs,
  });

  const shortLink = String(data.generateShortLink?.shortLink || "").trim();
  if (!shortLink) {
    throw new Error("Shopee did not return a short affiliate link.");
  }

  return shortLink;
}
