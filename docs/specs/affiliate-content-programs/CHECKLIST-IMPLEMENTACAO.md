# Checklist de Implementacao

Ultima atualizacao: 2026-08-05

## Objetivo

Transformar a base atual em uma central de programas afiliados com continuidade de execucao, checklist persistente e fundacao reutilizavel para as 12 lojas priorizadas.

## Fase 0 - Fundacao compartilhada

- [x] Consolidar o spec driven development das 12 lojas em `docs/specs/affiliate-content-programs/`
- [x] Confirmar os slugs e links de afiliado no seed `AffiliateStore`
- [x] Criar este checklist versionado para continuidade do trabalho
- [x] Criar um registro compartilhado dos programas afiliados no codigo
- [x] Criar uma central admin para visualizar os 12 programas
- [x] Ligar o seed principal ao catalogo de `AffiliateStore`
- [x] Verificar o estado real das migrations no banco atual antes de novas migrations
- [x] Criar uma camada compartilhada inicial de operacoes por programa no codigo
- [x] Unificar um cron inicial de programas afiliados no codigo

## Fase 1 - Cobasi como piloto operacional

- [x] Manter a area atual de Cobasi funcionando sem quebrar o fluxo existente
- [x] Manter CTA indireto via `/go/loja/cobasi`
- [x] Manter cidades e paginas locais fora do sitemap ate verificacao
- [ ] Migrar a area Cobasi para dentro da central multi-programa
- [x] Rodar seed do programa Cobasi no banco
- [ ] Validar execucao do job/manual publish apos reconciliar migration

## Fase 2 - Expansao para as outras lojas

- [x] Brascol: conectar a central compartilhada ao pipeline editorial direcionado por loja
- [ ] Electrolux: modelar hubs, comparativos, reviews e problemas
- [x] Electrolux: conectar a central compartilhada ao pipeline editorial direcionado por loja
- [ ] Cicatribem: modelar trilhas com compliance reforcado
- [ ] Pibe Brasil: modelar trilhas de creatina gummy com guardrails
- [ ] Funko Brasil: modelar colecoes, franquias e guias de compra
- [ ] Probel: modelar colchoes, perfis, dor e comparativos
- [ ] Thermos Brasil: modelar uso, categorias e kits
- [ ] Escuta o Veio: modelar editorial/comercial com presentes e moda
- [ ] GLNC Farma: modelar conteudo sensivel com validacao extra
- [x] TNG: conectar a central compartilhada ao pipeline editorial direcionado por loja
- [ ] Drogaria Rosario: modelar clusters com compliance farmaceutico

## Fase 3 - Operacao

- [x] Central admin com acoes compartilhadas de bootstrap/execucao para o piloto Cobasi
- [x] Central admin com execucao direcionada para Electrolux via pipeline editorial
- [x] Central admin com execucao direcionada para Brascol via pipeline editorial
- [x] Central admin com execucao direcionada para TNG via pipeline editorial
- [ ] Checklist operacional no admin para revisar fontes, CTA e sitemap
- [ ] Registro de estado por programa: draft, queued, review, published, stale
- [x] Analytics base de cliques via `/go/loja/[slug]` consolidado em `AffiliateStoreClick` e `SalesPageEvent`
- [x] Inventario de analytics ampliado para incluir paginas pet/local da Cobasi
- [x] Central admin com visao de cliques por programa em total, 30d e 7d
- [ ] Observabilidade de runs e erros por programa
- [ ] Politica de refresh de conteudos stale
- [ ] Criterios de autopublish por programa

## Observacoes

- Em `2026-08-05`, o banco configurado em `.env` respondeu com `Database schema is up to date!` no `prisma migrate status`.
- Em `2026-08-05`, o seed estreito de afiliados retornou `ACTIVE=77`, `NEEDS_FIX=3` e `BLOCKED=3`.
- Em `2026-08-05`, o bootstrap Cobasi retornou `97` cidades, `26` paginas e `19` pautas na fila.
- Thermos Brasil usa parametros de afiliado diferentes dos demais e deve continuar como excecao controlada.
- Nenhum agente ou gerador deve gravar URL de afiliado diretamente em conteudo; o destino final precisa continuar resolvido pela rota `/go/loja/[slug]`.
