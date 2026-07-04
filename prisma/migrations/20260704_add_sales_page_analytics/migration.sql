-- CreateEnum
CREATE TYPE "SalesPageEventType" AS ENUM (
  'PAGE_VIEW',
  'VIEW_CONTENT',
  'INITIATE_CHECKOUT',
  'LEAD',
  'PURCHASE'
);

-- CreateEnum
CREATE TYPE "SalesPageDeviceType" AS ENUM (
  'DESKTOP',
  'MOBILE',
  'TABLET',
  'BOT',
  'UNKNOWN'
);

-- CreateTable
CREATE TABLE "SalesPageEvent" (
  "id" TEXT NOT NULL,
  "pageKey" TEXT NOT NULL,
  "pagePath" TEXT NOT NULL,
  "pageTitle" TEXT,
  "eventType" "SalesPageEventType" NOT NULL,
  "sessionId" TEXT NOT NULL,
  "visitorId" TEXT,
  "source" TEXT NOT NULL DEFAULT 'site',
  "referrer" TEXT,
  "userAgent" TEXT,
  "ipHash" TEXT,
  "deviceType" "SalesPageDeviceType" NOT NULL DEFAULT 'UNKNOWN',
  "browser" TEXT,
  "os" TEXT,
  "country" TEXT,
  "region" TEXT,
  "city" TEXT,
  "utmSource" TEXT,
  "utmMedium" TEXT,
  "utmCampaign" TEXT,
  "utmTerm" TEXT,
  "utmContent" TEXT,
  "fbclid" TEXT,
  "metaEventName" TEXT,
  "checkoutUrl" TEXT,
  "currency" TEXT,
  "value" DOUBLE PRECISION,
  "orderId" TEXT,
  "metadataJson" TEXT NOT NULL DEFAULT '{}',
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SalesPageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesPageSession" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "pageKey" TEXT NOT NULL,
  "landingPath" TEXT NOT NULL,
  "firstReferrer" TEXT,
  "firstUtmSource" TEXT,
  "firstUtmMedium" TEXT,
  "firstUtmCampaign" TEXT,
  "firstUtmTerm" TEXT,
  "firstUtmContent" TEXT,
  "firstFbclid" TEXT,
  "firstDeviceType" "SalesPageDeviceType" NOT NULL DEFAULT 'UNKNOWN',
  "firstUserAgent" TEXT,
  "visitorId" TEXT,
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "pageViewCount" INTEGER NOT NULL DEFAULT 0,
  "viewContentCount" INTEGER NOT NULL DEFAULT 0,
  "initiateCheckoutCount" INTEGER NOT NULL DEFAULT 0,
  "leadCount" INTEGER NOT NULL DEFAULT 0,
  "purchaseCount" INTEGER NOT NULL DEFAULT 0,
  "revenueTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,

  CONSTRAINT "SalesPageSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesPageConfig" (
  "id" TEXT NOT NULL,
  "pageKey" TEXT NOT NULL,
  "pagePath" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "trackPageView" BOOLEAN NOT NULL DEFAULT true,
  "trackViewContent" BOOLEAN NOT NULL DEFAULT true,
  "trackCheckout" BOOLEAN NOT NULL DEFAULT true,
  "trackLead" BOOLEAN NOT NULL DEFAULT true,
  "trackPurchase" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SalesPageConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalesPageEvent_pageKey_occurredAt_idx" ON "SalesPageEvent"("pageKey", "occurredAt");

-- CreateIndex
CREATE INDEX "SalesPageEvent_eventType_occurredAt_idx" ON "SalesPageEvent"("eventType", "occurredAt");

-- CreateIndex
CREATE INDEX "SalesPageEvent_sessionId_idx" ON "SalesPageEvent"("sessionId");

-- CreateIndex
CREATE INDEX "SalesPageEvent_utmCampaign_idx" ON "SalesPageEvent"("utmCampaign");

-- CreateIndex
CREATE INDEX "SalesPageEvent_pageKey_eventType_occurredAt_idx" ON "SalesPageEvent"("pageKey", "eventType", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "SalesPageSession_sessionId_key" ON "SalesPageSession"("sessionId");

-- CreateIndex
CREATE INDEX "SalesPageSession_pageKey_firstSeenAt_idx" ON "SalesPageSession"("pageKey", "firstSeenAt");

-- CreateIndex
CREATE INDEX "SalesPageSession_pageKey_lastSeenAt_idx" ON "SalesPageSession"("pageKey", "lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "SalesPageConfig_pageKey_key" ON "SalesPageConfig"("pageKey");
