/**
 * Shopee product scraping using the Chromium already bundled with render-service.
 * This is the active scraping path used by the admin panel.
 */

export type ScrapedMedia = {
  tipo: "IMAGE" | "VIDEO";
  url: string;
};

export type ShopeeScrapedProduct = {
  titulo: string;
  descricao: string;
  detalhes: string;
  aiPromptVendas: string;
  linksMedia: ScrapedMedia[];
};

type JsonLdProduct = {
  name?: string;
  description?: string;
  image?: string | string[];
};

type ShopeeItemApiResponse = {
  ok: boolean;
  status: number;
  data: any;
};

function normalizeText(value: string | null | undefined) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanShopeeText(value: string | null | undefined) {
  return normalizeText(value).replace(/\|\s*Shopee\s+Brasil.*$/i, "").trim();
}

function cleanupMarketingText(value: string | null | undefined) {
  return cleanShopeeText(value)
    .replace(/%C[0-9A-F]{1,2}/gi, " ")
    .replace(/\b\d{8,}\b/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function sanitizeTitleForSpokenAd(value: string | null | undefined) {
  const text = cleanupMarketingText(value);
  if (!text) return "";

  const withoutBrackets = text.replace(/\[[^\]]*]/g, " ").replace(/\([^)]*\)/g, " ");
  const normalized = withoutBrackets.replace(/[|•·]/g, " ").replace(/\s{2,}/g, " ").trim();

  const rawTokens = normalized.split(/\s+/).filter(Boolean);
  const filtered = rawTokens.filter((token) => {
    const t = token.trim();
    if (!t) return false;
    if (t.length <= 1) return false;
    if (/^\d+$/.test(t)) return false;
    if (/[0-9]/.test(t) && /[a-zA-ZÀ-ÿ]/.test(t)) return false; // "1080P", "iCSee", "A8", etc
    if (/^ip\d{2,}$/i.test(t)) return false;
    if (/^\d{2,}\s*-\s*\d{2,}$/i.test(t)) return false;
    if (/^\d{2,}\s*-\s*\d{2,}v$/i.test(t)) return false;
    if (/^\d{2,}v$/i.test(t)) return false;
    if (/^\d{3,}mah$/i.test(t)) return false;
    if (/^\d{3,}w$/i.test(t)) return false;
    if (/^\d{3,}ml$/i.test(t)) return false;
    if (/^\d{2,}l$/i.test(t)) return false;
    if (/^[A-Z]{2,6}$/.test(t)) return false; // "HD", "APP", etc (sole token)
    if (/^(app|icsee|yoosee|tuya|alexa|google|smart|wifi|bluetooth)$/i.test(t)) return false;
    return true;
  });

  const collapsed = filtered.join(" ").replace(/\s{2,}/g, " ").trim();
  return collapsed;
}

function inferFriendlyProductName(titulo: string, descricao: string, detalhes: string) {
  const haystack = cleanupMarketingText(`${titulo} ${descricao} ${detalhes}`).toLowerCase();

  const rules: Array<{ re: RegExp; label: string }> = [
    { re: /\b(cam(era)?|câmera)\b/, label: "câmera de segurança" },
    { re: /\b(furadeira|parafusadeira)\b/, label: "furadeira/parafusadeira" },
    { re: /\b(air\s*fryer|airfryer)\b/, label: "airfryer" },
    { re: /\b(liquidificador)\b/, label: "liquidificador" },
    { re: /\b(aspirador)\b/, label: "aspirador" },
    { re: /\b(fone|headset|auricular)\b/, label: "fone de ouvido" },
    { re: /\b(teclado)\b/, label: "teclado" },
    { re: /\b(mouse)\b/, label: "mouse" },
    { re: /\b(rel[óo]gio|smartwatch)\b/, label: "relógio" },
    { re: /\b(vestido)\b/, label: "vestido" },
    { re: /\b(camisa|camiseta)\b/, label: "camiseta" },
    { re: /\b(cal[cç]a|jeans)\b/, label: "calça" },
    { re: /\b(t[eê]nis|sapato)\b/, label: "tênis" },
    { re: /\b(bolsa)\b/, label: "bolsa" },
    { re: /\b(mochila)\b/, label: "mochila" },
  ];

  const matched = rules.find((r) => r.re.test(haystack));
  if (matched) return matched.label;

  const titleSlim = sanitizeTitleForSpokenAd(titulo);
  if (titleSlim) return titleSlim.split(/\s+/).slice(0, 6).join(" ").trim();
  return "este produto";
}

function stripTechnicalTokensForSpeech(value: string) {
  return String(value || "")
    .replace(/\bip\s*\d{2,3}\b/gi, "")
    .replace(/\b\d{3,4}\s*p\b/gi, "")
    .replace(/\b(4k|8k)\b/gi, "")
    .replace(/\b\d{2,3}\s*-\s*\d{2,3}\s*v\b/gi, "")
    .replace(/\b\d{2,3}\s*v\b/gi, "")
    .replace(/\b\d+(\.\d+)?\s*(ghz|mhz)\b/gi, "")
    .replace(/\b\d{3,5}\s*(mah|wh|w)\b/gi, "")
    // model/codigo: mistura letras+numeros (ex: A8, X12Pro, H9, 2.4G, etc)
    .replace(/\b(?=[a-zA-ZÀ-ÿ0-9]{3,}\b)(?=.*[0-9])(?=.*[a-zA-ZÀ-ÿ])[a-zA-ZÀ-ÿ0-9-_.]+\b/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function removeLowValueSalesNoise(value: string | null | undefined) {
  return cleanupMarketingText(value)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .filter(
      (sentence) =>
        !/(primeiro uso|deix[aá]-?lo carregando|carregando de \d|antes do primeiro uso|manual|instru[cç][aã]o)/i.test(sentence)
    )
    .map((sentence) => sentence.replace(/\([^)]*$/g, "").trim())
    .filter((sentence) => sentence.length >= 12)
    .join(" ");
}

function isSuspiciousProductTitle(value: string | null | undefined) {
  const text = cleanupMarketingText(value);
  if (!text) return true;
  if (text.toLowerCase() === "shopee__domain") return true;
  if (/^\d[\d\s\-_.]{5,}$/.test(text)) return true;
  if (text.length < 6) return true;
  return false;
}

function inferProductTitleFromContent(descricao: string, detalhes: string) {
  const base = cleanupMarketingText(`${descricao} ${detalhes}`);
  if (!base) return "";

  const productMatch =
    base.match(/(?:produto|item)\s*:\s*([^|.]{8,90})/i) ||
    base.match(/compre\s+([^|.]{8,90})/i) ||
    base.match(/camiseta\s+([^|.]{4,80})/i);

  if (productMatch?.[1]) {
    return cleanupMarketingText(productMatch[1]);
  }

  const sentence = base.split(/[.!?]/).map((part) => cleanupMarketingText(part)).find((part) => part.length >= 8);
  return sentence ? sentence.slice(0, 90).trim() : "";
}

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function stripHtml(value: string) {
  return normalizeText(decodeHtml(value).replace(/<[^>]+>/g, " "));
}

function detectShopeeBlockingState(html: string) {
  const text = stripHtml(html).toLowerCase();
  if (
    text.includes("pagina indisponivel") ||
    text.includes("faça login e tente novamente") ||
    text.includes("faca login e tente novamente") ||
    text.includes("algo deu errado")
  ) {
    return "Shopee bloqueou esta pagina para acesso anonimo ou exige login.";
  }
  return "";
}

function extractMetaContent(html: string, attr: "name" | "property", key: string) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`<meta[^>]+${attr}=["']${escaped}["'][^>]+content=["']([^"']*)["']`, "i");
  const match = html.match(regex);
  return match ? decodeHtml(match[1]) : "";
}

function extractJsonLdProducts(html: string): JsonLdProduct[] {
  const blocks = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  const products: JsonLdProduct[] = [];

  const visit = (node: any) => {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (typeof node !== "object") return;
    if (String(node["@type"] || "").toLowerCase() === "product") {
      products.push(node);
    }
    for (const value of Object.values(node)) visit(value);
  };

  for (const block of blocks) {
    const jsonMatch = block.match(/>([\s\S]*?)<\/script>/i);
    if (!jsonMatch) continue;
    try {
      visit(JSON.parse(jsonMatch[1]));
    } catch {
      // ignore malformed json-ld
    }
  }

  return products;
}

function extractSectionByHeading(html: string, headings: string[]) {
  for (const heading of headings) {
    const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`${escaped}[\\s\\S]{0,300}?<div[^>]*>([\\s\\S]{20,2500}?)<\\/div>`, "i");
    const match = html.match(regex);
    if (match) {
      const text = stripHtml(match[1]);
      if (text) return text;
    }
  }
  return "";
}

function normalizeDomainFromUrl(productUrl: string) {
  try {
    return new URL(productUrl).hostname || "shopee.com.br";
  } catch {
    return "shopee.com.br";
  }
}

function parseIdsFromProductUrl(productUrl: string) {
  const itemMatch = productUrl.match(/-i\.(\d+)\.(\d+)/i);
  if (itemMatch) {
    return {
      shopId: Number(itemMatch[1]),
      itemId: Number(itemMatch[2]),
    };
  }

  const productMatch = productUrl.match(/\/product\/(\d+)\/(\d+)/i);
  if (productMatch) {
    return {
      shopId: Number(productMatch[1]),
      itemId: Number(productMatch[2]),
    };
  }

  return null;
}

function buildApiItemUrl(domain: string, shopId: number, itemId: number) {
  const url = new URL(`https://${domain}/api/v4/item/get`);
  url.searchParams.set("shopid", String(shopId));
  url.searchParams.set("itemid", String(itemId));
  return url.toString();
}

function buildImageUrl(domain: string, imageId: string) {
  const normalizedDomain = normalizeDomainFromUrl(`https://${domain}`);
  const match = normalizedDomain.match(/shopee\.com(?:\.(\w+))?$/i);
  const site = (match?.[1] || "br").toLowerCase();
  const host = site === "br" ? "down-br.img.susercontent.com" : `down-${site}.img.susercontent.com`;
  return `https://${host}/file/${encodeURIComponent(imageId)}`;
}

function collectTextFragments(node: unknown, out: string[]) {
  if (!node) return;
  if (typeof node === "string") {
    const normalized = cleanShopeeText(node);
    if (normalized) out.push(normalized);
    return;
  }
  if (Array.isArray(node)) {
    for (const value of node) collectTextFragments(value, out);
    return;
  }
  if (typeof node !== "object") return;
  for (const value of Object.values(node as Record<string, unknown>)) {
    collectTextFragments(value, out);
  }
}

function buildDetalhesFromApi(item: any) {
  const parts: string[] = [];

  const itemAttributes = Array.isArray(item?.item_attributes) ? item.item_attributes : [];
  for (const attr of itemAttributes) {
    const name = cleanShopeeText(attr?.name || attr?.display_name || "");
    const value = cleanShopeeText(attr?.value || attr?.display_value || "");
    if (name && value) parts.push(`${name}: ${value}`);
  }

  const tierVariations = Array.isArray(item?.tier_variations) ? item.tier_variations : [];
  for (const variation of tierVariations) {
    const name = cleanShopeeText(variation?.name || "");
    const options = Array.isArray(variation?.options)
      ? variation.options.map((value: unknown) => cleanShopeeText(String(value || ""))).filter(Boolean)
      : [];
    if (name && options.length > 0) parts.push(`${name}: ${options.join(", ")}`);
  }

  if (parts.length === 0) {
    const fragments: string[] = [];
    collectTextFragments(item?.specification, fragments);
    collectTextFragments(item?.product_attributes, fragments);
    collectTextFragments(item?.attributes, fragments);
    return cleanShopeeText(fragments.join(" | "));
  }

  return cleanShopeeText(parts.join(" | "));
}

function extractApiImageUrls(domain: string, item: any) {
  const images: string[] = [];
  const add = (value: unknown) => {
    const str = String(value || "").trim();
    if (!str) return;
    if (/^https?:\/\//i.test(str)) {
      images.push(str);
      return;
    }
    images.push(buildImageUrl(domain, str));
  };

  add(item?.image);

  const list = Array.isArray(item?.images) ? item.images : [];
  for (const image of list) add(image);

  return Array.from(new Set(images.filter(Boolean)));
}

function extractVideoUrlFromInfo(info: any): string {
  if (!info) return "";
  if (typeof info === "string") {
    return /^https?:\/\//i.test(info) ? info : "";
  }
  if (Array.isArray(info)) {
    for (const value of info) {
      const candidate = extractVideoUrlFromInfo(value);
      if (candidate) return candidate;
    }
    return "";
  }
  if (typeof info !== "object") return "";

  const preferredKeys = [
    "video_url",
    "play_url",
    "url",
    "src",
    "mp4",
    "default_play_url",
    "default_format",
    "play_addr",
  ];

  for (const key of preferredKeys) {
    if (!(key in info)) continue;
    const candidate = extractVideoUrlFromInfo(info[key]);
    if (candidate) return candidate;
  }

  for (const [key, value] of Object.entries(info)) {
    if (/url|src|play|mp4/i.test(key)) {
      const candidate = extractVideoUrlFromInfo(value);
      if (candidate) return candidate;
    }
  }

  for (const value of Object.values(info)) {
    const candidate = extractVideoUrlFromInfo(value);
    if (candidate) return candidate;
  }

  return "";
}

function extractApiVideoUrl(item: any) {
  const videoList = Array.isArray(item?.video_info_list) ? item.video_info_list : [];
  for (const videoInfo of videoList) {
    const candidate = extractVideoUrlFromInfo(videoInfo);
    if (candidate) return candidate;
  }
  return "";
}

async function firstTextContent(page: any, selector: string) {
  try {
    const elements = await page.$$(selector);
    if (!elements.length) return "";
    const value = await elements[0].evaluate((element: Element) => element.textContent || "");
    return cleanShopeeText(value);
  } catch {
    return "";
  }
}

async function firstVideoSrc(page: any, selector: string) {
  try {
    const elements = await page.$$(selector);
    if (!elements.length) return "";
    const value = await elements[0].evaluate((element: Element) => {
      const video = element as HTMLVideoElement;
      return video.src || "";
    });
    return String(value || "");
  } catch {
    return "";
  }
}

async function fetchJsonViaPage(page: any, url: string): Promise<ShopeeItemApiResponse> {
  try {
    return await page.evaluate(async (requestUrl: string) => {
      try {
        const res = await fetch(requestUrl, {
          credentials: "include",
          headers: {
            accept: "application/json",
          },
        });
        const text = await res.text();
        let data: any = null;
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          data = { rawText: text };
        }
        return { ok: res.ok, status: res.status, data };
      } catch (error: any) {
        return {
          ok: false,
          status: 0,
          data: { error: error?.message || "fetch failed" },
        };
      }
    }, url);
  } catch (error: any) {
    return {
      ok: false,
      status: 0,
      data: { error: error?.message || "page evaluate failed" },
    };
  }
}

function dynamicRequire(moduleName: string) {
  // eslint-disable-next-line no-eval
  const req = eval("require") as (name: string) => any;
  return req(moduleName);
}

function executableCandidates() {
  return [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.REMOTION_CHROME_BIN,
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ].filter(Boolean) as string[];
}

async function firstExistingExecutable(): Promise<string> {
  const fs = await import("fs/promises");
  for (const candidate of executableCandidates()) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // try next
    }
  }
  throw new Error("Chrome/Chromium nao encontrado. Verifique PUPPETEER_EXECUTABLE_PATH ou REMOTION_CHROME_BIN.");
}

export async function uploadToMinio(fileBuffer: Buffer, key: string, contentType: string): Promise<string> {
  const { S3Client, PutObjectCommand } = dynamicRequire("@aws-sdk/client-s3");
  const endpoint = process.env.MINIO_INTERNAL_ENDPOINT || process.env.MINIO_ENDPOINT;
  const publicUrl = process.env.MINIO_PUBLIC_URL;
  const bucket = process.env.MINIO_BUCKET_NAME || "uploads";

  if (!endpoint || !publicUrl) {
    throw new Error("MINIO_ENDPOINT e MINIO_PUBLIC_URL precisam estar configurados.");
  }

  const s3 = new S3Client({
    endpoint,
    region: "us-east-1",
    credentials: {
      accessKeyId: process.env.MINIO_ACCESS_KEY || "",
      secretAccessKey: process.env.MINIO_SECRET_KEY || "",
    },
    forcePathStyle: true,
  });

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    })
  );

  return `${publicUrl.replace(/\/+$/, "")}/${key}`;
}

export async function generateSalesScript(titulo: string, descricao: string, detalhes: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return "";

  const model = process.env.VIDEO_CODE_AI_MODEL || "gpt-4o-mini";
  const tituloSeguro = cleanupMarketingText(titulo);
  const nomeCurto = inferFriendlyProductName(titulo, descricao, detalhes);
  const descricaoSegura = removeLowValueSalesNoise(descricao).slice(0, 1500);
  const detalhesSeguros = removeLowValueSalesNoise(detalhes).slice(0, 1500);

  const body = JSON.stringify({
    model,
    temperature: 0.85,
    messages: [
      {
        role: "system",
        content:
          "Voce e um copywriter senior de resposta direta para videos curtos de vendas.\n" +
          "Antes de escrever, interprete o produto e identifique: dor que resolve, desejo que ativa, publico comprador e principal beneficio percebido.\n" +
          "O texto deve vender o produto como uma oferta irresistivel, nao apenas descrever caracteristicas.\n" +
          "A copy deve seguir esta estrutura: GANCHO FORTE + PROBLEMA/DESEJO + BENEFICIO PRINCIPAL + PROVA/DETALHE + CTA.\n" +
          "Escreva como uma pessoa real falaria em um video UGC/TikTok, com tom natural, curto, direto, convincente e profissional.\n" +
          "O gancho deve partir do USO e do BENEFICIO (ex: seguranca, praticidade, saude, beleza, conforto, renda extra), como se estivesse resolvendo um problema real.\n" +
          "Nunca comece com 'Olha isso', 'Compre agora' ou repetindo o nome cru do produto.\n" +
          "Nunca leia codigos, ids, sku, numeros soltos, porcentagens estranhas, texto truncado, URLs ou marcacoes internas.\n" +
          "Nao use no texto siglas, nomes de app/modelo e especificacoes tecnicas que ficam ruins em audio. Exemplos (apenas exemplos): IP66, 1080P, 110-220V, ICSEE, YOOSEE.\n" +
          "A regra vale para QUALQUER termo tecnico parecido (codigos, modelos, combinacoes de letras+numeros, siglas, etc).\n" +
          "Quando existir especificacao tecnica importante, traduza para beneficio humano (ex: 'resistente a agua', 'imagem em alta definicao', 'bivolt', 'controle pelo app').\n" +
          "Se a descricao vier confusa, cortada ou ruim, descarte trechos quebrados e irrelevantes.\n" +
          "Nao cite instrucoes tecnicas sem apelo de venda, como tempo de carregamento inicial, salvo se forem um diferencial real para comprar.\n" +
          "Se o titulo estiver ruim, priorize o contexto da descricao e dos detalhes para identificar o produto.\n" +
          "Transforme caracteristicas tecnicas em beneficios claros para o comprador.\n" +
          "Mostre para quem o produto e util e em qual situacao ele resolve um problema.\n" +
          "Evite frases genericas como 'boa apresentacao', 'vale conhecer melhor' ou 'potencial para surpreender'.\n" +
          "Nao prometa resultados impossiveis nem invente funcionalidades que nao estejam no produto.\n" +
          "Use gatilhos com moderacao: praticidade, economia, tecnologia, presente, estilo, novidade e custo-beneficio.\n" +
          'Obrigatorio: terminar com uma variacao natural de "Para ter acesso ao produto, o link esta na bio!".\n' +
          'Responda apenas com JSON valido: {"script_vendas":"..."}',
      },
      {
        role: "user",
        content:
          `Titulo original (nao repetir literalmente): ${tituloSeguro}\n` +
          `Nome curto sugerido (use este no texto): ${nomeCurto}\n` +
          `Descricao comercial filtrada: ${descricaoSegura}\n` +
          `Detalhes uteis filtrados: ${detalhesSeguros}\n` +
          "Escreva um texto pronto para locucao, fluido, vendedor e focado somente no que ajuda a pessoa a desejar e comprar o produto.",
      },
    ],
  });

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body,
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) return "";
    const data = await res.json();
    const text = String(data?.choices?.[0]?.message?.content ?? "").trim();

    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) return text;
    const parsed = JSON.parse(text.slice(start, end + 1));
    const script = cleanupMarketingText(String(parsed?.script_vendas ?? "").trim());
    // Final safety net: avoid app/model tokens being read in audio.
    return stripTechnicalTokensForSpeech(
      script
        .replace(/\b(icsee|yoosee|tuya)\b/gi, "")
        .replace(/\s{2,}/g, " ")
        .trim()
    );
  } catch {
    return "";
  }
}

export async function scrapeShopeeProduct(productUrl: string): Promise<ShopeeScrapedProduct> {
  const executablePath = await firstExistingExecutable();
  const puppeteerExtra = dynamicRequire("puppeteer-extra");
  const StealthPlugin = dynamicRequire("puppeteer-extra-plugin-stealth");
  const puppeteerCore = dynamicRequire("puppeteer-core");
  const puppeteer = puppeteerExtra.addExtra(puppeteerCore);
  puppeteer.use(StealthPlugin());
  const domain = normalizeDomainFromUrl(productUrl);
  const parsedIds = parseIdsFromProductUrl(productUrl);

  console.log(`[shopee-scrape] Iniciando scraping de: ${productUrl}`);
  console.log(`[shopee-scrape] Usando Chrome: ${executablePath}`);

  const browser = await puppeteer.launch({
    executablePath,
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled",
      "--window-size=1920,1080",
      "--disable-infobars",
      "--disable-extensions",
      "--disable-web-security",
      "--disable-features=IsolateOrigins,site-per-process",
    ],
  });

  let titulo = "";
  let descricao = "";
  let detalhes = "";
  let imageUrls: string[] = [];
  let videoUrl: string | null = null;
  let itemApiData: any = null;

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    );
    await page.setExtraHTTPHeaders({
      "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    });

    await page.goto(productUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector("body", { timeout: 10000 });
    await new Promise((resolve) => setTimeout(resolve, 3000));

    if (parsedIds) {
      const itemApi = await fetchJsonViaPage(page, buildApiItemUrl(domain, parsedIds.shopId, parsedIds.itemId));
      if (itemApi.ok) {
        itemApiData = itemApi.data?.data?.item || itemApi.data?.data || null;
        console.log(
          `[shopee-scrape] item/get OK para shopId=${parsedIds.shopId} itemId=${parsedIds.itemId} | video_info_list=${Array.isArray(itemApiData?.video_info_list) ? itemApiData.video_info_list.length : 0}`
        );
      } else {
        console.warn(`[shopee-scrape] item/get falhou: HTTP ${itemApi.status} ${itemApi.data?.error || ""}`.trim());
      }
    } else {
      console.warn("[shopee-scrape] Nao foi possivel extrair shopId/itemId da URL.");
    }

    const html = await page.content();
    const pageTitle = await page.title();
    const blockingReason = detectShopeeBlockingState(html);

    const headingTitle = await firstTextContent(page, "div[class*='page-product'] h1, h1, [class*='product-name']");
    const metaTitle = extractMetaContent(html, "property", "og:title");
    const jsonLdProduct = extractJsonLdProducts(html)[0] || {};
    titulo = cleanShopeeText(itemApiData?.name || headingTitle || jsonLdProduct.name || metaTitle || pageTitle);

    const descFromDom = await firstTextContent(
      page,
      "div[class*='product-detail'], div[style*='white-space: pre-wrap'], [class*='product-description']"
    );
    const metaDescription =
      extractMetaContent(html, "name", "description") || extractMetaContent(html, "property", "og:description");
    const descSection = extractSectionByHeading(html, ["Descricao do produto", "Descricao", "Product Description"]);
    descricao = cleanShopeeText(
      itemApiData?.description || descFromDom || descSection || jsonLdProduct.description || metaDescription
    );

    const detailsSection = extractSectionByHeading(html, [
      "Detalhes do Produto",
      "Caracteristicas do Produto",
      "Especificacoes",
      "Informacoes do Produto",
    ]);
    detalhes = cleanShopeeText(buildDetalhesFromApi(itemApiData) || detailsSection);

    imageUrls = extractApiImageUrls(domain, itemApiData);
    if (imageUrls.length === 0) {
      imageUrls = await page.$$eval("picture img, img", (elements) =>
        Array.from(
          new Set(
            elements
              .map((element) => {
                const image = element as HTMLImageElement;
                return image.currentSrc || image.src || "";
              })
              .filter((src) => /^https?:\/\//i.test(src) && /susercontent\.com|shopee/i.test(src))
          )
        )
      );
    }

    const jsonLdImages = Array.isArray(jsonLdProduct.image)
      ? jsonLdProduct.image
      : jsonLdProduct.image
        ? [jsonLdProduct.image]
        : [];
    if (jsonLdImages.length > 0) {
      imageUrls = Array.from(new Set([...imageUrls, ...jsonLdImages.map((image) => String(image).trim())]));
    }

    videoUrl = extractApiVideoUrl(itemApiData) || (await firstVideoSrc(page, "video")) || null;
    if (!videoUrl) {
      const mp4Match = html.match(/https?:\/\/[^\s"'<>]+\.mp4[^\s"'<>]*/i);
      if (mp4Match) {
        videoUrl = mp4Match[0].replace(/\\+$/, '');
        console.log("[shopee-scrape] Video encontrado via regex no HTML:", videoUrl);
      }
    }

    if (!itemApiData && blockingReason) {
      throw new Error(blockingReason);
    }

    console.log(`[shopee-scrape] Titulo: ${titulo.slice(0, 60)}`);
    console.log(
      `[shopee-scrape] Imagens: ${imageUrls.length} | Video: ${videoUrl ? "sim" : "nao"} | API item/get: ${itemApiData ? "sim" : "nao"}`
    );
  } finally {
    await browser.close();
  }

  if (!titulo) {
    throw new Error("Scraping retornou dados insuficientes da Shopee.");
  }
  if (!videoUrl) {
    console.warn("[shopee-scrape] Nenhum video encontrado nesta pagina da Shopee.");
  }

  const linksMedia: ScrapedMedia[] = [];
  const ts = Date.now();

  for (let i = 0; i < Math.min(5, imageUrls.length); i += 1) {
    const imgUrl = imageUrls[i];
    try {
      const res = await fetch(imgUrl, { signal: AbortSignal.timeout(20000) });
      if (!res.ok) continue;

      const contentType = (res.headers.get("content-type") || "").toLowerCase();
      const buf = Buffer.from(await res.arrayBuffer());
      const ext =
        contentType.includes("png") || imgUrl.includes(".png")
          ? "png"
          : contentType.includes("webp") || imgUrl.includes(".webp")
            ? "webp"
            : contentType.includes("gif") || imgUrl.includes(".gif")
              ? "gif"
              : "jpg";
      const minioUrl = await uploadToMinio(buf, `shopee/images/shopee_img_${ts}_${i}.${ext}`, `image/${ext}`);
      linksMedia.push({ tipo: "IMAGE", url: minioUrl });
      console.log(`[shopee-scrape] Imagem ${i + 1} enviada: ${minioUrl}`);
    } catch (error) {
      console.error(`[shopee-scrape] Erro na imagem ${i}:`, error);
    }
  }

  if (videoUrl) {
    try {
      const res = await fetch(videoUrl, {
        headers: {
          referer: `https://${domain}/`,
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(60000),
      });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        const minioUrl = await uploadToMinio(buf, `shopee/videos/shopee_vid_${ts}.mp4`, "video/mp4");
        linksMedia.push({ tipo: "VIDEO", url: minioUrl });
        console.log(`[shopee-scrape] Video enviado: ${minioUrl}`);
      }
    } catch (error) {
      console.error("[shopee-scrape] Erro no video:", error);
    }
  }

  if (!linksMedia.some((item) => item.tipo === "VIDEO")) {
    console.warn("[shopee-scrape] Video nao foi possivel baixar/enviar para MinIO, retornando apenas imagens.");
  }

  console.log("[shopee-scrape] Gerando script de vendas com IA...");
  const aiPromptVendas = await generateSalesScript(titulo, descricao, detalhes);

  return {
    titulo,
    descricao,
    detalhes,
    aiPromptVendas,
    linksMedia,
  };
}
