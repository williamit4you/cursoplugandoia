# SDD-CMP-01: Modelo de Dados

## 1. Objetivo
Persistir tema, links, dados raspados, artigo final, estados do pipeline e telemetria de IA sem misturar esse dominio com `Post`.

## 2. Estrategia
Usar tabelas dedicadas para `Comparativos`, mantendo isolamento do dominio, mas reaproveitando padroes do projeto:
- tabela principal;
- tabela filha por link/produto;
- tabelas de step e event;
- tabela opcional de config.

## 3. Enums propostos
```prisma
enum ComparisonStatus {
  DRAFT
  QUEUED
  SCRAPING
  ENRICHING
  WRITING
  REVIEWING
  PUBLISHED
  FAILED
  ARCHIVED
}

enum ComparisonItemStatus {
  PENDING
  FETCHING
  SCRAPED
  NORMALIZED
  FAILED
  SKIPPED
}

enum ComparisonStepStatus {
  PENDING
  RUNNING
  SUCCESS
  FAILED
  RETRY_SCHEDULED
  SKIPPED
}
```

## 4. Modelos Prisma propostos
```prisma
model AffiliateComparison {
  id                    String             @id @default(cuid())
  title                 String
  slug                  String             @unique
  theme                 String
  targetYear            Int?
  introSummary          String?
  seoTitle              String?
  metaDescription       String?
  heroTitle             String?
  heroSubtitle          String?
  contentHtml           String             @default("")
  faqJson               String             @default("[]")
  schemaJson            String             @default("{}")
  status                ComparisonStatus   @default(DRAFT)
  publishedAt           DateTime?
  sourceCount           Int                @default(0)
  validSourceCount      Int                @default(0)
  views                 Int                @default(0)
  featuredImageUrl      String?
  generationModel       String?
  generationNotes       String?
  errorMessage          String?
  attemptCount          Int                @default(0)
  lastError             String?
  createdByUserId       String?
  createdAt             DateTime           @default(now())
  updatedAt             DateTime           @updatedAt

  items                 AffiliateComparisonItem[]
  steps                 AffiliateComparisonStep[]
  events                AffiliateComparisonEvent[]

  @@index([status])
  @@index([publishedAt])
  @@index([theme])
  @@index([createdAt])
}

model AffiliateComparisonItem {
  id                    String               @id @default(cuid())
  comparisonId          String
  comparison            AffiliateComparison  @relation(fields: [comparisonId], references: [id], onDelete: Cascade)
  sortOrder             Int                  @default(0)
  sourceUrl             String
  sourceDomain          String
  affiliateUrl          String
  canonicalUrl          String?
  storeName             String?
  productTitle          String?
  brand                 String?
  priceText             String?
  priceValue            Float?
  currency              String?
  imageUrl              String?
  ratingText            String?
  reviewCountText       String?
  shortDescription      String?
  bulletPointsJson      String               @default("[]")
  specsJson             String               @default("{}")
  prosJson              String               @default("[]")
  consJson              String               @default("[]")
  scrapingPayloadJson   String               @default("{}")
  normalizedPayloadJson String               @default("{}")
  status                ComparisonItemStatus @default(PENDING)
  scrapedAt             DateTime?
  errorMessage          String?
  createdAt             DateTime             @default(now())
  updatedAt             DateTime             @updatedAt

  @@index([comparisonId, sortOrder])
  @@index([status])
  @@unique([comparisonId, sourceUrl])
}

model AffiliateComparisonStep {
  id              String               @id @default(cuid())
  comparisonId    String
  comparison      AffiliateComparison  @relation(fields: [comparisonId], references: [id], onDelete: Cascade)
  stepName        String
  status          ComparisonStepStatus @default(PENDING)
  startedAt       DateTime?
  finishedAt      DateTime?
  durationMs      Int?
  attempt         Int                  @default(1)
  nextRetryAt     DateTime?
  errorCode       String?
  errorMessage    String?
  requestPayload  Json?
  responsePayload Json?
  createdAt       DateTime             @default(now())
  updatedAt       DateTime             @updatedAt

  @@index([comparisonId])
  @@index([status])
  @@index([stepName])
}

model AffiliateComparisonEvent {
  id           String              @id @default(cuid())
  comparisonId String
  comparison   AffiliateComparison @relation(fields: [comparisonId], references: [id], onDelete: Cascade)
  itemId       String?
  stepName     String?
  level        String              @default("INFO")
  message      String
  metadata     Json?
  createdAt    DateTime            @default(now())

  @@index([comparisonId, createdAt])
  @@index([itemId])
}

model AffiliateComparisonConfig {
  id                     String   @id @default(cuid())
  isEnabled              Boolean  @default(true)
  autoPublish            Boolean  @default(true)
  maxLinksPerComparison  Int      @default(20)
  requestTimeoutMs       Int      @default(30000)
  aiModel                String   @default("gpt-4.1")
  reviewerModel          String   @default("gpt-4o-mini")
  writerTemperature      Float    @default(0.3)
  reviewerTemperature    Float    @default(0.2)
  defaultYearStrategy    String   @default("CURRENT_YEAR")
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
}
```

## 5. Decisoes de modelagem
- `contentHtml` fica direto na tabela principal para leitura publica rapida.
- `faqJson` e `schemaJson` guardam artefatos SEO derivados.
- `validSourceCount` protege o titulo final contra links invalidos.
- `normalizedPayloadJson` preserva a versao limpa usada pela IA.
- `prosJson` e `consJson` podem vir do scraping quando houver bullets; se nao houver, serao inferidos pela IA com marcacao de confianca.

## 6. Relacao com auth
- Se quisermos rastrear o criador, adicionar `createdByUserId -> User`.
- Para o MVP, pode ser nullable porque o sistema atual trabalha com poucos admins.

## 7. Campos derivados importantes
- `title`: `"{N} melhores {tema} em {ano}"`.
- `slug`: derivado do titulo final, sem acentos e com fallback incremental.
- `metaDescription`: ate 155 caracteres com foco em utilidade.
- `schemaJson`: JSON-LD de `Article` + `ItemList`.

## 8. Migracoes esperadas
1. Criar enums.
2. Criar 4 tabelas principais.
3. Adicionar indices de busca/listagem.
4. Seed opcional da `AffiliateComparisonConfig`.
