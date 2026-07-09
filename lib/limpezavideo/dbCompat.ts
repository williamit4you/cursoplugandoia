const OPTIONAL_JOB_COLUMNS = ["affiliateUrl", "isPublished", "publishedAt", "showTopMessage"] as const;

type OptionalJobColumn = (typeof OPTIONAL_JOB_COLUMNS)[number];

export async function hasVideoCleanupJobColumn(_: OptionalJobColumn) {
  return false;
}

export async function buildVideoCleanupJobSelect(includeRelations = false) {
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
  for (const column of OPTIONAL_JOB_COLUMNS) {
    delete compatibleData[column];
  }
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
