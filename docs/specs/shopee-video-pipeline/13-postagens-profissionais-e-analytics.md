# Postagens Profissionais, Bio e Analytics (Shopee Pipeline)

Status: PROPOSTA / SPEC (nao implementado por completo).

Este documento define como evoluir o fluxo atual do Shopee Pipeline para:

- manter uma "vitrine link da bio" com todos os produtos postados;
- medir cliques por item (analytics);
- organizar postagens automáticas com agendamento (ex: de 6 em 6 horas);
- publicar (quando possível) em YouTube Shorts, TikTok e Instagram (Reels e/ou Stories);
- oferecer uma tela profissional de controle de posts sem misturar com a tela de geração de vídeos.

## 1) O que ja existe hoje (investigacao)

### 1.1 Cadastro interno do item “final”

Ja existe uma entidade de vitrine/publicacao para link da bio:

- `BioProduct` (Prisma): `title`, `description`, `imageUrl`, `videoUrl`, `affiliateUrl`, `slug`, `active`, `publishedAt`.
  - Criacao automatica acontece no orquestrador quando o item chega em `AFFILIATE_LINK_READY`.
  - Arquivo: `lib/shopee-pipeline/orchestrator.ts` (step `CREATE_BIO_PRODUCT`).

Ja existe tracking de clique por item:

- `BioClick` (Prisma): `bioProductId`, `source`, `userAgent`, `ipHash`, `createdAt`.
  - Endpoint: `app/api/bio/click/route.ts` (POST).
  - UI publica: `app/(public)/bio/*` chama `/api/bio/click` ao clicar no CTA.

Ja existe a pagina publica "link da bio":

- Lista + busca + filtro: `app/(public)/bio/page.tsx`
- Pagina do produto: `app/(public)/bio/[slug]/page.tsx`

### 1.2 Postagens sociais e agendamento (base existente)

Ja existe estrutura geral para agendamento/publicacao social:

- `SocialPost` (Prisma): `summary`, `videoUrl`, `platform`, `postType`, `status`, `scheduledTo`, `postUrl`, `views`, etc.
- Cron: `app/api/social/cron/route.ts` publica posts due e continua posts em `PROCESSING_MEDIA`.
- Integracoes: `IntegrationSettings` (Prisma) + tela `app/(admin)/admin/integrations/page.tsx`.
- Calendario e lista de agendamentos:
  - `app/(admin)/admin/social/calendar/page.tsx`
  - `app/(admin)/admin/schedules/page.tsx`

Ja existe “postagem” especifica do Shopee Pipeline:

- `StoryAd` + `StoryPublication` (Prisma).
- Runner: `app/api/shopee-pipeline/publisher-runner/route.ts`
  - Cria um `SocialPost` por plataforma (YOUTUBE/TIKTOK/INSTAGRAM) no momento da publicacao.
  - Para Instagram, hoje usa `postType=STORY` e chama `app/api/social/publish-story/route.ts`.
  - Para YouTube e TikTok chama `publish-youtube` e `publish-tiktok`.

**Conclusao:** sim, ja cadastramos internamente titulo/descricao/link e temos base de posts e tracking de clique. O que falta eh “produto postado = item na bio” virar um fluxo consistente + tela operacional + agendamento profissional + melhor uso de descricao/link no YouTube e padronizacao por plataforma.

## 2) Objetivo do produto (visao)

Criar um modulo de “Postagens Shopee” com 3 camadas:

1. **Catalogo Bio (publico)**: `/bio` continua sendo o destino do “link na bio”.
2. **Fila/Agenda de Postagens (privado/admin)**: tela profissional para revisar, editar e agendar posts (6/6h ou slots custom).
3. **Publicador (cron)**: publica automaticamente quando chega no horario, registra resultado por plataforma e salva URL publicada.

## 3) Requisitos (MVP)

### 3.1 Vitrine (Bio) e analytics

- Manter 100% funcional:
  - `/bio` lista todos os itens ativos.
  - `/bio/[slug]` exibe detalhes e CTA.
  - Tracking: registrar clique sempre que usuario clicar no CTA.

- Adicionar no admin (MVP):
  - Uma tela “Bio Analytics” (ou coluna na tela “Postagens Shopee”) exibindo:
    - cliques totais por produto;
    - cliques nos ultimos 7/30 dias;
    - (opcional) cliques unicos aproximados por `ipHash` em janela (anti-ruido).

- Paginação (publico):
  - `/bio` hoje traz `take: 60` sem paginacao. Adicionar paginacao simples (page/pageSize) mantendo UX leve.

### 3.2 Postagens (Agendamento 6/6 horas)

- Criar uma tela dedicada: `Admin > Shopee > Postagens` (nao misturar com a tela pipeline).
  - Lista de posts (linha por item):
    - produto (titulo + thumb/video);
    - status geral e por plataforma;
    - horario agendado (data + hora);
    - cliques (analytics) do item;
    - acoes: editar, reagendar, pausar, forcar publicar.

- Agendamento:
  - Regra default: a cada item pronto, sugerir um horario automaticamente no proximo slot (ex: a cada 6 horas).
  - Deve permitir editar: dia/mes/ano + hora/minuto.

- Plataformas:
  - Checkboxes/flags por item:
    - YouTube Shorts
    - TikTok
    - Instagram Reels
    - Instagram Stories (opcional)

### 3.3 Conteudo do post (descricao + link)

- YouTube Shorts:
  - Publicar vídeo com `title` e `description` + link do produto.
  - Link recomendado: `https://plugandoia.cloud/bio/[slug]` (estavel, rastreavel, e centraliza o CTA).
  - Tambem pode incluir `affiliateUrl` (opcional), mas preferir o link da bio para consolidar tracking e evitar riscos de spam.

- TikTok:
  - Hoje a API usada publica com `title` como caption. Manter caption curta e CTA “link na bio”.
  - Link clicavel direto no caption geralmente e limitado; MVP: usar “link na bio”.

- Instagram:
  - Reels via Graph API: OK (ja existe `app/api/social/publish/route.ts` para `postType=REEL`).
  - Stories via Graph API: OK (ja existe `app/api/social/publish-story/route.ts`).
  - Link clicavel “no meio do story”:
    - Limitação: a Graph API nao garante suporte oficial para “link sticker” programatico em todas as contas/cenarios.
    - MVP: manter CTA “link na bio”.
    - Futuro: investigar suporte a sticker/link (se existir e for permitido pela conta).

## 4) Modelo de dados (proposta)

### 4.1 Vincular BioProduct ao post

Hoje:

- `BioProduct` e `StoryAd` sao criados por `coletaId` e nao guardam relacionamento explicito entre si.

Proposta:

- Adicionar `bioProductId` em `StoryAd` (nullable) OU criar um novo model “ShopeePostPlan”.

Opcao A (mais simples):

- `StoryAd.bioProductId` (1:1 por coletaId ja existe, entao funciona bem).
- Na criacao do `StoryAd`, setar `bioProductId` do item.

Opcao B (mais profissional/escala):

- Novo model `ShopeePostPlan`:
  - `id`, `coletaId` (unique), `bioProductId`, `videoUrl`, `affiliateUrl`, `title`, `description`
  - `scheduledAt`
  - `platformFlags` (JSON) ou colunas boolean
  - `status` (DRAFT/SCHEDULED/PUBLISHED/FAILED/PAUSED)
  - `createdAt/updatedAt`
  - `publications` (1:N) com status por plataforma.

Recomendacao: **Opcao B** (separar “pipeline de geracao” de “operacao de postagem”).

### 4.2 Analytics

Ja existe `BioClick`.

Proposta de agregacao:

- Sem alterar schema no MVP: agregar por query (count/period) no backend.
- Se performance virar problema: criar tabela agregada diaria (`BioClickDaily`).

### 4.3 SocialPost (reuso)

Reusar `SocialPost` como “job de publicacao” para o cron `api/social/cron`.

Proposta:

- Criar `SocialPost` no momento do agendamento (e nao na hora de publicar), para:
  - aparecer no calendario;
  - permitir edicao e re-agendamento antes do post;
  - manter rastreabilidade.

## 5) APIs (proposta)

### 5.1 Admin - Postagens Shopee

- `GET /api/shopee-posts?page=&pageSize=&status=&q=`
  - retorna lista paginada com:
    - dados do item (titulo, thumb, video, affiliate/bio url)
    - scheduledAt
    - status por plataforma
    - clicks (7d/30d/total)

- `POST /api/shopee-posts/:id/schedule`
  - body: `{ scheduledAt, platforms }`

- `POST /api/shopee-posts/:id/update`
  - body: `{ title, description }`

- `POST /api/shopee-posts/:id/publish-now`
  - cria/atualiza SocialPost(s) e dispara publishers

### 5.2 Publico - Bio

- Manter:
  - `POST /api/bio/click`
- Adicionar (opcional) endpoint para analytics no admin:
  - `GET /api/bio/analytics?slug=...` ou por `bioProductId`

## 6) Regras de agendamento (6 em 6 horas)

Default sugerido:

- Configuracao global:
  - `postIntervalHours = 6`
  - `startHour` (ex: 08:00)
  - `timeZone` (usar America/Sao_Paulo)

Algoritmo:

1. Buscar o ultimo post agendado “SCHEDULED” (por plataforma ou global).
2. Escolher o proximo slot = max(now + 15min, lastScheduledAt + 6h).
3. Persistir como `scheduledAt`.

Permitir override manual por item.

## 7) Conteudo (copy) por plataforma

Padrao recomendado para todos:

- `title`: curto, humano, sem termos tecnicos.
- `description`:
  - 1-2 linhas com beneficio principal;
  - CTA claro;
  - link rastreavel:
    - `Bio URL`: `https://plugandoia.cloud/bio/[slug]`
  - (opcional) cupom/urgencia leve.

### Observacao (YouTube)

O endpoint atual `app/api/social/publish-youtube/route.ts` usa `socialPost.summary` como `description`.

Proposta:

- `SocialPost.summary` virar um template:
  - incluir `bioUrl` e/ou `affiliateUrl` no final.
- Exemplo:
  - `Resumo...\n\nAcesse o produto: https://plugandoia.cloud/bio/<slug>`

## 8) UX/UI (tela profissional)

### 8.1 Nova tela: “Shopee Postagens”

Local:

- `app/(admin)/admin/shopee-postagens/page.tsx` (sugestao)

Layout:

- Header com KPIs:
  - “Agendados hoje”, “Publicados 7d”, “Falhas pendentes”, “Cliques 7d”.
- Tabela com:
  - Thumb + titulo
  - ScheduledAt (edit inline)
  - Plataformas (chips com status + toggle)
  - Cliques (total / 7d)
  - Acoes (Editar / Reagendar / Publicar agora / Pausar)

Detalhe (drawer/modal):

- Editar `title` e `description` por plataforma (com preview).
- Links:
  - Bio URL (copiar)
  - Affiliate URL (copiar)
  - VideoUrl (abrir)
- Logs por plataforma (ultima tentativa, erro, nextRetryAt).

### 8.2 Tela “Bio” (publico)

- Manter UX atual e adicionar:
  - paginacao no rodape (simples);
  - (opcional) links para redes sociais no rodape (configuravel).

## 9) Credenciais e integracoes (o que vou precisar de voce)

### YouTube (ja existe)

- `Client ID` e `Client Secret` (Google Cloud)
- `Refresh Token` (obtido via fluxo `api/integrations/youtube/*`)

### Meta (Instagram/Facebook)

- `instagramId`, `pageId`, `accessToken` (ja existe tela)
- Confirmar se a conta permite publicar Reels e Stories via API.

### TikTok

- `accessToken` valido com escopo `video.publish`
- Validar se a app TikTok esta aprovada/permitida para Content Posting API em prod.

### URLs de perfis (para exibicao clicavel na bio)

Proposta:

- Configurar em uma entidade simples `BioSocialLink` (ou `SiteSettings`):
  - YouTube: `https://www.youtube.com/@willianbarata2313`
  - Instagram: (voce vai informar)
  - TikTok: (voce vai informar)

## 10) Plano de implementacao (sequencia recomendada)

1. Criar `ShopeePostPlan` (ou `StoryAd.bioProductId`) + endpoints admin de listagem/edicao/agendamento.
2. Criar tela `Shopee Postagens` (lista + edicao + agendamento).
3. Criar `SocialPost` no agendamento (para aparecer no calendario) e reutilizar `api/social/cron`.
4. Ajustar YouTube para incluir Bio URL (e opcional affiliate).
5. Ajustar Instagram para permitir escolher REEL vs STORY no plano.
6. Implementar analytics no admin (cliques por item).
7. Adicionar links de redes sociais na pagina publica `/bio`.

