import "server-only";

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function formatVttTimestamp(seconds: number) {
  const ms = Math.max(0, Math.round(seconds * 1000));
  const totalSeconds = Math.floor(ms / 1000);
  const millis = ms % 1000;
  const s = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const m = totalMinutes % 60;
  const h = Math.floor(totalMinutes / 60);
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}.${String(millis).padStart(3, "0")}`;
}

function splitIntoCaptionLines(text: string) {
  const cleaned = String(text || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return [];

  // Split primarily by punctuation, but keep it robust for marketing scripts.
  const parts = cleaned
    .split(/(?<=[.!?])\s+|(?<=\p{Emoji_Presentation})\s+/u)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length > 1) return parts;

  // Fallback: chunk by words
  const words = cleaned.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let buffer: string[] = [];
  for (const w of words) {
    buffer.push(w);
    if (buffer.join(" ").length >= 46) {
      chunks.push(buffer.join(" ").trim());
      buffer = [];
    }
  }
  if (buffer.length) chunks.push(buffer.join(" ").trim());
  return chunks;
}

export function generateApproxVtt(params: { text: string; wordsPerSecond?: number }) {
  const wordsPerSecond = Math.max(1.6, Math.min(4.2, Number(params.wordsPerSecond || 2.6)));
  const lines = splitIntoCaptionLines(params.text);
  if (lines.length === 0) return "WEBVTT\n\n";

  const counts = lines.map((line) => line.split(/\s+/).filter(Boolean).length);
  const totalWords = counts.reduce((a, b) => a + b, 0);
  const totalDuration = Math.max(2, totalWords / wordsPerSecond);

  let cursor = 0;
  let out = "WEBVTT\n\n";

  for (let i = 0; i < lines.length; i += 1) {
    const words = counts[i] || 1;
    const slice = (words / totalWords) * totalDuration;
    const start = cursor;
    const end = i === lines.length - 1 ? totalDuration : cursor + slice;
    cursor = end;
    out += `${formatVttTimestamp(start)} --> ${formatVttTimestamp(end)}\n${lines[i]}\n\n`;
  }

  return out;
}

