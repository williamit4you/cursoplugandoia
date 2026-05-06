export const AUTOMATION_TASK_TYPES = [
  "NEWS_VIDEO",
  "QA_VIDEO",
  "MERCADO_LIVRE_VIDEO",
  "SHOPEE_VIDEO",
] as const;

export const AUTOMATION_TASK_STATUSES = ["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"] as const;

export const AUTOMATION_TRIGGER_TYPES = ["MANUAL", "SCHEDULED", "RETRY"] as const;

export const AUTOMATION_RUN_STATUSES = [
  "PENDING",
  "RUNNING",
  "COMPLETED",
  "FAILED",
  "PARTIAL",
  "CANCELED",
] as const;

export type AutomationTaskTypeValue = (typeof AUTOMATION_TASK_TYPES)[number];
export type AutomationTaskStatusValue = (typeof AUTOMATION_TASK_STATUSES)[number];

export const DEFAULT_TASK_CONFIGS: Record<AutomationTaskTypeValue, Record<string, unknown>> = {
  NEWS_VIDEO: {
    sourceConfig: { feeds: [], keywords: [], maxItems: 5 },
    creativeConfig: { durationSec: 30, aspectRatio: "PORTRAIT_9_16", useImages: true, useVideos: true },
    publishConfig: { platforms: ["YOUTUBE", "INSTAGRAM_REELS"], autoPost: false, timeSlots: ["08:00", "14:00", "20:00"] },
    executionConfig: { retryLimit: 2, retryBackoffMinutes: 15, failOnStepError: true },
  },
  QA_VIDEO: {
    sourceConfig: { questionSetId: null, randomize: true, maxQuestions: 1 },
    creativeConfig: { durationSec: 30, aspectRatio: "PORTRAIT_9_16", useImages: true, useVideos: false },
    publishConfig: { platforms: ["YOUTUBE", "INSTAGRAM_REELS"], autoPost: false, timeSlots: ["08:00", "14:00", "20:00"] },
    executionConfig: { retryLimit: 2, retryBackoffMinutes: 15, failOnStepError: true },
  },
  MERCADO_LIVRE_VIDEO: {
    sourceConfig: { searchTerms: [], minPrice: 10, maxPrice: null, affiliateMode: "AUTO" },
    creativeConfig: { durationSec: 30, aspectRatio: "PORTRAIT_9_16", useImages: true, useVideos: false },
    publishConfig: { platforms: ["YOUTUBE", "INSTAGRAM_REELS", "TIKTOK"], autoPost: false, timeSlots: ["08:00", "14:00", "20:00"] },
    executionConfig: { retryLimit: 2, retryBackoffMinutes: 15, failOnStepError: true },
  },
  SHOPEE_VIDEO: {
    sourceConfig: { searchTerms: [], minPrice: 10, minCommissionRate: 5, minSales: 100 },
    creativeConfig: { durationSec: 30, aspectRatio: "PORTRAIT_9_16", useImages: true, useVideos: false },
    publishConfig: { platforms: ["YOUTUBE", "INSTAGRAM_REELS", "TIKTOK"], autoPost: false, timeSlots: ["08:00", "14:00", "20:00"] },
    executionConfig: { retryLimit: 2, retryBackoffMinutes: 15, failOnStepError: true },
  },
};

export function safeJsonStringify(value: unknown) {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return "{}";
  }
}

export function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function slugifyTaskName(value: string) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function normalizeTaskType(value: unknown): AutomationTaskTypeValue {
  const normalized = String(value || "").trim().toUpperCase() as AutomationTaskTypeValue;
  return AUTOMATION_TASK_TYPES.includes(normalized) ? normalized : "SHOPEE_VIDEO";
}

export function normalizeTaskStatus(value: unknown): AutomationTaskStatusValue {
  const normalized = String(value || "").trim().toUpperCase() as AutomationTaskStatusValue;
  return AUTOMATION_TASK_STATUSES.includes(normalized) ? normalized : "DRAFT";
}
