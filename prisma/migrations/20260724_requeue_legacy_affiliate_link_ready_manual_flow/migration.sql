-- The affiliate link is supplied during manual registration. Legacy records
-- that were left in AFFILIATE_LINK_READY must not enter the old BioProduct gate.
UPDATE "ColetaDadosShoppe"
SET
  "inputMode" = 'MANUAL_VIDEO',
  "pipelineStatus" = CASE
    WHEN COALESCE(TRIM("aiPromptVendas"), '') = '' THEN 'GENERATING_COPY'::"ShopeePipelineStatus"
    WHEN "audioUrl" IS NULL OR TRIM("audioUrl") = '' THEN 'GENERATING_AUDIO'::"ShopeePipelineStatus"
    WHEN "copyVideoUrl" IS NULL OR TRIM("copyVideoUrl") = '' THEN 'GENERATING_COPY_VIDEO'::"ShopeePipelineStatus"
    WHEN "videoFinalUrl" IS NULL OR TRIM("videoFinalUrl") = '' THEN 'MERGING_VIDEOS'::"ShopeePipelineStatus"
    WHEN "platformMetadata" IS NULL THEN 'GENERATING_PLATFORM_METADATA'::"ShopeePipelineStatus"
    ELSE 'READY_FOR_SCHEDULING'::"ShopeePipelineStatus"
  END,
  "nextRunAt" = NULL,
  "lockedAt" = NULL,
  "lockedBy" = NULL,
  "lastError" = NULL
WHERE "pipelineKind" = 'SALES'::"ColetaPipelineKind"
  AND "pipelineStatus" IN ('AFFILIATE_LINK_READY'::"ShopeePipelineStatus", 'GENERATING_AFFILIATE_LINK'::"ShopeePipelineStatus")
  AND COALESCE(TRIM("affiliateUrl"), '') <> '';
