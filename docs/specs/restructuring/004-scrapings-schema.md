# SDD-004: Scrapings (ML / Shopee) Schema Alignment

## 1. Objective
Align Shopee and Mercado Livre configuration schemas. Both scraping sources need to generate automated videos and track their steps identically under a single unified pipeline engine.

---

## 2. Database Models
We rely on the existing models:
* `ColetaDadosShoppe` (used for both Shopee and Mercado Livre via `pipelineKind` enum).
* `ShopeePipelineStep` and `ShopeePipelineEvent`.

### Proposed DB Changes
To unify tracking, ensure `MercadoLivreAffiliatePick` has standard fields mapping to pipeline steps:
```prisma
model MercadoLivreAffiliatePick {
  id                  String             @id @default(cuid())
  // Existing fields...
  pipelineStatus      ShopeePipelineStatus @default(PENDING)
  videoStatus         String?            // RENDERING | COMPLETED | FAILED
  attemptCount        Int                @default(0)
  lastError           String?
  // Media outputs
  audioUrl            String?
  copyVideoUrl        String?
  videoFinalUrl       String?
}
```
This aligns Mercado Livre directly with the Shopee model variables.
