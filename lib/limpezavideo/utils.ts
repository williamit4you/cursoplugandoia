export function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function estimateSecondsLeft(params: { durationSec?: number | null; progressPercent?: number | null }) {
  const duration = Math.max(Number(params.durationSec || 0), 1);
  const progress = Math.max(Number(params.progressPercent || 0), 1);
  const multiplier = 0.9;
  const totalEstimate = Math.ceil(duration * multiplier);
  const remaining = Math.ceil(totalEstimate * ((100 - progress) / 100));
  return Math.max(remaining, 0);
}
