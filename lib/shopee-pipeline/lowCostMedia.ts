import "server-only";

import { uploadBufferToMinio } from "@/lib/shopee-pipeline/minioUpload";

function workerBaseUrl() {
  return (process.env.WORKER_FASTAPI_BASE_URL || process.env.FASTAPI_URL || "http://127.0.0.1:8000").trim().replace(/\/+$/, "");
}

async function postFormForBuffer(path: string, form: URLSearchParams, timeoutMs: number) {
  const targetUrl = `${workerBaseUrl()}${path}`;
  let res: Response;
  try {
    res = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
      cache: "no-store",
      signal: AbortSignal.timeout(Math.min(60 * 60 * 1000, Math.max(10_000, timeoutMs))),
    });
  } catch (error: any) {
    const reason = error?.cause?.message || error?.message || "erro desconhecido";
    throw new Error(`Falha ao conectar no worker de audio/video (${targetUrl}): ${reason}`);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Worker ${path} failed via ${targetUrl} (HTTP ${res.status}): ${text}`);
  }

  return {
    buffer: Buffer.from(await res.arrayBuffer()),
    contentType: res.headers.get("content-type") || "application/octet-stream",
  };
}

export async function generateShopeeLowCostAudio(params: {
  coletaId: string;
  text: string;
  voice?: string | null;
  speed?: string | null;
}) {
  const form = new URLSearchParams();
  form.set("text", params.text);
  form.set("voice", String(params.voice || "pt-BR-AntonioNeural"));
  form.set("speed", String(params.speed || "+5%"));

  const audio = await postFormForBuffer("/gerar-audio", form, 10 * 60 * 1000);
  return uploadBufferToMinio({
    buffer: audio.buffer,
    key: `shopee/audio-lowcost/audio_${params.coletaId}_${Date.now()}.mp3`,
    contentType: "audio/mpeg",
  });
}

export async function renderShopeeLowCostVoiceoverVideo(params: {
  coletaId: string;
  originalVideoUrl: string;
  audioUrl: string;
}) {
  const form = new URLSearchParams();
  form.set("coleta_id", params.coletaId);
  form.set("original_video_url", params.originalVideoUrl);
  form.set("audio_url", params.audioUrl);
  form.set("upload_mode", "external");

  const video = await postFormForBuffer("/voiceover-video", form, 45 * 60 * 1000);
  return uploadBufferToMinio({
    buffer: video.buffer,
    key: `shopee/videos-final/lowcost_${params.coletaId}_${Date.now()}.mp4`,
    contentType: video.contentType || "video/mp4",
  });
}
