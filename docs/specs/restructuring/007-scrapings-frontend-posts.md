# SDD-007: Scrapings Posts & Click Analytics View

## 1. Objective
Define the interface to list scheduled/published social posts derived from product scraping. Displays platform destinations, posted date-times, views, and clicks.

---

## 2. Interface Features
* **Post List Table**:
  * Displays: Cover image, Post description preview, Creation date.
  * Status badges: `DRAFT`, `SCHEDULED`, `POSTED`, `FAILED`.
  * Redirection shortlink: `https://plugandoia.cloud/p/[id]` with a click-to-copy button.
* **Redirection Click Metrics**:
  * Displays `clicksCount` count alongside total views.
  * Interactive tooltips explaining click rate (Clicks / Views).
