-- Recover only manual uploads created by the regressed endpoint. In that flow,
-- `url` and `affiliateUrl` are identical, a video is already stored, and the
-- item was incorrectly left in a scraping state.
UPDATE "ColetaDadosShoppe"
SET
  "inputMode" = 'MANUAL_VIDEO',
  "sourceUrl" = NULL,
  "pipelineStatus" = CASE
    WHEN COALESCE(BTRIM("aiPromptVendas"), '') <> '' THEN 'COPY_READY'::"ShopeePipelineStatus"
    ELSE 'GENERATING_COPY'::"ShopeePipelineStatus"
  END,
  "status" = 'COMPLETED',
  "lockedAt" = NULL,
  "lockedBy" = NULL,
  "nextRunAt" = NULL,
  "lastError" = NULL
WHERE
  "pipelineKind" = 'SALES'
  AND "url" = "affiliateUrl"
  AND CARDINALITY("mediaVideoUrls") > 0
  AND "pipelineStatus" IN ('PENDING', 'SCRAPING_MEDIA', 'MEDIA_SCRAPED');
