# SDD-005: Scrapings API Specification

## 1. Objective
Define the API routes to start, pause, configure, and retrieve logs for the scrapings pipeline.

---

## 2. API Routes
* `GET /api/scrapers/items`
  Returns all scraped affiliate picks from both Shopee and Mercado Livre.
  * *Parameters*: `platform` (SHopee | MercadoLivre), `status` (PENDING, COMPLETED, FAILED), `page`, `limit`.
* `POST /api/scrapers/items/[id]/run`
  Manually triggers the background video generation worker for the specified pick.
  * *Steps Run*: Media scrape -> AI narrative script -> Audio synthesis -> Video compilation.
* `GET /api/scrapers/items/[id]/events`
  Retrieves chronological execution logs from `ShopeePipelineEvent` for the item.
