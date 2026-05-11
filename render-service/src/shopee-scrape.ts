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

async function uploadToMinio(fileBuffer: Buffer, key: string, contentType: string): Promise<string> {
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

async function generateSalesScript(titulo: string, descricao: string, detalhes: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return "";

  const model = process.env.VIDEO_CODE_AI_MODEL || "gpt-4o-mini";

  const body = JSON.stringify({
    model,
    temperature: 0.7,
    messages: [
      {
        role: "system",
        content:
          'Voce e um especialista em marketing digital e copy de vendas.\n' +
          "Crie um script de vendas curto e persuasivo para um produto da Shopee.\n" +
          "Use gatilhos mentais para um vendedor falar em video estilo Reels ou TikTok.\n" +
          'Obrigatorio: o script deve terminar com uma variacao de "Para ter acesso ao produto, o link esta na bio!".\n' +
          'Responda apenas com JSON: {"script_vendas":"seu texto aqui"}',
      },
      {
        role: "user",
        content:
          `Titulo: ${titulo}\n` +
          `Descricao: ${descricao.slice(0, 1500)}\n` +
          `Detalhes do Produto: ${detalhes.slice(0, 1500)}`,
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
    return String(parsed?.script_vendas ?? "").trim();
  } catch {
    return "";
  }
}

export async function scrapeShopeeProduct(productUrl: string): Promise<ShopeeScrapedProduct> {
  const executablePath = await firstExistingExecutable();
  const puppeteer = dynamicRequire("puppeteer-core");

  console.log(`[shopee-scrape] Iniciando scraping de: ${productUrl}`);
  console.log(`[shopee-scrape] Usando Chrome: ${executablePath}`);

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled",
      "--disable-gpu",
    ],
  });

  let titulo = "";
  let descricao = "";
  let detalhes = "";
  let imageUrls: string[] = [];
  let videoUrl: string | null = null;

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 900 });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
    );
    await page.setExtraHTTPHeaders({
      "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    });

    await page.goto(productUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector("body", { timeout: 10000 });
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const pageData = await page.evaluate(() => {
      const normalizeText = (value: string | null | undefined) =>
        String(value || "")
          .replace(/\u00a0/g, " ")
          .replace(/\s+/g, " ")
          .trim();

      const cleanShopeeText = (value: string | null | undefined) => {
        let text = normalizeText(value);
        text = text.replace(/\|\s*Shopee\s+Brasil.*$/i, "").trim();
        return text;
      };

      const parseJsonLdProducts = () => {
        const products: JsonLdProduct[] = [];
        const scripts = Array.from(
          document.querySelectorAll('script[type="application/ld+json"]')
        ) as HTMLScriptElement[];

        const visit = (node: any) => {
          if (!node) return;
          if (Array.isArray(node)) {
            node.forEach(visit);
            return;
          }
          if (typeof node !== "object") return;

          const type = String(node["@type"] || "").toLowerCase();
          if (type === "product") {
            products.push(node);
          }

          for (const value of Object.values(node)) visit(value);
        };

        for (const script of scripts) {
          try {
            visit(JSON.parse(script.textContent || ""));
          } catch {
            // ignore malformed blocks
          }
        }

        return products;
      };

      const looksLikeProductImage = (src: string) =>
        /^https?:\/\//i.test(src) && /susercontent\.com|shopee/i.test(src);

      const findSectionContent = (sectionNames: string[]) => {
        const wanted = new Set(sectionNames.map((item) => item.toLowerCase()));
        const elements = Array.from(document.querySelectorAll("h1, h2, h3, h4, div, span, p, label"));

        for (const element of elements) {
          const heading = normalizeText(element.textContent);
          if (!heading || !wanted.has(heading.toLowerCase())) continue;

          const candidates: Element[] = [];
          if (element.parentElement) candidates.push(element.parentElement);
          if (element.nextElementSibling) candidates.push(element.nextElementSibling);
          if (element.parentElement?.nextElementSibling) candidates.push(element.parentElement.nextElementSibling);

          for (const candidate of candidates) {
            const text = normalizeText(candidate.textContent);
            if (!text || text.length <= heading.length) continue;
            const withoutHeading = normalizeText(text.replace(heading, ""));
            if (withoutHeading) return withoutHeading;
          }
        }

        return "";
      };

      const collectDetailLines = () => {
        const detailLines = new Set<string>();
        const elements = Array.from(document.querySelectorAll("div, li, tr"));

        for (const element of elements) {
          const text = normalizeText(element.textContent);
          if (!text || text.length < 4 || text.length > 240) continue;

          const looksLikePair =
            /:\s*\S/.test(text) ||
            /\b(origem|material|genero|estilo|tipo|modelo|marca|categoria|estoque|enviado de|comprimento|altura|largura|peso)\b/i.test(
              text
            );

          if (!looksLikePair) continue;
          detailLines.add(text);
          if (detailLines.size >= 12) break;
        }

        return Array.from(detailLines).join("\n");
      };

      const jsonLdProduct = parseJsonLdProducts()[0] || {};

      const titleEl =
        document.querySelector("div[class*='page-product'] h1") ||
        document.querySelector("h1") ||
        document.querySelector("[class*='product-name']");
      const metaTitle =
        document.querySelector('meta[property="og:title"]')?.getAttribute("content") ||
        document.title ||
        "";
      const title = cleanShopeeText(titleEl?.textContent || jsonLdProduct.name || metaTitle);

      const metaDescription =
        document.querySelector('meta[name="description"]')?.getAttribute("content") ||
        document.querySelector('meta[property="og:description"]')?.getAttribute("content") ||
        "";
      const descSection = findSectionContent(["Descricao do produto", "Descricao", "Product Description"]);
      const descEl =
        document.querySelector("div[class*='product-detail']") ||
        document.querySelector("div[style*='white-space: pre-wrap']") ||
        document.querySelector("[class*='product-description']");
      const desc = cleanShopeeText(
        descSection || descEl?.textContent || jsonLdProduct.description || metaDescription
      );

      const detailsSection = findSectionContent([
        "Detalhes do Produto",
        "Caracteristicas do Produto",
        "Especificacoes",
        "Informacoes do Produto",
      ]);
      const detailLines = collectDetailLines();
      const details = cleanShopeeText(detailsSection || detailLines);

      const imageSet = new Set<string>();
      const addImage = (src: string | null | undefined) => {
        const value = String(src || "").trim();
        if (looksLikeProductImage(value)) imageSet.add(value);
      };

      const imgEls = Array.from(document.querySelectorAll("picture img, img")) as HTMLImageElement[];
      for (const img of imgEls) {
        addImage(img.currentSrc);
        addImage(img.src);
      }

      const ldImages = Array.isArray(jsonLdProduct.image)
        ? jsonLdProduct.image
        : jsonLdProduct.image
          ? [jsonLdProduct.image]
          : [];
      for (const image of ldImages) addImage(String(image));

      const videoEl = document.querySelector("video") as HTMLVideoElement | null;
      const video = videoEl?.src && videoEl.src.startsWith("http") ? videoEl.src : null;

      return {
        title,
        desc,
        details,
        images: Array.from(imageSet),
        video,
      };
    });

    titulo = pageData.title;
    descricao = pageData.desc;
    detalhes = pageData.details;
    imageUrls = pageData.images.slice(0, 8);
    videoUrl = pageData.video;

    console.log(`[shopee-scrape] Titulo: ${titulo.slice(0, 60)}`);
    console.log(`[shopee-scrape] Imagens: ${imageUrls.length} | Video: ${videoUrl ? "sim" : "nao"}`);
  } finally {
    await browser.close();
  }

  if (!titulo || (!descricao && !detalhes)) {
    throw new Error("Scraping retornou dados insuficientes da Shopee.");
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
      const res = await fetch(videoUrl, { signal: AbortSignal.timeout(60000) });
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
