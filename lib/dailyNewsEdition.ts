import "server-only";

export const DAILY_NEWS_TIMEZONE = "America/Sao_Paulo";
export const DAILY_NEWS_DEFAULT_DURATION_SEC = 240;
export const DAILY_NEWS_ALLOWED_STATUSES = [
  "DRAFT",
  "CURATING",
  "SCRIPTING",
  "AWAITING_REVIEW",
  "APPROVED",
  "GENERATING_AUDIO",
  "PLANNING_VISUALS",
  "RENDERING",
  "QA",
  "SCHEDULED",
  "PUBLISHED",
  "REJECTED",
  "FAILED",
  "CANCELED",
] as const;

export type DailyNewsStatus = (typeof DAILY_NEWS_ALLOWED_STATUSES)[number];

export function normalizeDailyNewsStatus(value: unknown): DailyNewsStatus {
  const normalized = String(value || "").trim().toUpperCase();
  if (
    (DAILY_NEWS_ALLOWED_STATUSES as readonly string[]).includes(normalized)
  ) {
    return normalized as DailyNewsStatus;
  }
  return "DRAFT";
}

export function normalizeEditionDate(value: unknown) {
  const raw = String(value || "").trim();
  const date = raw ? new Date(`${raw}T00:00:00.000-03:00`) : new Date();
  if (Number.isNaN(date.getTime())) {
    const fallback = new Date();
    fallback.setHours(0, 0, 0, 0);
    return fallback;
  }
  date.setHours(0, 0, 0, 0);
  return date;
}

export function normalizeDuration(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 60) return DAILY_NEWS_DEFAULT_DURATION_SEC;
  return Math.round(parsed);
}

export function normalizeIds(values: unknown, limit = 20) {
  if (!Array.isArray(values)) return [];
  return Array.from(
    new Set(
      values
        .map((value) => String(value || "").trim())
        .filter(Boolean),
    ),
  ).slice(0, limit);
}

export function sourceNameFromUrl(url: string | null | undefined) {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function buildEditionTitle(date: Date) {
  const label = new Intl.DateTimeFormat("pt-BR", {
    timeZone: DAILY_NEWS_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
  return `Resumo de Noticias ${label}`;
}
