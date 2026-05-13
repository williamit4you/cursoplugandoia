import path from "path";
import { config } from "dotenv";
config({ path: path.resolve(process.cwd(), "..", ".env") });

import http from "http";
import fs from "fs/promises";
import {
  PutObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
} from "@aws-sdk/client-s3";
import { s3Client } from "./s3";
import { shopeeBrowserSearch } from "./shopee-search";
import { uploadToMinio, generateSalesScript } from "./shopee-scrape";
import { mercadoLivreBrowserImages, mercadoLivreBrowserSearch } from "./mercadolivre-search";

type RenderRequest = {
  projectId: string;
  project: {
    aspectRatio?: string | null;
    fps?: number | null;
    narrationText?: string | null;
    audioUrl?: string | null;
    ttsVoice?: string | null;
    ttsSpeed?: string | null;
  };
  videoSpec: any;
};

function json(res: http.ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function totalDurationInFramesFromSpec(videoSpec: any, fps: number) {
  const scenes = Array.isArray(videoSpec?.scenes) ? videoSpec.scenes : [];
  let frames = 0;
  for (const s of scenes) {
    const sec = s?.durationSec;
    const n = sec === undefined || sec === null ? 1 : Number(sec);
    const sceneFrames = Math.max(1, Math.round((Number.isFinite(n) ? n : 1) * fps));
    frames += sceneFrames;
  }
  return Math.max(1, frames);
}

function normalizeShopeeText(value: unknown) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanShopeeText(value: unknown) {
  return normalizeShopeeText(value).replace(/\|\s*Shopee\s+Brasil.*$/i, "").trim();
}

function cleanupMarketingText(value: unknown) {
  return cleanShopeeText(value)
    .replace(/%C[0-9A-F]{1,2}/gi, " ")
    .replace(/\b\d{8,}\b/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function isSuspiciousProductTitle(value: unknown) {
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

function normalizeShopeeDomain(productUrl: string) {
  try {
    return new URL(productUrl).hostname || "shopee.com.br";
  } catch {
    return "shopee.com.br";
  }
}

function parseShopeeIdsFromUrl(productUrl: string) {
  const itemMatch = productUrl.match(/-i\.(\d+)\.(\d+)/i);
  if (itemMatch) return { shopId: Number(itemMatch[1]), itemId: Number(itemMatch[2]) };

  const productMatch = productUrl.match(/\/product\/(\d+)\/(\d+)/i);
  if (productMatch) return { shopId: Number(productMatch[1]), itemId: Number(productMatch[2]) };

  return null;
}

function deriveShopeeTitleFromUrl(productUrl: string) {
  try {
    const pathname = new URL(productUrl).pathname;
    const slug = pathname.split("/").filter(Boolean).pop() || "";
    const cleaned = slug
      .replace(/-i\.\d+\.\d+.*$/i, "")
      .replace(/[-_]+/g, " ")
      .trim();

    return cleanupMarketingText(cleaned) || "Produto Shopee";
  } catch {
    return "Produto Shopee";
  }
}

function buildShopeeItemApiUrl(domain: string, shopId: number, itemId: number) {
  const url = new URL(`https://${domain}/api/v4/item/get`);
  url.searchParams.set("shopid", String(shopId));
  url.searchParams.set("itemid", String(itemId));
  return url.toString();
}

function collectShopeeTextFragments(node: unknown, out: string[]) {
  if (!node) return;
  if (typeof node === "string") {
    const normalized = cleanShopeeText(node);
    if (normalized) out.push(normalized);
    return;
  }
  if (Array.isArray(node)) {
    for (const value of node) collectShopeeTextFragments(value, out);
    return;
  }
  if (typeof node !== "object") return;
  for (const value of Object.values(node as Record<string, unknown>)) {
    collectShopeeTextFragments(value, out);
  }
}

function buildShopeeDetailsFromApi(item: any) {
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
      ? variation.options.map((value: unknown) => cleanShopeeText(value)).filter(Boolean)
      : [];
    if (name && options.length > 0) parts.push(`${name}: ${options.join(", ")}`);
  }

  if (parts.length === 0) {
    const fragments: string[] = [];
    collectShopeeTextFragments(item?.specification, fragments);
    collectShopeeTextFragments(item?.product_attributes, fragments);
    collectShopeeTextFragments(item?.attributes, fragments);
    return cleanShopeeText(fragments.join(" | "));
  }

  return cleanShopeeText(parts.join(" | "));
}

function buildFallbackSalesScript(titulo: string, descricao: string, detalhes: string) {
  const tituloSeguro = cleanupMarketingText(titulo) || "esse produto";
  const base = cleanupMarketingText(descricao || detalhes);
  const snippet = base ? base.slice(0, 220).trim() : "";
  return cleanupMarketingText(
    `Olha isso: ${tituloSeguro}. ` +
      (snippet
        ? `${snippet}. `
        : "E uma opcao que chama atencao pelo visual, pela proposta e pelo custo-beneficio. ") +
      "Se voce quer algo com boa apresentacao e potencial para surpreender no uso, vale conhecer melhor. " +
      "Para ter acesso ao produto, o link esta na bio!"
  );
}

async function fetchShopeeStructuredDetails(productUrl: string) {
  const ids = parseShopeeIdsFromUrl(productUrl);
  if (!ids) return null;

  const domain = normalizeShopeeDomain(productUrl);
  const apiUrl = buildShopeeItemApiUrl(domain, ids.shopId, ids.itemId);

  try {
    const res = await fetch(apiUrl, {
      headers: {
        accept: "application/json",
        "user-agent": "PlugandoIA/1.0 (+https://plugandoia.cloud)",
        referer: `https://${domain}/product/${ids.shopId}/${ids.itemId}`,
        "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });

    const text = await res.text();
    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {};
    }

    if (!res.ok) {
      console.warn(`[render-service][shopee/scrape] item/get falhou: HTTP ${res.status}`);
      return null;
    }

    const item = data?.data?.item || data?.data || null;
    if (!item) return null;

    return {
      titulo: cleanShopeeText(item?.name || ""),
      descricao: cleanShopeeText(item?.description || ""),
      detalhes: buildShopeeDetailsFromApi(item),
    };
  } catch (error: any) {
    console.warn(`[render-service][shopee/scrape] item/get indisponivel (${error?.message || "erro desconhecido"})`);
    return null;
  }
}

async function ensureBucket(bucketName: string) {
  try {
    console.log(`[render-service] Checking bucket: ${bucketName}`);
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    console.log(`[render-service] Bucket ${bucketName} exists.`);
  } catch (headErr: any) {
    const statusCode = headErr.$metadata?.httpStatusCode;
    console.log(`[render-service] HeadBucket status for ${bucketName}:`, statusCode);

    if (statusCode === 404) {
      console.log(`[render-service] Bucket not found. Creating: ${bucketName}`);
      try {
        await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
      } catch (createErr: any) {
        console.error(`[render-service] CreateBucket failed:`, createErr.message);
      }
    } else {
      console.log(`[render-service] Proceeding despite HeadBucket status ${statusCode} (assuming bucket exists)`);
    }
  }

  try {
    await s3Client.send(
      new PutBucketPolicyCommand({
        Bucket: bucketName,
        Policy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: "*",
              Action: ["s3:GetObject"],
              Resource: [`arn:aws:s3:::${bucketName}/*`],
            },
          ],
        }),
      })
    );
  } catch {
    // ignore policy failures
  }
}

async function generateNarrationMp3(params: { text: string; voice: string; speed: string }) {
  const baseUrl = (process.env.WORKER_FASTAPI_BASE_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
  const url = `${baseUrl}/gerar-audio`;
  const form = new FormData();
  form.set("text", params.text);
  form.set("voice", params.voice);
  form.set("speed", params.speed);

  const res = await fetch(url, { method: "POST", body: form as any });
  if (!res.ok) {
    let msg = `Worker audio failed (HTTP ${res.status})`;
    try {
      const parsed = await res.json();
      msg = parsed?.error || parsed?.detail || msg;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }

  return Buffer.from(await res.arrayBuffer());
}

async function transcribeAudio(audioUrl: string) {
  const baseUrl = (process.env.WORKER_FASTAPI_BASE_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
  const url = `${baseUrl}/transcrever-palavras`;
  const audioRes = await fetch(audioUrl);
  if (!audioRes.ok) return null;

  const audioBlob = await audioRes.blob();
  const form = new FormData();
  form.append("file", audioBlob, "audio.mp3");

  const transRes = await fetch(url, { method: "POST", body: form });
  if (!transRes.ok) return null;

  const data = await transRes.json().catch(() => null);
  return data?.words || null;
}

async function renderProject(payload: RenderRequest) {
  const { projectId, project, videoSpec } = payload;
  if (!projectId) throw new Error("projectId is required");
  if (!videoSpec) throw new Error("videoSpec is required");

  const bucketName = process.env.MINIO_BUCKET_NAME || "uploads";
  const publicBase = process.env.MINIO_PUBLIC_URL;
  if (!publicBase) throw new Error("MINIO_PUBLIC_URL not configured");

  await ensureBucket(bucketName);

  let audioUrl = project.audioUrl || null;
  if (!audioUrl && project.narrationText && project.narrationText.trim().length > 0) {
    const mp3 = await generateNarrationMp3({
      text: project.narrationText,
      voice: project.ttsVoice || "pt-BR-AntonioNeural",
      speed: project.ttsSpeed || "+5%",
    });

    const audioKey = `code-video-audio-${projectId}.mp3`;
    console.log(`[render-service] Uploading audio: ${audioKey} to ${bucketName}`);
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: audioKey,
        Body: mp3,
        ContentType: "audio/mpeg",
      })
    );
    audioUrl = `${publicBase}/${audioKey}`;
  }

  const transcription = audioUrl ? await transcribeAudio(audioUrl) : null;

  // eslint-disable-next-line no-eval
  const req = eval("require") as (name: string) => any;
  const { bundle } = req("@remotion/bundler") as typeof import("@remotion/bundler");
  const { getCompositions, renderMedia } = req("@remotion/renderer") as typeof import("@remotion/renderer");

  const entryPoint = path.resolve(process.cwd(), "remotion", "index.ts");
  const bundleLocation = await bundle({ entryPoint, webpackOverride: (config: any) => config });
  const browserPath = process.env.REMOTION_CHROME_BIN || undefined;

  const compositions = await getCompositions(bundleLocation, {
    inputProps: { videoSpec, audioUrl, transcription },
    browserExecutable: browserPath,
  });

  const compositionId = project.aspectRatio === "LANDSCAPE_16_9" ? "VideoLandscape" : "VideoPortrait";
  const comp = compositions.find((item: any) => item.id === compositionId);
  if (!comp) throw new Error(`Composition not found: ${compositionId}`);

  const fps = project.fps || 30;
  const durationInFrames = totalDurationInFramesFromSpec(videoSpec, fps);
  const composition = { ...comp, fps, durationInFrames };

  const outDir = path.resolve(process.cwd(), ".remotion-temp");
  await fs.mkdir(outDir, { recursive: true });
  const localMp4 = path.join(outDir, `code-video-${projectId}.mp4`);

  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation: localMp4,
    inputProps: { videoSpec, audioUrl, transcription },
    browserExecutable: browserPath,
  });

  const buffer = await fs.readFile(localMp4);
  const key = `code-video-${projectId}.mp4`;
  console.log(`[render-service] Uploading video: ${key} to ${bucketName}`);
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: "video/mp4",
    })
  );

  return {
    projectId,
    audioUrl,
    videoUrl: `${publicBase}/${key}`,
  };
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    return json(res, 200, { ok: true, service: "render-service" });
  }

  if (req.method === "POST" && req.url === "/shopee/search") {
    try {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(Buffer.from(chunk));
      const payload = safeJsonParse(Buffer.concat(chunks).toString("utf8")) as any | null;
      if (!payload) return json(res, 400, { error: "Invalid JSON" });

      const items = await shopeeBrowserSearch(payload);
      return json(res, 200, { ok: true, items, source: "browser" });
    } catch (error: any) {
      console.error("[render-service][shopee/search]", error);
      return json(res, 502, { ok: false, error: error?.message || "Shopee search failed" });
    }
  }

  if (req.method === "POST" && req.url === "/render") {
    try {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(Buffer.from(chunk));
      const payload = safeJsonParse(Buffer.concat(chunks).toString("utf8")) as RenderRequest | null;
      if (!payload) return json(res, 400, { error: "Invalid JSON" });

      const response = await renderProject(payload);
      return json(res, 200, response);
    } catch (error: any) {
      console.error("[render-service] S3 ERROR:", error);
      if (error.$metadata) console.error("[render-service] S3 METADATA:", error.$metadata);
      return json(res, 500, { error: error?.message || "Render failed" });
    }
  }

  if (req.method === "POST" && req.url === "/shopee/scrape") {
    try {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(Buffer.from(chunk));
      const payload = safeJsonParse(Buffer.concat(chunks).toString("utf8")) as { url?: string } | null;
      if (!payload?.url) return json(res, 400, { error: "url is required" });

      const workerBase = (process.env.WORKER_FASTAPI_BASE_URL || "").replace(/\/+$/, "");
      if (!workerBase) {
        return json(res, 500, { error: "WORKER_FASTAPI_BASE_URL nao configurado para scraping Shopee." });
      }

      console.log(`[render-service][shopee/scrape] Step 1/3 media via HTML: ${workerBase}/scraping-shopee-raw`);
      const form = new FormData();
      form.set("url", payload.url);
      const workerRes = await fetch(`${workerBase}/scraping-shopee-raw`, {
        method: "POST",
        body: form as any,
        signal: AbortSignal.timeout(60000),
      });

      if (!workerRes.ok) {
        const errorText = await workerRes.text();
        return json(res, 502, { error: `Worker raw falhou: HTTP ${workerRes.status} - ${errorText}` });
      }

      const raw = await workerRes.json() as {
        titulo?: string;
        descricao?: string;
        detalhes?: string;
        videoRawUrl?: string | null;
        imageRawUrls?: string[];
      };

      const rawTitulo = cleanShopeeText(raw?.titulo || "");
      const rawDescricao = cleanShopeeText(raw?.descricao || "");
      const rawDetalhes = cleanShopeeText(raw?.detalhes || "");
      const videoRawUrl = raw?.videoRawUrl || null;
      const imageRawUrls = Array.isArray(raw?.imageRawUrls) ? raw.imageRawUrls : [];

      console.log(
        `[render-service][shopee/scrape] raw html found: title="${rawTitulo}" video=${!!videoRawUrl} images=${imageRawUrls.length}`
      );

      if (!videoRawUrl && imageRawUrls.length === 0) {
        return json(res, 422, { error: "Captura HTML nao retornou nenhuma midia do produto." });
      }

      console.log("[render-service][shopee/scrape] Step 1/3 uploading media to MinIO...");
      const ts = Date.now();
      const linksMedia: Array<{ tipo: "IMAGE" | "VIDEO"; url: string }> = [];

      for (let i = 0; i < Math.min(5, imageRawUrls.length); i++) {
        try {
          const imgRes = await fetch(imageRawUrls[i], { signal: AbortSignal.timeout(20000) });
          if (imgRes.ok) {
            const buf = Buffer.from(await imgRes.arrayBuffer());
            const ct = imgRes.headers.get("content-type") || "";
            const ext = ct.includes("png") ? "png" : ct.includes("webp") ? "webp" : "jpg";
            const minioUrl = await uploadToMinio(buf, `shopee/images/shopee_img_${ts}_${i}.${ext}`, `image/${ext}`);
            linksMedia.push({ tipo: "IMAGE", url: minioUrl });
            console.log(`[render-service][shopee/scrape] Imagem ${i + 1} enviada: ${minioUrl}`);
          }
        } catch (error: any) {
          console.warn(`[render-service][shopee/scrape] Erro imagem ${i}:`, error?.message);
        }
      }

      if (videoRawUrl) {
        try {
          const vidRes = await fetch(videoRawUrl, {
            headers: { referer: "https://shopee.com.br/" },
            signal: AbortSignal.timeout(90000),
          });
          if (vidRes.ok) {
            const buf = Buffer.from(await vidRes.arrayBuffer());
            const minioUrl = await uploadToMinio(buf, `shopee/videos/shopee_vid_${ts}.mp4`, "video/mp4");
            linksMedia.push({ tipo: "VIDEO", url: minioUrl });
            console.log(`[render-service][shopee/scrape] Video enviado: ${minioUrl}`);
          }
        } catch (error: any) {
          console.warn(`[render-service][shopee/scrape] Erro video:`, error?.message);
        }
      }

      if (linksMedia.length === 0) {
        return json(res, 422, { error: "As midias foram detectadas no HTML, mas nenhuma conseguiu ser enviada ao MinIO." });
      }

      console.log("[render-service][shopee/scrape] Step 2/3 titles and descriptions via API...");
      const structured = await fetchShopeeStructuredDetails(payload.url);
      const structuredTitulo = cleanupMarketingText(structured?.titulo || "");
      const descricao = cleanupMarketingText(structured?.descricao || rawDescricao || "");
      const detalhes = cleanupMarketingText(structured?.detalhes || rawDetalhes || "");
      const tituloBase =
        !isSuspiciousProductTitle(rawTitulo)
          ? cleanupMarketingText(rawTitulo)
          : !isSuspiciousProductTitle(structuredTitulo)
            ? structuredTitulo
            : inferProductTitleFromContent(descricao, detalhes);
      const titulo = tituloBase || deriveShopeeTitleFromUrl(payload.url);

      console.log("[render-service][shopee/scrape] Step 3/3 sales copy via AI...");
      let aiPromptVendas = "";
      try {
        aiPromptVendas =
          (await generateSalesScript(titulo, descricao, detalhes)) ||
          buildFallbackSalesScript(titulo, descricao, detalhes);
      } catch (error: any) {
        console.warn(
          `[render-service][shopee/scrape] IA indisponivel, usando fallback local: ${error?.message || "erro desconhecido"}`
        );
        aiPromptVendas = buildFallbackSalesScript(titulo, descricao, detalhes);
      }

      return json(res, 200, {
        titulo,
        descricao,
        detalhes,
        aiPromptVendas,
        linksMedia,
      });
    } catch (error: any) {
      console.error("[render-service][shopee/scrape]", error);
      return json(res, 500, { error: error?.message || "Scrape failed" });
    }
  }

  if (req.method === "POST" && req.url === "/mercadolivre/search") {
    try {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(Buffer.from(chunk));
      const payload = safeJsonParse(Buffer.concat(chunks).toString("utf8")) as any | null;
      if (!payload) return json(res, 400, { error: "Invalid JSON" });

      const items = await mercadoLivreBrowserSearch(payload);
      return json(res, 200, { ok: true, items, source: "browser" });
    } catch (error: any) {
      console.error("[render-service][mercadolivre/search]", error);
      return json(res, 502, { ok: false, error: error?.message || "Mercado Livre browser search failed" });
    }
  }

  if (req.method === "POST" && req.url === "/mercadolivre/images") {
    try {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(Buffer.from(chunk));
      const payload = safeJsonParse(Buffer.concat(chunks).toString("utf8")) as any | null;
      if (!payload?.url) return json(res, 400, { error: "url is required" });

      const urls = await mercadoLivreBrowserImages(payload);
      return json(res, 200, { ok: true, urls, source: "browser" });
    } catch (error: any) {
      console.error("[render-service][mercadolivre/images]", error);
      return json(res, 502, { ok: false, error: error?.message || "Mercado Livre browser images failed" });
    }
  }

  return json(res, 404, { error: "Not found" });
});

const port = Number(process.env.PORT || 3010);
server.listen(port, "0.0.0.0", () => {
  console.log(`[render-service] listening on ${port}`);
});
