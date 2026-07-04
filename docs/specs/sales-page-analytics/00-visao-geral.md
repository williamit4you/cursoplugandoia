# SDD-SPA-00: Visao Geral

## 1. Objetivo
Criar uma vertical de analytics para a pagina de vendas do curso, permitindo acompanhar acessos, engajamento, origem do trafego e conversao de funil sem depender apenas do painel da Meta.

Pagina alvo inicial:
- `/curso-fundamentos-ia`

Objetivo de negocio:
- responder com clareza quantas pessoas chegaram na pagina;
- quantas realmente visualizaram a oferta;
- quantas clicaram em comprar;
- de onde vieram;
- quais campanhas e UTMs geram mais conversao;
- como a performance evolui ao longo do tempo.

## 2. Problema atual
Hoje o projeto passou a contar com Meta Pixel para eventos como:
- `PageView`
- `ViewContent`
- `InitiateCheckout`

Isso ajuda campanhas da Meta, mas nao resolve integralmente a necessidade operacional do negocio porque:
- o dado fica concentrado em ferramenta externa;
- nao temos dashboard interno da landing;
- nao conseguimos cruzar com contexto do produto e da pagina do jeito que precisamos;
- nao ha historico estruturado no banco do proprio sistema.

## 3. Resultado esperado
Adicionar uma nova capacidade ao sistema com:
- persistencia propria dos eventos da landing page;
- API de ingestao segura e leve;
- dashboard admin para analise de funil;
- coexistencia com o Pixel da Meta sem interferir no rastreamento ja implantado.

## 4. Escopo funcional do MVP
- Rastrear eventos internos da pagina de vendas:
  - `PAGE_VIEW`
  - `VIEW_CONTENT`
  - `INITIATE_CHECKOUT`
  - `LEAD` opcional quando houver captura
  - `PURCHASE` preparado, mas inicialmente dependente de integracao externa
- Persistir contexto minimo de sessao:
  - `sessionId`
  - `pathname`
  - `referrer`
  - `utm_source`
  - `utm_medium`
  - `utm_campaign`
  - `utm_term`
  - `utm_content`
  - `fbclid`
  - `userAgent`
  - `deviceType`
- Criar dashboard admin com:
  - volume de trafego
  - usuarios unicos
  - funil por etapa
  - taxa de clique no checkout
  - origens e campanhas
  - serie temporal
- Estruturar arquitetura para futuras landing pages alem do curso atual.

## 5. Fora de escopo do MVP
- Heatmap de scroll e mapa de clique estilo Hotjar
- Gravacao de sessao
- Atribuicao multitoque completa
- Integracao nativa com Google Ads, GA4 e TikTok Ads
- Modelos estatisticos de cohort/LTV
- Conciliacao financeira completa da Hotmart

## 6. Premissas tecnicas
- O projeto usa `Next.js App Router`, `Prisma` e `PostgreSQL`.
- Ja existe um admin consolidado em `app/(admin)/admin/*`.
- Ja existe Pixel da Meta instalado e funcionando como trilha paralela.
- O rastreamento proprietario deve ser desacoplado do Meta Pixel:
  - se a Meta falhar, o tracking interno continua;
  - se o tracking interno falhar, o Meta Pixel continua.

## 7. Principios da solucao
- Nao substituir o Pixel da Meta.
- Nao introduzir dependencia externa obrigatoria para analytics do MVP.
- Nao gerar regressao na performance da pagina de vendas.
- Nao gerar erros de hidratacao.
- Nao depender de cookies complexos no MVP; usar sessao leve no browser quando possivel.
- Nao confiar em `Purchase` apenas pelo clique de checkout.

## 8. Funil inicial
1. Usuario chega em `/curso-fundamentos-ia`.
2. O site registra `PAGE_VIEW`.
3. A pagina do produto registra `VIEW_CONTENT`.
4. Ao clicar em `Quero comprar agora`, o site registra `INITIATE_CHECKOUT`.
5. Futuramente:
   - retorno/obrigado ou webhook da Hotmart registra `PURCHASE`.

## 9. KPI principais
- `pageViews`
- `uniqueVisitors`
- `viewContentCount`
- `initiateCheckoutCount`
- `checkoutCTR = initiateCheckoutCount / pageViews`
- `viewToCheckoutRate = initiateCheckoutCount / viewContentCount`
- `purchaseCount`
- `purchaseRate = purchaseCount / initiateCheckoutCount`
- `revenue`
- `avgRevenuePerVisitor`

## 10. Criterios de sucesso do MVP
- Conseguimos abrir uma tela admin e responder:
  - quantas visitas a landing teve no periodo;
  - quantos visitantes unicos teve;
  - quantos cliques em comprar ocorreram;
  - qual a taxa de clique da oferta;
  - quais UTMs geraram mais `INITIATE_CHECKOUT`.
- O Pixel da Meta continua operando normalmente.
- O build de producao segue passando.
