# SDD-SPA-01: Modelo de Dados

## 1. Objetivo
Persistir eventos da landing page e agregacoes futuras sem misturar esse dominio com `Post`, `Lead` ou analytics de outras verticais.

## 2. Estrategia
Criar tabelas dedicadas para analytics da pagina de vendas:
- tabela principal de evento bruto;
- tabela opcional de sessao agregada;
- tabela opcional de config por landing page.

No MVP, a tabela de evento bruto ja e suficiente para gerar dashboard e funil.

## 3. Enums propostos
```prisma
enum SalesPageEventType {
  PAGE_VIEW
  VIEW_CONTENT
  INITIATE_CHECKOUT
  LEAD
  PURCHASE
}

enum SalesPageDeviceType {
  DESKTOP
  MOBILE
  TABLET
  BOT
  UNKNOWN
}
```

## 4. Modelos Prisma propostos
```prisma
enum SalesPageEventType {
  PAGE_VIEW
  VIEW_CONTENT
  INITIATE_CHECKOUT
  LEAD
  PURCHASE
}

enum SalesPageDeviceType {
  DESKTOP
  MOBILE
  TABLET
  BOT
  UNKNOWN
}

model SalesPageEvent {
  id              String              @id @default(cuid())
  pageKey         String
  pagePath        String
  pageTitle       String?
  eventType       SalesPageEventType
  sessionId       String
  visitorId       String?
  source          String              @default("site")
  referrer        String?
  userAgent       String?
  ipHash          String?
  deviceType      SalesPageDeviceType @default(UNKNOWN)
  browser         String?
  os              String?
  country         String?
  region          String?
  city            String?
  utmSource       String?
  utmMedium       String?
  utmCampaign     String?
  utmTerm         String?
  utmContent      String?
  fbclid          String?
  metaEventName   String?
  checkoutUrl     String?
  currency        String?
  value           Float?
  orderId         String?
  metadataJson    String              @default("{}")
  occurredAt      DateTime            @default(now())
  createdAt       DateTime            @default(now())

  @@index([pageKey, occurredAt])
  @@index([eventType, occurredAt])
  @@index([sessionId])
  @@index([utmCampaign])
  @@index([pageKey, eventType, occurredAt])
}

model SalesPageSession {
  id                    String    @id @default(cuid())
  sessionId             String    @unique
  pageKey               String
  landingPath           String
  firstReferrer         String?
  firstUtmSource        String?
  firstUtmMedium        String?
  firstUtmCampaign      String?
  firstUtmTerm          String?
  firstUtmContent       String?
  firstFbclid           String?
  firstDeviceType       SalesPageDeviceType @default(UNKNOWN)
  firstUserAgent        String?
  visitorId             String?
  firstSeenAt           DateTime  @default(now())
  lastSeenAt            DateTime  @default(now())
  pageViewCount         Int       @default(0)
  viewContentCount      Int       @default(0)
  initiateCheckoutCount Int       @default(0)
  leadCount             Int       @default(0)
  purchaseCount         Int       @default(0)
  revenueTotal          Float     @default(0)
}

model SalesPageConfig {
  id                 String   @id @default(cuid())
  pageKey            String   @unique
  pagePath           String
  title              String
  isActive           Boolean  @default(true)
  trackPageView      Boolean  @default(true)
  trackViewContent   Boolean  @default(true)
  trackCheckout      Boolean  @default(true)
  trackLead          Boolean  @default(true)
  trackPurchase      Boolean  @default(true)
  notes              String?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}
```

## 5. Decisoes de modelagem
- `pageKey` permite reutilizar a vertical para varias landings.
  - Exemplo: `curso-fundamentos-ia`
- `pagePath` preserva a rota publica real.
- `sessionId` sera gerado no navegador e enviado em todos os eventos.
- `visitorId` fica opcional no MVP para evitar overengineering.
- `ipHash` e opcional e deve guardar hash, nunca IP bruto em texto puro.
- `metadataJson` permite anexar contexto especifico por evento.
- `SalesPageSession` e opcional para a primeira entrega, mas recomendado para consultas mais leves.

## 6. Campos derivados
- `uniqueVisitors`:
  - no MVP pode ser calculado por `COUNT(DISTINCT sessionId)` por periodo/pagina;
  - depois pode evoluir para `visitorId`.
- `checkoutCTR`:
  - `INITIATE_CHECKOUT / PAGE_VIEW`
- `viewToCheckoutRate`:
  - `INITIATE_CHECKOUT / VIEW_CONTENT`
- `purchaseRate`:
  - `PURCHASE / INITIATE_CHECKOUT`

## 7. Regras de consistencia
- `PAGE_VIEW` e `VIEW_CONTENT` podem coexistir na mesma sessao.
- `INITIATE_CHECKOUT` pode ocorrer mais de uma vez na mesma sessao; o dashboard deve mostrar:
  - volume bruto;
  - sessoes com checkout unico.
- `PURCHASE` deve aceitar `orderId` para deduplicacao futura.

## 8. Consideracoes de privacidade
- Nao salvar PII sensivel sem necessidade.
- Nao salvar IP puro no MVP.
- `userAgent` pode ser salvo porque ajuda troubleshooting e segmentacao.
- Geolocalizacao e opcional; se vier, deve ser aproximada.
