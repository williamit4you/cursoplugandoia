export type SeoOpportunityInput = {
  demandScore?: number;
  trendScore?: number;
  competitionScore?: number;
  relevanceScore?: number;
  conversionScore?: number;
};

export type SeoEvidenceSource = {
  source?: string | null;
  collectedAt?: string | null;
  keyword?: string | null;
  region?: string | null;
  url?: string | null;
};

export function calculateSeoOpportunityScore(input: SeoOpportunityInput) {
  const demand = Math.max(0, Math.min(100, input.demandScore || 0));
  const trend = Math.max(0, Math.min(100, input.trendScore || 0));
  const competition = Math.max(0, Math.min(100, input.competitionScore || 0));
  const relevance = Math.max(0, Math.min(100, input.relevanceScore || 0));
  const conversion = Math.max(0, Math.min(100, input.conversionScore || 0));
  return Number((demand * 0.25 + trend * 0.15 + (100 - competition) * 0.15 + relevance * 0.25 + conversion * 0.2).toFixed(2));
}

export function parseSeoSources(raw: string | null | undefined) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function validateSeoSources(raw: string | null | undefined) {
  const sources = parseSeoSources(raw) as SeoEvidenceSource[];
  const issues: string[] = [];
  if (!sources.length) issues.push("Fontes/evidencias ausentes");
  const validSources = sources.filter((item) => {
    const source = String(item?.source || "").trim();
    const collectedAt = String(item?.collectedAt || "").trim();
    return source.length > 0 && collectedAt.length > 0 && !Number.isNaN(new Date(collectedAt).getTime());
  });
  if (sources.length > 0 && validSources.length === 0) issues.push("Fontes sem origem/data valida");
  return { ok: issues.length === 0, issues, sources, validSources };
}

export function validateSeoRelease(input: { productUrl?: string | null; affiliateUrl?: string | null; price?: number | null; primaryKeyword?: string | null; intent?: string | null; sourcesJson?: string | null; angle?: string | null }) {
  const issues: string[] = [];
  if (!input.productUrl) issues.push("URL do produto ausente");
  if (!input.affiliateUrl) issues.push("Link afiliado ausente");
  if (input.price == null || input.price <= 0) issues.push("Preco do produto ausente");
  if (!input.primaryKeyword) issues.push("Palavra-chave principal ausente");
  if (!input.intent) issues.push("Intencao de busca ausente");
  issues.push(...validateSeoSources(input.sourcesJson).issues);
  return { ok: issues.length === 0, issues };
}
