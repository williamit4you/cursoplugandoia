# SDD-016: Perguntas cria Vídeos Schema Extensions

## 1. Objective
Modify the `VideoQuestion` and related configurations to support step-by-step progress logging.

---

## 2. Prisma Modifications
Add logging capabilities to `VideoQuestion` and its configurations in `schema.prisma`:

```prisma
model VideoQuestion {
  id                 String                       @id @default(cuid())
  // Existing fields...
  pipelineStatus     ShopeePipelineStatus         @default(PENDING)
  videoStatus        String?                      // RENDERING | COMPLETED | FAILED
  attemptCount       Int                          @default(0)
  lastError          String?
  
  // Relations to track logging
  pipelineSteps      VideoQuestionPipelineStep[]
  pipelineEvents     VideoQuestionPipelineEvent[]
}

model VideoQuestionPipelineStep {
  id              String   @id @default(cuid())
  questionId      String
  question        VideoQuestion @relation(fields: [questionId], references: [id], onDelete: Cascade)
  stepName        String
  status          ShopeePipelineStepStatus @default(PENDING)
  startedAt       DateTime?
  finishedAt      DateTime?
  durationMs      Int?
  errorMessage    String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([questionId])
}

model VideoQuestionPipelineEvent {
  id          String   @id @default(cuid())
  questionId  String
  question    VideoQuestion @relation(fields: [questionId], references: [id], onDelete: Cascade)
  stepName    String?
  level       String   @default("INFO") // INFO | ERROR | WARN
  message     String
  createdAt   DateTime @default(now())

  @@index([questionId])
  @@index([createdAt])
}
```
This separates Q&A logging from general codebase pipelines.
