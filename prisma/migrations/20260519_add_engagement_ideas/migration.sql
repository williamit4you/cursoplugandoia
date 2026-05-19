-- Engagement Ideas + Creator Assets

CREATE TABLE IF NOT EXISTS "CreatorAsset" (
  "id" TEXT NOT NULL,
  "kind" TEXT NOT NULL DEFAULT 'IMAGE',
  "label" TEXT,
  "url" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CreatorAsset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CreatorAsset_url_key" ON "CreatorAsset"("url");
CREATE INDEX IF NOT EXISTS "CreatorAsset_kind_idx" ON "CreatorAsset"("kind");
CREATE INDEX IF NOT EXISTS "CreatorAsset_active_idx" ON "CreatorAsset"("active");

CREATE TABLE IF NOT EXISTS "EngagementIdea" (
  "id" TEXT NOT NULL,
  "coletaId" TEXT,
  "templateType" TEXT NOT NULL,
  "personaName" TEXT,
  "hook" TEXT NOT NULL,
  "script" TEXT NOT NULL,
  "onScreenText" JSONB NOT NULL DEFAULT '[]',
  "ctaComment" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "creatorImageUrl" TEXT,
  "audioUrl" TEXT,
  "videoUrl" TEXT,
  "captionsUrl" TEXT,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EngagementIdea_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "EngagementIdea_coletaId_idx" ON "EngagementIdea"("coletaId");
CREATE INDEX IF NOT EXISTS "EngagementIdea_templateType_idx" ON "EngagementIdea"("templateType");
CREATE INDEX IF NOT EXISTS "EngagementIdea_status_idx" ON "EngagementIdea"("status");
CREATE INDEX IF NOT EXISTS "EngagementIdea_createdAt_idx" ON "EngagementIdea"("createdAt");

DO $$ BEGIN
  ALTER TABLE "EngagementIdea"
    ADD CONSTRAINT "EngagementIdea_coletaId_fkey"
    FOREIGN KEY ("coletaId") REFERENCES "ColetaDadosShoppe"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

