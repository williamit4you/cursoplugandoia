# APIs e Contratos

## Principio

As rotas do microsaas devem ser novas e independentes das rotas de Shopee.

## Rotas propostas

### `POST /api/limpezavideo/jobs`

Cria um job a partir do upload.

Responsabilidades:

- validar autenticacao;
- validar extensao e tamanho;
- subir original no MinIO;
- criar job;
- disparar processamento assincrono;
- devolver o job criado.

Resposta:

```json
{
  "ok": true,
  "job": {
    "id": "cjx...",
    "status": "QUEUED",
    "progressPercent": 10,
    "inputUrl": "https://...",
    "estimatedSecondsLeft": 95
  }
}
```

### `GET /api/limpezavideo/jobs`

Lista jobs do usuario autenticado.

Filtros do MVP:

- `status`
- `page`
- `pageSize`

### `GET /api/limpezavideo/jobs/[id]`

Detalhe do job.

Inclui:

- dados principais;
- URLs;
- steps;
- eventos recentes.

### `POST /api/limpezavideo/jobs/[id]/retry`

Reprocessa um job falho.

### `GET /api/limpezavideo/jobs/[id]/events`

Retorna eventos recentes para polling.

## Servicos internos

Camadas sugeridas:

- `lib/limpezavideo/auth.ts`
- `lib/limpezavideo/repository.ts`
- `lib/limpezavideo/orchestrator.ts`
- `lib/limpezavideo/ffmpeg.ts`
- `lib/limpezavideo/eta.ts`

## Reaproveitamento direto

- reutilizar `lib/shopee-pipeline/minioUpload.ts` para upload de buffers pequenos;
- criar helper de upload por arquivo/caminho para videos grandes;
- seguir o padrao de eventos e steps ja usado em `CodeVideoProject` e `ColetaDadosShoppe`.
