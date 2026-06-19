# SDD-CMP-05: Plano de Implementacao

## Fase 1 - Especificacao e modelagem
Objetivo: travar contrato antes de codar.

- [ ] Validar naming final: `Comparativos` / `AffiliateComparison`.
- [ ] Confirmar marketplaces suportados no MVP: Amazon, Shopee, Mercado Livre.
- [ ] Aprovar modelo Prisma e statuses.
- [ ] Aprovar contrato do artigo e prompts.

## Fase 2 - Banco e infraestrutura
Objetivo: preparar persistencia e observabilidade.

- [ ] Criar enums Prisma.
- [ ] Criar tabelas `AffiliateComparison`, `AffiliateComparisonItem`, `AffiliateComparisonStep`, `AffiliateComparisonEvent`, `AffiliateComparisonConfig`.
- [ ] Criar migration.
- [ ] Criar config default/seed se necessario.
- [ ] Opcional: integrar `AiUsageLog`.

## Fase 3 - Backend core
Objetivo: permitir CRUD e processamento em background.

- [ ] Criar `lib/comparisons/slugify.ts`.
- [ ] Criar `lib/comparisons/orchestrator.ts`.
- [ ] Criar `lib/comparisons/logger.ts`.
- [ ] Criar `lib/comparisons/stepContract.ts`.
- [ ] Criar `lib/comparisons/prompts.ts`.
- [ ] Criar `lib/comparisons/normalize.ts`.

## Fase 4 - Scrapers por dominio
Objetivo: coletar dados por marketplace.

- [ ] Criar interface comum `ComparisonSourceScraper`.
- [ ] Implementar adaptador `shopee`.
- [ ] Implementar adaptador `mercado-livre`.
- [ ] Implementar adaptador `amazon`.
- [ ] Criar fallback por HTML raw + parser generico.
- [ ] Registrar payload cru e normalizado.

## Fase 5 - APIs admin
Objetivo: expor listagem, criacao, detalhe e reprocessamento.

- [ ] `GET /api/comparativos`
- [ ] `POST /api/comparativos`
- [ ] `GET /api/comparativos/[id]`
- [ ] `PATCH /api/comparativos/[id]`
- [ ] `POST /api/comparativos/[id]/run`
- [ ] `GET /api/comparativos/[id]/events`

## Fase 6 - IA e publicacao
Objetivo: gerar artigo, revisar e publicar.

- [ ] Implementar writer prompt.
- [ ] Implementar reviewer prompt.
- [ ] Criar montagem do `comparisonBriefJson`.
- [ ] Persistir `contentHtml`, `faqJson`, `schemaJson`.
- [ ] Definir auto-publicacao apos aprovacao.

## Fase 7 - Frontend admin
Objetivo: criar operacao completa sem sair do painel.

- [ ] Adicionar aba `Comparativos` abaixo de `Agendamentos`.
- [ ] Criar pagina de listagem.
- [ ] Criar formulario de novo comparativo.
- [ ] Criar pagina de detalhe com timeline e preview.
- [ ] Exibir erros por link.

## Fase 8 - Frontend publico
Objetivo: publicar pagina indexavel e navegavel.

- [ ] Criar `/comparativo`.
- [ ] Criar `/comparativo/[slug]`.
- [ ] Criar metadata dinamica.
- [ ] Renderizar secao de links afiliados.
- [ ] Adicionar disclaimer de afiliacao.

## Fase 9 - Qualidade
Objetivo: reduzir regressao e risco editorial.

- [ ] Testes unitarios de slug, normalizacao e validacao.
- [ ] Testes de API para criacao e listagem.
- [ ] Testes de orquestracao com mocks de scraper/IA.
- [ ] Testes de render da pagina publica.
- [ ] Smoke test com 3 cenarios reais.

## Fase 10 - Go live
Objetivo: liberar com seguranca.

- [ ] Popular `.env.example` com chaves necessarias.
- [ ] Documentar marketplaces e limites conhecidos.
- [ ] Fazer rollout interno.
- [ ] Monitorar primeiras execucoes.
