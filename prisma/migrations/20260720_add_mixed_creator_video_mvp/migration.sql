CREATE TABLE IF NOT EXISTS "MixedCreatorVideo" (
  "id" TEXT NOT NULL,
  "narrationText" TEXT NOT NULL,
  "creatorImageUrl" TEXT NOT NULL,
  "voiceRefUrl" TEXT,
  "audioUrl" TEXT,
  "talkingHeadVideoUrl" TEXT,
  "finalVideoUrl" TEXT,
  "captionsUrl" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "aspectRatio" TEXT NOT NULL DEFAULT 'PORTRAIT_9_16',
  "audioLanguage" TEXT NOT NULL DEFAULT 'Portuguese',
  "speechRate" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "assetPlanJson" TEXT NOT NULL DEFAULT '{}',
  "renderSpecJson" TEXT NOT NULL DEFAULT '{}',
  "errorMessage" TEXT,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MixedCreatorVideo_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MixedCreatorVideoAsset" (
  "id" TEXT NOT NULL,
  "mixedCreatorVideoId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'UPLOAD',
  "originalName" TEXT,
  "userLabel" TEXT,
  "autoLabel" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MixedCreatorVideoAsset_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "MixedCreatorVideo_status_idx" ON "MixedCreatorVideo"("status");
CREATE INDEX IF NOT EXISTS "MixedCreatorVideo_createdAt_idx" ON "MixedCreatorVideo"("createdAt");
CREATE INDEX IF NOT EXISTS "MixedCreatorVideoAsset_mixedCreatorVideoId_sortOrder_idx" ON "MixedCreatorVideoAsset"("mixedCreatorVideoId", "sortOrder");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'MixedCreatorVideoAsset_mixedCreatorVideoId_fkey'
  ) THEN
    ALTER TABLE "MixedCreatorVideoAsset"
    ADD CONSTRAINT "MixedCreatorVideoAsset_mixedCreatorVideoId_fkey"
    FOREIGN KEY ("mixedCreatorVideoId") REFERENCES "MixedCreatorVideo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
