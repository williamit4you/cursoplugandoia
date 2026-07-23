CREATE TABLE "OperationAlert" (
  "id" TEXT NOT NULL,
  "fingerprint" TEXT NOT NULL,
  "operationKey" TEXT,
  "severity" TEXT NOT NULL DEFAULT 'WARNING',
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "actionUrl" TEXT,
  "metadataJson" TEXT,
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OperationAlert_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ManualActionAudit" (
  "id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "actor" TEXT,
  "summary" TEXT NOT NULL,
  "metadataJson" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ManualActionAudit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContentMetricEvent" (
  "id" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "postId" TEXT,
  "socialPostId" TEXT,
  "productId" TEXT,
  "sessionId" TEXT,
  "source" TEXT,
  "medium" TEXT,
  "campaign" TEXT,
  "referrer" TEXT,
  "metadataJson" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContentMetricEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DailyContentReport" (
  "id" TEXT NOT NULL,
  "reportDate" TIMESTAMP(3) NOT NULL,
  "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  "metricsJson" TEXT NOT NULL,
  "alertsJson" TEXT,
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DailyContentReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductCatalog" (
  "id" TEXT NOT NULL,
  "externalRef" TEXT,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "productUrl" TEXT,
  "affiliateUrl" TEXT,
  "imageUrl" TEXT,
  "price" DOUBLE PRECISION,
  "currency" TEXT NOT NULL DEFAULT 'BRL',
  "category" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "metadataJson" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductCatalog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SeoOpportunity" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "keyword" TEXT NOT NULL,
  "region" TEXT NOT NULL DEFAULT 'BR',
  "source" TEXT NOT NULL,
  "intent" TEXT,
  "cluster" TEXT,
  "demandScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "trendScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "competitionScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "relevanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "conversionScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "opportunityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "rawDataJson" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SeoOpportunity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SeoBrief" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "opportunityId" TEXT,
  "angle" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "primaryKeyword" TEXT NOT NULL,
  "intent" TEXT,
  "outlineJson" TEXT,
  "internalLinksJson" TEXT,
  "sourcesJson" TEXT,
  "reviewNotes" TEXT,
  "postId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SeoBrief_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CostLedger" (
  "id" TEXT NOT NULL,
  "operationKey" TEXT,
  "provider" TEXT NOT NULL,
  "assetType" TEXT NOT NULL,
  "assetId" TEXT,
  "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "unit" TEXT NOT NULL DEFAULT 'unit',
  "costUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "metadataJson" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CostLedger_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProviderCircuitBreaker" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "state" TEXT NOT NULL DEFAULT 'CLOSED',
  "failureCount" INTEGER NOT NULL DEFAULT 0,
  "openedAt" TIMESTAMP(3),
  "retryAfter" TIMESTAMP(3),
  "lastError" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProviderCircuitBreaker_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OperationAlert_fingerprint_key" ON "OperationAlert"("fingerprint");
CREATE INDEX "OperationAlert_status_severity_lastSeenAt_idx" ON "OperationAlert"("status", "severity", "lastSeenAt");
CREATE INDEX "OperationAlert_operationKey_status_idx" ON "OperationAlert"("operationKey", "status");
CREATE INDEX "ManualActionAudit_entityType_entityId_createdAt_idx" ON "ManualActionAudit"("entityType", "entityId", "createdAt");
CREATE INDEX "ManualActionAudit_createdAt_idx" ON "ManualActionAudit"("createdAt");
CREATE INDEX "ContentMetricEvent_eventType_occurredAt_idx" ON "ContentMetricEvent"("eventType", "occurredAt");
CREATE INDEX "ContentMetricEvent_postId_occurredAt_idx" ON "ContentMetricEvent"("postId", "occurredAt");
CREATE INDEX "ContentMetricEvent_productId_occurredAt_idx" ON "ContentMetricEvent"("productId", "occurredAt");
CREATE UNIQUE INDEX "DailyContentReport_reportDate_key" ON "DailyContentReport"("reportDate");
CREATE UNIQUE INDEX "ProductCatalog_externalRef_key" ON "ProductCatalog"("externalRef");
CREATE UNIQUE INDEX "ProductCatalog_slug_key" ON "ProductCatalog"("slug");
CREATE INDEX "ProductCatalog_status_updatedAt_idx" ON "ProductCatalog"("status", "updatedAt");
CREATE INDEX "SeoOpportunity_productId_opportunityScore_idx" ON "SeoOpportunity"("productId", "opportunityScore");
CREATE INDEX "SeoOpportunity_keyword_region_collectedAt_idx" ON "SeoOpportunity"("keyword", "region", "collectedAt");
CREATE UNIQUE INDEX "SeoBrief_slug_key" ON "SeoBrief"("slug");
CREATE UNIQUE INDEX "SeoBrief_productId_angle_key" ON "SeoBrief"("productId", "angle");
CREATE INDEX "SeoBrief_status_updatedAt_idx" ON "SeoBrief"("status", "updatedAt");
CREATE INDEX "CostLedger_operationKey_occurredAt_idx" ON "CostLedger"("operationKey", "occurredAt");
CREATE INDEX "CostLedger_provider_occurredAt_idx" ON "CostLedger"("provider", "occurredAt");
CREATE UNIQUE INDEX "ProviderCircuitBreaker_provider_key" ON "ProviderCircuitBreaker"("provider");

ALTER TABLE "SeoOpportunity" ADD CONSTRAINT "SeoOpportunity_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ProductCatalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SeoBrief" ADD CONSTRAINT "SeoBrief_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ProductCatalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SeoBrief" ADD CONSTRAINT "SeoBrief_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "SeoOpportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
