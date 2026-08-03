ALTER TABLE "CrmSettings"
  ADD COLUMN IF NOT EXISTS "offersCronEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "offersGroupTargetId" TEXT,
  ADD COLUMN IF NOT EXISTS "offersGroupLabel" TEXT,
  ADD COLUMN IF NOT EXISTS "offersPublishIntervalMin" INTEGER NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS "offersDailyStartHour" INTEGER NOT NULL DEFAULT 8,
  ADD COLUMN IF NOT EXISTS "offersDailyEndHour" INTEGER NOT NULL DEFAULT 22,
  ADD COLUMN IF NOT EXISTS "offersRequireApproval" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "offersLastRunAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "offersNextRunAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "WhatsappPromoCatalogItem" (
  "id" TEXT NOT NULL,
  "productCatalogId" TEXT,
  "sourceType" TEXT NOT NULL DEFAULT 'MANUAL',
  "sourceBatchKey" TEXT,
  "sourceOfferName" TEXT,
  "sourceOfferType" TEXT,
  "sourceOfferPeriod" TEXT,
  "sourceUrl" TEXT,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "imageUrl" TEXT,
  "category" TEXT,
  "affiliateUrl" TEXT NOT NULL,
  "productUrl" TEXT,
  "oldPrice" DOUBLE PRECISION,
  "currentPrice" DOUBLE PRECISION,
  "discountPercent" INTEGER,
  "savingsAmount" DOUBLE PRECISION,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "readyForPublish" BOOLEAN NOT NULL DEFAULT false,
  "lastPriceCheckAt" TIMESTAMP(3),
  "lastPublishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WhatsappPromoCatalogItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "WhatsappPromoPost" (
  "id" TEXT NOT NULL,
  "catalogItemId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "headline" TEXT NOT NULL,
  "bodyText" TEXT NOT NULL,
  "linkUrl" TEXT NOT NULL,
  "mediaUrl" TEXT,
  "scheduledTo" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "targetType" TEXT NOT NULL DEFAULT 'GROUP',
  "targetId" TEXT,
  "deliveryPayload" TEXT NOT NULL DEFAULT '{}',
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WhatsappPromoPost_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WhatsappPromoCatalogItem_slug_key" ON "WhatsappPromoCatalogItem"("slug");
CREATE INDEX IF NOT EXISTS "WhatsappPromoCatalogItem_active_readyForPublish_updatedAt_idx" ON "WhatsappPromoCatalogItem"("active", "readyForPublish", "updatedAt");
CREATE INDEX IF NOT EXISTS "WhatsappPromoCatalogItem_sourceBatchKey_idx" ON "WhatsappPromoCatalogItem"("sourceBatchKey");
CREATE INDEX IF NOT EXISTS "WhatsappPromoCatalogItem_productCatalogId_idx" ON "WhatsappPromoCatalogItem"("productCatalogId");
CREATE INDEX IF NOT EXISTS "WhatsappPromoPost_status_scheduledTo_idx" ON "WhatsappPromoPost"("status", "scheduledTo");
CREATE INDEX IF NOT EXISTS "WhatsappPromoPost_catalogItemId_createdAt_idx" ON "WhatsappPromoPost"("catalogItemId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "WhatsappPromoCatalogItem"
    ADD CONSTRAINT "WhatsappPromoCatalogItem_productCatalogId_fkey"
    FOREIGN KEY ("productCatalogId") REFERENCES "ProductCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "WhatsappPromoPost"
    ADD CONSTRAINT "WhatsappPromoPost_catalogItemId_fkey"
    FOREIGN KEY ("catalogItemId") REFERENCES "WhatsappPromoCatalogItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
