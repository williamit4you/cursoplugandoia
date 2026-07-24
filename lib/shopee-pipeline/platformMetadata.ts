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

function buildYoutubeTitle(params: { title: string; caption: string }) {
  const raw = clean(params.title || params.caption, 100);
  if (raw) return raw;
  return "Produto em destaque";
}

function ensureBioCta(value: string) {
  if (/link na bio/i.test(value)) return value;
  return "Confira o link na bio para ver mais detalhes.";
}

function buildYoutubeCta(value: string, affiliateUrl: string) {
  const cleaned = clean(value, 220);
  if (cleaned) return cleaned;
  if (affiliateUrl) return "Confira o link na descrição para saber mais.";
  return "Confira os detalhes na descrição.";
}

function extractKeywords(source: string, max: number) {
  return Array.from(
    new Set(
      clean(source, 500)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .match(/[a-z0-9]{4,}/g) || [],
    ),
  )
    .filter((term) => !["para", "com", "mais", "isso", "essa", "esse", "produto", "video", "link", "descricao"].includes(term))
    .slice(0, max)
    .map((term) => `#${term}`);
}

function ensureHashtags(value: unknown, fallbackSource: string, max: number) {
  const tags = normalizeHashtags(value, max);
  if (tags.length > 0) return tags;
  return extractKeywords(fallbackSource, max);
}

function buildYoutubeDescription(params: {
  baseDescription: string;
  caption: string;
  cta: string;
  hashtags: string[];
  affiliateUrl: string;
}) {
  const body = [params.baseDescription, params.caption, params.cta, params.hashtags.join(" ")]
    .map((item) => clean(item, 4_000))
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 3_700);

  if (!params.affiliateUrl) return body;
  if (body.includes(params.affiliateUrl)) return body;
  return `${params.affiliateUrl}\n\n${body}`.trim().slice(0, 4_000);
}

function readPlatform(
  value: any,
  platform: ManualPlatform,
  affiliateUrl: string,
  fallback: { title: string; productDescription: string; narrationScript: string },
): PlatformPublicationCopy {
  const fallbackCaption = clean(value?.description || fallback.narrationScript || fallback.productDescription || fallback.title, 2_000);
  const caption = clean(value?.caption, 2_000) || fallbackCaption;
  const title = clean(value?.title, 100);
  const cta = clean(value?.cta, 220);
  const hashtags = normalizeHashtags(value?.hashtags, platform === "INSTAGRAM" ? 8 : platform === "TIKTOK" ? 5 : 3);
  const baseDescription = clean(value?.description || caption, 4_000);

  if (!caption) {
    throw new Error(`Metadados incompletos para ${platform}.`);
  }

  if (platform === "YOUTUBE") {
    const safeTitle = buildYoutubeTitle({ title: title || fallback.title, caption });
    const safeHashtags = ensureHashtags(value?.hashtags, `${safeTitle} ${caption} ${fallback.productDescription}`, 3);
    const safeCta = buildYoutubeCta(cta, affiliateUrl);
    const description = buildYoutubeDescription({
      baseDescription,
      caption,
      cta: safeCta,
      hashtags: safeHashtags,
      affiliateUrl,
    });
    return { platform, title: safeTitle, caption, hashtags: safeHashtags, cta: safeCta, description };
  }

  const safeHashtags = ensureHashtags(value?.hashtags, `${fallback.title} ${caption} ${fallback.productDescription}`, platform === "INSTAGRAM" ? 8 : 5);
  const safeCta = ensureBioCta(cta);
  const description = `${caption}\n\n${safeHashtags.join(" ")}\n\n${safeCta}`.replace(/\n{3,}/g, "\n\n").trim();
  if (/https?:\/\//i.test(description)) {
    throw new Error(`${platform} nao pode receber URL na legenda; use o CTA para link na bio.`);
  }
  return { platform, title: title || caption.slice(0, 100), caption, hashtags: safeHashtags, cta: safeCta, description };
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
  const fallback = { title, productDescription, narrationScript };
  const metadata: ManualPlatformMetadata = {
    TIKTOK: readPlatform(parsed.TIKTOK, "TIKTOK", affiliateUrl, fallback),
    INSTAGRAM: readPlatform(parsed.INSTAGRAM, "INSTAGRAM", affiliateUrl, fallback),
    YOUTUBE: readPlatform(parsed.YOUTUBE, "YOUTUBE", affiliateUrl, fallback),
  };
  return { metadata, model: process.env.SHOPEE_PLATFORM_METADATA_MODEL || "gpt-4o-mini" };
}
