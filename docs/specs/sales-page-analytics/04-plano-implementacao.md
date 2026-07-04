# SDD-SPA-04: Plano de Implementacao

## Fase 1 - Especificacao e naming
Objetivo: alinhar dominio antes da codificacao.

- [ ] Aprovar naming final:
  - `SalesPageEvent`
  - `SalesPageSession`
  - `SalesPageConfig`
- [ ] Aprovar nome da aba admin:
  - `Sales Analytics`
  - ou `Analytics de Vendas`
- [ ] Aprovar landing page inicial:
  - `curso-fundamentos-ia`

## Fase 2 - Banco de dados
Objetivo: preparar persistencia do funil.

- [ ] Adicionar enums Prisma.
- [ ] Criar model `SalesPageEvent`.
- [ ] Criar model `SalesPageSession` se aprovado no MVP.
- [ ] Criar model `SalesPageConfig`.
- [ ] Criar migration.

## Fase 3 - Tracking interno no frontend
Objetivo: disparar analytics proprietario sem afetar a Meta.

- [ ] Criar helper de sessao da landing.
- [ ] Criar helper de coleta de UTM/referrer/device.
- [ ] Criar `lib/salesAnalytics.ts`.
- [ ] Integrar `PAGE_VIEW` na landing.
- [ ] Integrar `VIEW_CONTENT` na pagina do curso.
- [ ] Integrar `INITIATE_CHECKOUT` no CTA.
- [ ] Garantir que o redirect continue rapido.

## Fase 4 - API de ingestao
Objetivo: salvar eventos no banco.

- [ ] Criar `POST /api/sales/events`.
- [ ] Validar e normalizar payload.
- [ ] Persistir evento.
- [ ] Atualizar sessao agregada, se habilitada.
- [ ] Adicionar logs leves para troubleshooting.

## Fase 5 - API de consulta admin
Objetivo: expor dados para o dashboard.

- [ ] `GET /api/admin/sales-analytics/summary`
- [ ] `GET /api/admin/sales-analytics/timeseries`
- [ ] `GET /api/admin/sales-analytics/sources`
- [ ] `GET /api/admin/sales-analytics/funnel`
- [ ] `GET /api/admin/sales-analytics/events`

## Fase 6 - Frontend admin
Objetivo: entregar a tela de leitura do funil.

- [ ] Adicionar item no menu admin.
- [ ] Criar pagina `/admin/sales-analytics`.
- [ ] Criar cards de KPI.
- [ ] Criar grafico de serie temporal.
- [ ] Criar tabela de origens/UTMs.
- [ ] Criar tabela de eventos recentes.

## Fase 7 - Compra real
Objetivo: fechar o funil alem do clique no checkout.

- [ ] Definir estrategia Hotmart:
  - pagina de obrigado
  - callback
  - webhook
- [ ] Criar `PURCHASE` deduplicavel por `orderId`.
- [ ] Exibir receita e taxa final.

## Fase 8 - Qualidade
Objetivo: reduzir regressao e diferenciar falha de rastreamento de queda real.

- [ ] Testes unitarios da camada de normalizacao.
- [ ] Testes de API de ingestao.
- [ ] Testes de agregacao.
- [ ] Smoke test da landing com Pixel + analytics interno.
- [ ] Verificacao de build.

## Fase 9 - Rollout
Objetivo: liberar com risco controlado.

- [ ] Habilitar so para `curso-fundamentos-ia`.
- [ ] Validar eventos por 24-48h.
- [ ] Conferir paridade basica com Meta Test Events.
- [ ] Publicar dashboard para uso operacional.

## Ordem recomendada de entrega
1. Banco + ingestao
2. `PAGE_VIEW`, `VIEW_CONTENT`, `INITIATE_CHECKOUT`
3. Dashboard admin MVP
4. Integracao de `PURCHASE`
