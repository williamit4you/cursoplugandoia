# Publicações sociais, mural de vendas e Stories com afiliado — especificação dirigida por comportamento

## Problema e causa confirmada

O painel de Publicações carregava somente uma página da API (20 itens por padrão). Os filtros de período, origem, mídia, erro e conta eram aplicados depois, no navegador. Em consequência, `Hoje` e `Últimos 7 dias` examinavam apenas essa página e usavam a regra implícita `scheduledTo || postedAt || createdAt`. Os KPIs eram contagens dessa mesma página, e não da fila real.

## Objetivos

1. Todo filtro da fila deve ser resolvido no backend antes da paginação.
2. O painel deve manter filtros em edição até o operador pressionar **Filtrar**; depois de uma alteração, o botão passa a **Aplicar filtro**.
3. Cada KPI deve mostrar uma contagem real e clicável. Ao clicar, a lista recebe o status correspondente e consulta novamente o backend.
4. A data deve ser explícita: por padrão é a **data relevante** — `postedAt` para publicado, `scheduledTo` para itens futuros/em fila e `createdAt` somente quando nenhuma das anteriores existir. O operador pode selecionar agendamento, publicação ou criação.
5. A `/bio` deve ser uma vitrine mobile-first dos 50 produtos mais recentemente publicados: foto, nome, resumo e CTA direto ao link de afiliado, com rastreio de clique preservado.
6. A criação de vídeo, coleta, geração de link de afiliado e publicação social não podem ter suas transições, workers, cron ou contratos alterados.

## Contrato da listagem social

`GET /api/social/posts` aceita `q`, `period`, `dateFrom`, `dateTo`, `dateField`, `platform`, `postType`, `status`, `platformStatus`, `account`, `origin`, `media`, `errors`, `sortBy`, `sortDir`, `page` e `pageSize`.

A resposta contém `items`, `total` (já filtrado), paginação e `stats`. `stats` usa os filtros de contexto, exceto status, para que cada cartão corresponda exatamente ao conjunto que será exibido ao ser clicado. Status agregados: `PUBLISHED` inclui `POSTED`; `PROCESSING` inclui processamento/envio/aguardo; `FAILED` inclui erro e atenção requerida; `queue` inclui rascunho e fila.

Origem continua sendo inferida de forma compatível: relações de notícia identificam `NEWS`; projetos/StoryPublications da Shopee identificam `SHOPEE`; o restante é `OTHER`. Nenhum registro existente é migrado ou reclassificado.

## Fluxo da vitrine

Após a coleta obter título, descrição, imagens e o link afiliado, a etapa existente `CREATE_BIO_PRODUCT` cria o `BioProduct`. A `/bio` consulta somente produtos ativos, ordenados por `publishedAt DESC, createdAt DESC`, limita 50 e encaminha imagem e CTA ao detalhe/rastreamento. Não haverá scraping no acesso público; fotos e dados vêm dos ativos já persistidos pela esteira. Isso evita atrasar ou acoplar publicação do vídeo a uma navegação de cliente.

## Reels + Story de conversão com link afiliado

### Descoberta técnica e decisão

O Instagram permite publicar Stories orgânicos de vídeo via Content Publishing API para contas Business. Porém, a API oficial não expõe a criação nem a posição do **Link Sticker** interativo. A ajuda da Meta confirma que o adesivo direciona o toque para uma URL; a documentação pública de publicação não oferece esse campo. Um sticker desenhado/renderizado no vídeo é apenas visual e não gera comissão, pois não é tocável.

Referências: [Meta — Link sticker em Stories](https://www.facebook.com/help/instagram/192168966243613) e [coleção oficial Instagram API da Meta](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api?entity=request-23987686-b628c95f-9319-432e-a58c-c99e96a05670).

Não será usada automação de interface, emulador, sessão/cookie ou scraping do aplicativo para contornar essa limitação: além de frágil, isso coloca a conta em risco. A solução correta é híbrida e mantém a comissão rastreável:

1. O Reel afiliado é publicado automaticamente.
2. Assim que a publicação do Reel é confirmada, o sistema cria uma tarefa `STORY_LINK_REQUIRED`, com o mesmo vídeo vertical, link afiliado, título/CTA e URL do Reel.
3. O operador recebe uma tela mobile-first com os botões: **abrir Instagram**, **copiar link afiliado**, **baixar/abrir mídia**, e uma instrução curta: compartilhar o Reel no Story, inserir o Link Sticker oficial e colar o afiliado.
4. Após confirmar, a tarefa registra `STORY_LINK_APPLIED`, data, usuário e URL/ID do Story quando disponível. Sem confirmação ela permanece pendente e aparece no painel de falhas operacionais.

O vídeo poderá receber um CTA visual seguro (“Toque no link acima”) com área livre para o sticker, mas isso nunca substitui a etapa de adesivo oficial. A arte deve reservar o rodapé e a área central-baixa, como no exemplo, sem cobrir o CTA ou o rosto/produto.

### Situação da rotina atual

Há uma rota capaz de publicar Story simples (`/api/social/publish-story`), mas ela não recebe link afiliado nem pode criar Link Sticker. Além disso, a função `ensureStorySocialPosts` da esteira cria registros `REEL`; portanto ela não atende hoje ao requisito “após cada Reel, criar Story de conversão”. Não se deve marcar esse requisito como implementado apenas porque um `StoryAd` existe no banco.

### Contrato e estados novos propostos

Uma tarefa de Story deve possuir: `reelSocialPostId`, `affiliateUrl`, `videoUrl`, `ctaText`, `status`, `preparedAt`, `completedAt`, `completedBy`, `storyUrl`, `lastError` e log. Estados: `WAITING_REEL`, `READY_FOR_LINK_STICKER`, `COMPLETED`, `SKIPPED`, `FAILED`.

- O gatilho é exclusivamente o sucesso do Reel Meta/Instagram (`POSTED` com `metaReelPostedAt`). Falhas ou publicação em outra plataforma não criam tarefa.
- O afiliado é obrigatório; sem ele, a publicação do Reel pode seguir normalmente, mas a tarefa fica `FAILED` com alerta de receita.
- A criação deve ser idempotente por Reel: reprocessar cron não pode duplicar Story/tarefa.
- A publicação automática do Story simples é opcional e desabilitada por padrão, pois não converte pelo sticker. Quando habilitada, ela é complementar, nunca substitui `READY_FOR_LINK_STICKER`.

## Critérios de aceite

- Com mais de uma página de dados, `Hoje` e `Últimos 7 dias` retornam resultados corretos independentemente da página em que foram criados.
- Alterar qualquer controle não dispara consulta; pressionar o botão consulta o backend e reinicia na página 1.
- Os cinco cartões superiores não usam valores locais nem placeholders. Clicar em um deles mostra a quantidade correspondente na lista.
- A `/bio` exibe no máximo 50 produtos em ordem de publicação e, em celular, cada card mostra foto, nome, descrição curta e CTA acessível para a Shopee.
- Cada Reel de Instagram com afiliado publicado gera exatamente uma tarefa de Story com link; a tarefa só é concluída após a confirmação humana do Link Sticker oficial.
- Nenhum Story é contabilizado como conversão apenas por ter CTA visual renderizado.
- Os testes existentes de operações continuam verdes; não são modificadas as rotas de geração de vídeo, worker, cron ou os estados do pipeline.

## Plano de validação e reversão

1. Testar a função de filtro com datas, status agregados e paginação.
2. Executar os testes de operações e o build TypeScript/Next.
3. Testar manualmente viewport móvel (360 px), notebook (1280 px) e desktop (>= 1720 px).
4. A mudança é isolada à leitura do painel e à renderização pública da bio. Caso seja necessário reverter, basta reverter esses arquivos; não há migração nem alteração de dados.

## Checklist consolidado

| Item | Estado | Evidência / próximo passo |
| --- | --- | --- |
| Diagnosticar filtros de período e KPIs irreais | Concluído | Causa registrada: filtro local sobre apenas uma página. |
| Filtros sociais no backend antes da paginação | Concluído | `GET /api/social/posts` retorna itens, total e `stats` reais. |
| Botão Filtrar/Aplicar filtro e KPIs clicáveis | Concluído | Painel mantém edição local até aplicar; cartões filtram por status. |
| Layout da Bio para celular, notebook e desktop | Concluído para a vitrine | Grade 1/2/3 colunas, CTAs de toque e cards dos 50 mais recentes. |
| Mural de vendas com foto, nome, descrição e afiliado | Concluído para novos `BioProduct` | Foto/CTA clicáveis e rastreados na `/bio`. |
| Preencher produtos legados sem `BioProduct` | Pendente | Criar rotina administrativa idempotente e executá-la somente com aprovação para escrita no banco. |
| Confirmar toda a responsividade do painel administrativo em viewport real | Pendente | Validar 360 px, 1280 px e >=1720 px; a tabela atual ainda usa rolagem horizontal em telas pequenas. |
| Publicar Reel Meta/Instagram | Já existia | Fluxo atual de publicação permanece isolado. |
| Criar Story de vídeo automático | Já existe parcialmente | A rota publica Story simples, sem link clicável; não atende à comissão. |
| Criar tarefa pós-Reel para Story com Link Sticker | Pendente, prioridade máxima | Implementar modelo, gatilho idempotente, tela operacional e alertas. |
| Inserir Link Sticker oficial e apontar para o Reel | Ação humana obrigatória | Limitação da API oficial; confirmar conclusão e auditar. |
| Testes de regressão da criação/publicação de vídeo | Concluído nesta entrega | Build e 12 testes operacionais verdes; ampliar testes para o novo fluxo antes de ativá-lo. |
