# Master Design: Video Automation Platforms Unification & Click Tracking

This document outlines the architecture and design decisions for standardizing the 4 video automation routines under the `shopee-pipeline` UX/process pattern, and implementing a unified social post redirection and click-tracking module.

---

## 1. Technical Context & Approach (Approach A)

We are standardizing four separate pipelines:
1. **Scrapings (ML / Shopee)**
2. **Vídeo com código (Code-to-Video)**
3. **Criar propaganda (Product Ads)**
4. **Perguntas cria vídeos (Q&A-to-Video)**

To preserve database stability and ensure zero regression bugs on existing workers, we will use **Approach A: UX/UI Padronizada com Tabelas Isoladas**. We maintain separate Prisma models but unify their API contracts, stepper UI wrappers, and logging endpoints.

---

## 2. Redirection & Click Tracking Architecture

We will implement a unified click-tracking endpoint to log user engagement when clicking links published on YouTube, TikTok, LinkedIn, or Meta.

### Database Schema Updates
We will add a new model `SocialPostClick` and update `SocialPost` to log clicks:

```prisma
model SocialPost {
  // Existing fields ...
  clicksCount Int @default(0)
  clicks      SocialPostClick[]
}

model SocialPostClick {
  id           String     @id @default(cuid())
  socialPostId String
  socialPost   SocialPost @relation(fields: [socialPostId], references: [id], onDelete: Cascade)
  platform     String     // e.g., "YOUTUBE", "TIKTOK", "LINKEDIN", "META"
  referrer     String?
  userAgent    String?
  ipHash       String?    // SHA-256 hash of visitor IP for rate-limiting & analytics
  createdAt    DateTime   @default(now())

  @@index([socialPostId])
  @@index([createdAt])
}
```

### Redirect Request Flow
1. We generate a redirection link: `https://plugandoia.cloud/p/[socialPostId]`.
2. When visited, Next.js handles the route `/p/[id]/route.ts`:
   * Resolves the `SocialPost`.
   * Logs a click inside `SocialPostClick`.
   * Increments `SocialPost.clicksCount` atomically.
   * Determines redirection target:
     * If parent project contains `affiliateUrl`, `productUrl`, or a custom URL $\rightarrow$ Redirects 302 to destination.
     * Otherwise $\rightarrow$ Redirects to a public viewer page `/p/[id]/view` showing the video player and narration.

---

## 3. Shared Stepper & Logger Integration

Each video routine will expose a common set of pipeline endpoints:
1. `GET /api/[routine]/items` -> Query list of items with current pipeline statuses.
2. `POST /api/[routine]/items/[id]/run` -> Trigger manual execution of the routine's pipeline in background.
3. `GET /api/[routine]/items/[id]/events` -> Stream/Query step-by-step logs (`PipelineEvent` style).

Each routine's stepper UI will consume a reusable React stepper component (`TimelineStepper`) with identical styles, progress animations, and real-time polling logs.

---

## 4. Documentation Strategy

To implement this restructuring safely, we will create a dedicated spec directory `docs/specs/restructuring/` containing 20 granular specification documents (SDDs) divided into:
* General specs (Architecture, Redirection, Logging)
* Modules specs (Scrapings, Code Video, Propagandas, Questions)
* A master `checkpoints.md` file tracking the completion of each step.
