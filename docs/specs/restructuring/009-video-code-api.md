# SDD-009: Vídeo com Código API Specification

## 1. Objective
Define API routes to trigger video-code generation pipelines and fetch execution steps.

---

## 2. API Routes
* `POST /api/video-code/projects/[id]/run`
  Starts the code video orchestrator:
  1. Updates project state to `GENERATING` / `RENDERING`.
  2. Runs LLM code/script generation step.
  3. Invokes Edge-TTS audio step.
  4. Generates Remotion rendering tasks.
* `GET /api/video-code/projects/[id]/events`
  Fetches running events from `CodeVideoPipelineEvent` for visual stepper updates.
