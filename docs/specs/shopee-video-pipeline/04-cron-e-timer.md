# Cron, Timer e Configuracao

## Objetivo

Permitir que o usuario ative/inative a esteira e configure horarios de execucao.

## Configuracao recomendada

Criar entidade de configuracao:

```ts
type ShopeePipelineConfig = {
  id: string;
  enabled: boolean;
  cronExpression: string | null;
  runEveryMinutes: number;
  maxItemsPerRun: number;
  processOneItemAtATime: boolean;
  createdAt: Date;
  updatedAt: Date;
};
```

Para o MVP:

- `enabled`
- `runEveryMinutes`
- `maxItemsPerRun = 1`

## Rotinas

### `pipeline-runner`

Roda a esteira principal.

Responsavel por:

- selecionar a proxima URL;
- executar uma etapa;
- registrar logs;
- reagendar se necessario.

### `pod-watchdog`

Roda em intervalo curto, por exemplo a cada 1 ou 2 minutos.

Responsavel por:

- consultar `/api/online`;
- verificar se existe job ativo;
- desligar o POD quando estiver online e ocioso.

### `publisher-runner`

Roda publicacoes agendadas.

Responsavel por:

- buscar stories com `scheduledAt <= now`;
- publicar em TikTok, YouTube e Instagram;
- registrar resultado por plataforma.

## Integracao com cron atual

Existe `app/api/automation/cron/route.ts`. A fase de implementacao deve avaliar se:

- adiciona chamadas para novas rotas do pipeline dentro desse cron;
- ou cria uma rota propria, por exemplo `/api/shopee-pipeline/cron`;
- ou usa um worker separado para tarefas longas.

Decisao recomendada:

- MVP: rota Next.js acionada pelo cron atual para coordenar.
- Fase robusta: worker dedicado para etapas longas e polling de jobs.

Status:

- OK `/api/shopee-pipeline/cron` integrado ao cron atual.
- OK `/api/shopee-pipeline/pod-watchdog` integrado ao cron atual.
- OK `/api/shopee-pipeline/publisher-runner` integrado ao cron atual.
