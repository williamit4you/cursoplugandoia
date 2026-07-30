ALTER TABLE "SocialPost"
  ADD COLUMN "publicationKey" TEXT,
  ADD COLUMN "metaContainerAttemptedAt" TIMESTAMP(3),
  ADD COLUMN "metaInstagramPublishAttemptedAt" TIMESTAMP(3),
  ADD COLUMN "metaFacebookPublishAttemptedAt" TIMESTAMP(3),
  ADD COLUMN "tiktokPublishAttemptedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "SocialPost_publicationKey_key"
  ON "SocialPost"("publicationKey");
