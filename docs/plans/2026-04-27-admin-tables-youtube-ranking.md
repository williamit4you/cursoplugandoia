# Planejamento — Admin Tables + YouTube Ranking (2026-04-27)

## Objetivos
- Corrigir persistência de “Publicação Automática” no Scraper Config.
- Transformar “Fila de Stories” e “Vídeos com código” em tabelas com **ordenação, paginação e filtros**.
- Após publicar no YouTube, **armazenar o link** e permitir “publicar no site” (`/noticias`) com embed do vídeo.
- Evitar render com “tela preta” no final quando áudio/vídeo terminam antes do `duration`.
- Ter um **ranking próprio** (tipo SocialBlade) no banco, com coleta diária e filtros por categoria.

---

## Epic 1 — Bug: Auto-publicação não salva
### Done
- [x] `POST /api/worker/config` persistir `autoPublishReels|Story|TikTok|LinkedIn`.

### Validação
- [ ] Alterar toggles em `/admin/scraper-config` e confirmar persistência após refresh.
- [ ] Rodar worker/scraper e validar enqueue automático quando o vídeo ficar pronto.

---

## Epic 2 — “Fila de Stories” virar tabela (admin/social)
### UI
- [ ] Trocar lista atual por tabela com colunas: `createdAt`, `status`, `platform`, `postType`, `views`, `postUrl`, `summary` (resumido), ações.
- [ ] Ordenação por colunas (default: `createdAt desc`).
- [ ] Paginação (page/pageSize) + contador total.
- [ ] Filtros: status, plataforma, tipo (REEL/STORY), intervalo de datas, busca por texto (summary).
- [ ] Manter botões de publicar (Meta Reels/Story, TikTok, YouTube) e log expandível (pode virar drawer/modal).

### Backend
- [ ] Evoluir `GET /api/social/posts` para aceitar query params: `page`, `pageSize`, `sortBy`, `sortDir`, `status`, `platform`, `postType`, `q`.
- [ ] Retornar `{ items, total }` para paginação server-side.
- [ ] Index/ordenadores: garantir ordenação eficiente em `createdAt`, `status`, `platform`, `postType`.

### Aceite
- [ ] Com 500+ itens a tela continua responsiva (server-side pagination).

---

## Epic 3 — “Vídeos com código” virar tabela (admin/video-code)
### UI
- [ ] Converter cards em tabela com colunas: `createdAt`, `status`, `title`, `aspectRatio`, `videoDurationSec`, `videoUrl` (badge), ações (abrir/deletar).
- [ ] Ordenação + paginação + filtros: status, aspect ratio, “tem vídeo pronto”.
- [ ] Busca por título/ideaPrompt.

### Backend
- [ ] Criar endpoint `GET /api/video-code/projects` com paginação/ordenação/filtros (atualmente a página busca direto no Prisma).
- [ ] Ou: manter server component, lendo `searchParams` e aplicando `skip/take/orderBy/where` no Prisma.

### Aceite
- [ ] Navegação de páginas preserva filtros via querystring.

---

## Epic 4 — YouTube: salvar link e publicar no site (notícias)
### YouTube link
- [ ] Exibir `postUrl` na tabela de social (link clicável + copiar).
- [ ] Garantir que `/api/social/publish-youtube` sempre grava `postUrl` no `SocialPost`.

### Publicar em `/noticias`
- [ ] Criar ação “Publicar no site” que cria um `Post` com:
  - `title`: título do vídeo
  - `content_html`: texto (ex.: `summary` + parágrafos do “o que foi falado”)
  - embed do YouTube via `<iframe>` usando `postUrl`/`videoId`
- [ ] Definir origem do texto:
  - Opção A: usar o roteiro/narration já existente
  - Opção B: transcrever (se disponível) e resumir para artigo

### Aceite
- [ ] Página `/noticias/[slug]` renderiza o vídeo incorporado (iframe) no final.

---

## Epic 5 — Render: evitar “tela preta” no final
### Hipóteses prováveis
- `durationInFrames` baseado na soma das cenas (`videoSpec`) ou no “duration pedido”, mas áudio/cenas reais terminam antes.

### Tasks
- [ ] Medir duração real do áudio gerado (server-side) e ajustar `durationInFrames` para não exceder o conteúdo.
- [ ] Alternativa: auto-preencher o “restante” com última cena (hold) ou loop de b-roll (sem preto).
- [ ] Adicionar validação: se `sum(scene.durationSec)` < `targetDurationSec`, corrigir/normalizar antes de renderizar.

### Aceite
- [ ] Nunca renderizar frames sem conteúdo (sem preto) ao final.

---

## Epic 6 — Ranking YouTube (tipo SocialBlade) + coleta diária
### Importante (limitação)
- A YouTube Data API **não fornece** uma “lista oficial de top canais por país/categoria”.
  - Para ranking próprio, precisamos de um conjunto de canais no banco (pré-cadastro).

### Descoberta / Pré-cadastro
- [ ] Criar UI para cadastrar canais por:
  - ID do canal
  - @handle
  - URL do canal
  - import CSV
- [ ] (Opcional) “Descoberta assistida”: busca por termos + `regionCode` para sugerir canais (não garante top ranking real).

### Categorias
- [ ] Seed das categorias desejadas (Todos, Games, Entretenimento, Pessoas e blogs, Pets, Film, Música, Esportes, Ciência e tecnologia, How-to e estilo, News e polícia, Educação, Comédia, Nonprofit/Ativismo, Autos e veículos, Travel).
- [ ] UI para reatribuir categoria do canal.

### Coleta diária
- [ ] Garantir scheduler (Vercel Cron/Cloud Scheduler/GitHub Actions) chamando `/api/youtube-analytics/cron?secret=...` 1x por dia.
- [ ] Guardar `YtChannelSnapshot` diário e recalcular ranking (`rankPosition`) por:
  - inscritos (`subscribers`)
  - views longos (`viewsLongs`)
  - views shorts (`viewsShorts`)

### Dashboard
- [ ] Filtros por categoria, país e status (ativo/inativo).
- [ ] Bubble chart:
  - paleta/gradiente melhor (por categoria ou métrica)
  - modo tela cheia
  - toggle “shorts vs longs vs total”

### Aceite
- [ ] Ranking muda ao longo do tempo e histórico fica consultável por dia.

