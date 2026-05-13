# Estados e Transicoes

## Status geral do pipeline

```ts
enum ShopeePipelineStatus {
  PENDING = "PENDING",
  SCRAPING_MEDIA = "SCRAPING_MEDIA",
  MEDIA_SCRAPED = "MEDIA_SCRAPED",
  GENERATING_COPY = "GENERATING_COPY",
  COPY_READY = "COPY_READY",
  WAITING_POD = "WAITING_POD",
  GENERATING_AUDIO = "GENERATING_AUDIO",
  AUDIO_READY = "AUDIO_READY",
  GENERATING_COPY_VIDEO = "GENERATING_COPY_VIDEO",
  COPY_VIDEO_READY = "COPY_VIDEO_READY",
  MERGING_VIDEOS = "MERGING_VIDEOS",
  FINAL_VIDEO_READY = "FINAL_VIDEO_READY",
  GENERATING_AFFILIATE_LINK = "GENERATING_AFFILIATE_LINK",
  AFFILIATE_LINK_READY = "AFFILIATE_LINK_READY",
  READY_FOR_STORY = "READY_FOR_STORY",
  SCHEDULED = "SCHEDULED",
  PUBLISHING = "PUBLISHING",
  PUBLISHED = "PUBLISHED",
  FAILED = "FAILED",
  PAUSED = "PAUSED"
}
```

## Status de etapa

```ts
enum StepStatus {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  RETRY_SCHEDULED = "RETRY_SCHEDULED",
  SKIPPED = "SKIPPED"
}
```

## Transicoes principais

| De | Para | Condicao |
| --- | --- | --- |
| `PENDING` | `SCRAPING_MEDIA` | URL ativa selecionada pelo orquestrador |
| `SCRAPING_MEDIA` | `MEDIA_SCRAPED` | Midias gravadas no MinIO |
| `MEDIA_SCRAPED` | `GENERATING_COPY` | Titulo/descricao/copy ainda ausentes |
| `GENERATING_COPY` | `COPY_READY` | Copy persistida |
| `COPY_READY` | `WAITING_POD` | Audio ainda ausente e POD offline |
| `COPY_READY` | `GENERATING_AUDIO` | POD online |
| `WAITING_POD` | `GENERATING_AUDIO` | POD ficou online |
| `GENERATING_AUDIO` | `AUDIO_READY` | Audio salvo no MinIO |
| `AUDIO_READY` | `GENERATING_COPY_VIDEO` | Imagem do usuario e audio disponiveis |
| `GENERATING_COPY_VIDEO` | `COPY_VIDEO_READY` | Video da copy salvo |
| `COPY_VIDEO_READY` | `MERGING_VIDEOS` | Video Shopee e copy video disponiveis |
| `MERGING_VIDEOS` | `FINAL_VIDEO_READY` | Video final salvo |
| `FINAL_VIDEO_READY` | `GENERATING_AFFILIATE_LINK` | Link afiliado ausente |
| `GENERATING_AFFILIATE_LINK` | `AFFILIATE_LINK_READY` | Link afiliado salvo |
| `AFFILIATE_LINK_READY` | `READY_FOR_STORY` | Story/vitrine preparados |
| `READY_FOR_STORY` | `SCHEDULED` | Publicacao agendada |
| `SCHEDULED` | `PUBLISHING` | Horario chegou |
| `PUBLISHING` | `PUBLISHED` | Todas as plataformas obrigatorias publicadas |

## Regras de bloqueio

- Uma URL com `PAUSED` nao deve ser selecionada automaticamente.
- Uma URL com `lockedAt` recente nao deve ser processada por outro runner.
- Uma etapa nao deve rodar se seus artefatos de entrada estiverem ausentes.
- Uma etapa que ja possui artefato final valido deve ser considerada idempotente e pular para a proxima.

## Falha definitiva

Usar `FAILED` apenas quando:

- a etapa excedeu o limite de tentativas;
- o erro exige acao humana;
- a URL original e invalida;
- a resposta externa indica erro permanente.

Erros temporarios devem virar `RETRY_SCHEDULED`.

