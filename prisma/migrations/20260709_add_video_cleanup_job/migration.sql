-- CreateTable
CREATE TABLE "VideoCleanupJob" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UPLOADING',
    "sourceType" TEXT NOT NULL DEFAULT 'UPLOAD',
    "originalFilename" TEXT,
    "mimeType" TEXT,
    "inputBucketKey" TEXT,
    "inputUrl" TEXT,
    "outputBucketKey" TEXT,
    "outputUrl" TEXT,
    "logoBucketKey" TEXT,
    "logoUrl" TEXT,
    "instagramHandle" TEXT DEFAULT '@compraesperta.promocoes',
    "endCardDurationSec" DOUBLE PRECISION NOT NULL DEFAULT 2.0,
    "durationSec" DOUBLE PRECISION,
    "fileSizeBytes" BIGINT,
    "width" INTEGER,
    "height" INTEGER,
    "fps" DOUBLE PRECISION,
    "audioMode" TEXT NOT NULL DEFAULT 'PRESERVE',
    "audioVolumePercent" INTEGER NOT NULL DEFAULT 100,
    "outputFormat" TEXT NOT NULL DEFAULT 'mp4',
    "progressPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentStep" TEXT,
    "estimatedSecondsLeft" INTEGER,
    "processingStartedAt" TIMESTAMP(3),
    "processingFinishedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "metadataJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoCleanupJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoCleanupStep" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "stepName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "errorMessage" TEXT,
    "requestPayload" JSONB,
    "responsePayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoCleanupStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoCleanupEvent" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'INFO',
    "stepName" TEXT,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoCleanupEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VideoCleanupJob_ownerUserId_createdAt_idx" ON "VideoCleanupJob"("ownerUserId", "createdAt");

-- CreateIndex
CREATE INDEX "VideoCleanupJob_status_idx" ON "VideoCleanupJob"("status");

-- CreateIndex
CREATE INDEX "VideoCleanupStep_jobId_stepName_idx" ON "VideoCleanupStep"("jobId", "stepName");

-- CreateIndex
CREATE INDEX "VideoCleanupStep_status_idx" ON "VideoCleanupStep"("status");

-- CreateIndex
CREATE INDEX "VideoCleanupEvent_jobId_createdAt_idx" ON "VideoCleanupEvent"("jobId", "createdAt");

-- AddForeignKey
ALTER TABLE "VideoCleanupJob" ADD CONSTRAINT "VideoCleanupJob_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoCleanupStep" ADD CONSTRAINT "VideoCleanupStep_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "VideoCleanupJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoCleanupEvent" ADD CONSTRAINT "VideoCleanupEvent_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "VideoCleanupJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
