ALTER TABLE "SalesPageConfig"
ADD COLUMN "metaPixelId" TEXT;

INSERT INTO "SalesPageConfig" (
  "id",
  "pageKey",
  "pagePath",
  "title",
  "metaPixelId",
  "isActive",
  "trackPageView",
  "trackViewContent",
  "trackCheckout",
  "trackLead",
  "trackPurchase",
  "createdAt",
  "updatedAt"
)
SELECT
  'sales-page-config-curso-fundamentos-ia',
  'curso-fundamentos-ia',
  '/curso-fundamentos-ia',
  'Plugando IA | Arquitetando o Futuro com LLMs e RAG',
  '2221646568647297',
  true,
  true,
  true,
  true,
  true,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "SalesPageConfig" WHERE "pageKey" = 'curso-fundamentos-ia'
);

UPDATE "SalesPageConfig"
SET
  "metaPixelId" = COALESCE("metaPixelId", '2221646568647297'),
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "pageKey" = 'curso-fundamentos-ia';
