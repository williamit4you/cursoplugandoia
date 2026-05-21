# Master Checkpoints & Integration Plan (SDD-020)

This document establishes the strict order of implementation and checkpoints. Any AI coding assistant working on this repository MUST verify and check off each step before proceeding to the next one.

---

## 1. Master Checkpoints

### 🏁 Phase 0: Core Architecture & Tracking
- [ ] **Checkpoint 0.1**: Schema Migration (Prisma models for logging & clicks created).
  * *Verification*: Run `npx prisma db push` or `npx prisma migrate dev` and verify no schema conflict.
- [ ] **Checkpoint 0.2**: Redirection endpoint (`/p/[id]`) fully functional.
  * *Verification*: Query `/p/non-existing-id` and verify it returns a clean 404. Log fake post click and check DB inserts.

### 🏁 Phase 1: Scrapings (ML / Shopee) Unification
- [ ] **Checkpoint 1.1**: Align ML configs in DB and setup backend endpoints (`/api/scrapers/items`).
- [ ] **Checkpoint 1.2**: Replace old scrapings table with the visual progress Stepper.
- [ ] **Checkpoint 1.3**: Deploy the Posts & Click Analytics calendar tab.
  * *Verification*: Trigger a manual scrape, watch the progress steps go green, click the bio shortlink and confirm clicks log correctly.

### 🏁 Phase 2: Vídeo com Código
- [ ] **Checkpoint 2.1**: Extended DB Schema migrated for Code Video project steps.
- [ ] **Checkpoint 2.2**: Backend endpoints integrated for steps logging.
- [ ] **Checkpoint 2.3**: Stepper frontend UI activated on manual generator.
- [ ] **Checkpoint 2.4**: Posts calendar tab active.
  * *Verification*: Generate a video-code item, track the stepper rendering steps, and confirm the shortlink redirects as intended.

### 🏁 Phase 3: Criar Propaganda
- [ ] **Checkpoint 3.1**: Stepper endpoint routing active.
- [ ] **Checkpoint 3.2**: Stepper UI replaces old page components.
- [ ] **Checkpoint 3.3**: Posts calendar tab active.
  * *Verification*: Generate an ad script, render it, and verify the SocialPost lists and tracks CTA redirects.

### 🏁 Phase 4: Perguntas cria Vídeos
- [ ] **Checkpoint 4.1**: DB Schema migrated for Q&A steps.
- [ ] **Checkpoint 4.2**: Logging API integrated.
- [ ] **Checkpoint 4.3**: Stepper frontend UI deployed.
- [ ] **Checkpoint 4.4**: Posts calendar tab active.
  * *Verification*: Input a question, run background worker, verify dynamic progress overlays, and check platform share logs.

---

## 2. Platform Verification & Testing Commands

To prevent regressions, the developer must run the following checks at each checkpoint:
1. **TypeScript validation**:
   ```bash
   npx tsc --noEmit
   ```
2. **Next.js Production Compilation**:
   ```bash
   npm run build
   ```
3. **Database Health**:
   ```bash
   npx prisma validate
   ```
