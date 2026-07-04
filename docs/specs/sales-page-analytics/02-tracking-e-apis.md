# SDD-SPA-02: Tracking e APIs

## 1. Objetivo
Definir como os eventos serao disparados no frontend, persistidos no backend e lidos pelo dashboard admin sem afetar o Meta Pixel.

## 2. Arquitetura proposta
Uma acao na landing page gera dois fluxos independentes:

1. `Meta Pixel`
- continua usando `window.fbq(...)`
- serve para Meta Ads e Test Events

2. `Sales Analytics interno`
- envia `fetch` para API propria
- grava evento no banco
- alimenta dashboard admin

## 3. Regras de coexistencia com Meta Pixel
- O envio interno nao substitui `fbq`.
- Falha no envio interno nao bloqueia `fbq`.
- Falha no `fbq` nao bloqueia o envio interno.
- O clique no CTA deve continuar redirecionando mesmo se o tracking interno falhar.

## 4. Eventos do MVP

### `PAGE_VIEW`
Quando disparar:
- ao carregar a landing page
- em navegacoes client-side para a mesma pagina, se aplicavel

Payload minimo:
```json
{
  "pageKey": "curso-fundamentos-ia",
  "pagePath": "/curso-fundamentos-ia",
  "eventType": "PAGE_VIEW"
}
```

### `VIEW_CONTENT`
Quando disparar:
- quando a pagina do curso montar/carregar

Payload minimo:
```json
{
  "pageKey": "curso-fundamentos-ia",
  "pagePath": "/curso-fundamentos-ia",
  "eventType": "VIEW_CONTENT",
  "value": 19.9,
  "currency": "BRL"
}
```

### `INITIATE_CHECKOUT`
Quando disparar:
- imediatamente antes do redirect para Hotmart

Payload minimo:
```json
{
  "pageKey": "curso-fundamentos-ia",
  "pagePath": "/curso-fundamentos-ia",
  "eventType": "INITIATE_CHECKOUT",
  "checkoutUrl": "https://pay.hotmart.com/...",
  "value": 19.9,
  "currency": "BRL"
}
```

### `PURCHASE`
Quando disparar:
- fora do MVP basico
- pagina de obrigado ou webhook/retorno da Hotmart

## 5. Sessao no frontend
Criar um identificador leve por navegador:
- nome sugerido: `sales_page_session_id`
- persistencia sugerida: `localStorage`

Comportamento:
- se nao existir, gerar `crypto.randomUUID()`
- reutilizar em todos os eventos enviados pelo browser

## 6. UTMs e contexto
Extrair do `window.location.search` quando houver:
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_term`
- `utm_content`
- `fbclid`

Tambem capturar:
- `document.referrer`
- `navigator.userAgent`
- inferencia simples de device:
  - `mobile`
  - `tablet`
  - `desktop`

## 7. Biblioteca proposta
Arquivos sugeridos:
- `lib/salesAnalytics.ts`
- `components/SalesAnalyticsTracker.tsx`
- `lib/salesSession.ts`

Funcoes sugeridas:
```ts
trackSalesEvent(eventType, payload?)
trackSalesPageView(payload?)
trackSalesViewContent(payload?)
trackSalesInitiateCheckout(payload?)
trackSalesPurchase(payload?)
```

## 8. API de ingestao

### `POST /api/sales/events`
Objetivo:
- receber eventos da landing page
- normalizar payload
- gravar no banco

Request body sugerido:
```json
{
  "pageKey": "curso-fundamentos-ia",
  "pagePath": "/curso-fundamentos-ia",
  "eventType": "INITIATE_CHECKOUT",
  "sessionId": "uuid",
  "referrer": "https://instagram.com/...",
  "utmSource": "instagram",
  "utmMedium": "social",
  "utmCampaign": "lancamento-julho",
  "fbclid": "abc",
  "checkoutUrl": "https://pay.hotmart.com/...",
  "value": 19.9,
  "currency": "BRL",
  "metadata": {
    "buttonLabel": "Quero comprar agora"
  }
}
```

Response:
```json
{
  "ok": true
}
```

## 9. API de dashboard

### `GET /api/admin/sales-analytics/summary`
Objetivo:
- devolver KPIs principais por periodo e pageKey

Query params:
- `pageKey`
- `from`
- `to`

Resposta sugerida:
```json
{
  "pageViews": 1200,
  "uniqueVisitors": 910,
  "viewContents": 1170,
  "initiateCheckouts": 82,
  "purchases": 0,
  "checkoutCtr": 6.83,
  "viewToCheckoutRate": 7.01
}
```

### `GET /api/admin/sales-analytics/timeseries`
Objetivo:
- devolver serie por dia ou hora

### `GET /api/admin/sales-analytics/sources`
Objetivo:
- agrupar por UTM/referrer

### `GET /api/admin/sales-analytics/funnel`
Objetivo:
- devolver contagem por etapa e taxas

### `GET /api/admin/sales-analytics/events`
Objetivo:
- listar eventos recentes para troubleshooting

## 10. Resiliencia
- `sendBeacon` pode ser considerado para `INITIATE_CHECKOUT`, mas nao e obrigatorio no MVP.
- Se `sendBeacon` nao for usado, `fetch(..., { keepalive: true })` e preferivel para eventos de saida.
- Em ultimo caso, usar timeout curto e nunca travar redirect.

## 11. Validacoes backend
- `pageKey` obrigatorio
- `pagePath` obrigatorio
- `eventType` obrigatorio e restrito ao enum
- `sessionId` obrigatorio
- limitar tamanho de `userAgent`, `referrer` e `metadataJson`
- normalizar strings vazias para `null`

## 12. Criterios tecnicos de aceite
- Eventos internos sao registrados mesmo com Meta Pixel ativo.
- O clique do CTA nao perde redirect por causa do tracking.
- O payload salvo inclui UTM e referrer quando disponiveis.
- A API aceita crescimento para novas landing pages.
