import "server-only";

import { prisma } from "@/lib/prisma";
import { recordCost } from "@/lib/operationsControl";
import { validateSeoRelease } from "@/lib/seoGovernance";

const ROLES = {
  research: "Pesquise apenas com os dados e fontes fornecidos. Liste lacunas; nunca invente evidencias.",
  strategy: "Defina intencao, cluster, palavra-chave e angulo sem escolher termo apenas por volume.",
  writing: "Redija em portugues do Brasil, util, factual, sem claims absolutos e com indicacao de fontes.",
  seo: "Revise title, description, headings, links internos, FAQ e dados estruturados sem keyword stuffing.",
  review: "Verifique fatos, fontes, afiliacao, duplicidade, riscos medico/financeiro/legal e claims enganosos.",
  analysis: "Defina hipoteses e metricas de 7, 14 e 28 dias sem atribuir causalidade sem evidencia.",
} as const;

function words(value: string) { return new Set(value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((item) => item.length > 3)); }
function similarity(a: string, b: string) { const left = words(a); const right = words(b); const intersection = [...left].filter((item) => right.has(item)).length; const union = new Set([...left, ...right]).size; return union ? intersection / union : 0; }

async function runAgent(role: keyof typeof ROLES, context: unknown) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY nao configurada");
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: process.env.SEO_AGENT_MODEL || "gpt-4o-mini", temperature: 0.2, response_format: { type: "json_object" }, messages: [{ role: "system", content: `${ROLES[role]} Responda JSON valido.` }, { role: "user", content: JSON.stringify(context) }] }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `Falha no agente ${role}`);
  const usage = data?.usage || {};
  await recordCost({ operationKey: "NEWS_CONTENT", provider: "OPENAI", assetType: `SEO_AGENT_${role.toUpperCase()}`, quantity: Number(usage.total_tokens || 0), unit: "tokens", metadata: { model: data?.model } });
  return JSON.parse(data?.choices?.[0]?.message?.content || "{}");
}

export async function runSeoAgentPipeline(briefId: string) {
  const brief = await prisma.seoBrief.findUnique({ where: { id: briefId }, include: { product: true, opportunity: true } });
  if (!brief) throw new Error("Brief SEO nao encontrado");
  const gate = validateSeoRelease({ ...brief.product, primaryKeyword: brief.primaryKeyword, intent: brief.intent, sourcesJson: brief.sourcesJson });
  const existingPosts = await prisma.post.findMany({ where: { status: "PUBLISHED" }, select: { id: true, title: true }, take: 500 });
  const duplicate = existingPosts.map((post) => ({ ...post, score: similarity(brief.title, post.title) })).sort((a, b) => b.score - a.score)[0] || null;
  const sensitiveClaim = /(cura|garantid[oa]|resultado certo|sem risco|milagre|trata doença|lucro garantido)/i.test(`${brief.title} ${brief.product.description || ""}`);
  const context: any = { product: brief.product, brief, opportunity: brief.opportunity, releaseGate: gate, deterministicReview: { duplicate, duplicateBlocked: Number(duplicate?.score || 0) >= 0.75, sensitiveClaim } };
  for (const role of Object.keys(ROLES) as (keyof typeof ROLES)[]) context[role] = await runAgent(role, context);
  const sensitive = Boolean(context.review?.requiresHumanReview || context.review?.sensitiveClaims?.length || context.deterministicReview.duplicateBlocked || context.deterministicReview.sensitiveClaim);
  await prisma.seoBrief.update({ where: { id: brief.id }, data: { status: gate.ok && !sensitive ? "REVIEW" : "DRAFT", outlineJson: JSON.stringify(context.strategy?.outline || context.writing?.outline || []), sourcesJson: JSON.stringify(context.research?.sources || []), reviewNotes: JSON.stringify({ gate, review: context.review, seo: context.seo, analysis: context.analysis }) } });
  return { briefId, status: gate.ok && !sensitive ? "REVIEW" : "DRAFT", requiresHumanReview: sensitive || !gate.ok, output: context };
}

export { ROLES as SEO_AGENT_ROLES };
