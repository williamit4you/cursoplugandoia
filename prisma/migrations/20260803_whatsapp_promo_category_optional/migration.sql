-- Category is an optional organizational label. Existing offers with a price
-- and affiliate link should become publishable even when that label is absent.
UPDATE "WhatsappPromoCatalogItem"
SET "readyForPublish" = TRUE
WHERE "active" = TRUE
  AND "affiliateUrl" <> ''
  AND "currentPrice" IS NOT NULL;
