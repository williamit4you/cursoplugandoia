# SDD-017: Perguntas cria Vídeos API Specification

## 1. Objective
Define API routes to trigger Q&A pipelines and retrieve execution progress logs.

---

## 2. API Routes
* `POST /api/video-questions/[id]/run`
  Starts the Q&A workflow:
  1. Calls LLM to explain the question in an informative, structured voice script.
  2. Generates TTS audio.
  3. Compiles final output using dynamic subtitles and background overlays.
* `GET /api/video-questions/[id]/events`
  Fetches running events for real-time progress display.
