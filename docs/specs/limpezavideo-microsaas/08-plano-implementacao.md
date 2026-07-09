# Plano de Implementacao

## Fase 1 - Fundacao

- criar spec e validar decisoes abertas;
- adicionar modelos Prisma do microsaas;
- criar migration;
- criar seed idempotente do usuario inicial;
- proteger novas rotas no middleware.

## Fase 2 - Auth e shell do produto

- criar `/limpezavideo/login`;
- criar layout proprio de `/limpezavideo`;
- criar listagem vazia;
- criar integracao de sessao e guard.

## Fase 3 - API e persistencia

- criar `POST /api/limpezavideo/jobs`;
- criar `GET /api/limpezavideo/jobs`;
- criar `GET /api/limpezavideo/jobs/[id]`;
- criar `POST /api/limpezavideo/jobs/[id]/retry`;
- criar eventos e steps.

## Fase 4 - Pipeline tecnico

- integrar `ffprobe`;
- integrar processamento `ffmpeg`;
- subir original no MinIO;
- criar etapa de fechamento final com logo + Instagram;
- subir output no MinIO;
- atualizar progresso e ETA.

## Fase 5 - UX operacional

- modal/drawer de upload;
- lista profissional com polling;
- detalhe do job;
- acoes de copiar URL e retry.

## Fase 6 - Harden

- limites de tamanho;
- validacoes de arquivo;
- mensagens de erro melhores;
- medicao de duracao media por etapa;
- revisao de seeds e secrets.

## Checklist de aceite do MVP

- consigo logar em `/limpezavideo/login`;
- consigo ver a lista de jobs;
- consigo enviar um video;
- o original sobe no MinIO;
- o processamento inicia sozinho;
- vejo progresso e ETA simples;
- o final sobe no MinIO;
- recebo uma URL final funcional;
- consigo reprocessar um job com falha.
