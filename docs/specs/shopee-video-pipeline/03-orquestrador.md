# Orquestrador

## Objetivo

Criar um servico central que execute a proxima etapa necessaria para uma URL por vez, com lock, logs, retry, idempotencia e rastreabilidade.

## Responsabilidades

- Buscar a proxima URL ativa.
- Respeitar `nextRunAt`.
- Aplicar lock por item.
- Identificar a proxima etapa.
- Executar somente uma etapa por ciclo, salvo decisao explicita em fase futura.
- Registrar inicio, fim, request, response, erro e duracao.
- Decidir retry ou falha definitiva.
- Liberar lock.

## Contrato de step

```ts
type StepContext = {
  itemId: string;
  runId: string;
  now: Date;
  logger: PipelineLogger;
};

type StepResult = {
  ok: boolean;
  nextStatus?: ShopeePipelineStatus;
  artifacts?: Record<string, unknown>;
  requestPayload?: unknown;
  responsePayload?: unknown;
};

interface PipelineStep {
  name: string;
  canRun(context: StepContext): Promise<boolean>;
  run(context: StepContext): Promise<StepResult>;
  onFailure(error: unknown, context: StepContext): Promise<RetryDecision>;
}
```

Status:

- OK Tipos/contrato versionados em `lib/shopee-pipeline/stepContract.ts`.

## Steps previstos

```txt
shopeePipelineOrchestrator
  scrapeMedia
  generateCopy
  ensurePodOnline
  generateAudio
  generateCopyVideo
  shutdownPodIfIdle
  mergeVideos
  generateAffiliateLink
  createStoryAd
  createBioProduct
  schedulePublications
  publishStory
```

## Algoritmo do runner

```txt
1. Ler configuracao de timer.
2. Se timer inativo, encerrar.
3. Buscar uma URL ativa, sem lock, com nextRunAt <= agora.
4. Aplicar lock atomico.
5. Carregar contexto completo da URL.
6. Determinar proxima etapa.
7. Criar log de inicio.
8. Executar etapa.
9. Persistir artefatos e novo status.
10. Registrar request/response/duracao.
11. Se falhar, aplicar politica de retry.
12. Liberar lock.
```

## Idempotencia

Cada etapa deve checar se o resultado ja existe antes de executar chamada externa.

Exemplos:

- Se `audioUrl` existe, nao gerar audio novamente.
- Se `finalVideoUrl` existe, nao unir videos novamente.
- Se `affiliateUrl` existe, nao gerar novo link sem acao manual.

## Locks

Recomendacao:

- `lockedAt`
- `lockedBy`
- TTL de lock, por exemplo 30 minutos.

Se um runner morrer, outro runner pode assumir apos o TTL.
