ALTER TABLE "ProductCatalog"
ADD COLUMN "affiliateStoreId" TEXT;

ALTER TABLE "SeoBrief"
ADD COLUMN "metaDescription" TEXT,
ADD COLUMN "contentJson" TEXT,
ADD COLUMN "qualityScore" DOUBLE PRECISION,
ADD COLUMN "indexable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "publishedAt" TIMESTAMP(3);

CREATE TABLE "CommerceEditorialConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "autoPublish" BOOLEAN NOT NULL DEFAULT true,
    "runEveryHours" INTEGER NOT NULL DEFAULT 24,
    "maxItemsPerRun" INTEGER NOT NULL DEFAULT 1,
    "minimumWords" INTEGER NOT NULL DEFAULT 900,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "lockedAt" TIMESTAMP(3),
    "lastResultJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CommerceEditorialConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommerceEditorialRun" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "step" TEXT NOT NULL DEFAULT 'SELECT_STORE',
    "storeId" TEXT,
    "productId" TEXT,
    "briefId" TEXT,
    "sourceUrl" TEXT,
    "message" TEXT,
    "detailsJson" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CommerceEditorialRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProductCatalog_affiliateStoreId_status_idx" ON "ProductCatalog"("affiliateStoreId", "status");
CREATE INDEX "SeoBrief_status_indexable_publishedAt_idx" ON "SeoBrief"("status", "indexable", "publishedAt");
CREATE INDEX "CommerceEditorialRun_status_startedAt_idx" ON "CommerceEditorialRun"("status", "startedAt");
CREATE INDEX "CommerceEditorialRun_storeId_startedAt_idx" ON "CommerceEditorialRun"("storeId", "startedAt");

ALTER TABLE "ProductCatalog"
ADD CONSTRAINT "ProductCatalog_affiliateStoreId_fkey"
FOREIGN KEY ("affiliateStoreId") REFERENCES "AffiliateStore"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "CommerceEditorialConfig" (
  "id", "enabled", "autoPublish", "runEveryHours", "maxItemsPerRun",
  "minimumWords", "createdAt", "updatedAt"
)
VALUES ('default', true, true, 24, 1, 900, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
