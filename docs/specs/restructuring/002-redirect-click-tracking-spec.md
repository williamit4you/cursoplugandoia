# SDD-002: Redirect & Click Tracking Specification

## 1. Objective
Implement a centralized redirection system `/p/[socialPostId]` to log every click from social media (YouTube comments, Link in Bio, TikTok description, LinkedIn articles) and redirect users to affiliate or product landing pages.

---

## 2. Database Schema
Add the following Prisma models and relations to `prisma/schema.prisma`:

```prisma
model SocialPost {
  id              String             @id @default(cuid())
  // existing fields...
  clicksCount     Int                @default(0)
  clicks          SocialPostClick[]
}

model SocialPostClick {
  id           String     @id @default(cuid())
  socialPostId String
  socialPost   SocialPost @relation(fields: [socialPostId], references: [id], onDelete: Cascade)
  platform     String     // e.g. "YOUTUBE", "TIKTOK", "LINKEDIN", "META"
  referrer     String?
  userAgent    String?
  ipHash       String?    // SHA-256 hash of client IP
  createdAt    DateTime   @default(now())

  @@index([socialPostId])
  @@index([createdAt])
}
```

---

## 3. Redirect Route Handler: `app/p/[id]/route.ts`
Implement the Next.js Route Handler to intercept traffic and log metrics:
1. **Parameter Resolution**: Fetch `SocialPost` by `id`. If missing, return a 404 page.
2. **Hash Client IP**:
   ```typescript
   const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
   const ipHash = crypto.createHash("sha256").update(ip).digest("hex");
   ```
3. **Register Click**: Create a `SocialPostClick` record and increment `clicksCount` inside `SocialPost`.
4. **Resolve Destination**:
   * Inspect `SocialPost.codeVideoProject` or related `ColetaDadosShoppe` for `affiliateUrl` or `productUrl`.
   * If found, perform an HTTP 302 redirect.
   * If empty, redirect to a public viewer page `/p/[id]/view` rendering a clean layout of the video.
