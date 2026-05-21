# SDD-006: Scrapings Stepper Component

## 1. Objective
Define the React layout for the scrapings stepper view, replacing the old unstructured tables with a visual, state-driven progress pipeline.

---

## 2. Layout & Interactions
* **Url Ingest Input**: Form field at the top to paste a product page link (Shopee / ML).
* **Pipeline Stepper Modal**: When scraping is triggered, open a modal with a step-by-step list:
  1. *Coleta de Mídias* (Scrapes product assets)
  2. *Escrita do Roteiro* (Generates script)
  3. *Geração de Áudio* (TTS Edge voice)
  4. *Renderização de Vídeo* (Compiles final clip)
* **Real-time Log terminal**: A CLI-like window showing live database events.
