export type SeoOpportunityInput = {
  demandScore?: number;
  trendScore?: number;
  competitionScore?: number;
  relevanceScore?: number;
  conversionScore?: number;
};

export function calculateSeoOpportunityScore(input: SeoOpportunityInput) {
  const demand = Math.max(0, Math.min(100, input.demandScore || 0));
  const trend = Math.max(0, Math.min(100, input.trendScore || 0));
  const competition = Math.max(0, Math.min(100, input.competitionScore || 0));
  const relevance = Math.max(0, Math.min(100, input.relevanceScore || 0));
  const conversion = Math.max(0, Math.min(100, input.conversionScore || 0));
  return Number((demand * 0.25 + trend * 0.15 + (100 - competition) * 0.15 + relevance * 0.25 + conversion * 0.2).toFixed(2));
}

export function validateSeoRelease(input: { productUrl?: string | null; affiliateUrl?: string | null; price?: number | null; primaryKeyword?: string | null; intent?: string | null; sourcesJson?: string | null; angle?: string | null }) {
  const issues: string[] = [];
  if (!input.productUrl) issues.push("URL do produto ausente");
  if (!input.affiliateUrl) issues.push("Link afiliado ausente");
  if (input.price == null || input.price <= 0) issues.push("Preco do produto ausente");
  if (!input.primaryKeyword) issues.push("Palavra-chave principal ausente");
  if (!input.intent) issues.push("Intencao de busca ausente");
  if (!input.sourcesJson || input.sourcesJson === "[]") issues.push("Fontes/evidencias ausentes");
  return { ok: issues.length === 0, issues };
}
