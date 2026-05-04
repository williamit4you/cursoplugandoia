-- CreateTable
CREATE TABLE "MercadoLivreAffiliateConfig" (
    "id" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "siteId" TEXT NOT NULL DEFAULT 'MLB',
    "searchTerms" TEXT NOT NULL DEFAULT '["ofertas"]',
    "categoryIds" TEXT NOT NULL DEFAULT '[]',
    "minPrice" DOUBLE PRECISION,
    "maxPrice" DOUBLE PRECISION,
    "sort" TEXT NOT NULL DEFAULT 'relevance',
    "maxProductsPerRun" INTEGER NOT NULL DEFAULT 8,
    "postIntervalHours" INTEGER NOT NULL DEFAULT 2,
    "preferredPlatforms" TEXT NOT NULL DEFAULT '["YOUTUBE","INSTAGRAM","TIKTOK"]',
    "autoGenerateScript" BOOLEAN NOT NULL DEFAULT true,
    "autoRenderVideo" BOOLEAN NOT NULL DEFAULT false,
    "autoEnqueueSocial" BOOLEAN NOT NULL DEFAULT true,
    "affiliateLinkMode" TEXT NOT NULL DEFAULT 'MANUAL_TEMPLATE',
    "affiliateTag" TEXT,
    "affiliateUrlTemplate" TEXT,
    "linkBuilderCookie" TEXT,
    "appId" TEXT,
    "clientSecret" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "lastRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MercadoLivreAffiliateConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MercadoLivreAffiliatePick" (
    "id" TEXT NOT NULL,
    "mercadoLivreItemId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "price" DOUBLE PRECISION,
    "currencyId" TEXT,
    "permalink" TEXT NOT NULL,
    "affiliateUrl" TEXT,
    "thumbnailUrl" TEXT,
    "categoryId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SELECTED',
    "scheduledBaseAt" TIMESTAMP(3),
    "codeVideoProjectId" TEXT,
    "errorMessage" TEXT,
    "metadataJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MercadoLivreAffiliatePick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MercadoLivreAffiliatePick_mercadoLivreItemId_key" ON "MercadoLivreAffiliatePick"("mercadoLivreItemId");

-- CreateIndex
CREATE INDEX "MercadoLivreAffiliatePick_createdAt_idx" ON "MercadoLivreAffiliatePick"("createdAt");

-- CreateIndex
CREATE INDEX "MercadoLivreAffiliatePick_status_idx" ON "MercadoLivreAffiliatePick"("status");

-- CreateIndex
CREATE INDEX "MercadoLivreAffiliatePick_codeVideoProjectId_idx" ON "MercadoLivreAffiliatePick"("codeVideoProjectId");
