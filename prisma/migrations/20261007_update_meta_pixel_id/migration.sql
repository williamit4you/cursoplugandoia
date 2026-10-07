-- Keep existing sales-page records aligned with the site-wide Meta Pixel.
-- Only replace the previous ID so custom per-page IDs remain untouched.
UPDATE "SalesPageConfig"
SET
  "metaPixelId" = '1436206035142172',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "metaPixelId" = '2221646568647297';
