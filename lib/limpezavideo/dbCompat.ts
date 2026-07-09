import { prisma } from "@/lib/prisma";

const OPTIONAL_JOB_COLUMNS = ["affiliateUrl", "isPublished", "publishedAt", "showTopMessage"] as const;

type OptionalJobColumn = (typeof OPTIONAL_JOB_COLUMNS)[number];

let cachedOptionalColumns: Set<string> | null = null;

async function getVideoCleanupJobColumns() {
  if (cachedOptionalColumns) return cachedOptionalColumns;
  const rows = await prisma.$queryRaw<Array<{ column_name: string }>>`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'VideoCleanupJob'
  `;
  cachedOptionalColumns = new Set(rows.map((row) => row.column_name));
  return cachedOptionalColumns;
}

export async function hasVideoCleanupJobColumn(column: OptionalJobColumn) {
  const columns = await getVideoCleanupJobColumns();
  return columns.has(column);
}

export async function buildVideoCleanupJobSelect(includeRelations = false) {
  const [hasAffiliateUrl, hasIsPublished, hasPublishedAt, hasShowTopMessage] = await Promise.all([
    hasVideoCleanupJobColumn("affiliateUrl"),
    hasVideoCleanupJobColumn("isPublished"),
    hasVideoCleanupJobColumn("publishedAt"),
    hasVideoCleanupJobColumn("showTopMessage"),
  ]);

  const select: Record<string, any> = {
    id: true,
    ownerUserId: true,
    status: true,
    sourceType: true,
    originalFilename: true,
    mimeType: true,
    inputBucketKey: true,
    inputUrl: true,
    outputBucketKey: true,
    outputUrl: true,
    logoBucketKey: true,
    logoUrl: true,
    instagramHandle: true,
    endCardDurationSec: true,
    durationSec: true,
    fileSizeBytes: true,
    width: true,
    height: true,
    fps: true,
    audioMode: true,
    audioVolumePercent: true,
    outputFormat: true,
    progressPercent: true,
    currentStep: true,
    estimatedSecondsLeft: true,
    processingStartedAt: true,
    processingFinishedAt: true,
    errorMessage: true,
    metadataJson: true,
    createdAt: true,
    updatedAt: true,
    ...(hasAffiliateUrl ? { affiliateUrl: true } : {}),
    ...(hasIsPublished ? { isPublished: true } : {}),
    ...(hasPublishedAt ? { publishedAt: true } : {}),
    ...(hasShowTopMessage ? { showTopMessage: true } : {}),
  };

  if (includeRelations) {
    select.steps = {
      orderBy: { createdAt: "asc" },
    };
    select.events = {
      orderBy: { createdAt: "desc" },
      take: 30,
    };
  }

  return select;
}

export async function buildVideoCleanupJobCreateData(data: Record<string, any>) {
  const compatibleData = { ...data };
  if (!(await hasVideoCleanupJobColumn("showTopMessage"))) delete compatibleData.showTopMessage;
  if (!(await hasVideoCleanupJobColumn("affiliateUrl"))) delete compatibleData.affiliateUrl;
  if (!(await hasVideoCleanupJobColumn("isPublished"))) delete compatibleData.isPublished;
  if (!(await hasVideoCleanupJobColumn("publishedAt"))) delete compatibleData.publishedAt;
  return compatibleData;
}

export async function buildVideoCleanupJobUpdateData(data: Record<string, any>) {
  return buildVideoCleanupJobCreateData(data);
}

export function applyVideoCleanupJobDefaults<T extends Record<string, any>>(job: T): T {
  return {
    affiliateUrl: null,
    isPublished: false,
    publishedAt: null,
    showTopMessage: true,
    ...job,
  };
}

export function applyVideoCleanupJobDefaultsList<T extends Record<string, any>>(jobs: T[]) {
  return jobs.map((job) => applyVideoCleanupJobDefaults(job));
}
