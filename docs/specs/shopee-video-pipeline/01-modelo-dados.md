# Modelo de Dados

## Diretriz

O modelo deve preservar os dados atuais e adicionar rastreabilidade. Nao remover campos existentes sem migracao planejada.

## Entidade principal: URL/Post Shopee

Cada linha da coleta Shopee representa um futuro post.

Campos recomendados para a entidade principal, seja por extensao da tabela atual ou por nova tabela vinculada:

```ts
type ShopeePipelineItem = {
  id: string;
  originalUrl: string;
  status: ShopeePipelineStatus;
  active: boolean;
  priority: number;
  lockedAt: Date | null;
  lockedBy: string | null;
  nextRunAt: Date | null;
  attemptCount: number;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;

  productTitle: string | null;
  productDescription: string | null;
  salesCopy: string | null;
  mediaImageUrls: string[];
  mediaVideoUrls: string[];
  audioUrl: string | null;
  copyVideoUrl: string | null;
  finalVideoUrl: string | null;
  affiliateUrl: string | null;
};
```

## `shopee_pipeline_steps`

Registra cada etapa de alto nivel.

Campos:

- `id`
- `shopeeItemId`
- `stepName`
- `status`
- `startedAt`
- `finishedAt`
- `durationMs`
- `attempt`
- `nextRetryAt`
- `errorCode`
- `errorMessage`
- `requestPayload`
- `responsePayload`
- `createdAt`
- `updatedAt`

Uso esperado:

- Uma tentativa de gerar audio cria/atualiza uma etapa.
- Se falhar, grava erro, tentativa e proximo horario.
- Se tiver sucesso, grava retorno e duracao.

## `shopee_pipeline_events`

Log cronologico fino.

Campos:

- `id`
- `shopeeItemId`
- `stepName`
- `level`: `DEBUG`, `INFO`, `WARN`, `ERROR`
- `message`
- `metadata`
- `createdAt`

Exemplos:

- `Consultando status do POD`
- `POD offline, reagendando para daqui 30 minutos`
- `Audio gerado com sucesso`
- `Video final salvo no MinIO`

## `pod_sessions`

Controle operacional do RunPod.

Campos:

- `id`
- `status`: `OFFLINE`, `STARTING`, `ONLINE`, `BUSY`, `IDLE`, `STOPPING`, `ERROR`
- `startedAt`
- `stoppedAt`
- `lastOnlineCheckAt`
- `lastActivityAt`
- `currentShopeeItemId`
- `currentStepName`
- `shutdownRequestedAt`
- `errorMessage`
- `createdAt`
- `updatedAt`

## `story_ads`

Story/reel derivado do video final.

Campos:

- `id`
- `shopeeItemId`
- `title`
- `description`
- `videoUrl`
- `affiliateUrl`
- `scheduledAt`
- `status`: `DRAFT`, `SCHEDULED`, `PUBLISHING`, `PUBLISHED`, `FAILED`, `CANCELED`
- `createdAt`
- `updatedAt`

## `story_publications`

Uma linha por plataforma.

Campos:

- `id`
- `storyAdId`
- `platform`: `TIKTOK`, `YOUTUBE`, `INSTAGRAM`
- `status`: `PENDING`, `PUBLISHING`, `PUBLISHED`, `FAILED`, `RETRY_SCHEDULED`
- `externalPostId`
- `publishedUrl`
- `attemptCount`
- `nextRetryAt`
- `errorMessage`
- `requestPayload`
- `responsePayload`
- `createdAt`
- `updatedAt`

## `bio_products`

Produto publicado na vitrine/link da bio.

Campos:

- `id`
- `shopeeItemId`
- `slug`
- `title`
- `description`
- `imageUrl`
- `videoUrl`
- `affiliateUrl`
- `categoryId`
- `active`
- `publishedAt`
- `createdAt`
- `updatedAt`

