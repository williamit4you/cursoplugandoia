export const COBASI_STORE_SLUG = "cobasi";
export const COBASI_REQUIRED_TRACKING = {
  utm_source: "mais",
  utm_medium: "maisplataforma",
  utm_campaign: "willianbarata",
} as const;

export function validateCobasiAffiliateUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { valid: false as const, error: "URL afiliada da Cobasi inválida" };
  }
  if (url.protocol !== "https:") return { valid: false as const, error: "A URL afiliada da Cobasi precisa usar HTTPS" };
  if (!/(^|\.)cobasi\.com\.br$/i.test(url.hostname)) return { valid: false as const, error: "O host afiliado não pertence à Cobasi" };
  for (const [key, expected] of Object.entries(COBASI_REQUIRED_TRACKING)) {
    if (url.searchParams.get(key) !== expected) return { valid: false as const, error: `Parâmetro afiliado obrigatório ausente ou incorreto: ${key}` };
  }
  return { valid: true as const, url };
}

export function hasForbiddenCobasiUrl(value: unknown) {
  const text = typeof value === "string" ? value : JSON.stringify(value ?? "");
  return /https?:\/\/[^\s"'<>]*cobasi\.com\.br/i.test(text);
}

export function buildCobasiAffiliateHref(input: {
  source: string;
  medium: string;
  campaign: string;
  destination?: string | null;
}) {
  const params = new URLSearchParams({
    source: input.source.slice(0, 80),
    medium: input.medium.slice(0, 80),
    campaign: input.campaign.slice(0, 120),
  });
  if (input.destination) params.set("destination", input.destination.slice(0, 2_000));
  return `/go/loja/${COBASI_STORE_SLUG}?${params.toString()}`;
}

