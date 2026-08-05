CREATE TABLE "PetSeoConfig" (
    "id" TEXT NOT NULL DEFAULT 'cobasi',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "autoPublish" BOOLEAN NOT NULL DEFAULT false,
    "runEveryHours" INTEGER NOT NULL DEFAULT 24,
    "maxItemsPerRun" INTEGER NOT NULL DEFAULT 1,
    "minimumWords" INTEGER NOT NULL DEFAULT 900,
    "minimumScore" DOUBLE PRECISION NOT NULL DEFAULT 80,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "lockedAt" TIMESTAMP(3),
    "lastResultJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PetSeoConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PetLocation" (
    "id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "sourceUrl" TEXT,
    "factsJson" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PetLocation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PetStoreUnit" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "affiliateStoreId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "postalCode" TEXT,
    "phone" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "openingHoursJson" TEXT,
    "servicesJson" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "verifiedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PetStoreUnit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PetContentPage" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "path" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "seoTitle" TEXT,
    "metaDescription" TEXT,
    "primaryKeyword" TEXT NOT NULL,
    "searchIntent" TEXT,
    "outlineJson" TEXT,
    "contentJson" TEXT,
    "sourcesJson" TEXT,
    "internalLinksJson" TEXT,
    "reviewJson" TEXT,
    "qualityScore" DOUBLE PRECISION,
    "indexable" BOOLEAN NOT NULL DEFAULT false,
    "affiliateStoreId" TEXT NOT NULL,
    "locationId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PetContentPage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PetSeoRun" (
    "id" TEXT NOT NULL,
    "pageId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "step" TEXT NOT NULL DEFAULT 'SELECT_TOPIC',
    "message" TEXT,
    "detailsJson" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PetSeoRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PetLocation_slug_key" ON "PetLocation"("slug");
CREATE UNIQUE INDEX "PetLocation_city_state_key" ON "PetLocation"("city", "state");
CREATE INDEX "PetLocation_status_state_city_idx" ON "PetLocation"("status", "state", "city");
CREATE INDEX "PetStoreUnit_locationId_status_idx" ON "PetStoreUnit"("locationId", "status");
CREATE INDEX "PetStoreUnit_affiliateStoreId_status_idx" ON "PetStoreUnit"("affiliateStoreId", "status");
CREATE UNIQUE INDEX "PetContentPage_path_key" ON "PetContentPage"("path");
CREATE INDEX "PetContentPage_status_scheduledAt_createdAt_idx" ON "PetContentPage"("status", "scheduledAt", "createdAt");
CREATE INDEX "PetContentPage_status_indexable_publishedAt_idx" ON "PetContentPage"("status", "indexable", "publishedAt");
CREATE INDEX "PetContentPage_type_status_idx" ON "PetContentPage"("type", "status");
CREATE INDEX "PetContentPage_affiliateStoreId_status_idx" ON "PetContentPage"("affiliateStoreId", "status");
CREATE INDEX "PetContentPage_locationId_status_idx" ON "PetContentPage"("locationId", "status");
CREATE INDEX "PetSeoRun_status_startedAt_idx" ON "PetSeoRun"("status", "startedAt");
CREATE INDEX "PetSeoRun_pageId_startedAt_idx" ON "PetSeoRun"("pageId", "startedAt");

ALTER TABLE "PetStoreUnit" ADD CONSTRAINT "PetStoreUnit_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "PetLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PetStoreUnit" ADD CONSTRAINT "PetStoreUnit_affiliateStoreId_fkey" FOREIGN KEY ("affiliateStoreId") REFERENCES "AffiliateStore"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PetContentPage" ADD CONSTRAINT "PetContentPage_affiliateStoreId_fkey" FOREIGN KEY ("affiliateStoreId") REFERENCES "AffiliateStore"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PetContentPage" ADD CONSTRAINT "PetContentPage_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "PetLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PetSeoRun" ADD CONSTRAINT "PetSeoRun_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "PetContentPage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "PetSeoConfig" ("id", "enabled", "autoPublish", "runEveryHours", "maxItemsPerRun", "minimumWords", "minimumScore", "createdAt", "updatedAt")
VALUES ('cobasi', true, false, 24, 1, 900, 80, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
