import "server-only";

import { recordCost } from "@/lib/operationsControl";

export type PetSeoArticle = {
  eyebrow: string;
  intro: string;
  sections: Array<{
    heading: string;
    paragraphs: string[];
    bullets?: string[];
    subsections?: Array<{ heading: string; paragraphs: string[]; bullets?: string[] }>;
  }>;
  faq: Array<{ question: string; answer: string }>;
  sourceNotes: string[];
};

type AgentInput = {
  page: { type: string; title: string; primaryKeyword: string; searchIntent: string | null; path: string };
  location?: { city: string; state: string; facts: unknown; units: unknown[] } | null;
  sources: unknown[];
  internalLinks: string[];
  existingTitles: string[];
  minimumWords: number;
};

async function callAgent(agent: string, instruction: string, context: unknown) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY não configurada para os agentes SEO Pet");
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    signal: AbortSignal.timeout(180_000),
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.PET_SEO_AGENT_MODEL || process.env.SEO_AGENT_MODEL || "gpt-4o-mini",
      temperature: agent === "WRITER" ? 0.4 : 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `${instruction}\nResponda somente JSON válido em português do Brasil. Não invente preço, estoque, endereço, unidade, horário, avaliação, efeito clínico, composição ou experiência pessoal. Não inclua URL, Markdown com link, HTML <a> nem domínio da Cobasi. O sistema adicionará separadamente o único CTA afiliado. Não apresente o Compra Esperta como site oficial da loja.`,
        },
        { role: "user", content: JSON.stringify(context) },
      ],
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `Falha no agente ${agent}`);
  await recordCost({
    operationKey: "PET_SEO_COBASI",
    provider: "OPENAI",
    assetType: `PET_SEO_${agent}`,
    quantity: Number(data?.usage?.total_tokens || 0),
    unit: "tokens",
    metadata: { model: data?.model },
  });
  try {
    return JSON.parse(data?.choices?.[0]?.message?.content || "{}");
  } catch {
    throw new Error(`O agente ${agent} retornou JSON inválido`);
  }
}

export function petArticleWordCount(article: PetSeoArticle) {
  const text = [
    article.intro,
    ...article.sections.flatMap((section) => [
      section.heading,
      ...section.paragraphs,
      ...(section.bullets || []),
      ...(section.subsections || []).flatMap((subsection) => [subsection.heading, ...subsection.paragraphs, ...(subsection.bullets || [])]),
    ]),
    ...article.faq.flatMap((item) => [item.question, item.answer]),
  ].join(" ");
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function sanitizeArticle(article: PetSeoArticle): PetSeoArticle {
  const clean = (value: unknown) => String(value || "").replace(/https?:\/\/\S+/gi, "").replace(/\s+/g, " ").trim();
  return {
    eyebrow: clean(article.eyebrow),
    intro: clean(article.intro),
    sections: Array.isArray(article.sections) ? article.sections.map((section) => ({
      heading: clean(section.heading),
      paragraphs: Array.isArray(section.paragraphs) ? section.paragraphs.map(clean).filter(Boolean) : [],
      bullets: Array.isArray(section.bullets) ? section.bullets.map(clean).filter(Boolean) : undefined,
      subsections: Array.isArray(section.subsections) ? section.subsections.map((subsection) => ({
        heading: clean(subsection.heading),
        paragraphs: Array.isArray(subsection.paragraphs) ? subsection.paragraphs.map(clean).filter(Boolean) : [],
        bullets: Array.isArray(subsection.bullets) ? subsection.bullets.map(clean).filter(Boolean) : undefined,
      })).filter((subsection) => subsection.heading && subsection.paragraphs.length) : undefined,
    })).filter((section) => section.heading && section.paragraphs.length) : [],
    faq: Array.isArray(article.faq) ? article.faq.map((item) => ({ question: clean(item.question), answer: clean(item.answer) })).filter((item) => item.question && item.answer) : [],
    sourceNotes: Array.isArray(article.sourceNotes) ? article.sourceNotes.map(clean).filter(Boolean) : [],
  };
}

export async function runPetSeoAgents(input: AgentInput) {
  const strategy = await callAgent(
    "STRATEGIST",
    "Você é estrategista de conteúdo pet e SEO. Defina intenção, diferenciação, riscos factuais e uma estrutura com H2 e H3. Páginas locais só podem usar os fatos locais fornecidos. Retorne {seoTitle,metaDescription,intent,differentiation,secondaryKeywords:string[],outline:[{h2,h3:string[]}],factualRisks:string[]}.",
    input,
  );
  const research = await callAgent(
    "RESEARCHER",
    "Você é pesquisador editorial. Organize apenas os fatos do contexto, separe conhecimento geral não sensível de alegações que exigem fonte e proíba qualquer informação local ausente. Retorne {supportedFacts:string[],claimsToAvoid:string[],questionsToAnswer:string[],sourceGaps:string[]}.",
    { ...input, strategy },
  );
  let article = sanitizeArticle(await callAgent(
    "WRITER",
    `Você é redator especializado em guias de compra pet. Produza conteúdo útil com pelo menos ${input.minimumWords} palavras, sem keyword stuffing. Não dê diagnóstico ou prescrição. H1 será renderizado pelo sistema: crie somente introdução, seções H2 e subseções H3. Retorne {eyebrow,intro,sections:[{heading,paragraphs:string[],bullets?:string[],subsections?:[{heading,paragraphs:string[],bullets?:string[]}]}],faq:[{question,answer}],sourceNotes:string[]}.`,
    { ...input, strategy, research },
  ) as PetSeoArticle);
  let review = await callAgent(
    "REVIEWER",
    "Você é revisor factual, SEO e de publicidade responsável. Reprove invenção, afirmação clínica, conteúdo local sem fonte, falsa representação oficial, duplicidade, texto genérico, links externos, headings ruins ou baixa utilidade. Retorne {approved:boolean,score:number,factualIssues:string[],seoIssues:string[],affiliateIssues:string[],requiredChanges:string[]}.",
    { ...input, strategy, research, article, wordCount: petArticleWordCount(article) },
  );
  if (review?.approved !== true || Number(review?.score || 0) < 80 || petArticleWordCount(article) < input.minimumWords) {
    article = sanitizeArticle(await callAgent(
      "EDITOR",
      `Reescreva o artigo completo corrigindo a revisão. Entregue pelo menos ${input.minimumWords} palavras, preserve somente fatos sustentados e retorne o mesmo JSON do artigo.`,
      { ...input, strategy, research, previousArticle: article, review },
    ) as PetSeoArticle);
    review = await callAgent(
      "FINAL_REVIEWER",
      "Faça a revisão final factual, SEO e de afiliação. Retorne {approved:boolean,score:number,factualIssues:string[],seoIssues:string[],affiliateIssues:string[],requiredChanges:string[]}.",
      { ...input, strategy, research, article, wordCount: petArticleWordCount(article) },
    );
  }
  return { strategy, research, article, review, wordCount: petArticleWordCount(article) };
}

