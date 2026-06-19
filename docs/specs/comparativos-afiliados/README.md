# SDD: Comparativos de Afiliados

Esta pasta define a nova area de `Comparativos`, onde o admin cadastra um tema e uma lista de links de afiliados para gerar artigos comparativos publicos com SEO, scraping, IA e rastreabilidade de execucao.

## Documentos
- `00-visao-geral.md`: objetivo, escopo, fluxo e premissas.
- `01-modelo-dados.md`: schema Prisma proposto, estados e relacionamentos.
- `02-api-e-orquestracao.md`: contratos de API, fila, steps e processamento.
- `03-prompts-ia-seo.md`: prompts, guardrails, SEO e estrategia editorial.
- `04-frontend-admin-publico.md`: UX da aba admin e paginas publicas.
- `05-plano-implementacao.md`: fases de entrega em Spec Driven Development.
- `checkpoints.md`: checklist operacional para execucao.

## Resultado esperado
1. Nova aba admin abaixo de `Agendamentos`: `Comparativos`.
2. Listagem em `/admin/comparativos` com botao `Novo`.
3. Cadastro guiado de tema + links de afiliados.
4. Gatilho automatico para scraping, enriquecimento e escrita do artigo.
5. Publicacao publica em `/comparativo` e `/comparativo/[slug]`.
