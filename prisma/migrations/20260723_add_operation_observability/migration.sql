CREATE TABLE "OperationDefinition" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "expectedEverySec" INTEGER,
    "owner" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OperationDefinition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OperationRun" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "operationKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "heartbeatAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "itemsFound" INTEGER NOT NULL DEFAULT 0,
    "itemsProcessed" INTEGER NOT NULL DEFAULT 0,
    "itemsSucceeded" INTEGER NOT NULL DEFAULT 0,
    "itemsFailed" INTEGER NOT NULL DEFAULT 0,
    "estimatedCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OperationRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OperationDefinition_key_key" ON "OperationDefinition"("key");
CREATE UNIQUE INDEX "OperationRun_runId_key" ON "OperationRun"("runId");
CREATE INDEX "OperationRun_operationKey_startedAt_idx" ON "OperationRun"("operationKey", "startedAt");
CREATE INDEX "OperationRun_status_heartbeatAt_idx" ON "OperationRun"("status", "heartbeatAt");
CREATE INDEX "OperationRun_heartbeatAt_idx" ON "OperationRun"("heartbeatAt");

ALTER TABLE "OperationRun" ADD CONSTRAINT "OperationRun_operationKey_fkey"
  FOREIGN KEY ("operationKey") REFERENCES "OperationDefinition"("key") ON DELETE CASCADE ON UPDATE CASCADE;
