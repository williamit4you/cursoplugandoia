CREATE TABLE "DailyNewsEdition" (
    "id" TEXT NOT NULL,
    "editionDate" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "title" TEXT,
    "description" TEXT,
    "scriptText" TEXT,
    "targetDurationSec" INTEGER NOT NULL DEFAULT 240,
    "measuredDurationSec" DOUBLE PRECISION,
    "codeVideoProjectId" TEXT,
    "previewVideoUrl" TEXT,
    "finalVideoUrl" TEXT,
    "thumbnailUrl" TEXT,
    "captionsUrl" TEXT,
    "scriptApprovedAt" TIMESTAMP(3),
    "scriptApprovedBy" TEXT,
    "finalApprovedAt" TIMESTAMP(3),
    "finalApprovedBy" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "youtubePostUrl" TEXT,
    "sourceSnapshotJson" JSONB,
    "assetPlanJson" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DailyNewsEdition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DailyNewsEditionItem" (
    "id" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "category" TEXT,
    "titleSnapshot" TEXT NOT NULL,
    "sourceName" TEXT,
    "sourceUrl" TEXT,
    "publishedAtSnapshot" TIMESTAMP(3),
    "narrationText" TEXT,
    "targetDurationSec" INTEGER,
    "verificationJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DailyNewsEditionItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DailyNewsAsset" (
    "id" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "editionItemId" TEXT,
    "assetType" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "query" TEXT,
    "originalUrl" TEXT NOT NULL,
    "stableUrl" TEXT,
    "author" TEXT,
    "licenseUrl" TEXT,
    "credit" TEXT,
    "technicalJson" JSONB,
    "contentHash" TEXT,
    "startSec" DOUBLE PRECISION,
    "endSec" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'DISCOVERED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DailyNewsAsset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DailyNewsEdition_codeVideoProjectId_key" ON "DailyNewsEdition"("codeVideoProjectId");
CREATE UNIQUE INDEX "DailyNewsEdition_editionDate_timezone_key" ON "DailyNewsEdition"("editionDate", "timezone");
CREATE INDEX "DailyNewsEdition_status_createdAt_idx" ON "DailyNewsEdition"("status", "createdAt");

CREATE UNIQUE INDEX "DailyNewsEditionItem_editionId_postId_key" ON "DailyNewsEditionItem"("editionId", "postId");
CREATE UNIQUE INDEX "DailyNewsEditionItem_editionId_position_key" ON "DailyNewsEditionItem"("editionId", "position");

CREATE INDEX "DailyNewsAsset_editionId_status_idx" ON "DailyNewsAsset"("editionId", "status");
CREATE INDEX "DailyNewsAsset_editionItemId_idx" ON "DailyNewsAsset"("editionItemId");

ALTER TABLE "DailyNewsEdition"
ADD CONSTRAINT "DailyNewsEdition_codeVideoProjectId_fkey"
FOREIGN KEY ("codeVideoProjectId") REFERENCES "CodeVideoProject"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DailyNewsEditionItem"
ADD CONSTRAINT "DailyNewsEditionItem_editionId_fkey"
FOREIGN KEY ("editionId") REFERENCES "DailyNewsEdition"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DailyNewsEditionItem"
ADD CONSTRAINT "DailyNewsEditionItem_postId_fkey"
FOREIGN KEY ("postId") REFERENCES "Post"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DailyNewsAsset"
ADD CONSTRAINT "DailyNewsAsset_editionId_fkey"
FOREIGN KEY ("editionId") REFERENCES "DailyNewsEdition"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DailyNewsAsset"
ADD CONSTRAINT "DailyNewsAsset_editionItemId_fkey"
FOREIGN KEY ("editionItemId") REFERENCES "DailyNewsEditionItem"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
