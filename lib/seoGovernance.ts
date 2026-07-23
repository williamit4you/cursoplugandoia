export type SeoOpportunityInput = {
  demandScore?: number;
  trendScore?: number;
  competitionScore?: number;
  relevanceScore?: number;
  conversionScore?: number;
};

export const SEO_SOURCES = ["SEARCH_CONSOLE", "TRENDS", "KEYWORD_PLANNER", "SUGGEST", "MANUAL"] as const;
export type SeoSource = (typeof SEO_SOURCES)[number];

export type SeoEvidenceSource = {
  source?: string | null;
  collectedAt?: string | null;
  keyword?: string | null;
  region?: string | null;
  url?: string | null;
};

export function normalizeSeoSource(value: unknown): SeoSource {
  const normalized = String(value || "").trim().toUpperCase();
  return (SEO_SOURCES as readonly string[]).includes(normalized) ? (normalized as SeoSource) : "MANUAL";
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((item) => item.length > 2);
}

export function calculateTextSimilarity(left: string, right: string) {
  const a = new Set(normalizeText(left));
  const b = new Set(normalizeText(right));
  const intersection = [...a].filter((item) => b.has(item)).length;
  const union = new Set([...a, ...b]).size;
  return union ? intersection / union : 0;
}

export function validateSeoAngleDistinctness(items: Array<{ angle?: string | null; title?: string | null; keyword?: string | null }>) {
  const issues: string[] = [];
  const comparisons: Array<{ left: string; right: string; score: number }> = [];
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const left = items[i];
      const right = items[j];
      const score = calculateTextSimilarity(
        `${left.title || ""} ${left.keyword || ""}`,
        `${right.title || ""} ${right.keyword || ""}`,
      );
      comparisons.push({ left: String(left.angle || i), right: String(right.angle || j), score });
      if (score >= 0.85) issues.push(`Angulos ${left.angle || i} e ${right.angle || j} estao muito parecidos`);
    }
  }
  return { ok: issues.length === 0, issues, comparisons };
}

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
