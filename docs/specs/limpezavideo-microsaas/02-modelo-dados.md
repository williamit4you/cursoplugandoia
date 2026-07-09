# Modelo de Dados

## Nova entidade principal

Criar uma entidade propria para o microsaas, sem reaproveitar `ColetaDadosShoppe`.

Nome sugerido: `VideoCleanupJob`.

## Campos principais

```prisma
model VideoCleanupJob {
  id                   String   @id @default(cuid())
  ownerUserId          String
  ownerUser            User     @relation(fields: [ownerUserId], references: [id], onDelete: Cascade)

  status               String   @default("UPLOADING")
  sourceType           String   @default("UPLOAD")
  originalFilename     String?
  mimeType             String?

  inputBucketKey       String?
  inputUrl             String?
  outputBucketKey      String?
  outputUrl            String?

  durationSec          Float?
  fileSizeBytes        BigInt?
  width                Int?
  height               Int?
  fps                  Float?

  trimStartSec         Float    @default(0)
  audioMode            String   @default("PRESERVE")
  audioVolumePercent   Int      @default(100)
  outputFormat         String   @default("mp4")

  progressPercent      Float    @default(0)
  currentStep          String?
  estimatedSecondsLeft Int?

  processingStartedAt  DateTime?
  processingFinishedAt DateTime?
  errorMessage         String?
  metadataJson         String   @default("{}")

  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  steps                VideoCleanupStep[]
  events               VideoCleanupEvent[]

  @@index([ownerUserId, createdAt])
  @@index([status])
}

model VideoCleanupStep {
  id              String   @id @default(cuid())
  jobId           String
  job             VideoCleanupJob @relation(fields: [jobId], references: [id], onDelete: Cascade)
  stepName        String
  status          String   @default("PENDING")
  startedAt       DateTime?
  finishedAt      DateTime?
  durationMs      Int?
  errorMessage    String?
  requestPayload  Json?
  responsePayload Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([jobId, stepName])
  @@index([status])
}

model VideoCleanupEvent {
  id        String   @id @default(cuid())
  jobId     String
  job       VideoCleanupJob @relation(fields: [jobId], references: [id], onDelete: Cascade)
  level     String   @default("INFO")
  stepName  String?
  message   String
  metadata  Json?
  createdAt DateTime @default(now())

  @@index([jobId, createdAt])
}
```

## Motivos para um modelo proprio

- evita poluir entidades ligadas a Shopee;
- deixa o produto pronto para evoluir para assinaturas;
- facilita regras de acesso por dono do job;
- permite pipeline e logs dedicados.

## Seed do usuario inicial

Nao salvar senha em texto puro no banco.

Implementacao esperada:

- criar ou atualizar o usuario `willianbarata@gmail.com`;
- armazenar hash bcrypt da senha inicial;
- definir role dedicada, por exemplo `VIDEO_CLEANUP_OWNER`, ou reaproveitar `ADMIN` com guard especifico por rota.

## Chaves MinIO

Estrutura sugerida:

- `limpezavideo/input/{jobId}/original.mp4`
- `limpezavideo/output/{jobId}/final.mp4`
- `limpezavideo/debug/{jobId}/probe.json`
- `limpezavideo/logs/{jobId}/summary.json`
