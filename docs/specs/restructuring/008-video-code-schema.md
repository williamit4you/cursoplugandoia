# SDD-008: Vídeo com Código Schema Extensions

## 1. Objective
Enable step logs and pipeline execution tracking on the `CodeVideoProject` table.

---

## 2. Prisma Modifications
Add the following fields and relations to `CodeVideoProject` model in `schema.prisma`:

```prisma
model CodeVideoProject {
  id                 String                     @id @default(cuid())
  // Existing fields...
  pipelineStatus     ShopeePipelineStatus       @default(PENDING)
  videoStatus        String?                    // RENDERING | COMPLETED | FAILED
  attemptCount       Int                        @default(0)
  lastError          String?
  
  // Relations to track logging
  pipelineSteps      CodeVideoPipelineStep[]
  pipelineEvents     CodeVideoPipelineEvent[]
}

model CodeVideoPipelineStep {
  id              String   @id @default(cuid())
  projectId       String
  project         CodeVideoProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
  stepName        String
  status          ShopeePipelineStepStatus @default(PENDING)
  startedAt       DateTime?
  finishedAt      DateTime?
  durationMs      Int?
  errorMessage    String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([projectId])
}

model CodeVideoPipelineEvent {
  id        String   @id @default(cuid())
  projectId String
  project   CodeVideoProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
  stepName  String?
  level     String   @default("INFO") // INFO | ERROR | WARN
  message   String
  createdAt DateTime @default(now())

  @@index([projectId])
  @@index([createdAt])
}
```
This mirrors the logging schemas without interfering with existing Shopee database models.
