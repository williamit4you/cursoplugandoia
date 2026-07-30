ALTER TABLE "CommerceEditorialConfig"
ADD COLUMN "storeCursor" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "CommerceEditorialConfig"
ALTER COLUMN "runEveryHours" SET DEFAULT 2;

UPDATE "CommerceEditorialConfig"
SET
  "runEveryHours" = 2,
  "maxItemsPerRun" = 1,
  "storeCursor" = 0,
  "nextRunAt" = NULL,
  "lockedAt" = NULL,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'default';
