import "server-only";

import { recordCost } from "@/lib/operationsControl";

export type EditorialArticle = {
  title: string;
  metaDescription: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  eyebrow: string;
  intro: string;
  specs: Array<{ label: string; value: string }>;
  sections: Array<{ title: string; paragraphs: string[]; bullets?: string[] }>;
  faq: Array<{ question: string; answer: string }>;
  sourceNotes: string[];
};

async function callAgent(agent: string, instruction: string, context: unknown) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY não configurada");
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    signal: AbortSignal.timeout(180_000),
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.SEO_AGENT_MODEL || "gpt-4o-mini",
      temperature: agent === "COPYWRITER" ? 0.45 : 0.15,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `${instruction}\nResponda somente JSON válido. Escreva em português do Brasil. Nunca invente preço, avaliação, benefício, especificação ou experiência de uso.`,
        },
        { role: "user", content: JSON.stringify(context) },
      ],
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `Falha no agente ${agent}`);
  await recordCost({
    operationKey: "COMMERCE_EDITORIAL",
    provider: "OPENAI",
    assetType: `EDITORIAL_${agent}`,
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

function words(article: EditorialArticle) {
  const text = [
    article.title,
    article.intro,
    ...article.specs.flatMap((item) => [item.label, item.value]),
    ...article.sections.flatMap((section) => [section.title, ...section.paragraphs, ...(section.bullets || [])]),
    ...article.faq.flatMap((item) => [item.question, item.answer]),
  ].join(" ");
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export async function runCommerceEditorialAgents(input: {
  store: { name: string; category: string; domain: string };
  product: { name: string; description: string | null; url: string; price: number | null; currency: string; brand: string | null; evidence: string[] };
  existingTitles: string[];
  minimumWords: number;
}) {
  const research = await callAgent(
    "RESEARCHER",
    "Você é pesquisador de produto. Organize somente os fatos fornecidos, separe fato de inferência, identifique dúvidas reais de busca e marque lacunas. Retorne {facts:string[], gaps:string[], searchQuestions:string[], unsafeClaims:string[]}.",
    input,
  );
  const strategy = await callAgent(
    "SEO_STRATEGIST",
    "Você é estrategista SEO. Proponha intenção, palavra-chave principal, secundárias e estrutura útil, evitando títulos caça-clique e canibalização. Retorne {intent:string, primaryKeyword:string, secondaryKeywords:string[], title:string, outline:string[], differentiation:string}.",
    { ...input, research },
  );
  let article = (await callAgent(
    "COPYWRITER",
    `Você é copywriter editorial. Crie uma análise explicativa e comercial equilibrada com no mínimo ${input.minimumWords} palavras. Use somente os fatos disponíveis; quando algo não estiver confirmado, ensine o leitor a conferir na loja. Não escreva depoimento pessoal. Retorne {title,metaDescription,primaryKeyword,secondaryKeywords,eyebrow,intro,specs:[{label,value}],sections:[{title,paragraphs:[...],bullets?:[...]}],faq:[{question,answer}],sourceNotes:[...]}.`,
    { ...input, research, strategy },
  )) as EditorialArticle;
  const initialReview = await callAgent(
    "SEO_REVIEWER",
    "Você é revisor factual, SEO e publicidade responsável. Reprove se houver fatos sem fonte, promessa, falsa urgência, conteúdo repetitivo, título enganoso ou baixa utilidade. Avalie title, meta description, H2, intenção, naturalidade e originalidade. Retorne {approved:boolean, score:number, factualIssues:string[], seoIssues:string[], complianceIssues:string[], requiredChanges:string[]}.",
    { ...input, research, strategy, article, wordCount: words(article) },
  );
  let review = initialReview;
  let revised = false;
  if (initialReview?.approved !== true || Number(initialReview?.score || 0) < 75 || words(article) < input.minimumWords) {
    article = (await callAgent(
      "COPY_EDITOR",
      `Você é editor-chefe. Reescreva o artigo completo, corrigindo as exigências do revisor e entregando entre ${input.minimumWords + 100} e ${input.minimumWords + 450} palavras. Preserve somente fatos presentes nas evidências. Se o revisor pedir um dado que a fonte não fornece, não invente: explique objetivamente que o leitor deve confirmá-lo na página da loja. Retorne o mesmo JSON completo do artigo: {title,metaDescription,primaryKeyword,secondaryKeywords,eyebrow,intro,specs,sections,faq,sourceNotes}.`,
      {
        ...input,
        research,
        strategy,
        previousArticle: article,
        previousWordCount: words(article),
        reviewer: initialReview,
      },
    )) as EditorialArticle;
    revised = true;
    review = await callAgent(
      "SEO_REVIEWER_FINAL",
      "Você é o revisor final factual, SEO e publicidade responsável. Reprove fatos não sustentados, promessas, falsa urgência, repetição, keyword stuffing ou baixa utilidade. Não exija que o texto invente especificações ausentes: é correto orientar a conferência na fonte. Retorne {approved:boolean, score:number, factualIssues:string[], seoIssues:string[], complianceIssues:string[], requiredChanges:string[]}.",
      { ...input, research, strategy, article, wordCount: words(article), previousReview: initialReview },
    );
  }
  return { research, strategy, article, review, initialReview, revised, wordCount: words(article) };
}
