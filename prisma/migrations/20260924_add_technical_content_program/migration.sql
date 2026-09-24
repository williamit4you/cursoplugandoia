CREATE TABLE "TechnicalContentTopic" (
  "id" TEXT NOT NULL,
  "funnel" TEXT NOT NULL,
  "keyword" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "searchIntent" TEXT NOT NULL,
  "angle" TEXT,
  "priority" INTEGER NOT NULL DEFAULT 100,
  "status" TEXT NOT NULL DEFAULT 'QUEUED',
  "scheduledAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "lastError" TEXT,
  "postId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TechnicalContentTopic_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TechnicalContentConfig" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  "model" TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  "autoPublish" BOOLEAN NOT NULL DEFAULT true,
  "minWords" INTEGER NOT NULL DEFAULT 900,
  "topHour" INTEGER NOT NULL DEFAULT 7,
  "middleHour" INTEGER NOT NULL DEFAULT 12,
  "bottomHour" INTEGER NOT NULL DEFAULT 18,
  "lastTopRunAt" TIMESTAMP(3),
  "lastMiddleRunAt" TIMESTAMP(3),
  "lastBottomRunAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TechnicalContentConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TechnicalContentTopic_postId_key" ON "TechnicalContentTopic"("postId");
CREATE UNIQUE INDEX "TechnicalContentTopic_funnel_keyword_key" ON "TechnicalContentTopic"("funnel", "keyword");
CREATE INDEX "TechnicalContentTopic_funnel_status_priority_idx" ON "TechnicalContentTopic"("funnel", "status", "priority");
CREATE INDEX "TechnicalContentTopic_status_scheduledAt_idx" ON "TechnicalContentTopic"("status", "scheduledAt");
ALTER TABLE "TechnicalContentTopic" ADD CONSTRAINT "TechnicalContentTopic_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;
