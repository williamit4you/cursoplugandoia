# SDD-001: General Stepper Architecture & Shared Components

## 1. Objective
Standardize the visual look, feel, and API interactions of all four video generation pipelines. Every routine will present a consistent 3-stage interface:
1. **Create/Config** (Configuration form)
2. **Stepper/Execution** (Progress tracker with logs)
3. **Posts/Analytics** (Calendar, social posts list, view counts, and click metrics)

---

## 2. Stepper Visual Layout
Every routine must render a vertical or horizontal stepper with the following states for each step:
* `PENDING`: Light gray dot, disabled text.
* `RUNNING`: Animated pulsing blue dot with a spinning loader.
* `SUCCESS`: solid emerald checkmark.
* `FAILED`: solid red X with an error message dropdown.
* `SKIPPED`: Yellow badge indicating the step was bypassed (e.g. no affiliate links needed).

### Reusable UI Components
All frontend routes must utilize the same Tailwind card patterns, fonts (Inter), and hover micro-animations to align with a premium SaaS appearance.

---

## 3. Generic Pipeline API Contract
Each video automation routine must support these endpoints:
* **List Endpoint**: `GET /api/[routine]/items`
  Returns items with pagination, filters, and current status.
* **Orchestrator Trigger**: `POST /api/[routine]/items/[id]/run`
  Starts or resumes the background execution of the item.
* **Logs Fetch**: `GET /api/[routine]/items/[id]/events`
  Returns chronological events for the item, filtered by stepName if needed.

---

## 4. UI Polish and Micro-Animations
* **Transitions**: Use `transition-all duration-300` on buttons, status badges, and table rows.
* **States**: Active steps should pulse using Tailwind's `animate-pulse` class.
* **Tooltips**: Display descriptive text when hovering over platform icons (Meta, YouTube, TikTok, LinkedIn) to explain publishing statuses and date-times.
