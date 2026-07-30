# Compra Esperta: analytics, SEO, leads e LGPD

Data do levantamento: 30/07/2026

## Objetivo

Transformar o `compraesperta-promocoes.shop` em uma operação mensurável, mantendo o
painel administrativo exclusivamente em `plugandoia.cloud`.

O painel precisa responder:

- quais páginas existem e como acessá-las;
- quantas visitas e sessões cada página recebeu;
- de onde vieram os visitantes;
- quais links externos receberam cliques;
- quais páginas converteram visitantes em leads;
- quais páginas e consultas aparecem no Google;
- quais conteúdos merecem investimento em SEO ou tráfego pago;
- se o rastreamento e a captação respeitam as escolhas de privacidade.

## Decisão de domínio

- Site público comercial: `https://compraesperta-promocoes.shop`
- Administração: `https://plugandoia.cloud/admin`
- Dashboard proposto: `https://plugandoia.cloud/admin/compra-esperta`
- APIs administrativas: somente no domínio Plugando IA e protegidas por sessão.
- Endpoints públicos de coleta: disponíveis no domínio Compra Esperta, com validação,
  limitação de requisições e sem retornar dados administrativos.

O admin não deve ser servido pelo domínio Compra Esperta.

## O que já existe no sistema

O projeto já contém peças que podem ser reutilizadas:

1. `SalesPageEvent` e `SalesPageSession`
   - visitas, sessões, origem, referência, dispositivo, navegador e UTMs;
   - funil com visualização, lead e conversão;
   - consultas por intervalo de data.
2. `ContentMetricEvent`
   - eventos genéricos de conteúdo, artigo, clique e lead.
3. `AffiliateStoreClick`
   - clique por loja, origem, campanha, referência, user-agent e hash de IP.
4. `BioClick`
   - clique de produto da vitrine.
5. `Lead`
   - cadastro simples por e-mail.
6. Dashboard `Sales Analytics`
   - resumo, série temporal, fontes, funil e eventos recentes.
7. Integração parcial com Google Search Console
   - consultas, cliques, impressões, CTR e posição.
8. Redirecionador `/go/loja/[slug]`
   - já registra o clique antes de enviar o visitante para a loja.
9. Sitemap, canonical e robots separados por domínio.

## Lacunas encontradas

1. As páginas do Compra Esperta ainda não disparam eventos de visita de maneira
   uniforme.
2. Os cliques de loja e de produto estão em modelos diferentes e não aparecem em
   um único painel.
3. Links de comparativos ainda podem apontar diretamente para a URL externa e
   escapar do redirecionador rastreável.
4. O dashboard atual é voltado a uma landing page, não a um catálogo de páginas.
5. O Search Console atual aceita uma propriedade padrão; o Compra Esperta precisa
   de propriedade e configuração próprias.
6. O modelo `Lead` não armazena prova completa de consentimento, versão do texto,
   confirmação, descadastro ou estado de sincronização com Mautic.
7. A política pública existente é da Plugando IA, está desatualizada para o novo
   domínio e não descreve adequadamente newsletter, Google Analytics, publicidade,
   retenção e revogação.
8. O middleware do domínio comercial atualmente permite o clique da bio, mas
   bloqueia `/api/leads` e `/api/metrics/event`. Isso é seguro por padrão, porém os
   novos endpoints públicos precisam ser liberados de forma explícita.
9. Não existe uma central para inventariar URL, título, palavra-chave pretendida,
   status HTTP, canonical, última atualização e desempenho.

## Arquitetura recomendada

### 1. Analytics próprio como fonte operacional

Registrar no PostgreSQL eventos de primeira parte:

- `PAGE_VIEW`
- `OUTBOUND_CLICK`
- `LEAD_SUBMITTED`
- `LEAD_CONFIRMED`
- `CONSENT_UPDATED`

Campos essenciais:

- domínio, caminho, título e tipo da página;
- identificador estável da página;
- loja e produto, quando aplicável;
- sessão pseudônima;
- origem, mídia, campanha e conteúdo UTM;
- referência;
- dispositivo e navegador;
- data e hora;
- metadados técnicos limitados.

Não armazenar IP puro. Se o hash de IP continuar sendo usado, tratá-lo como dado
pseudonimizado, com retenção definida, e não como dado anônimo.

### 2. Google Analytics 4 e Google Tag Manager

Usar uma propriedade GA4 exclusiva para Compra Esperta e um container GTM
exclusivo ou claramente separado por ambiente.

Eventos sugeridos:

- `page_view`
- `view_item`
- `select_content`
- `click_outbound`
- `generate_lead`

O e-mail, nome ou qualquer outra informação identificável nunca deve ser enviado
ao GA4, inclusive em URL, título, UTM, dimensão personalizada ou rótulo de evento.

Começar com Google Consent Mode v2 em modo básico:

- antes da escolha, tags de analytics e publicidade permanecem bloqueadas;
- depois da escolha, carregar somente as categorias autorizadas;
- permitir que o visitante altere ou revogue a escolha.

Para remarketing futuro, manter separados:

- `analytics_storage`
- `ad_storage`
- `ad_user_data`
- `ad_personalization`

Ativar Google Ads/remarketing somente depois do banner, política e consentimento
estarem revisados.

### 3. Search Console como fonte de SEO

Criar uma propriedade de domínio para `compraesperta-promocoes.shop`, verificar via
DNS e adicionar a conta de serviço usada pelo sistema como usuário com permissão
adequada.

Configurar no sistema uma propriedade separada do portal:

- `GOOGLE_SEARCH_CONSOLE_COMMERCE_SITE_URL=sc-domain:compraesperta-promocoes.shop`
- credencial da conta de serviço já suportada pelo projeto.

Enviar:

- `https://compraesperta-promocoes.shop/sitemap.xml`

O dashboard deve cruzar, por URL e período:

- impressões;
- cliques orgânicos;
- CTR;
- posição média;
- consultas reais;
- visitas próprias;
- cliques externos;
- leads.

O Search Console informa o que o Google observou. Ele não fornece uma data futura
garantida de indexação. O painel deve exibir `sem dados`, `descoberta provável`,
`com impressão` e, quando consultado por inspeção, `indexada` ou o motivo informado
pelo Google.

Não usar a Indexing API comum para esses artigos: a API oficial é destinada a
`JobPosting` e transmissões ao vivo com `BroadcastEvent`. Para os artigos, usar
sitemap e inspeção de URL.

### 4. Captura de ofertas por e-mail

Adicionar o bloco "Receba ofertas por e-mail" nas páginas de produto e, depois de
validado, nas páginas de loja e guias.

O formulário deve conter:

- campo de e-mail;
- texto curto e específico da finalidade;
- link para a Política de Privacidade;
- checkbox não pré-marcado;
- informação de que o consentimento pode ser revogado;
- botão com ação clara;
- confirmação visual sem revelar se outro e-mail já está cadastrado.

Texto inicial sugerido:

> Quero receber por e-mail ofertas, guias de compra e novidades da Compra Esperta.
> Li a Política de Privacidade e sei que posso cancelar quando quiser.

Recomenda-se double opt-in: após o cadastro, enviar um link de confirmação. Embora
não seja uma exigência universal automática para todo e-mail, ele oferece melhor
prova de vontade, reduz endereços inválidos e prepara uma base mais limpa para o
Mautic.

Dados necessários no cadastro:

- e-mail normalizado;
- status `PENDING`, `ACTIVE`, `UNSUBSCRIBED` ou `SUPPRESSED`;
- URL e página de origem;
- loja/produto de interesse;
- UTMs e referência;
- data do consentimento;
- versão exata do texto aceito;
- hash de IP opcional e com retenção;
- data da confirmação;
- data e motivo do descadastro;
- identificador do contato no Mautic, futuramente;
- data e erro da última sincronização.

O link de descadastro deve ser gratuito, simples e funcionar sem login.

### 5. Inventário de páginas

Criar uma tabela no admin com:

- URL e botão "Abrir";
- título;
- tipo: home, loja, guia, produto ou comparativo;
- loja/produto;
- palavra-chave principal pretendida;
- palavras secundárias;
- canonical;
- inclusão no sitemap;
- status HTTP;
- atualização;
- visitas;
- visitantes/sessões;
- clique externo;
- CTR de saída;
- leads;
- conversão em lead;
- impressões Google;
- cliques Google;
- CTR orgânico;
- posição média;
- consultas de melhor desempenho;
- estado de indexação quando disponível.

Filtros:

- data inicial e final;
- tipo de página;
- loja;
- produto;
- origem/mídia/campanha;
- palavra-chave;
- com/sem visitas;
- com/sem cliques;
- com/sem leads;
- com/sem impressão no Google;
- indexada/não indexada/sem verificação.

## Dashboard proposto

### Visão geral

Cards:

- páginas publicadas;
- páginas com impressão no Google;
- visitas;
- sessões;
- cliques para lojas;
- CTR de saída;
- leads ativos;
- conversão visita → lead.

Gráficos:

- visitas, cliques e leads por dia;
- origem do tráfego;
- dispositivo;
- funil `visita → clique externo → lead`;
- lojas e produtos mais procurados.

### Páginas e SEO

Tabela do inventário com desempenho por URL. Ao abrir uma linha:

- link público;
- metadados e palavras-chave planejadas;
- consultas reais do Search Console;
- evolução de posição, impressão e CTR;
- visitas e conversões próprias;
- histórico de mudanças editoriais;
- recomendações acionáveis.

### Aquisição

- origem, mídia, campanha e conteúdo;
- referência;
- orgânico, direto, social e pago;
- desempenho de cada UTM;
- comparação entre períodos.

### Leads

- total, pendentes, confirmados e descadastrados;
- página, loja e produto de origem;
- consentimento e versão do texto;
- exportação controlada;
- estado da futura sincronização Mautic;
- ação de supressão/descadastro.

Não exibir IP, hash de IP ou dados técnicos desnecessários na listagem comum.

## Palavras-chave

As páginas de produto já possuem palavras-chave editoriais principais e
secundárias no código. Elas são hipóteses, não garantia de busca ou ranqueamento.

O processo profissional deve separar:

1. **palavra-chave planejada**: definida antes de publicar;
2. **consulta real**: termo que gerou impressão ou clique no Google;
3. **oportunidade**: consulta com boa impressão e posição intermediária;
4. **conversão**: página/consulta que também gera clique externo ou lead.

Critérios de oportunidade:

- muitas impressões e CTR baixo: revisar título e descrição;
- posição entre 5 e 20: reforçar conteúdo, links internos e intenção;
- visita alta e clique externo baixo: revisar CTA e alinhamento com a busca;
- clique externo alto e lead baixo: testar posição e proposta do formulário;
- sem impressões após período razoável: verificar indexação, diferenciação e
  qualidade do conteúdo.

Não decidir investimento apenas por posição média. Priorizar tendência de
impressões, cliques, CTR e conversão.

## O que é possível saber sobre o visitante

Sem cadastro:

- sessão pseudônima;
- página visitada;
- origem e campanha;
- dispositivo/navegador aproximados;
- região aproximada se fornecida por ferramenta autorizada;
- ações realizadas.

Não é possível nem recomendável descobrir a identidade civil de cada visitante.

Depois do cadastro voluntário:

- e-mail fornecido;
- interesse inferido pela página de origem;
- histórico de consentimento;
- campanhas e ações posteriores, conforme política e permissões.

Remarketing deve ser feito por públicos das plataformas, respeitando consentimento,
sem expor no admin uma lista nominal de visitantes anônimos.

## LGPD e governança mínima

Antes de ativar newsletter e tags:

1. publicar Política de Privacidade própria da Compra Esperta;
2. publicar Política de Cookies;
3. informar controlador e canal de contato;
4. explicar finalidades, categorias de dados, compartilhamentos, retenção e
   direitos;
5. implementar banner com recusa tão acessível quanto aceitação;
6. guardar prova do consentimento;
7. permitir revogação e descadastro;
8. definir retenção e rotina de exclusão;
9. limitar acesso aos leads no admin;
10. registrar exportações e operações sensíveis;
11. manter contrato e configuração de operadores futuros, como Mautic e provedor
    de e-mail.

Esta especificação é técnica e não substitui revisão jurídica.

## Ordem de implementação

### Fase 1 — medição própria e inventário

- criar modelos/migração unificados para páginas, eventos e consentimentos;
- instrumentar todas as páginas comerciais;
- garantir que todos os CTAs externos usem redirecionador rastreável;
- criar `/admin/compra-esperta`;
- implementar filtros, cards, gráfico e tabela de URLs;
- liberar somente endpoints públicos específicos no domínio comercial;
- adicionar rate limit, validação de origem e proteção contra bots básicos.

Resultado: visitas, cliques, fontes e desempenho por página sem depender do Google.

### Fase 2 — leads e LGPD

- criar o formulário reutilizável;
- implementar double opt-in e descadastro;
- publicar políticas específicas;
- criar central de preferências e banner;
- adicionar área de leads e auditoria no dashboard.

Resultado: base própria comprovável e preparada para Mautic.

### Fase 3 — Google

- configurar Search Console do novo domínio;
- enviar sitemap;
- integrar consultas por página/período ao dashboard;
- criar GA4 e GTM;
- implementar Consent Mode v2;
- validar com Tag Assistant e DebugView.

Resultado: visão de aquisição, SEO e comportamento cruzada com dados próprios.

### Fase 4 — otimização e campanhas

- sincronizar contatos confirmados com Mautic;
- padronizar UTMs;
- criar segmentos por interesse;
- ativar remarketing somente com consentimento;
- criar alertas de oportunidade de SEO;
- comparar períodos e registrar alterações editoriais.

Resultado: operação pronta para automação, mídia paga e melhoria contínua.

## Critérios de aceite

- admin nunca é exibido no domínio Compra Esperta;
- toda URL comercial aparece no inventário;
- toda visita válida gera no máximo um evento inicial por carregamento;
- todo CTA externo passa por rota rastreável;
- filtros de data usam o fuso `America/Sao_Paulo`;
- bots conhecidos são identificados e excluíveis dos relatórios;
- nenhum e-mail é enviado ao GA4/GTM;
- tags opcionais não disparam antes da escolha exigida;
- consentimento, confirmação e descadastro são auditáveis;
- política e preferências são acessíveis em todas as páginas;
- dashboard diferencia palavra-chave planejada de consulta real;
- falhas de coleta e de integração ficam visíveis no admin.

## Referências oficiais

- Google Search Central — crawling e indexação:
  https://developers.google.com/search/docs/crawling-indexing
- Google Search Central — solicitar nova varredura:
  https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl
- Google Search Console — relatório de desempenho:
  https://support.google.com/webmasters/answer/7576553
- Google Search Console — indexação de páginas:
  https://support.google.com/webmasters/answer/7440203
- Google — Consent Mode:
  https://developers.google.com/tag-platform/security/guides/consent
- Google Analytics — não enviar informações identificáveis:
  https://support.google.com/analytics/answer/6366371
- ANPD — Guia de Cookies e Proteção de Dados Pessoais:
  https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-cookies-e-protecao-de-dados-pessoais.pdf
- Lei Geral de Proteção de Dados:
  https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm
