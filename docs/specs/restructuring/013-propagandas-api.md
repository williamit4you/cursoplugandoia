# SDD-013: Criar Propaganda API Specification

## 1. Objective
Define the API routes to start, pause, and configure advertisement pipelines.

---

## 2. API Routes
* `POST /api/propagandas/projects/[id]/run`
  Starts the ad workflow:
  1. Triggers OpenAI to compose a persuasive product ad copy.
  2. Synthesizes ad audio via Edge-TTS.
  3. Executes Remotion templates with custom background overlays.
* `GET /api/propagandas/projects/[id]/events`
  Fetches running events for real-time log display.
