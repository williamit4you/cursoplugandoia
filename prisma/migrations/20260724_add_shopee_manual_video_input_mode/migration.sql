CREATE TYPE "ShopeePipelineInputMode" AS ENUM ('SCRAPE_SOURCE', 'MANUAL_VIDEO');

ALTER TABLE "ColetaDadosShoppe"
  ADD COLUMN "sourceUrl" TEXT,
  ADD COLUMN "inputMode" "ShopeePipelineInputMode" NOT NULL DEFAULT 'SCRAPE_SOURCE';

UPDATE "ColetaDadosShoppe"
SET "sourceUrl" = "url"
WHERE "sourceUrl" IS NULL AND "inputMode" = 'SCRAPE_SOURCE';
