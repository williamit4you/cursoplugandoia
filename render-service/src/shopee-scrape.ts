/**
 * shopee-scrape.ts
 * Scraping de produto Shopee usando o Chromium já instalado no render-service.
 * Substitui o uso de Playwright no worker Python.
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
  throw new Error(
    "Chrome/Chromium não encontrado. Verifique PUPPETEER_EXECUTABLE_PATH ou REMOTION_CHROME_BIN."
  );
}

async function uploadToMinio(
  fileBuffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
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

async function generateSalesScript(
  titulo: string,
  descricao: string
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return "";

  const model = process.env.VIDEO_CODE_AI_MODEL || "gpt-4o-mini";

  const body = JSON.stringify({
    model,
    temperature: 0.7,
    messages: [
      {
        role: "system",
        content: `Você é um especialista em marketing digital e copy de vendas.
Crie um script de vendas curto e persuasivo para um produto da Shopee.
Use gatilhos mentais para um vendedor falar em vídeo (estilo Reels/TikTok).
OBRIGATÓRIO: O script DEVE terminar com uma variação de: "Para ter acesso ao produto, o link está na bio!".
Responda APENAS com JSON: {"script_vendas": "seu texto aqui"}`,
      },
      {
        role: "user",
        content: `Título: ${titulo}\nDescrição: ${descricao.slice(0, 1000)}`,
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

    // Extract JSON from the response
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) return text;
    const parsed = JSON.parse(text.slice(start, end + 1));
    return String(parsed?.script_vendas ?? "").trim();
  } catch {
    return "";
  }
}

export async function scrapeShopeeProduct(
  productUrl: string
): Promise<ShopeeScrapedProduct> {
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
    await new Promise((r) => setTimeout(r, 3000));

    // Extract page data
    const pageData = await page.evaluate(() => {
      // Title
      const titleEl =
        document.querySelector("div[class*='page-product'] h1") ||
        document.querySelector("h1") ||
        document.querySelector("[class*='product-name']");
      const title = titleEl?.textContent?.trim() || document.title || "";

      // Description
      const descEl =
        document.querySelector("div[class*='product-detail']") ||
        document.querySelector("div[style*='white-space: pre-wrap']") ||
        document.querySelector("[class*='product-description']");
      const desc = descEl?.textContent?.trim() || "";

      // Images from picture tags (thumbnail gallery)
      const imgEls = Array.from(document.querySelectorAll("picture img")) as HTMLImageElement[];
      const images = [...new Set(imgEls.map((img) => img.src).filter((src) => src.startsWith("http")))];

      // Video
      const videoEl = document.querySelector("video") as HTMLVideoElement | null;
      const video = videoEl?.src && videoEl.src.startsWith("http") ? videoEl.src : null;

      return { title, desc, images, video };
    });

    titulo = pageData.title;
    descricao = pageData.desc;
    imageUrls = pageData.images.slice(0, 8);
    videoUrl = pageData.video;

    console.log(`[shopee-scrape] Título: ${titulo.slice(0, 60)}`);
    console.log(`[shopee-scrape] Imagens: ${imageUrls.length} | Vídeo: ${videoUrl ? "sim" : "não"}`);
  } finally {
    await browser.close();
  }

  // Download and upload media to MinIO
  const linksMedia: ScrapedMedia[] = [];
  const ts = Date.now();

  for (let i = 0; i < Math.min(5, imageUrls.length); i++) {
    const imgUrl = imageUrls[i];
    try {
      const res = await fetch(imgUrl, { signal: AbortSignal.timeout(20000) });
      if (!res.ok) continue;

      const buf = Buffer.from(await res.arrayBuffer());
      const ext = imgUrl.includes(".png") ? "png" : imgUrl.includes(".webp") ? "webp" : "jpg";
      const key = `shopee/images/shopee_img_${ts}_${i}.${ext}`;
      const minioUrl = await uploadToMinio(buf, key, `image/${ext}`);
      linksMedia.push({ tipo: "IMAGE", url: minioUrl });
      console.log(`[shopee-scrape] Imagem ${i + 1} enviada: ${minioUrl}`);
    } catch (e) {
      console.error(`[shopee-scrape] Erro na imagem ${i}:`, e);
    }
  }

  if (videoUrl) {
    try {
      const res = await fetch(videoUrl, { signal: AbortSignal.timeout(60000) });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        const key = `shopee/videos/shopee_vid_${ts}.mp4`;
        const minioUrl = await uploadToMinio(buf, key, "video/mp4");
        linksMedia.push({ tipo: "VIDEO", url: minioUrl });
        console.log(`[shopee-scrape] Vídeo enviado: ${minioUrl}`);
      }
    } catch (e) {
      console.error("[shopee-scrape] Erro no vídeo:", e);
    }
  }

  // Generate AI sales script
  console.log("[shopee-scrape] Gerando script de vendas com IA...");
  const aiPromptVendas = await generateSalesScript(titulo, descricao);

  return {
    titulo,
    descricao,
    detalhes: descricao.slice(0, 500),
    aiPromptVendas,
    linksMedia,
  };
}
