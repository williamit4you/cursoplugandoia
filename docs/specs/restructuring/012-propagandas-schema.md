# SDD-012: Criar Propaganda Schema Specification

## 1. Objective
Define the database schema logic for product advertisements.

---

## 2. Model Reuse
Propagandas are stored inside the `CodeVideoProject` table where `projectType` is set to `"PRODUCT_AD"`.
All logging tables (`CodeVideoPipelineStep` and `CodeVideoPipelineEvent`) are shared, making it lightweight and preventing database bloat. No further changes to `schema.prisma` are necessary for this module.
