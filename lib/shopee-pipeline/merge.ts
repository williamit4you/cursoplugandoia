import "server-only";

function workerBaseUrl() {
  return (process.env.WORKER_FASTAPI_BASE_URL || process.env.FASTAPI_URL || "http://127.0.0.1:8000").trim().replace(/\/+$/, "");
}

export async function mergeProductAndCopyVideos(params: {
  coletaId: string;
  originalVideoUrl: string;
  copyVideoUrl: string;
  timeoutMs?: number;
}) {
  const base = workerBaseUrl();
  const targetUrl = `${base}/merge-videos`;

  const form = new URLSearchParams();
  form.set("coleta_id", params.coletaId);
  form.set("original_video_url", params.originalVideoUrl);
  form.set("copy_video_url", params.copyVideoUrl);
  form.set("upload_mode", "external");

  const res = await fetch(targetUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
    cache: "no-store",
    signal: AbortSignal.timeout(Math.min(60 * 60 * 1000, Math.max(10_000, Number(params.timeoutMs || 30 * 60 * 1000)))),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Worker /merge-videos failed (HTTP ${res.status}): ${text}`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  return { buffer: buf, contentType: res.headers.get("content-type") || "video/mp4" };
}

