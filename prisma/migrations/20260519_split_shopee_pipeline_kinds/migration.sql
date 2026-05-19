DO $$ BEGIN
  CREATE TYPE "ColetaPipelineKind" AS ENUM ('SALES', 'ENGAGEMENT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "ColetaDadosShoppe"
  ADD COLUMN IF NOT EXISTS "pipelineKind" "ColetaPipelineKind" NOT NULL DEFAULT 'SALES',
  ADD COLUMN IF NOT EXISTS "aiPromptEngajamento" TEXT;

ALTER TABLE "ShopeePipelineConfig"
  ADD COLUMN IF NOT EXISTS "pipelineKind" "ColetaPipelineKind" NOT NULL DEFAULT 'SALES';

DROP INDEX IF EXISTS "ColetaDadosShoppe_url_key";
CREATE UNIQUE INDEX IF NOT EXISTS "ColetaDadosShoppe_url_pipelineKind_key"
  ON "ColetaDadosShoppe"("url", "pipelineKind");

CREATE INDEX IF NOT EXISTS "ColetaDadosShoppe_pipelineKind_idx"
  ON "ColetaDadosShoppe"("pipelineKind");

CREATE UNIQUE INDEX IF NOT EXISTS "ShopeePipelineConfig_pipelineKind_key"
  ON "ShopeePipelineConfig"("pipelineKind");
