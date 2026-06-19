-- CreateEnum
CREATE TYPE "ComparisonStatus" AS ENUM (
  'DRAFT',
  'QUEUED',
  'SCRAPING',
  'ENRICHING',
  'WRITING',
  'REVIEWING',
  'PUBLISHED',
  'FAILED',
  'ARCHIVED'
);

-- CreateEnum
CREATE TYPE "ComparisonItemStatus" AS ENUM (
  'PENDING',
  'FETCHING',
  'SCRAPED',
  'NORMALIZED',
  'FAILED',
  'SKIPPED'
);

-- CreateEnum
CREATE TYPE "ComparisonStepStatus" AS ENUM (
  'PENDING',
  'RUNNING',
  'SUCCESS',
  'FAILED',
  'RETRY_SCHEDULED',
  'SKIPPED'
);

-- CreateTable
CREATE TABLE "AffiliateComparison" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "theme" TEXT NOT NULL,
  "targetYear" INTEGER,
  "introSummary" TEXT,
  "seoTitle" TEXT,
  "metaDescription" TEXT,
  "heroTitle" TEXT,
  "heroSubtitle" TEXT,
  "contentHtml" TEXT NOT NULL DEFAULT '',
  "faqJson" TEXT NOT NULL DEFAULT '[]',
  "schemaJson" TEXT NOT NULL DEFAULT '{}',
  "status" "ComparisonStatus" NOT NULL DEFAULT 'DRAFT',
  "publishedAt" TIMESTAMP(3),
  "sourceCount" INTEGER NOT NULL DEFAULT 0,
  "validSourceCount" INTEGER NOT NULL DEFAULT 0,
  "views" INTEGER NOT NULL DEFAULT 0,
  "featuredImageUrl" TEXT,
  "generationModel" TEXT,
  "generationNotes" TEXT,
  "errorMessage" TEXT,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AffiliateComparison_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateComparisonItem" (
  "id" TEXT NOT NULL,
  "comparisonId" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "sourceUrl" TEXT NOT NULL,
  "sourceDomain" TEXT NOT NULL,
  "affiliateUrl" TEXT NOT NULL,
  "canonicalUrl" TEXT,
  "storeName" TEXT,
  "productTitle" TEXT,
  "brand" TEXT,
  "priceText" TEXT,
  "priceValue" DOUBLE PRECISION,
  "currency" TEXT,
  "imageUrl" TEXT,
  "ratingText" TEXT,
  "reviewCountText" TEXT,
  "shortDescription" TEXT,
  "bulletPointsJson" TEXT NOT NULL DEFAULT '[]',
  "specsJson" TEXT NOT NULL DEFAULT '{}',
  "prosJson" TEXT NOT NULL DEFAULT '[]',
  "consJson" TEXT NOT NULL DEFAULT '[]',
  "scrapingPayloadJson" TEXT NOT NULL DEFAULT '{}',
  "normalizedPayloadJson" TEXT NOT NULL DEFAULT '{}',
  "status" "ComparisonItemStatus" NOT NULL DEFAULT 'PENDING',
  "scrapedAt" TIMESTAMP(3),
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AffiliateComparisonItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateComparisonStep" (
  "id" TEXT NOT NULL,
  "comparisonId" TEXT NOT NULL,
  "stepName" TEXT NOT NULL,
  "status" "ComparisonStepStatus" NOT NULL DEFAULT 'PENDING',
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

  CONSTRAINT "AffiliateComparisonStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateComparisonEvent" (
  "id" TEXT NOT NULL,
  "comparisonId" TEXT NOT NULL,
  "itemId" TEXT,
  "stepName" TEXT,
  "level" TEXT NOT NULL DEFAULT 'INFO',
  "message" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AffiliateComparisonEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateComparisonConfig" (
  "id" TEXT NOT NULL,
  "isEnabled" BOOLEAN NOT NULL DEFAULT true,
  "autoPublish" BOOLEAN NOT NULL DEFAULT true,
  "maxLinksPerComparison" INTEGER NOT NULL DEFAULT 20,
  "requestTimeoutMs" INTEGER NOT NULL DEFAULT 30000,
  "aiModel" TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  "reviewerModel" TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  "writerTemperature" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
  "reviewerTemperature" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
  "defaultYearStrategy" TEXT NOT NULL DEFAULT 'CURRENT_YEAR',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AffiliateComparisonConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateComparison_slug_key" ON "AffiliateComparison"("slug");

-- CreateIndex
CREATE INDEX "AffiliateComparison_status_idx" ON "AffiliateComparison"("status");

-- CreateIndex
CREATE INDEX "AffiliateComparison_publishedAt_idx" ON "AffiliateComparison"("publishedAt");

-- CreateIndex
CREATE INDEX "AffiliateComparison_theme_idx" ON "AffiliateComparison"("theme");

-- CreateIndex
CREATE INDEX "AffiliateComparison_createdAt_idx" ON "AffiliateComparison"("createdAt");

-- CreateIndex
CREATE INDEX "AffiliateComparisonItem_comparisonId_sortOrder_idx" ON "AffiliateComparisonItem"("comparisonId", "sortOrder");

-- CreateIndex
CREATE INDEX "AffiliateComparisonItem_status_idx" ON "AffiliateComparisonItem"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateComparisonItem_comparisonId_sourceUrl_key" ON "AffiliateComparisonItem"("comparisonId", "sourceUrl");

-- CreateIndex
CREATE INDEX "AffiliateComparisonStep_comparisonId_idx" ON "AffiliateComparisonStep"("comparisonId");

-- CreateIndex
CREATE INDEX "AffiliateComparisonStep_status_idx" ON "AffiliateComparisonStep"("status");

-- CreateIndex
CREATE INDEX "AffiliateComparisonStep_stepName_idx" ON "AffiliateComparisonStep"("stepName");

-- CreateIndex
CREATE INDEX "AffiliateComparisonEvent_comparisonId_createdAt_idx" ON "AffiliateComparisonEvent"("comparisonId", "createdAt");

-- CreateIndex
CREATE INDEX "AffiliateComparisonEvent_itemId_idx" ON "AffiliateComparisonEvent"("itemId");

-- AddForeignKey
ALTER TABLE "AffiliateComparisonItem"
ADD CONSTRAINT "AffiliateComparisonItem_comparisonId_fkey"
FOREIGN KEY ("comparisonId") REFERENCES "AffiliateComparison"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateComparisonStep"
ADD CONSTRAINT "AffiliateComparisonStep_comparisonId_fkey"
FOREIGN KEY ("comparisonId") REFERENCES "AffiliateComparison"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateComparisonEvent"
ADD CONSTRAINT "AffiliateComparisonEvent_comparisonId_fkey"
FOREIGN KEY ("comparisonId") REFERENCES "AffiliateComparison"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
