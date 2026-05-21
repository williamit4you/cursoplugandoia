# SDD-003: Unified Pipeline Logging & Stepper Events

## 1. Objective
Ensure every background action (script generation, voice TTS rendering, video compilation, social upload) writes real-time progress events. This allows users to view step-by-step logs and durations.

---

## 2. Shared Logging Models
Each routine uses its respective pipeline logging mechanism, but all follow this DB schema:
* `level`: `DEBUG` | `INFO` | `WARN` | `ERROR` | `SUCCESS`
* `stepName`: Name of the executed phase (e.g. `GENERATE_AUDIO`, `MERGE_VIDEOS`)
* `message`: Human-readable log sentence (e.g., "Narrativa gerada por IA com 452 tokens")
* `metadata`: JSON payload containing token cost, Pexels API response, or upload parameters

---

## 3. Real-Time Fetch API: `/api/[routine]/items/[id]/events`
* **Method**: `GET`
* **Query Parameters**:
  * `stepName` (optional): Filter events for a single stepper phase.
  * `take` (default: 50): Number of recent log events to return.
* **Response**:
  ```json
  [
    {
      "id": "evt_123",
      "stepName": "GENERATE_AUDIO",
      "level": "INFO",
      "message": "Enviando texto para a Edge-TTS (pt-BR-AntonioNeural)",
      "createdAt": "2026-05-21T12:00:00.000Z"
    }
  ]
  ```
* **Frontend Polling**: The frontend Stepper modal polls this endpoint every 2 seconds when status is `RUNNING` or `RENDERING`.
