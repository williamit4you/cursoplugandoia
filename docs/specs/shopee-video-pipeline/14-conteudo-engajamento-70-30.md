# Conteúdo de Engajamento (70/30) — Spec Driven Development

Status: SPEC (planejamento).  
Escopo: **novo fluxo e nova tela**, sem alterar o que já funciona no Shopee Pipeline e no publicador social atual.

## Objetivo

Criar um fluxo paralelo para produzir **conteúdo que engaja (70%)** + **conteúdo agressivo de venda (30%)**, usando:

- a mesma infraestrutura já existente (scraping Shopee, mídia no MinIO, `aiPromptVendas`, `voiceRefUrl`, geração de áudio/vídeo, `SocialPost`, cron de publicação, calendário);
- **uma nova área** no admin para criar, revisar, gerar e agendar esses vídeos de engajamento;
- (opcional) autopreencher **3 ideias** por produto após o pipeline Shopee concluir um item.

Motivação (conforme solicitado):

- cansa rápido
- diminui retenção
- algoritmo entende como anúncio
- reduz seguidores fiéis

Conteúdo de engajamento precisa misturar:

- entretenimento, curiosidade, utilidade, comparação, erro comum, reação, prova social  
e, no meio, vendas.

## Princípios e restrições

1. **Não quebrar nem mudar o fluxo atual** do Shopee Pipeline, vitrine `/bio`, `StoryAd/StoryPublication`, cron social.
2. Reutilizar:
   - `IntegrationSettings` (META/YOUTUBE/TIKTOK),
   - `SocialPost` + `app/api/social/cron/route.ts`,
   - workers existentes (Modal/MinIO) e `render-service` quando aplicável.
3. Novo fluxo deve ser **operacional**, com estados, logs e retry consistentes com o resto do sistema.
4. Conteúdo deve priorizar:
   - **retenção**, **compartilhamento**, **comentários** (clique vem depois).

## Personas / “Personagem IA”

O sistema deve suportar um “personagem” (identidade do canal) para padronizar tom e bordões:

- “IA caçadora de produtos”
- “testador(a) de produtos”
- “achados da internet”

Implementação (MVP): um campo `personaName` (string) + `personaStyle` (enum simples) configurável por template.

## Tipos de conteúdo (templates)

Templates suportados no MVP (exatamente os formatos descritos):

1. **Coisas da Shopee que fazem sentido**
   - Exemplos de hook:
     - “Finalmente um produto barato que funciona”
     - “Isso aqui resolve um problema idiota”
     - “Produto simples mas genial”
   - Meta: comentários / compartilhamentos / salvamentos

2. **Produtos que parecem inúteis até você ver**
   - Meta: curiosidade, transformação visual

3. **Não compre isso sem ver isso antes**
   - Exemplos:
     - “Todo mundo compra errado isso aqui”
     - “O barato saiu caro”
     - “O que ninguém fala desse produto”
   - Meta: autoridade e retenção

4. **Comparações**
   - “barato vs caro”, “Shopee vs Amazon”, “China vs original”
   - Meta: “cérebro quer descobrir o vencedor” → retenção

5. **3 produtos que eu compraria hoje**
   - Formato rápido: ~7s cada, cortes rápidos, música rápida

6. **Coisas que parecem mentira**
   - gadgets estranhos, antes/depois, transformação

7. **Perguntas simples (comentários)**
   - “Você usaria isso?”
   - “Compraria ou não?”
   - “Genial ou inútil?”
   - “Quanto você acha que custa?”

8. **Séries**
   - “parecem caros mas são baratos”
   - “achados abaixo de R$30”
   - “eu queria ter conhecido antes”
   - “mais vendidos da semana”

## Decisões do MVP (confirmadas)

- “minha imagem”: **várias URLs** (galeria), você pode ir adicionando; o sistema escolhe uma por vídeo (random/round-robin).
- Legendas: **SIM no MVP**.
- Música de fundo: **NÃO no MVP**.
- Duração: vídeos podem variar de **30 segundos até 2 minutos**.
- Publicação: o foco inicial é **geração do conteúdo**; agendamento/publicação fica para fase posterior (o spec mantém o desenho de integração com `SocialPost`).

## O que o vídeo precisa conter (produção)

### Requisitos de mídia (MVP)

Entrada:

- imagens do produto (já coletadas no pipeline: `mediaImageUrls`)
- opcional vídeo do produto (quando existir: `mediaVideoUrls` / `videoFinalUrl`)
- “minha imagem” (foto/avatar do criador) **por URL**, com suporte a **múltiplas imagens** (galeria)
- áudio gerado com sua voz (reusar `userVoiceRefUrl` do `shopeePipelineConfig` e o gerador de áudio da Modal)

Saída:

- MP4 9:16 (1080x1920) no MinIO
- thumbnail (opcional)
- legendas (**MVP**) — gerar arquivo (SRT/VTT) e/ou embutir no vídeo (burn-in) na renderização

### Cenas do criador (“minha imagem falando”)

O sistema deve suportar um formato em que a “minha imagem” apareça como **talking photo** (foto animada sincronizada com o áudio),
intercalando com imagens/vídeos do produto.

Implementação (MVP):

- Reusar o mecanismo existente de vídeo falado por foto (o mesmo conceito usado no fluxo de “copy” / `copyVideoUrl`).
- Permitir escolher um `creatorImageUrl` (da galeria) para a cena “CREATOR”.
- Permitir alternar cenas no `shots` (ex.: CREATOR → PRODUCT → CREATOR).

### Estrutura visual (MVP)

Padrão recomendado:

- Topo: texto curto (HOOK) com 1–2 linhas, grande
- Meio: produto (imagem ou trecho de vídeo)
- Canto: “minha imagem” em bubble/recorte + nome do personagem
- Rodapé: CTA de engajamento (pergunta) e/ou “link na bio” (quando fizer sentido)

Observação: evitar “cara de anúncio” (muito CTA, muito preço) nos conteúdos 70%.

### Fontes de imagens (assets)

O vídeo pode utilizar 3 fontes de assets:

1. **Shopee (produto)**: imagens e vídeo já coletados (`mediaImageUrls`, `mediaVideoUrls`, `videoFinalUrl`).
2. **Acervo interno (recomendado no MVP)**: uma pasta/registro interno com imagens/vídeos genéricos (backgrounds, texturas, cenas),
   escolhidos manualmente por você (upload) e reutilizados em múltiplos vídeos.
3. **Bancos gratuitos (fase posterior)**: integração via API (ex.: Pexels/Unsplash) para buscar imagens relacionadas ao tema.
   - Observação: precisa validar licenças, rate limits, atribuição e confiabilidade. Por isso fica fora do MVP.

### Transições animadas (criador ⇄ produto)

MVP deve suportar transições simples e bonitas, aplicáveis entre qualquer cena:

- `CUT` (corte seco)
- `CROSSFADE` (fade)
- `SLIDE` (deslize)
- `ZOOM` (zoom in/out leve)

Fase posterior:

- `WIPE`, `BLUR`, transições “cinema”, presets por template.

## Prompt de roteiro (IA)

### Entradas do prompt

- `templateType` (um dos templates acima)
- `personaName` (ex: “IA caçadora de produtos”)
- `productTitle` (limpo)
- `productDescription` (filtrada)
- `productDetails` (filtrados)
- `targetPlatform` (TikTok, Reels, Shorts) — para ajustar ritmo/CTA
- `objective` (RETENCAO | COMENTARIO | COMPARTILHAMENTO | UTILIDADE)
- `tone` (natural, rápido, divertido, curioso)
- `constraints`:
  - não ler especificações técnicas (alfa-numérico, IPxx, modelos etc.)
  - não inventar funcionalidades
  - sem “Compre agora” no conteúdo 70%

### Saídas do prompt (JSON)

Retornar JSON com:

```json
{
  "hook": "...",
  "script": "...",
  "on_screen_text": ["...", "..."],
  "cta_comment": "...",
  "shots": [
    {"type":"PRODUCT","durationSec":3,"note":"..."},
    {"type":"CREATOR","durationSec":2,"note":"..."}
  ]
}
```

### Regras de duração

- Os templates devem permitir variação de duração entre **30s e 2min**, conforme o estilo.
- Conteúdos 70%: normalmente 30–60s (ritmo rápido, cortes).
- Comparações / “não compre sem ver”: 45–120s (tempo para contexto + conclusão).
- “3 produtos que eu compraria hoje”: 25–45s (3 blocos rápidos).
- Conteúdos 30% (venda): 35–90s (benefícios + prova + CTA).

## Novo modelo de dados (proposta)

### 1) `EngagementTemplate`

Configurações do template (pode ser seedado):

- `id`
- `name` (ex: “Coisas da Shopee que fazem sentido”)
- `type` (enum)
- `personaName` (default)
- `defaultObjective` (enum)
- `promptSystem` (text)
- `promptUser` (text com placeholders)
- `active`
- timestamps

### 2) `EngagementIdea`

Uma “ideia”/roteiro candidato (pode ser gerado automaticamente após pipeline):

- `id`
- `coletaId` (FK opcional → item Shopee origem)
- `templateId`
- `title` (título interno da ideia)
- `scriptJson` (JSON do roteiro)
- `status` (DRAFT | APPROVED | DISMISSED | GENERATED | FAILED)
- `notes` (texto livre)
- timestamps

### 3) `EngagementVideo`

Um vídeo gerado a partir de uma ideia aprovada:

- `id`
- `ideaId`
- `coletaId` (opcional)
- `videoUrl` (MinIO)
- `audioUrl` (MinIO)
- `thumbUrl` (opcional)
- `renderLog` / `errorMessage`
- `status` (DRAFT | GENERATING_AUDIO | GENERATING_VIDEO | READY | FAILED)
- timestamps

### 4) Reuso de `SocialPost`

Para agendamento/publicação, criar `SocialPost` a partir do `EngagementVideo`:

- `summary` (caption/descrição)
- `videoUrl`
- `platform` (META/YOUTUBE/TIKTOK)
- `postType` (REEL/SHORTS/REEL equivalente; no sistema atual: REEL ou STORY)
- `scheduledTo`
- `status`
- vincular via `automationTaskId` (opcional) OU via novos campos:
  - `engagementVideoId` (recomendado como novo FK)

> MVP pode evitar mexer em `SocialPost` e guardar o relacionamento em `responsePayload`/`metadata`, mas o ideal é FK.

## Fluxo (end-to-end)

### A) Auto-criar 3 ideias por produto (opcional / fase 2)

Quando `coletaId` atingir `AFFILIATE_LINK_READY` ou `READY_FOR_STORY`:

1. Selecionar 3 templates (ex.: “faz sentido”, “inútil até ver”, “pergunta”).
2. Gerar `EngagementIdea` em `DRAFT` para cada template.
3. Exibir na nova tela para revisão.

Observação (qualidade): as 3 ideias devem ter variedade real:

- 1 template de curiosidade (“inútil até ver” / “coisas que parecem mentira”)
- 1 template de autoridade (“não compre sem ver” / “erro comum”)
- 1 template de comentários (pergunta simples) ou comparação

### B) Criação manual (MVP)

Na tela nova:

1. Selecionar um produto (ou criar sem produto)
2. Escolher template
3. Gerar roteiro (IA) → salvar `EngagementIdea` em `DRAFT`
4. Editar roteiros (campos do JSON com UI amigável)
5. Aprovar ideia
6. Gerar áudio (Modal) com `voiceRefUrl`
7. Gerar vídeo (render-service / worker) com:
   - produto (imagens/vídeo)
   - “minha imagem” (url)
   - textos em tela
   - legendas (MVP)
8. Criar/agendar `SocialPost` (6 em 6 horas, ou manual)
9. Publicar via cron existente (`/api/social/cron`) e monitorar status

> Decisão do momento: no MVP, entregar bem o fluxo **roteiro → áudio → vídeo + legendas**. A parte de agendamento/publicação fica para a fase seguinte.

## Nova tela (Admin) — “Conteúdo de Engajamento”

### Menu / navegação

Adicionar item no menu admin:

- “Conteúdo (Engajamento)”

### Layout (UX)

#### 1) Lista (Inbox operacional)

Filtros:

- status (DRAFT/APPROVED/GENERATED/FAILED)
- template
- origem (com/sem Shopee)
- objetivo (retenção/comentário/compartilhamento)

Colunas:

- hook (preview)
- template
- produto (quando houver)
- status
- último update
- ações: ver/editar, aprovar, gerar vídeo, agendar, descartar

#### 2) Detalhe (editor)

Seções:

- Template + persona
- Hook / Script (texto)
- Textos na tela (chips/edit)
- CTA de comentário (pergunta)
- Pré-visualização simples (mock)
- Botões:
  - “Gerar roteiro”
  - “Aprovar”
  - “Gerar áudio”
  - “Gerar vídeo”
  - “Agendar publicação”

#### 3) Agenda

Reusar telas existentes quando possível:

- `Calendário Social` e `Agendamentos` já mostram `SocialPost`.

Na tela do engajamento, oferecer link rápido “Ver no calendário”.

## Agendamento 6/6 horas

Reaproveitar conceito do spec anterior:

- criar `SocialPost.status = SCHEDULED`
- `scheduledTo` = próximo slot de 6 horas
- cron `app/api/social/cron/route.ts` publica quando due

## Integrações / credenciais

Sem mudanças:

- TikTok: `IntegrationSettings(platform="TIKTOK").accessToken` com escopo `video.publish`
- Meta: `IntegrationSettings(platform="META")` (Reels vs Story escolhido via `postType`)
- YouTube: `IntegrationSettings(platform="YOUTUBE")` (já publica com título/descrição)

## Observabilidade e retry

Para `EngagementVideo` e publicações:

- registrar logs (similar a `shopeePipelineStep`/`pipeline events`)
- retry policy:
  - áudio: 3 tentativas com backoff curto
  - vídeo: 3 tentativas com backoff
  - publicação: reusar retry do `SocialPost` cron (ou criar equivalente por plataforma)

## Segurança / compliance

- Conteúdo: evitar claims falsos (“não inventar funcionalidades”)
- Privacidade: não exibir dados pessoais nos vídeos
- Limitar texto: não ler códigos/modelos no áudio (mesma regra do pipeline Shopee)

## Plano de implementação (fases)

### Fase 0 — Apenas UI + dados (sem render)

1. Criar models `EngagementTemplate` e `EngagementIdea`.
2. Criar tela admin de lista + detalhe.
3. Implementar geração de roteiro (IA) e salvar JSON.

### Fase 1 — Gerar áudio e vídeo (reuso de infra)

4. Reusar `userVoiceRefUrl` para gerar áudio (Modal).
5. Criar job de vídeo no render-service/worker com layout padrão.
6. Persistir `EngagementVideo`.

### Fase 2 — Agendar e publicar

7. Criar `SocialPost` ao agendar.
8. Reusar `api/social/cron` para publicar.

### Fase 3 — Auto-ideias por produto

9. Após item Shopee pronto, criar 3 `EngagementIdea` (DRAFT) automaticamente.

## Nova tela simples (MVP paralelo) — “Texto → Vídeo”

Além da tela de “Conteúdo de Engajamento”, criar uma tela **bem simples** para gerar vídeos a partir de um texto.
Este fluxo não depende de Shopee e não afeta o que já existe.

### Objetivo

- Você cola/digita um texto curto (roteiro).
- O sistema gera:
  - áudio com sua voz (Modal)
  - vídeo 9:16 com sua “imagem falando” (talking photo) + legendas
- Exibe o MP4 e oferece botão de **download**.

### UX (tela)

Rota sugerida:

- `/admin/texto-para-video`

Campos:

- `Texto para narração` (textarea)
- `Imagem do criador` (select/URL — escolha da galeria)
- `Duração alvo` (opcional; default: auto)
- Botões:
  - “Gerar áudio”
  - “Gerar vídeo”
  - “Baixar MP4”

Estados:

- DRAFT → GENERATING_AUDIO → AUDIO_READY → GENERATING_VIDEO → READY / FAILED

### Modelo de dados (proposta)

Criar `SimpleCreatorVideo`:

- `id`
- `narrationText`
- `creatorImageUrl`
- `audioUrl`
- `videoUrl`
- `captionsUrl` (SRT/VTT)
- `status`
- `errorMessage`
- `createdAt/updatedAt`

### Reuso de infraestrutura

- Audio: reusar `generateModalAudio` (mesma base do pipeline).
- Vídeo: reusar o mesmo worker/render usado para “foto falando”.
- Legendas: gerar por alinhamento simples do texto (ou usar pipeline existente de captions, se houver).

### Download

- O `videoUrl` será público via MinIO; a UI pode usar link direto “download”.
- Alternativa: endpoint `/api/download?url=...` (se precisar forçar `Content-Disposition`).

## Decisões registradas

- “minha imagem”: várias URLs (galeria).
- Legendas: sim no MVP.
- Música: não no MVP.
- Publicação: Instagram (Reels e Stories), TikTok e YouTube (fase de agendamento depois).
- Duração: 30s até 2min.
