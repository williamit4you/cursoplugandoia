-- SimpleCreatorVideo (Texto -> Audio -> Video)

CREATE TABLE IF NOT EXISTS "SimpleCreatorVideo" (
  "id" TEXT NOT NULL,
  "narrationText" TEXT NOT NULL,
  "creatorImageUrl" TEXT NOT NULL,
  "audioUrl" TEXT,
  "videoUrl" TEXT,
  "captionsUrl" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SimpleCreatorVideo_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SimpleCreatorVideo_status_idx" ON "SimpleCreatorVideo"("status");
CREATE INDEX IF NOT EXISTS "SimpleCreatorVideo_createdAt_idx" ON "SimpleCreatorVideo"("createdAt");

