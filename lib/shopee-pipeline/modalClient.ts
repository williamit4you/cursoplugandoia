import "server-only";

type ModalAudioResponse = {
  status: string;
  kind: "audio";
  prompt_id: string;
  audio_url: string;
};

type ModalVideoResponse = {
  status: string;
  kind: "video";
  prompt_id: string;
  video_url: string;
};

function endpoint(name: "audio" | "video") {
  const value =
    name === "audio"
      ? process.env.MODAL_AUDIO_ENDPOINT
      : process.env.MODAL_VIDEO_ENDPOINT;
  const url = String(value || "").trim();
  if (!url) throw new Error(`MODAL_${name.toUpperCase()}_ENDPOINT not configured`);
  return url;
}

async function postJson<T>(url: string, body: unknown, timeoutMs: number): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { _raw: text };
  }
  if (!res.ok) {
    const err: any = new Error(`Modal ${res.status}: ${text || res.statusText}`);
    err.details = { status: res.status, response: data };
    throw err;
  }
  return data as T;
}

export async function generateModalAudio(params: {
  voiceRefUrl: string;
  targetText: string;
  seed: number;
}) {
  const data = await postJson<ModalAudioResponse>(
    endpoint("audio"),
    {
      voice_ref_url: params.voiceRefUrl,
      target_text: params.targetText,
      seed: params.seed,
    },
    30 * 60 * 1000
  );
  if (!data?.audio_url) throw new Error("Modal audio response missing audio_url");
  return data;
}

export async function generateModalVideo(params: {
  imageUrl: string;
  audioUrl: string;
  seed: number;
}) {
  const data = await postJson<ModalVideoResponse>(
    endpoint("video"),
    {
      image_url: params.imageUrl,
      audio_url: params.audioUrl,
      seed: params.seed,
    },
    75 * 60 * 1000
  );
  if (!data?.video_url) throw new Error("Modal video response missing video_url");
  return data;
}
