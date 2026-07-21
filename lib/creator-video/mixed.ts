import "server-only";

import { generateApproxVtt } from "@/lib/captions/vtt";

export type MixedAssetInput = {
  id: string;
  url: string;
  kind: "IMAGE" | "VIDEO";
  originalName?: string | null;
  userLabel?: string | null;
  autoLabel?: string | null;
};

export type MixedPlanSegment = {
  id: string;
  startSec: number;
  endSec: number;
  spokenText: string;
  layout: "TITLE_CARD" | "BROLL_FULL" | "PIP_BOTTOM_RIGHT";
  assetId?: string | null;
  title?: string | null;
};

function sanitizeText(value: unknown) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function stripExtension(value: string) {
  return value.replace(/\.[a-z0-9]{2,5}$/i, "");
}

function prettifyFilename(value: string) {
  return stripExtension(value)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractJsonObject(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

export function inferAssetFallbackLabel(asset: MixedAssetInput, index: number) {
  const explicit = sanitizeText(asset.userLabel || asset.autoLabel || "");
  if (explicit) return explicit;
  const original = prettifyFilename(sanitizeText(asset.originalName || ""));
  if (original) return original;
  return asset.kind === "VIDEO" ? `Video de apoio ${index + 1}` : `Imagem de apoio ${index + 1}`;
}

function parseVttTimestamp(value: string) {
  const [hh, mm, rest] = value.split(":");
  const [ss, ms] = rest.split(".");
  return Number(hh) * 3600 + Number(mm) * 60 + Number(ss) + Number(ms) / 1000;
}

export function buildApproxTimelineSegments(text: string, speechRate = 1) {
  const wordsPerSecond = 2.6 * Math.max(0.75, Math.min(1.35, Number(speechRate || 1)));
  const vtt = generateApproxVtt({ text, wordsPerSecond });
  const blocks = vtt
    .split(/\n\n+/)
    .map((block) => block.trim())
    .filter(Boolean)
    .filter((block) => !block.startsWith("WEBVTT"));

  const segments: Array<{ id: string; startSec: number; endSec: number; spokenText: string }> = [];
  for (let i = 0; i < blocks.length; i += 1) {
    const lines = blocks[i].split("\n").map((line) => line.trim()).filter(Boolean);
    if (lines.length < 2) continue;
    const [startRaw, endRaw] = lines[0].split(" --> ").map((part) => part.trim());
    const spokenText = sanitizeText(lines.slice(1).join(" "));
    if (!startRaw || !endRaw || !spokenText) continue;
    segments.push({
      id: `segment-${i + 1}`,
      startSec: parseVttTimestamp(startRaw),
      endSec: parseVttTimestamp(endRaw),
      spokenText,
    });
  }

  if (segments.length > 0) return segments;

  const fallbackText = sanitizeText(text);
  return fallbackText
    ? [
        {
          id: "segment-1",
          startSec: 0,
          endSec: Math.max(3, fallbackText.split(/\s+/).filter(Boolean).length / wordsPerSecond),
          spokenText: fallbackText,
        },
      ]
    : [];
}

export async function describeImageAssetWithVision(params: {
  asset: MixedAssetInput;
  index: number;
  apiKey: string;
  model: string;
}) {
  const fallback = inferAssetFallbackLabel(params.asset, params.index);
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify({
      model: params.model,
      temperature: 0.2,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Descreva esta imagem em portugues do Brasil em no maximo 8 palavras. Foque no que e visualmente util para planejar um video." },
            { type: "image_url", image_url: { url: params.asset.url } },
          ],
        },
      ],
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) return fallback;
  return sanitizeText(data?.choices?.[0]?.message?.content || "") || fallback;
}

export async function enrichMixedAssets(params: {
  assets: MixedAssetInput[];
  apiKey?: string | null;
  model?: string;
}) {
  const apiKey = sanitizeText(params.apiKey || "");
  const model = sanitizeText(params.model || "gpt-4o-mini");
  const enriched: MixedAssetInput[] = [];

  for (let i = 0; i < params.assets.length; i += 1) {
    const asset = params.assets[i];
    const userLabel = sanitizeText(asset.userLabel || "");
    if (userLabel) {
      enriched.push({ ...asset, autoLabel: userLabel });
      continue;
    }

    if (asset.kind === "IMAGE" && apiKey) {
      try {
        const autoLabel = await describeImageAssetWithVision({ asset, index: i, apiKey, model });
        enriched.push({ ...asset, autoLabel });
        continue;
      } catch {
        // fallback below
      }
    }

    enriched.push({ ...asset, autoLabel: inferAssetFallbackLabel(asset, i) });
  }

  return enriched;
}

function fallbackPlanFromSegments(segments: Array<{ id: string; startSec: number; endSec: number; spokenText: string }>, assets: MixedAssetInput[]) {
  return segments.map((segment, index) => {
    if (index === 0 || index === segments.length - 1 || assets.length === 0) {
      return {
        ...segment,
        layout: "TITLE_CARD" as const,
        assetId: null,
        title: segment.spokenText,
      };
    }
    const asset = assets[(index - 1) % assets.length];
    const usePip = index % 2 === 0;
    return {
      ...segment,
      layout: usePip ? "PIP_BOTTOM_RIGHT" as const : "BROLL_FULL" as const,
      assetId: asset.id,
      title: inferAssetFallbackLabel(asset, index - 1),
    };
  });
}

export async function planMixedVideo(params: {
  narrationText: string;
  speechRate?: number;
  assets: MixedAssetInput[];
  apiKey?: string | null;
  model?: string;
  aspectRatio?: string;
}) {
  const segments = buildApproxTimelineSegments(params.narrationText, params.speechRate || 1);
  const enrichedAssets = await enrichMixedAssets({
    assets: params.assets,
    apiKey: params.apiKey,
    model: params.model,
  });

  const apiKey = sanitizeText(params.apiKey || "");
  if (!apiKey || segments.length === 0) {
    return {
      assets: enrichedAssets,
      segments: fallbackPlanFromSegments(segments, enrichedAssets),
    };
  }

  const model = sanitizeText(params.model || "gpt-4o-mini");
  const user = [
    `FORMATO: ${sanitizeText(params.aspectRatio || "PORTRAIT_9_16")}`,
    `SEGMENTOS_ESTIMADOS: ${JSON.stringify(segments)}`,
    `ASSETS_DISPONIVEIS: ${JSON.stringify(
      enrichedAssets.map((asset) => ({
        id: asset.id,
        kind: asset.kind,
        label: inferAssetFallbackLabel(asset, 0),
      }))
    )}`,
    "Escolha para cada segmento um layout entre TITLE_CARD, BROLL_FULL e PIP_BOTTOM_RIGHT.",
    "Prefira TITLE_CARD na abertura e no CTA final.",
    "Use BROLL_FULL quando o asset ajuda a demonstrar visualmente a frase.",
    "Use PIP_BOTTOM_RIGHT quando a imagem ou video principal deve continuar visivel enquanto um segundo apoio aparece.",
    "Responda somente com JSON valido no formato { segments: [{ id, layout, assetId, title }] }.",
  ].join("\n");

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content: "Voce planeja VSLs narradas com imagens e videos de apoio. Seja objetivo e coerente com os assets disponiveis.",
          },
          { role: "user", content: user },
        ],
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        assets: enrichedAssets,
        segments: fallbackPlanFromSegments(segments, enrichedAssets),
      };
    }
    const parsed = extractJsonObject(String(data?.choices?.[0]?.message?.content || ""));
    const planned = Array.isArray(parsed?.segments) ? parsed.segments : [];
    const fallback = fallbackPlanFromSegments(segments, enrichedAssets);

    const merged: MixedPlanSegment[] = fallback.map((segment) => {
      const ai = planned.find((item: any) => String(item?.id || "") === segment.id);
      const layout = String(ai?.layout || segment.layout);
      const validLayout =
        layout === "BROLL_FULL" || layout === "PIP_BOTTOM_RIGHT" || layout === "TITLE_CARD"
          ? (layout as MixedPlanSegment["layout"])
          : segment.layout;
      const assetId = sanitizeText(ai?.assetId || segment.assetId || "");
      const hasAsset = enrichedAssets.some((asset) => asset.id === assetId);
      return {
        ...segment,
        layout: hasAsset ? validLayout : "TITLE_CARD",
        assetId: hasAsset ? assetId : null,
        title: sanitizeText(ai?.title || segment.title || "") || null,
      };
    });

    return { assets: enrichedAssets, segments: merged };
  } catch {
    return {
      assets: enrichedAssets,
      segments: fallbackPlanFromSegments(segments, enrichedAssets),
    };
  }
}

export function buildMixedRenderSpec(params: {
  narrationText: string;
  aspectRatio: string;
  fps: number;
  audioUrl: string;
  segments: MixedPlanSegment[];
  assets: MixedAssetInput[];
}) {
  const aspect = params.aspectRatio === "LANDSCAPE_16_9" ? "16:9" : "9:16";
  const totalDurationSec = params.segments.reduce((max, segment) => Math.max(max, segment.endSec), 0);
  return {
    mode: "MIXED_TALKING_HEAD",
    version: 1,
    meta: {
      aspectRatio: aspect,
      fps: params.fps,
    },
    content: {
      narrationText: params.narrationText,
      totalDurationSec,
    },
    audioUrl: params.audioUrl,
    segments: params.segments.map((segment) => {
      const asset = params.assets.find((item) => item.id === segment.assetId);
      return {
        ...segment,
        assetUrl: asset?.url || null,
        assetKind: asset?.kind || null,
        title: sanitizeText(segment.title || asset?.userLabel || asset?.autoLabel || "") || null,
      };
    }),
  };
}
