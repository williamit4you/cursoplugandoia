# SDD-SPA-03: Dashboard Admin

## 1. Objetivo
Criar uma tela administrativa para leitura rapida e analitica da performance da pagina de vendas.

Rota sugerida:
- `/admin/sales-analytics`

## 2. Posicionamento na navegacao
Sugestao:
- adicionar item `Sales Analytics` ou `Analytics de Vendas` no menu admin principal

Motivo:
- isola analytics da landing sem misturar com CRM ou YouTube Analytics

## 3. Filtros obrigatorios
- landing page (`pageKey`)
- periodo rapido:
  - hoje
  - ontem
  - ultimos 7 dias
  - ultimos 30 dias
  - mes atual
- intervalo customizado

## 4. KPIs no topo
- `Page Views`
- `Visitantes Unicos`
- `ViewContent`
- `Cliques em Comprar`
- `CTR de Checkout`
- `Purchase` quando disponivel
- `Receita` quando disponivel

## 5. Blocos visuais sugeridos

### 5.1 Serie temporal
Grafico de linha ou area mostrando:
- page views por dia
- initiate checkout por dia
- purchase por dia quando existir

### 5.2 Funil
Bloco com:
- `PAGE_VIEW`
- `VIEW_CONTENT`
- `INITIATE_CHECKOUT`
- `PURCHASE`

Exibir:
- contagem absoluta
- percentual de queda entre etapas

### 5.3 Origem do trafego
Tabela/cartoes com:
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `referrer`
- contagem de visitas
- contagem de checkout
- taxa de checkout

### 5.4 Segmentacao
Tabela por:
- dispositivo
- navegador
- pais/regiao se houver

### 5.5 Eventos recentes
Lista dos ultimos eventos:
- horario
- pageKey
- eventType
- sessionId parcial
- utm_campaign
- referrer

## 6. UX esperada
- leitura rapida no topo
- detalhamento progressivo abaixo
- filtros persistidos na URL
- suporte a loading, empty state e erro
- layout responsivo desktop first

## 7. Perguntas que a tela precisa responder
- A landing esta recebendo trafego?
- O trafego e qualificado?
- Quem entra na pagina esta clicando em comprar?
- Qual campanha gera mais checkout?
- O problema esta em trafego, oferta ou checkout?

## 8. Consultas de negocio desejadas
- `Quais campanhas geraram mais INITIATE_CHECKOUT nos ultimos 7 dias?`
- `Qual e a taxa de checkout por source?`
- `Quanto do trafego e mobile?`
- `Ontem converteu melhor do que hoje?`
- `O volume cresceu, mas a taxa caiu?`

## 9. Evolucoes futuras previstas
- comparativo entre duas landing pages
- comparativo entre duas janelas de tempo
- export CSV
- alerta de queda de conversao
- ranking de campanhas
- funil por botao/CTA
- cruzamento com webhook de compra real

## 10. Criterios de aceite
- Um admin consegue abrir a tela e entender o funil da landing sem consultar Meta Ads.
- A tela filtra por periodo e reflete os numeros corretamente.
- A tela permite detectar campanha boa e campanha ruim.
