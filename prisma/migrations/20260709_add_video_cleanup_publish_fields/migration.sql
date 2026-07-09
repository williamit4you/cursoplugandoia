-- AlterTable
ALTER TABLE "VideoCleanupJob"
ADD COLUMN "affiliateUrl" TEXT,
ADD COLUMN "isPublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "publishedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "VideoCleanupJob_isPublished_createdAt_idx" ON "VideoCleanupJob"("isPublished", "createdAt");
