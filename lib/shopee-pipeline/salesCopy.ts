import "server-only";

function clean(value: string | null | undefined, maxLength: number) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

export function buildManualSalesCopyPrompt(params: {
  title: string | null | undefined;
  description: string | null | undefined;
  affiliateUrl: string | null | undefined;
}) {
  const title = clean(params.title, 240);
  const description = clean(params.description, 2_000);
  const affiliateUrl = clean(params.affiliateUrl, 2_000);

  if (!title || !description || !affiliateUrl) {
    throw new Error("Titulo, descricao e link de afiliado sao obrigatorios para gerar a copy de vendas.");
  }

  return [
    "Crie uma copy curta em portugues do Brasil para narracao de um video vertical de vendas.",
    "Use tom direto, natural e confiavel. Nao invente preco, desconto, estoque, caracteristicas ou promessas.",
    "Inclua uma chamada para conferir o link de afiliado. Retorne apenas a copy, sem titulo, hashtags, markdown ou explicacoes.",
    "Limite: 90 palavras.",
    `Titulo: ${title}`,
    `Descricao: ${description}`,
    `Link de afiliado: ${affiliateUrl}`,
  ].join("\n");
}

export async function generateManualSalesCopy(params: {
  title: string | null | undefined;
  description: string | null | undefined;
  affiliateUrl: string | null | undefined;
}) {
  const apiKey = String(process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const prompt = buildManualSalesCopyPrompt(params);
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.SHOPEE_SALES_COPY_MODEL || "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 220,
      messages: [
        { role: "system", content: "Voce escreve copies de vendas curtas, factuais e adequadas para narracao." },
        { role: "user", content: prompt },
      ],
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(60_000),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`OpenAI copy generation failed (HTTP ${response.status}): ${String(payload?.error?.message || response.statusText)}`);
  }

  const copy = clean(payload?.choices?.[0]?.message?.content, 2_500);
  if (!copy) throw new Error("OpenAI did not return a sales copy.");
  return { copy, model: process.env.SHOPEE_SALES_COPY_MODEL || "gpt-4o-mini", prompt };
}
