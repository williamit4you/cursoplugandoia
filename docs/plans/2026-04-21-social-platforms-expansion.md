# Social Platforms Expansion — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expandir o pipeline de publicação social adicionando: Stories reais de 24h (Instagram/Facebook), integração TikTok, integração LinkedIn, imagem de capa automática via Pexels nos Posts, e botão de publicação no LinkedIn e no Site diretamente na tela de Posts.

**Architecture:**
- O botão "Publicar" atual na tela social → publica como **Reels** (comportamento atual, já funcionando — renomear label para "📹 Reels").
- Novo botão "📸 Story 24h" → publica via endpoint dedicado usando `media_type: "STORIES"`.
- Novo botão "🎵 TikTok" → publica via TikTok Content Posting API.
- TikTok e LinkedIn ganham abas em `IntegrationSettings` (DB) e endpoints próprios.
- Cover image dos Posts: ao publicar um Post, busca imagem no Pexels e salva em MinIO → `Post.coverImage`.
- Flags de auto-publicação em `ScraperConfig` (autoPublishReels, autoPublishStory, autoPublishTikTok, autoPublishLinkedIn).

**Tech Stack:** Next.js 14 (App Router), Prisma + PostgreSQL, Meta Graph API v19, TikTok Content Publishing API v2, LinkedIn UGC Posts API, Pexels API, MinIO/S3.

---

## Contexto atual (não alterar o que funciona)

- `app/(admin)/admin/social/page.tsx` — fila de vídeos (atualmente publica como Reels Meta)
- `app/api/social/publish/route.ts` — publica como `REELS` via container Meta
- `lib/metaGraph.ts` — funções de interação com Meta Graph API
- `prisma/schema.prisma` → `SocialPost.platform` (default `"META"`)
- `app/(admin)/admin/integrations/page.tsx` — configurações META + N8N existentes

---

## Plano de Implementação

---

### Task 1 — Schema: novos campos no banco

**Objetivo:** Preparar o banco para suportar tipo de publicação (REEL vs STORY) e flags de auto-publicação.

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Adicionar campo `postType` em `SocialPost`**

```prisma
// Em model SocialPost, adicionar após `platform`:
postType    String   @default("REEL") // REEL | STORY
```

**Step 2: Adicionar flags de auto-publicação em `ScraperConfig`**

```prisma
// Em model ScraperConfig, adicionar ao final do bloco de campos:
autoPublishReels    Boolean  @default(false)
autoPublishStory    Boolean  @default(false)
autoPublishTikTok   Boolean  @default(false)
autoPublishLinkedIn Boolean  @default(false)
```

> Nota: `TIKTOK` e `LINKEDIN` são adicionados como registros em `IntegrationSettings` usando colunas já existentes (`apiKey`, `apiSecret`, `accessToken`, `pageId`, `instagramId`) — sem adicionar colunas novas.

**Step 3: Gerar e aplicar migração**

```bash
cd c:\dev\cursoplugandoia
npx prisma migrate dev --name add_post_type_and_auto_publish_flags
```

Expected: arquivo em `prisma/migrations/` gerado, banco atualizado.

**Step 4: Commit**

```bash
git add prisma/
git commit -m "feat(db): add postType to SocialPost and auto-publish flags to ScraperConfig"
```

---

### Task 2 — Integração TikTok e LinkedIn nas Configurações

**Objetivo:** Adicionar seções TikTok e LinkedIn na página `/admin/integrations`.

**Files:**
- Modify: `app/(admin)/admin/integrations/page.tsx`

**Step 1: Adicionar states TikTok**

```typescript
const [tiktokClientKey, setTiktokClientKey] = useState("");
const [tiktokClientSecret, setTiktokClientSecret] = useState("");
const [tiktokAccessToken, setTiktokAccessToken] = useState("");
const [tiktokActive, setTiktokActive] = useState(false);
```

**Step 2: Adicionar states LinkedIn**

```typescript
const [linkedinToken, setLinkedinToken] = useState("");
const [linkedinPersonUrn, setLinkedinPersonUrn] = useState(""); // urn:li:person:xxx
const [linkedinOrgUrn, setLinkedinOrgUrn] = useState("");       // urn:li:organization:xxx
const [linkedinActive, setLinkedinActive] = useState(false);
```

**Step 3: Carregar dados no `useEffect` existente**

```typescript
const tiktok = data.find((d: any) => d.platform === "TIKTOK");
if (tiktok) {
  setTiktokClientKey(tiktok.apiKey || "");
  setTiktokClientSecret(tiktok.apiSecret || "");
  setTiktokAccessToken(tiktok.accessToken || "");
  setTiktokActive(tiktok.isActive);
}
const linkedin = data.find((d: any) => d.platform === "LINKEDIN");
if (linkedin) {
  setLinkedinToken(linkedin.accessToken || "");
  setLinkedinPersonUrn(linkedin.instagramId || ""); // reutiliza campo instagramId
  setLinkedinOrgUrn(linkedin.pageId || "");         // reutiliza campo pageId
  setLinkedinActive(linkedin.isActive);
}
```

**Step 4: Handlers de save**

```typescript
const handleSaveTikTok = async () => {
  setSaving(true);
  const res = await fetch("/api/integrations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      platform: "TIKTOK",
      apiKey: tiktokClientKey,
      apiSecret: tiktokClientSecret,
      accessToken: tiktokAccessToken,
      isActive: tiktokActive,
    }),
  });
  if (!res.ok) setMsg({ type: "error", text: "Erro ao salvar TikTok." });
  else setMsg({ type: "success", text: "TikTok configurado!" });
  setSaving(false);
};

const handleSaveLinkedIn = async () => {
  setSaving(true);
  const res = await fetch("/api/integrations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      platform: "LINKEDIN",
      accessToken: linkedinToken,
      instagramId: linkedinPersonUrn,
      pageId: linkedinOrgUrn,
      isActive: linkedinActive,
    }),
  });
  if (!res.ok) setMsg({ type: "error", text: "Erro ao salvar LinkedIn." });
  else setMsg({ type: "success", text: "LinkedIn configurado!" });
  setSaving(false);
};
```

**Step 5: Adicionar dois `<Paper>` novos no JSX**

— TikTok: Client Key, Client Secret (password), Access Token (multiline), switch Ativo, botão Salvar, tip com link developer.tiktok.com  
— LinkedIn: Access Token (multiline), Person URN, Organization URN (opcional), switch Ativo, botão Salvar, tip com link developers.linkedin.com

**Step 6: Commit**

```bash
git add "app/(admin)/admin/integrations/page.tsx"
git commit -m "feat(ui): add TikTok and LinkedIn configuration sections"
```

---

### Task 3 — API: publicar Instagram/Facebook Story 24h

**Objetivo:** Criar endpoint `POST /api/social/publish-story` que usa `media_type: "STORIES"`.

**Files:**
- Modify: `lib/metaGraph.ts`
- Create: `app/api/social/publish-story/route.ts`

**Step 1: Adicionar funções em `lib/metaGraph.ts`**

```typescript
/** Cria container para Story de 24h no Instagram */
export async function createInstagramStoryContainer(
  videoUrl: string,
  instagramId: string,
  accessToken: string
): Promise<string> {
  const res = await fetch(`https://graph.facebook.com/v19.0/${instagramId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      media_type: "STORIES",
      video_url: videoUrl,
      access_token: accessToken,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "Erro criando Story IG");
  return data.id;
}

/** Publica Story de 24h na Página do Facebook */
export async function publishFacebookStory24h(
  videoUrl: string,
  pageId: string,
  accessToken: string
): Promise<string> {
  const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/video_stories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      file_url: videoUrl,
      upload_phase: "finish",
      access_token: accessToken,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "Erro Story Facebook");
  return data.video_id || data.id;
}
```

**Step 2: Criar `app/api/social/publish-story/route.ts`**

Espelhar a lógica de `publish/route.ts` mas:
- Fase 1: usa `createInstagramStoryContainer` + atualiza `postType: "STORY"`
- Fase 2: usa `checkAndPublishInstagramContainer` + `publishFacebookStory24h`

**Step 3: Commit**

```bash
git add lib/metaGraph.ts "app/api/social/publish-story/"
git commit -m "feat(api): Instagram/Facebook Story 24h publish endpoint"
```

---

### Task 4 — API: publicar no TikTok

**Files:**
- Create: `lib/tiktokApi.ts`
- Create: `app/api/social/publish-tiktok/route.ts`

**Step 1: `lib/tiktokApi.ts`**

```typescript
/**
 * TikTok Content Posting API v2 — Direct Post via URL pull
 * Docs: https://developers.tiktok.com/doc/content-posting-api-reference-direct-post
 */
export async function publishTikTokVideo(
  videoUrl: string,
  title: string,
  accessToken: string
): Promise<string> {
  const res = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      post_info: {
        title,
        privacy_level: "PUBLIC_TO_EVERYONE",
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
        video_cover_timestamp_ms: 1000,
      },
      source_info: {
        source: "PULL_FROM_URL",
        video_url: videoUrl,
      },
    }),
  });
  const data = await res.json();
  if (data.error?.code && data.error.code !== "ok")
    throw new Error(`TikTok: ${data.error.message}`);
  return data.data?.publish_id || "pending";
}
```

**Step 2: `app/api/social/publish-tiktok/route.ts`**

- Busca `socialPost` e settings `TIKTOK`
- Chama `publishTikTokVideo(socialPost.videoUrl, title, accessToken)`
- Append log, retorna `{ success: true, publishId }`

**Step 3: Commit**

```bash
git add lib/tiktokApi.ts "app/api/social/publish-tiktok/"
git commit -m "feat(api): TikTok video publish endpoint"
```

---

### Task 5 — API: publicar no LinkedIn

**Files:**
- Create: `lib/linkedinApi.ts`
- Create: `app/api/social/publish-linkedin/route.ts`

**Step 1: `lib/linkedinApi.ts`**

```typescript
/**
 * LinkedIn UGC Posts API
 * Docs: https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/ugc-post-api
 */
export async function publishLinkedInPost(params: {
  text: string;
  title: string;
  imageUrl?: string;
  accessToken: string;
  personUrn: string;   // urn:li:person:ABC
  orgUrn?: string;     // urn:li:organization:123 (opcional)
}): Promise<string> {
  const authorUrn = params.orgUrn || params.personUrn;

  const body: any = {
    author: authorUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: params.text },
        shareMediaCategory: params.imageUrl ? "IMAGE" : "NONE",
        ...(params.imageUrl
          ? {
              media: [{
                status: "READY",
                description: { text: params.title },
                media: params.imageUrl,
                title: { text: params.title },
              }],
            }
          : {}),
      },
    },
    visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
  };

  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.accessToken}`,
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`LinkedIn: ${data.message || JSON.stringify(data)}`);
  return data.id;
}
```

**Step 2: `app/api/social/publish-linkedin/route.ts`**

- Busca `socialPost` incluindo `post { title, coverImage, slug }`
- Busca settings `LINKEDIN`
- Monta URL do artigo: `${NEXT_PUBLIC_SITE_URL}/noticias/${post.slug}`
- Chama `publishLinkedInPost`
- Append log, retorna resultado

**Step 3: Commit**

```bash
git add lib/linkedinApi.ts "app/api/social/publish-linkedin/"
git commit -m "feat(api): LinkedIn post publish endpoint"
```

---

### Task 6 — UI: botões na tela de Stories (Social Dashboard)

**Files:**
- Modify: `app/(admin)/admin/social/page.tsx`

**Mudanças:**
1. Renomear botão "🚀 Publicar" → "📹 Reels (Meta)" para clareza
2. Adicionar handler `handlePublishStory(id)` → chama `/api/social/publish-story`
3. Adicionar handler `handlePublishTikTok(id)` → chama `/api/social/publish-tiktok`
4. No JSX, na coluna de ações de cada card, adicionar 2 novos botões:

```tsx
{/* Novo: Story 24h */}
{!isProcessing && p.status !== "POSTED" && (
  <button onClick={() => handlePublishStory(p.id)} disabled={loadingId === p.id + "-story"}
    style={{ padding:"8px 14px", borderRadius:8, border:"1px solid #7c3aed",
             background:"white", color:"#7c3aed", fontWeight:700, fontSize:12, cursor:"pointer" }}>
    {loadingId === p.id + "-story" ? "⏳..." : "📸 Story 24h"}
  </button>
)}

{/* Novo: TikTok */}
{!isProcessing && (
  <button onClick={() => handlePublishTikTok(p.id)} disabled={loadingId === p.id + "-tiktok"}
    style={{ padding:"8px 14px", borderRadius:8, border:"none",
             background:"#010101", color:"white", fontWeight:700, fontSize:12, cursor:"pointer" }}>
    {loadingId === p.id + "-tiktok" ? "⏳..." : "🎵 TikTok"}
  </button>
)}
```

**Commit:**

```bash
git add "app/(admin)/admin/social/page.tsx"
git commit -m "feat(ui): add Story 24h and TikTok buttons in social queue"
```

---

### Task 7 — Imagem de capa automática via Pexels

**Files:**
- Create: `lib/pexelsImage.ts`
- Create: `app/api/posts/[id]/fetch-cover/route.ts`
- Modify: `worker/scraper.py`

**Step 1: `lib/pexelsImage.ts`**

```typescript
import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "@/lib/s3";

export async function fetchAndStorePexelsImage(
  query: string,
  bucket: string = process.env.MINIO_BUCKET_NAME || "news-images"
): Promise<string | null> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
      { headers: { Authorization: key } }
    );
    const data = await res.json();
    const photo = data.photos?.[0];
    if (!photo) return null;

    const imgRes = await fetch(photo.src.large2x || photo.src.original);
    const buf = Buffer.from(await imgRes.arrayBuffer());
    const objKey = `post-covers/${Date.now()}-${photo.id}.jpg`;

    await s3Client.send(new PutObjectCommand({
      Bucket: bucket, Key: objKey, Body: buf,
      ContentType: "image/jpeg", ACL: "public-read",
    }));

    const pub = process.env.MINIO_PUBLIC_ENDPOINT || process.env.MINIO_ENDPOINT;
    return `${pub}/${bucket}/${objKey}`;
  } catch (e) {
    console.error("Pexels error:", e);
    return null;
  }
}
```

**Step 2: `app/api/posts/[id]/fetch-cover/route.ts`**

```typescript
// POST — busca imagem do Pexels pelo título do Post e salva coverImage
export async function POST(req, { params }) {
  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const imageUrl = await fetchAndStorePexelsImage(post.title);
  if (!imageUrl) return NextResponse.json({ error: "Pexels indisponível" }, { status: 500 });
  await prisma.post.update({ where: { id: params.id }, data: { coverImage: imageUrl } });
  return NextResponse.json({ coverImage: imageUrl });
}
```

**Step 3: Worker**

Em `worker/scraper.py`, na função de criação de Post, após salvar no banco, se `coverImage` estiver vazio e `pexels_enabled` for true, chamar endpoint interno:

```python
def fetch_pexels_cover_for_article(post_id: str, next_url: str) -> None:
    try:
        requests.post(f"{next_url}/api/posts/{post_id}/fetch-cover", timeout=15)
    except Exception as e:
        print(f"[PEXELS-COVER] {e}")
```

**Commit:**

```bash
git add lib/pexelsImage.ts "app/api/posts/" worker/scraper.py
git commit -m "feat: Pexels auto cover image for posts"
```

---

### Task 8 — UI: botões Site e LinkedIn na tela de Posts

**Files:**
- Modify: `components/PostsTable.tsx`
- Create: `app/api/posts/[id]/publish/route.ts`
- Create: `app/api/posts/[id]/social-post/route.ts`

**Step 1: `app/api/posts/[id]/publish/route.ts`**

```typescript
// POST — muda Post.status para "PUBLISHED"
export async function POST(req, { params }) {
  await prisma.post.update({ where: { id: params.id }, data: { status: "PUBLISHED" } });
  return NextResponse.json({ success: true });
}
```

**Step 2: `app/api/posts/[id]/social-post/route.ts`**

```typescript
// GET — retorna o socialPostId mais recente do Post
export async function GET(req, { params }) {
  const sp = await prisma.socialPost.findFirst({
    where: { postId: params.id },
    orderBy: { createdAt: "desc" },
  });
  if (!sp) return NextResponse.json({ error: "Sem SocialPost" }, { status: 404 });
  return NextResponse.json({ socialPostId: sp.id });
}
```

**Step 3: Refatorar `PostsTable.tsx`**

Transformar em `"use client"` com handlers:
- `handlePublish(id)` → `POST /api/posts/:id/publish`
- `handleLinkedIn(id)` → `GET /api/posts/:id/social-post` → `POST /api/social/publish-linkedin`
- `handleFetchCover(id)` → `POST /api/posts/:id/fetch-cover`
- Exibir thumbnail se `coverImage` existir; caso contrário, botão "🖼️ Pexels"
- Botão "🌐 Site" (verde) — só se status ≠ PUBLISHED
- Botão "💼 LinkedIn" (azul LinkedIn #0A66C2)

**Commit:**

```bash
git add components/PostsTable.tsx "app/api/posts/"
git commit -m "feat(ui): Site publish and LinkedIn buttons in PostsTable"
```

---

### Task 9 — Card de Publicação Automática no ScraperConfig

**Files:**
- Modify: `app/(admin)/admin/scraper-config/page.tsx`

**Step 1: Atualizar tipo `ScraperConfig`**

```typescript
type ScraperConfig = {
  // ...campos existentes...
  autoPublishReels: boolean;
  autoPublishStory: boolean;
  autoPublishTikTok: boolean;
  autoPublishLinkedIn: boolean;
};
```

**Step 2: Atualizar `DEFAULT_CONFIG`**

```typescript
const DEFAULT_CONFIG: ScraperConfig = {
  // ...existentes...
  autoPublishReels: false,
  autoPublishStory: false,
  autoPublishTikTok: false,
  autoPublishLinkedIn: false,
};
```

**Step 3: Adicionar card "📡 Publicação Automática" antes do Card de histórico**

```tsx
<div className="cfg-card">
  <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>📡 Publicação Automática</h3>
  <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
    Plataformas onde os vídeos gerados serão publicados automaticamente.
  </p>
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
    {[
      { key: "autoPublishReels", label: "📹 Instagram/FB Reels", desc: "Reel permanente" },
      { key: "autoPublishStory", label: "📸 Instagram/FB Story", desc: "Dura 24 horas" },
      { key: "autoPublishTikTok", label: "🎵 TikTok", desc: "Publicação no TikTok" },
      { key: "autoPublishLinkedIn", label: "💼 LinkedIn", desc: "Post de texto + link" },
    ].map(({ key, label, desc }) => (
      <label key={key} style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px",
        border: `2px solid ${config[key as keyof ScraperConfig] ? "#6366f1" : "#e5e7eb"}`,
        borderRadius: 10, cursor: "pointer",
        background: config[key as keyof ScraperConfig] ? "#f5f3ff" : "white",
        transition: "all 0.2s",
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{label}</div>
          <div style={{ fontSize: 11, color: "#6b7280" }}>{desc}</div>
        </div>
        <label className="toggle">
          <input type="checkbox"
            checked={!!config[key as keyof ScraperConfig]}
            onChange={e => setConfig(c => ({ ...c, [key]: e.target.checked }))} />
          <span className="toggle-slider" />
        </label>
      </label>
    ))}
  </div>
  <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
    <button className="cfg-btn cfg-btn-primary" onClick={() => saveConfig()} disabled={saving}>
      {saving ? "Salvando..." : "💾 Salvar"}
    </button>
  </div>
</div>
```

**Commit:**

```bash
git add "app/(admin)/admin/scraper-config/page.tsx"
git commit -m "feat(ui): auto-publish platform toggles in ScraperConfig"
```

---

### Task 10 — Worker: auto-publicação nas plataformas configuradas

**Files:**
- Modify: `worker/scraper.py`
- Modify: `.env.example`

**Step 1: Adicionar `NEXT_APP_URL` no env**

```bash
# .env.example
NEXT_APP_URL=http://app:3000  # URL interna do Next.js no docker-compose
```

**Step 2: Função auxiliar no scraper**

```python
import requests as http_requests
import os

NEXT_APP_URL = os.getenv("NEXT_APP_URL", "http://localhost:3000")

def auto_publish(social_post_id: str, endpoint: str) -> bool:
    """Chama endpoint Next.js de publicação de forma síncrona."""
    try:
        res = http_requests.post(
            f"{NEXT_APP_URL}{endpoint}",
            json={"socialPostId": social_post_id},
            timeout=30
        )
        print(f"[AUTO-PUBLISH] {endpoint} → {res.status_code}")
        return res.ok
    except Exception as e:
        print(f"[AUTO-PUBLISH] Error {endpoint}: {e}")
        return False
```

**Step 3: Ler flags do config e chamar após criação de SocialPost**

```python
# Após criar SocialPost e gerar vídeo com sucesso:
if config.get("auto_publish_reels"):
    auto_publish(social_post_id, "/api/social/publish")
if config.get("auto_publish_story"):
    auto_publish(social_post_id, "/api/social/publish-story")
if config.get("auto_publish_tiktok"):
    auto_publish(social_post_id, "/api/social/publish-tiktok")
if config.get("auto_publish_linkedin"):
    auto_publish(social_post_id, "/api/social/publish-linkedin")
```

**Commit:**

```bash
git add worker/scraper.py .env.example
git commit -m "feat(worker): respect auto-publish flags after video generation"
```

---

## Ordem de Execução Recomendada

| # | Task | Razão |
|---|---|---|
| 1 | Schema (DB) | Fundação — tudo depende |
| 2 | Integrations UI | Onde salvar tokens TikTok/LinkedIn |
| 3 | API Story 24h | Estende `lib/metaGraph.ts` |
| 4 | API TikTok | Novo lib + endpoint |
| 5 | API LinkedIn | Novo lib + endpoint |
| 6 | UI Stories (botões) | Usa APIs 3, 4 |
| 7 | Pexels cover | Infraestrutura de imagem |
| 8 | UI Posts (botões) | Usa APIs 5, 7 |
| 9 | ScraperConfig UI | Usa campos adicionados em Task 1 |
| 10 | Worker auto-publish | Integra tudo |

---

## Variáveis de Ambiente Necessárias

| Variável | Onde usar |
|---|---|
| `PEXELS_API_KEY` | Já existe — validar |
| `MINIO_BUCKET_NAME` | Bucket de imagens (ex: `news-media`) |
| `MINIO_PUBLIC_ENDPOINT` | URL pública do MinIO para imagens |
| `NEXT_PUBLIC_SITE_URL` | URL do portal (para link no LinkedIn) |
| `NEXT_APP_URL` | URL interna do Next para o worker |

---

## Verificação Final

```bash
# Build sem erros TypeScript
cd c:\dev\cursoplugandoia
npm run build

# Checar endpoints criados:
# POST /api/social/publish-story
# POST /api/social/publish-tiktok
# POST /api/social/publish-linkedin
# POST /api/posts/[id]/publish
# GET  /api/posts/[id]/social-post
# POST /api/posts/[id]/fetch-cover

# Verificar páginas:
# /admin/social → 3 botões por card: "📹 Reels", "📸 Story 24h", "🎵 TikTok"
# /admin/posts → col Capa + botões "🌐 Site" + "💼 LinkedIn"
# /admin/integrations → seções TikTok + LinkedIn
# /admin/scraper-config → card "📡 Publicação Automática" com 4 toggles
```
