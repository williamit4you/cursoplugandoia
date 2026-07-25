# Publicações sociais e mural de vendas — especificação dirigida por comportamento

## Problema confirmado

O painel carregava somente uma página da API (20 itens por padrão) e aplicava vários filtros no navegador. Por isso, `Hoje`, `Últimos 7 dias` e os KPIs examinavam apenas uma fração da fila e não representavam os dados reais.

## Objetivos

1. Resolver todos os filtros no backend antes de paginar.
2. Manter filtros em edição até o operador pressionar **Filtrar**; após qualquer alteração, mostrar **Aplicar filtro**.
3. Exibir KPIs reais e clicáveis, que aplicam o respectivo status à lista.
4. Tornar o campo de data explícito: relevante, agendada, publicada ou criação.
5. Exibir na `/bio` os 50 produtos ativos mais recentes, com foto, nome, descrição, CTA direto ao afiliado e rastreio de clique.
6. Preservar integralmente a criação de vídeo, a coleta, o link afiliado, os workers e o cron existentes.
7. Garantir publicação social resiliente: containers Meta lentos são consultados, falhas transitórias são reagendadas e nunca bloqueiam posts vencidos.

## Contrato da listagem social

`GET /api/social/posts` aceita `q`, `period`, `dateFrom`, `dateTo`, `dateField`, `platform`, `postType`, `status`, `platformStatus`, `account`, `origin`, `media`, `errors`, `sortBy`, `sortDir`, `page` e `pageSize`.

A resposta devolve `items`, `total` já filtrado e `stats`. Os cartões de status usam o mesmo contexto de filtros da lista e não usam valores da página atual. `PUBLISHED` inclui `POSTED`; `PROCESSING` inclui os estados de processamento/envio; `FAILED` inclui erro e atenção requerida.

Por padrão, a data relevante é `postedAt` em itens publicados, `scheduledTo` nos itens futuros/em fila e `createdAt` apenas quando não houver nenhuma das anteriores.

## Mural de vendas

A etapa `CREATE_BIO_PRODUCT` cria o cadastro depois de a coleta obter título, descrição, imagens e link afiliado. No cadastro manual de vídeo, o link informado pelo operador é salvo diretamente como `affiliateUrl`; a Bio é garantida imediatamente antes de o item ser agendado nas redes, sem solicitar ou gerar outro link. A `/bio` consulta somente produtos ativos, ordena por `publishedAt DESC, createdAt DESC`, limita 50 e encaminha foto/CTA para o afiliado com rastreio de clique.

Não há scraping durante a visita pública. Os dados e mídias vêm do que a esteira já persistiu, evitando qualquer impacto na criação ou publicação de vídeos.

## Critérios de aceite

- `Hoje` e `Últimos 7 dias` retornam resultados corretos mesmo que estejam fora da primeira página.
- Alterar controles não faz consulta; pressionar o botão aplica tudo no backend e volta à página 1.
- Clicar em qualquer KPI mostra a quantidade correspondente na lista.
- A `/bio` tem cards responsivos de 1, 2 ou 3 colunas, com foto, nome, descrição curta e CTA para Shopee.
- Os testes operacionais e o build continuam verdes sem alterar as rotas de geração de vídeo, worker ou cron.

## Checklist consolidado

| Item | Estado | Evidência / próximo passo |
| --- | --- | --- |
| Diagnosticar filtros de período e KPIs irreais | Concluído | Causa: filtro local sobre apenas uma página. |
| Filtros sociais no backend antes da paginação | Concluído | A API retorna itens, total e estatísticas reais. |
| Botão Filtrar/Aplicar filtro e KPIs clicáveis | Concluído | O painel separa edição de filtro aplicado. |
| Bio responsiva para celular, notebook e desktop | Concluído para a vitrine | Grade 1/2/3 colunas e CTAs de toque. |
| Mural com foto, nome, descrição e afiliado | Concluído para novos `BioProduct` | Foto e CTA rastreados na `/bio`. |
| Cadastro manual com link afiliado informado | Concluído | A Bio é criada/garantida antes do agendamento social; não chama geração de link. |
| Fila Meta justa e recuperação de container | Concluído | Posts vencidos e consultas de containers usam filas separadas; após 10 consultas sem finalização, nova tentativa em 30 min; após 3 ciclos, falha auditável. |
| Central de falhas e reprogramação em lote | Concluído | `/admin/social?status=FAILED` filtra falhas; itens selecionados podem ser reprogramados a partir de 30 min. |
| Preencher produtos legados sem `BioProduct` | Pendente | Rotina administrativa idempotente, após autorização para escrever no banco. |
| Validar painel administrativo em viewport real | Pendente | Testar 360 px, 1280 px e >=1720 px; a tabela ainda rola horizontalmente no celular. |
| Testes de regressão de vídeo/publicação | Concluído nesta entrega | Build e 12 testes operacionais verdes. |
