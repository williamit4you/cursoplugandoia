-- Shopee Video Pipeline (merge/affiliate/story/bio) foundation

-- 1) Enums
DO $$ BEGIN
  CREATE TYPE "ShopeePipelineStatus" AS ENUM (
    'PENDING',
    'SCRAPING_MEDIA',
    'MEDIA_SCRAPED',
    'GENERATING_COPY',
    'COPY_READY',
    'WAITING_POD',
    'GENERATING_AUDIO',
    'AUDIO_READY',
    'GENERATING_COPY_VIDEO',
    'COPY_VIDEO_READY',
    'MERGING_VIDEOS',
    'FINAL_VIDEO_READY',
    'GENERATING_AFFILIATE_LINK',
    'AFFILIATE_LINK_READY',
    'READY_FOR_STORY',
    'SCHEDULED',
    'PUBLISHING',
    'PUBLISHED',
    'FAILED',
    'PAUSED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ShopeePipelineStepStatus" AS ENUM (
    'PENDING',
    'RUNNING',
    'SUCCESS',
    'FAILED',
    'RETRY_SCHEDULED',
    'SKIPPED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PodSessionStatus" AS ENUM (
    'OFFLINE',
    'STARTING',
    'ONLINE',
    'BUSY',
    'IDLE',
    'STOPPING',
    'ERROR'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "StoryAdStatus" AS ENUM (
    'DRAFT',
    'SCHEDULED',
    'PUBLISHING',
    'PUBLISHED',
    'FAILED',
    'CANCELED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "StoryPublicationStatus" AS ENUM (
    'PENDING',
    'PUBLISHING',
    'PUBLISHED',
    'FAILED',
    'RETRY_SCHEDULED',
    'CANCELED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "StoryPlatform" AS ENUM (
    'TIKTOK',
    'YOUTUBE',
    'INSTAGRAM'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) ColetaDadosShoppe columns (safe add)
ALTER TABLE "ColetaDadosShoppe" ADD COLUMN IF NOT EXISTS "pipelineStatus" "ShopeePipelineStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "ColetaDadosShoppe" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "ColetaDadosShoppe" ADD COLUMN IF NOT EXISTS "priority" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ColetaDadosShoppe" ADD COLUMN IF NOT EXISTS "lockedAt" TIMESTAMP(3);
ALTER TABLE "ColetaDadosShoppe" ADD COLUMN IF NOT EXISTS "lockedBy" TEXT;
ALTER TABLE "ColetaDadosShoppe" ADD COLUMN IF NOT EXISTS "nextRunAt" TIMESTAMP(3);
ALTER TABLE "ColetaDadosShoppe" ADD COLUMN IF NOT EXISTS "attemptCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ColetaDadosShoppe" ADD COLUMN IF NOT EXISTS "lastError" TEXT;
ALTER TABLE "ColetaDadosShoppe" ADD COLUMN IF NOT EXISTS "mediaImageUrls" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "ColetaDadosShoppe" ADD COLUMN IF NOT EXISTS "mediaVideoUrls" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "ColetaDadosShoppe" ADD COLUMN IF NOT EXISTS "audioUrl" TEXT;
ALTER TABLE "ColetaDadosShoppe" ADD COLUMN IF NOT EXISTS "copyVideoUrl" TEXT;
ALTER TABLE "ColetaDadosShoppe" ADD COLUMN IF NOT EXISTS "affiliateUrl" TEXT;

-- 3) Tables
CREATE TABLE IF NOT EXISTS "ShopeePipelineConfig" (
  "id" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "runEveryMinutes" INTEGER NOT NULL DEFAULT 5,
  "maxItemsPerRun" INTEGER NOT NULL DEFAULT 1,
  "processOneAtATime" BOOLEAN NOT NULL DEFAULT true,
  "userBaseImageUrl" TEXT,
  "userVoiceRefUrl" TEXT,
  "comfyAudioPromptTemplate" JSONB,
  "comfyVideoPromptTemplate" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ShopeePipelineConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ShopeePipelineStep" (
  "id" TEXT NOT NULL,
  "coletaId" TEXT NOT NULL,
  "stepName" TEXT NOT NULL,
  "status" "ShopeePipelineStepStatus" NOT NULL DEFAULT 'PENDING',
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "durationMs" INTEGER,
  "attempt" INTEGER NOT NULL DEFAULT 1,
  "nextRetryAt" TIMESTAMP(3),
  "errorCode" TEXT,
  "errorMessage" TEXT,
  "requestPayload" JSONB,
  "responsePayload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ShopeePipelineStep_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ShopeePipelineStep_coletaId_idx" ON "ShopeePipelineStep"("coletaId");
CREATE INDEX IF NOT EXISTS "ShopeePipelineStep_stepName_idx" ON "ShopeePipelineStep"("stepName");
CREATE INDEX IF NOT EXISTS "ShopeePipelineStep_status_idx" ON "ShopeePipelineStep"("status");
CREATE INDEX IF NOT EXISTS "ShopeePipelineStep_nextRetryAt_idx" ON "ShopeePipelineStep"("nextRetryAt");

DO $$ BEGIN
  ALTER TABLE "ShopeePipelineStep"
    ADD CONSTRAINT "ShopeePipelineStep_coletaId_fkey"
    FOREIGN KEY ("coletaId") REFERENCES "ColetaDadosShoppe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "ShopeePipelineEvent" (
  "id" TEXT NOT NULL,
  "coletaId" TEXT NOT NULL,
  "stepName" TEXT,
  "level" TEXT NOT NULL DEFAULT 'INFO',
  "message" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ShopeePipelineEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ShopeePipelineEvent_coletaId_idx" ON "ShopeePipelineEvent"("coletaId");
CREATE INDEX IF NOT EXISTS "ShopeePipelineEvent_createdAt_idx" ON "ShopeePipelineEvent"("createdAt");

DO $$ BEGIN
  ALTER TABLE "ShopeePipelineEvent"
    ADD CONSTRAINT "ShopeePipelineEvent_coletaId_fkey"
    FOREIGN KEY ("coletaId") REFERENCES "ColetaDadosShoppe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "PodSession" (
  "id" TEXT NOT NULL,
  "status" "PodSessionStatus" NOT NULL DEFAULT 'OFFLINE',
  "startedAt" TIMESTAMP(3),
  "stoppedAt" TIMESTAMP(3),
  "lastOnlineCheckAt" TIMESTAMP(3),
  "lastActivityAt" TIMESTAMP(3),
  "currentColetaId" TEXT,
  "currentStepName" TEXT,
  "shutdownRequestedAt" TIMESTAMP(3),
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PodSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PodSession_status_idx" ON "PodSession"("status");
CREATE INDEX IF NOT EXISTS "PodSession_lastActivityAt_idx" ON "PodSession"("lastActivityAt");

CREATE TABLE IF NOT EXISTS "StoryAd" (
  "id" TEXT NOT NULL,
  "coletaId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "videoUrl" TEXT NOT NULL,
  "affiliateUrl" TEXT NOT NULL,
  "scheduledAt" TIMESTAMP(3),
  "status" "StoryAdStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StoryAd_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "StoryAd_coletaId_key" ON "StoryAd"("coletaId");
CREATE INDEX IF NOT EXISTS "StoryAd_status_idx" ON "StoryAd"("status");
CREATE INDEX IF NOT EXISTS "StoryAd_scheduledAt_idx" ON "StoryAd"("scheduledAt");

DO $$ BEGIN
  ALTER TABLE "StoryAd"
    ADD CONSTRAINT "StoryAd_coletaId_fkey"
    FOREIGN KEY ("coletaId") REFERENCES "ColetaDadosShoppe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "StoryPublication" (
  "id" TEXT NOT NULL,
  "storyAdId" TEXT NOT NULL,
  "platform" "StoryPlatform" NOT NULL,
  "status" "StoryPublicationStatus" NOT NULL DEFAULT 'PENDING',
  "externalPostId" TEXT,
  "publishedUrl" TEXT,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "nextRetryAt" TIMESTAMP(3),
  "errorMessage" TEXT,
  "requestPayload" JSONB,
  "responsePayload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StoryPublication_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "StoryPublication_platform_idx" ON "StoryPublication"("platform");
CREATE INDEX IF NOT EXISTS "StoryPublication_status_idx" ON "StoryPublication"("status");
CREATE INDEX IF NOT EXISTS "StoryPublication_nextRetryAt_idx" ON "StoryPublication"("nextRetryAt");

DO $$ BEGIN
  ALTER TABLE "StoryPublication"
    ADD CONSTRAINT "StoryPublication_storyAdId_fkey"
    FOREIGN KEY ("storyAdId") REFERENCES "StoryAd"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Bio tables (Fase 8 do spec) - criadas aqui para manter schema x migrations alinhados
CREATE TABLE IF NOT EXISTS "BioCategory" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BioCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "BioCategory_slug_key" ON "BioCategory"("slug");

CREATE TABLE IF NOT EXISTS "BioProduct" (
  "id" TEXT NOT NULL,
  "coletaId" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "imageUrl" TEXT,
  "videoUrl" TEXT,
  "affiliateUrl" TEXT NOT NULL,
  "categoryId" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BioProduct_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "BioProduct_coletaId_key" ON "BioProduct"("coletaId");
CREATE UNIQUE INDEX IF NOT EXISTS "BioProduct_slug_key" ON "BioProduct"("slug");
CREATE INDEX IF NOT EXISTS "BioProduct_active_idx" ON "BioProduct"("active");

DO $$ BEGIN
  ALTER TABLE "BioProduct"
    ADD CONSTRAINT "BioProduct_coletaId_fkey"
    FOREIGN KEY ("coletaId") REFERENCES "ColetaDadosShoppe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "BioProduct"
    ADD CONSTRAINT "BioProduct_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "BioCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "BioClick" (
  "id" TEXT NOT NULL,
  "bioProductId" TEXT NOT NULL,
  "source" TEXT,
  "userAgent" TEXT,
  "ipHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BioClick_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "BioClick_bioProductId_idx" ON "BioClick"("bioProductId");
CREATE INDEX IF NOT EXISTS "BioClick_createdAt_idx" ON "BioClick"("createdAt");

DO $$ BEGIN
  ALTER TABLE "BioClick"
    ADD CONSTRAINT "BioClick_bioProductId_fkey"
    FOREIGN KEY ("bioProductId") REFERENCES "BioProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

