export const COMPARISON_PIPELINE_STEPS = [
  "validateSources",
  "scrapeSources",
  "normalizeSourceData",
  "generateComparisonBrief",
  "writeArticle",
  "reviewSeoAndClaims",
  "publishComparison",
] as const;

export const SUPPORTED_COMPARISON_DOMAINS = [
  "amazon.",
  "amzn.to",
  "mercadolivre.",
  "mercadolibre.",
  "meli.la",
  "shopee.",
] as const;

export function getStoreNameFromHost(hostname: string) {
  const host = hostname.toLowerCase();
  if (host.includes("amazon.") || host.includes("amzn.to")) return "Amazon";
  if (host.includes("mercadolivre.") || host.includes("mercadolibre.") || host.includes("meli.la")) {
    return "Mercado Livre";
  }
  if (host.includes("shopee.")) return "Shopee";
  return hostname.replace(/^www\./, "");
}

export function isSupportedComparisonUrl(input: string) {
  try {
    const url = new URL(input);
    const host = url.hostname.toLowerCase();
    return SUPPORTED_COMPARISON_DOMAINS.some((token) => host.includes(token));
  } catch {
    return false;
  }
}
