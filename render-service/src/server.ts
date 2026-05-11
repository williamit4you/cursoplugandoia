import path from "path";
import { config } from "dotenv";
config({ path: path.resolve(process.cwd(), "..", ".env") });

import http from "http";
import fs from "fs/promises";
import { PutObjectCommand, HeadBucketCommand, CreateBucketCommand, PutBucketPolicyCommand } from "@aws-sdk/client-s3";
import { s3Client } from "./s3";
import { shopeeBrowserSearch } from "./shopee-search";
import { scrapeShopeeProduct } from "./shopee-scrape";

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

async function ensureBucket(bucketName: string) {
  try {
    console.log(`[render-service] Checking bucket: ${bucketName}`);
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    console.log(`[render-service] Bucket ${bucketName} exists.`);
  } catch (headErr: any) {
    const statusCode = headErr.$metadata?.httpStatusCode;
    console.log(`[render-service] HeadBucket status for ${bucketName}:`, statusCode);
    
    // Se for 404, tentamos criar. Se for 403 ou 400, assumimos que o bucket existe
    // mas não temos permissão de "Head" ou o provedor não suporta esse comando.
    if (statusCode === 404) {
      console.log(`[render-service] Bucket not found. Creating: ${bucketName}`);
      try {
        await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
      } catch (createErr: any) {
        console.error(`[render-service] CreateBucket failed:`, createErr.message);
        // Se falhar a criação mas o erro for que já existe, ignoramos
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

      const result = await scrapeShopeeProduct(payload.url);
      return json(res, 200, result);
    } catch (error: any) {
      console.error("[render-service][shopee/scrape]", error);
      return json(res, 500, { error: error?.message || "Scrape failed" });
    }
  }

  return json(res, 404, { error: "Not found" });
});

const port = Number(process.env.PORT || 3010);
server.listen(port, "0.0.0.0", () => {
  console.log(`[render-service] listening on ${port}`);
});
