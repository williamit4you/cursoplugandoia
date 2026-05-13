import "server-only";

export type ComfyUiFileRef = {
  filename: string;
  subfolder?: string;
  type: "input" | "output" | "temp";
};

export type ComfyUiSubmitResponse = {
  prompt_id?: string;
  number?: number;
};

function comfyBaseUrl() {
  return (process.env.COMFYUI_BASE_URL || "").trim().replace(/\/+$/, "");
}

function requireBaseUrl() {
  const base = comfyBaseUrl();
  if (!base) throw new Error("COMFYUI_BASE_URL not configured");
  return base;
}

async function jsonFetch(url: string, init: RequestInit, timeoutMs: number) {
  const res = await fetch(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(timeoutMs) });
  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { _raw: text };
  }
  return { ok: res.ok, status: res.status, data };
}

export async function comfyIsOnline(timeoutMs = 5000) {
  const base = requireBaseUrl();
  return jsonFetch(`${base}/system_stats`, { method: "GET" }, timeoutMs);
}

export async function comfyUploadInput(params: { buffer: Buffer; filename: string; contentType: string }, timeoutMs = 20000) {
  const base = requireBaseUrl();
  const form = new FormData();
  const blob = new Blob([new Uint8Array(params.buffer)], { type: params.contentType });
  form.append("image", blob, params.filename);

  const res = await fetch(`${base}/upload/image`, {
    method: "POST",
    body: form,
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`ComfyUI upload failed (HTTP ${res.status})`);
  const name = String(data?.name || data?.filename || params.filename);
  return { name, raw: data };
}

export async function comfySubmitPrompt(prompt: unknown, timeoutMs = 20000) {
  const base = requireBaseUrl();
  const body = { prompt, client_id: "shopee-pipeline" };
  const res = await jsonFetch(
    `${base}/prompt`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
    timeoutMs
  );
  if (!res.ok) throw new Error(`ComfyUI /prompt failed (HTTP ${res.status})`);
  return res.data as ComfyUiSubmitResponse;
}

export async function comfyGetHistory(promptId: string, timeoutMs = 20000) {
  const base = requireBaseUrl();
  return jsonFetch(`${base}/history/${encodeURIComponent(promptId)}`, { method: "GET" }, timeoutMs);
}

export async function comfyDownloadView(file: ComfyUiFileRef, timeoutMs = 30000) {
  const base = requireBaseUrl();
  const qs = new URLSearchParams();
  qs.set("filename", file.filename);
  qs.set("type", file.type);
  if (file.subfolder) qs.set("subfolder", file.subfolder);
  const res = await fetch(`${base}/view?${qs.toString()}`, { method: "GET", cache: "no-store", signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`ComfyUI /view failed (HTTP ${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  return { buffer: buf, contentType: res.headers.get("content-type") || "application/octet-stream" };
}

export function extractOutputFilesFromHistory(history: any): ComfyUiFileRef[] {
  const out: ComfyUiFileRef[] = [];
  const root = history && typeof history === "object" ? history : {};
  const entries = Object.values(root) as any[];
  for (const entry of entries) {
    const outputs = entry?.outputs;
    if (!outputs || typeof outputs !== "object") continue;
    for (const nodeOut of Object.values(outputs) as any[]) {
      if (!nodeOut || typeof nodeOut !== "object") continue;
      const candidates: any[] = [];
      if (Array.isArray((nodeOut as any).images)) candidates.push(...(nodeOut as any).images);
      if (Array.isArray((nodeOut as any).gifs)) candidates.push(...(nodeOut as any).gifs);
      if (Array.isArray((nodeOut as any).videos)) candidates.push(...(nodeOut as any).videos);
      if (Array.isArray((nodeOut as any).audio)) candidates.push(...(nodeOut as any).audio);
      for (const c of candidates) {
        const filename = String(c?.filename || "");
        if (!filename) continue;
        out.push({
          filename,
          subfolder: c?.subfolder ? String(c.subfolder) : undefined,
          type: (c?.type ? String(c.type) : "output") as any,
        });
      }
    }
  }
  return out;
}

export async function comfyWaitForPrompt(params: { promptId: string; timeoutMs: number; pollMs?: number }) {
  const startedAt = Date.now();
  const pollMs = Math.max(1000, params.pollMs || 5000);

  while (Date.now() - startedAt < params.timeoutMs) {
    const history = await comfyGetHistory(params.promptId, 20000);
    if (history.ok) {
      const files = extractOutputFilesFromHistory(history.data);
      if (files.length > 0) return { history: history.data, files };
    }
    await new Promise((r) => setTimeout(r, pollMs));
  }

  throw new Error("ComfyUI timeout waiting for prompt history");
}
