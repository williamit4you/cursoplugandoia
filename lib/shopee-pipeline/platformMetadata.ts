import "server-only";

export type ManualPlatform = "TIKTOK" | "INSTAGRAM" | "YOUTUBE";

export type PlatformPublicationCopy = {
  platform: ManualPlatform;
  title: string;
  caption: string;
  hashtags: string[];
  cta: string;
  description: string;
};

export type ManualPlatformMetadata = Record<ManualPlatform, PlatformPublicationCopy>;

function clean(value: unknown, maxLength: number) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function normalizeHashtags(value: unknown, max: number) {
  if (!Array.isArray(value)) return [];
  return value
    .map((tag) => clean(tag, 60).replace(/^#*/, ""))
    .filter(Boolean)
    .map((tag) => `#${tag.replace(/\s+/g, "")}`)
    .slice(0, max);
}

function readPlatform(value: any, platform: ManualPlatform, affiliateUrl: string): PlatformPublicationCopy {
  const caption = clean(value?.caption, 2_000);
  const title = clean(value?.title, 100);
  const cta = clean(value?.cta, 220);
  const hashtags = normalizeHashtags(value?.hashtags, platform === "INSTAGRAM" ? 8 : platform === "TIKTOK" ? 5 : 3);
  const baseDescription = clean(value?.description || caption, 4_000);

  if (!caption || !cta || (platform === "YOUTUBE" && !title)) {
    throw new Error(`Metadados incompletos para ${platform}.`);
  }

  if (platform === "YOUTUBE") {
    const description = baseDescription.includes(affiliateUrl)
      ? baseDescription
      : `${affiliateUrl}\n\n${baseDescription}`.slice(0, 4_000);
    return { platform, title, caption, hashtags, cta, description };
  }

  const description = `${caption}\n\n${hashtags.join(" ")}\n\n${cta}`.replace(/\n{3,}/g, "\n\n").trim();
  if (/https?:\/\//i.test(description)) {
    throw new Error(`${platform} nao pode receber URL na legenda; use o CTA para link na bio.`);
  }
  if (!/link na bio/i.test(cta)) {
    throw new Error(`${platform} deve usar CTA para o link na bio.`);
  }
  return { platform, title: title || caption.slice(0, 100), caption, hashtags, cta, description };
}

export async function generateManualPlatformMetadata(params: {
  title: string | null;
  productDescription: string | null;
  narrationScript: string | null;
  affiliateUrl: string | null;
  priceText?: string | null;
}) {
  const affiliateUrl = clean(params.affiliateUrl, 2_000);
  const title = clean(params.title, 240);
  const productDescription = clean(params.productDescription, 2_000);
  const narrationScript = clean(params.narrationScript, 2_000);
  const priceText = clean(params.priceText, 240);
  const apiKey = String(process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");
  if (!affiliateUrl || !title || !productDescription) throw new Error("Dados do produto e link de afiliado sao obrigatorios para os textos das redes.");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.SHOPEE_PLATFORM_METADATA_MODEL || "gpt-4o-mini",
      temperature: 0.55,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Você é especialista em conteúdo de performance para TikTok, Instagram Reels e YouTube Shorts. Escreva português do Brasil correto, com acentos e cedilha. Não invente fatos, preço, desconto, estoque, frete ou prazo.",
        },
        {
          role: "user",
          content: JSON.stringify({
            task: "Gere JSON com as chaves TIKTOK, INSTAGRAM e YOUTUBE. Cada chave deve conter title, caption, hashtags (array), cta e description.",
            rules: {
              TIKTOK: "Legenda curta com 3 a 5 hashtags específicas. Não inclua URL. CTA obrigatório: link na bio.",
              INSTAGRAM: "Legenda curta ou média com 3 a 8 hashtags específicas. Não inclua URL. CTA obrigatório: link na bio.",
              YOUTUBE: "Título SEO claro (até 100 caracteres), descrição útil e o link de afiliado literal na primeira linha. Até 3 hashtags relevantes.",
              price: priceText ? `Você pode citar somente este preço/oferta informado: ${priceText}` : "Não mencione preço ou promoção.",
            },
            product: { title, description: productDescription, narrationScript, affiliateUrl },
          }),
        },
      ],
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(60_000),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`OpenAI platform metadata failed (HTTP ${response.status}): ${String(payload?.error?.message || response.statusText)}`);

  const content = String(payload?.choices?.[0]?.message?.content || "");
  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("OpenAI retornou metadados de redes em formato invalido.");
  }
  const metadata: ManualPlatformMetadata = {
    TIKTOK: readPlatform(parsed.TIKTOK, "TIKTOK", affiliateUrl),
    INSTAGRAM: readPlatform(parsed.INSTAGRAM, "INSTAGRAM", affiliateUrl),
    YOUTUBE: readPlatform(parsed.YOUTUBE, "YOUTUBE", affiliateUrl),
  };
  return { metadata, model: process.env.SHOPEE_PLATFORM_METADATA_MODEL || "gpt-4o-mini" };
}
