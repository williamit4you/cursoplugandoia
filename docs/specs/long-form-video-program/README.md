# Spec Driven Development - Programa de Videos Longos

Versao: 1.0

Data: 04/08/2026

Status: aprovado para implementacao incremental

Documentos relacionados:

- `docs/reports/2026-08-04-videos-longos-diagnostico.md`
- `docs/specs/daily-news-video/README.md`
- `docs/specs/long-form-marketing-video/README.md`
- `docs/specs/long-form-video-program/CHECKLIST.md`

## 1. Objetivo

Organizar e implementar dois produtos de video horizontal para YouTube:

1. `DAILY_NEWS`: resumo diario de noticias, com 3 a 5 minutos, narracao e videos gratuitos licenciados.
2. `LONG_FORM_EDUCATION`: videos educacionais profissionais, inicialmente com 5 a 8 minutos, usando Remotion, b-roll, demonstracoes, diagramas e capitulos.

Os produtos sao independentes do ponto de vista editorial e de operacao. Eles compartilham apenas infraestrutura de audio, assets, render, armazenamento, observabilidade e publicacao no YouTube.

## 2. Resultado esperado

Ao final do programa, o operador deve conseguir:

- criar uma edicao diaria a partir das noticias publicadas no site;
- revisar fontes, roteiro e assets antes de gerar o video;
- gerar preview em 720p sem publicar;
- aprovar e renderizar o MP4 final em 1080p;
- agendar exclusivamente no YouTube;
- acompanhar tempos, falhas, custos e artefatos de cada etapa;
- criar videos educacionais com uma composicao Remotion propria;
- editar ou reprocessar somente a parte alterada;
- retomar um job sem duplicar render ou publicacao.

## 3. Fora de escopo

Esta versao nao inclui:

- publicacao de videos longos no Meta, Instagram ou TikTok;
- geracao de dez minutos de video sintetico por IA;
- uso automatico de imagens ou videos de portais de noticias;
- publicacao automatica de noticias sensiveis sem revisao humana;
- remocao ou reescrita dos pipelines atuais de Shorts, Shopee e anuncios;
- avatar ou apresentador sintetico no resumo diario;
- legenda palavra por palavra queimada no MP4;
- escalabilidade horizontal antes da medicao do servidor atual.

## 4. Principios obrigatorios

### 4.1 Separacao editorial

- Noticias e educacionais nao compartilham roteiro, aprovacao nem agenda.
- Cada produto possui tipo de projeto, estados, tela e regras proprias.
- Ambos podem reutilizar o mesmo render-service e integracao do YouTube.

### 4.2 Revisao humana

- Planejamento e resultado final possuem aprovacoes distintas.
- Nenhum endpoint de processamento pode definir as duas aprovacoes automaticamente.
- Publicacao exige aprovacao final registrada com data e usuario.

### 4.3 Audio antes da timeline

- A timeline final deve usar a duracao medida do audio, nao uma constante estimada.
- `ffprobe` e a fonte de verdade para a duracao dos audios e videos.
- O sistema deve impedir audio cortado ou silencio excessivo no final.

### 4.4 Assets rastreaveis

- Todo asset externo deve possuir origem, consulta, URL original, URL estavel, autor quando disponivel e regra de uso.
- Assets remotos devem ser baixados e normalizados antes do render final.
- URLs de portais de noticias nao podem ser usadas como midia final sem permissao registrada.

### 4.5 Idempotencia

- Repetir uma chamada nao pode criar uma segunda publicacao.
- Cada etapa deve reconhecer artefatos validos ja concluidos.
- Alteracoes devem invalidar somente etapas dependentes.

### 4.6 Observabilidade

- Toda etapa registra inicio, fim, duracao, resultado e erro.
- O operador consegue distinguir espera em fila, TTS, download, normalizacao, render, concat e upload.
- O concat registra se usou `copy` ou recodificacao.

### 4.7 Prioridade de entrega

- As entregas do programa devem seguir a ordem `Fase 0 -> Fase 1 -> Fase 2` antes de iniciar implementacao da `Fase 3`.
- O primeiro produto novo a entrar em operacao e o `DAILY_NEWS`.
- O `LONG_FORM_EDUCATION` evolui somente depois do `GATE 2`, exceto por ajustes compartilhados obrigatorios de seguranca, observabilidade ou performance.

### 4.8 Padrao de interface administrativa

- Toda listagem nova do fluxo de noticias deve seguir um padrao unico de admin.
- O padrao minimo inclui busca, filtros, seletor de quantidade por pagina, tabela paginada, acoes por linha, selecao multipla, acoes em lote e navegacao para tela de detalhes.
- A listagem nao pode ser a unica tela: cada entidade relevante deve possuir uma tela especifica de visualizacao e operacao.
- Acoes destrutivas ou irreversiveis exigem confirmacao explicita.
- O mesmo padrao deve ser reutilizado nas futuras telas administrativas de noticias para reduzir custo de operacao.

## 5. Baseline confirmado

O sistema atual ja possui:

- `CodeVideoProject`, `CodeVideoPipelineStep` e `CodeVideoPipelineEvent`;
- roteiro educacional gerado em blocos;
- busca de videos horizontais no Pexels;
- TTS em portugues;
- Remotion 16:9 no render-service;
- segmentacao em partes de aproximadamente 55 a 75 segundos;
- reaproveitamento de partes concluidas;
- FFmpeg concat com tentativa de `-c copy`;
- armazenamento dos artefatos;
- fila e publicacao no YouTube;
- tela `/admin/videos-longos`;
- noticias publicadas no modelo `Post`;
- YouTube Analytics e analytics das noticias.

Problemas que fazem parte desta implementacao:

- fila global unica para render e concat;
- partes processadas sequencialmente;
- timeline educacional fixa em 600 segundos;
- planejamento visual criado antes do audio real;
- composicao generica `VideoLandscape` usada no educacional;
- ate 12 assets Pexels distribuidos em aproximadamente 40 cenas;
- aprovacao automatica em `/api/videos-longos/[id]/process`;
- ausencia da implementacao do resumo diario;
- falta de telemetria detalhada de download, concat e recodificacao.

## 6. Arquitetura alvo

```text
                         +----------------------+
Noticias/Post ---------->| Resumo diario        |
                         | pauta, fontes, roteiro|
                         +----------+-----------+
                                    |
Briefing educacional --->+----------------------+
                         | Video educacional    |
                         | capitulos e roteiro  |
                         +----------+-----------+
                                    |
                                    v
                         +----------------------+
                         | Producao compartilhada|
                         | TTS, assets, probe,  |
                         | normalize, preview   |
                         +----------+-----------+
                                    |
                                    v
                         +----------------------+
                         | Render-service       |
                         | Remotion + FFmpeg    |
                         +----------+-----------+
                                    |
                                    v
                         +----------------------+
                         | Storage + YouTube    |
                         +----------------------+
```

### 6.1 Responsabilidades

| Camada | Responsabilidade |
| --- | --- |
| Next.js | workflow, validacao, aprovacao, idempotencia e admin |
| Prisma/Postgres | estado, fontes, assets, etapas, aprovacoes e auditoria |
| Pexels | descoberta de videos gratuitos permitidos |
| Storage | URLs estaveis de audio, video, preview, thumbnail e assets |
| render-service | probe, normalizacao, Remotion, FFmpeg e upload |
| YouTube | upload, thumbnail, legenda opcional, agendamento e URL publicada |

## 7. Modelo de dados

`CodeVideoProject` continua sendo o job tecnico consumido pelo render-service. O resumo diario ganha dados editoriais proprios. O educacional continua associado a `CodeVideoProject`, com assets normalizados e aprovacoes explicitas.

### 7.1 Novos modelos propostos

```prisma
model DailyNewsEdition {
  id                  String   @id @default(cuid())
  editionDate         DateTime
  timezone            String   @default("America/Sao_Paulo")
  status              String   @default("DRAFT")
  title               String?
  description         String?
  scriptText          String?
  targetDurationSec   Int      @default(240)
  measuredDurationSec Float?
  codeVideoProjectId  String?  @unique
  previewVideoUrl     String?
  finalVideoUrl       String?
  thumbnailUrl        String?
  captionsUrl         String?
  scriptApprovedAt    DateTime?
  scriptApprovedBy    String?
  finalApprovedAt     DateTime?
  finalApprovedBy     String?
  scheduledAt         DateTime?
  publishedAt         DateTime?
  youtubePostUrl      String?
  errorMessage        String?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  codeVideoProject    CodeVideoProject? @relation(fields: [codeVideoProjectId], references: [id], onDelete: SetNull)
  items               DailyNewsEditionItem[]
  assets              DailyNewsAsset[]

  @@unique([editionDate, timezone])
  @@index([status, createdAt])
}

model DailyNewsEditionItem {
  id                  String   @id @default(cuid())
  editionId           String
  edition             DailyNewsEdition @relation(fields: [editionId], references: [id], onDelete: Cascade)
  postId              String
  post                Post     @relation(fields: [postId], references: [id], onDelete: Restrict)
  position            Int
  category            String?
  titleSnapshot       String
  sourceName          String?
  sourceUrl           String?
  publishedAtSnapshot DateTime?
  narrationText       String?
  targetDurationSec   Int?
  verificationJson    Json?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  assets              DailyNewsAsset[]

  @@unique([editionId, postId])
  @@unique([editionId, position])
}

model DailyNewsAsset {
  id              String   @id @default(cuid())
  editionId       String
  edition         DailyNewsEdition @relation(fields: [editionId], references: [id], onDelete: Cascade)
  editionItemId   String?
  editionItem     DailyNewsEditionItem? @relation(fields: [editionItemId], references: [id], onDelete: SetNull)
  assetType       String
  source          String
  query           String?
  originalUrl     String
  stableUrl       String?
  author          String?
  licenseUrl      String?
  credit          String?
  technicalJson   Json?
  contentHash     String?
  startSec        Float?
  endSec          Float?
  status          String   @default("DISCOVERED")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([editionId, editionItemId])
  @@index([contentHash])
}

model CodeVideoAsset {
  id              String   @id @default(cuid())
  projectId       String
  project         CodeVideoProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
  assetType       String
  source          String
  query           String?
  originalUrl     String
  stableUrl       String?
  licenseUrl      String?
  credit          String?
  technicalJson   Json?
  contentHash     String?
  chapterKey      String?
  status          String   @default("DISCOVERED")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([projectId, chapterKey])
  @@index([contentHash])
}
```

Alteracoes necessarias nos modelos existentes:

```prisma
model CodeVideoProject {
  workflowStatus    String?
  dailyNewsEdition  DailyNewsEdition?
  productionAssets  CodeVideoAsset[]
}

model Post {
  dailyNewsEditionItems DailyNewsEditionItem[]
}
```

Observacoes de implementacao:

- `editionDate` deve ser normalizada para o inicio do dia no timezone da edicao.
- A restricao unica impede duas edicoes para a mesma data e timezone.
- URLs e snapshots preservam auditoria mesmo se a noticia for atualizada depois.
- Segredos, tokens e payloads sensiveis nao podem ser gravados em JSON de auditoria.

## 8. Maquinas de estado

### 8.1 Resumo diario

```text
DRAFT
  -> CURATING
  -> SCRIPTING
  -> AWAITING_SCRIPT_REVIEW
  -> SCRIPT_APPROVED
  -> GENERATING_AUDIO
  -> DISCOVERING_ASSETS
  -> ASSETS_READY
  -> RENDERING_PREVIEW
  -> AWAITING_FINAL_REVIEW
  -> FINAL_APPROVED
  -> RENDERING_FINAL
  -> READY
  -> SCHEDULED
  -> PUBLISHED
```

Estados alternativos: `FAILED`, `REJECTED`, `CANCELED`.

Regras:

- somente `AWAITING_SCRIPT_REVIEW` pode virar `SCRIPT_APPROVED`;
- somente `AWAITING_FINAL_REVIEW` pode virar `FINAL_APPROVED`;
- `SCHEDULED` exige `finalVideoUrl`, `thumbnailUrl` e aprovacao final;
- `PUBLISHED` exige ID ou URL do YouTube;
- uma falha permite retomar da ultima etapa valida;
- alterar roteiro depois de `SCRIPT_APPROVED` invalida audio, assets dependentes, preview e aprovacao final.

### 8.2 Video educacional

```text
DRAFT
  -> PLANNING
  -> AWAITING_PLAN_REVIEW
  -> PLAN_APPROVED
  -> GENERATING_CHAPTER_AUDIO
  -> PLANNING_VISUALS
  -> NORMALIZING_ASSETS
  -> RENDERING_PREVIEW
  -> AWAITING_FINAL_REVIEW
  -> FINAL_APPROVED
  -> RENDERING_FINAL
  -> READY
  -> SCHEDULED
  -> PUBLISHED
```

Estados alternativos: `FAILED`, `REJECTED`, `CANCELED`.

O campo tecnico `CodeVideoProject.status` pode continuar com os estados amplos atuais. O estado editorial detalhado deve ficar em um campo estruturado e validado durante a transicao. Na primeira migration, preferir um campo `workflowStatus` em vez de depender de texto livre dentro de `metadataJson`.

## 9. Pipeline compartilhado

### 9.1 Telemetria

Usar `CodeVideoPipelineStep.durationMs` e eventos para registrar:

- `QUEUE_WAIT`;
- `SCRIPT_GENERATION`;
- `TTS` por bloco;
- `MEDIA_DISCOVERY`;
- `MEDIA_DOWNLOAD`;
- `MEDIA_NORMALIZE`;
- `REMOTION_BUNDLE`;
- `REMOTION_RENDER`;
- `SEGMENT_DOWNLOAD`;
- `FFMPEG_CONCAT_COPY` ou `FFMPEG_CONCAT_REENCODE`;
- `ARTIFACT_UPLOAD`;
- `YOUTUBE_UPLOAD`.

Cada etapa precisa de `startedAt`, `finishedAt`, `durationMs`, tentativa, status e erro sanitizado.

### 9.2 Probe e normalizacao

Adicionar contratos ao render-service:

```text
POST /media/probe
POST /media/normalize
POST /concat
POST /render
```

Perfil normalizado inicial:

- container MP4;
- video H.264;
- pixel format `yuv420p`;
- 1920x1080 para final e 1280x720 para preview;
- 30 fps constante;
- audio AAC, 48 kHz, stereo;
- `faststart` habilitado.

O concat deve validar o perfil de todas as partes antes de executar. Se houver incompatibilidade, registrar qual campo divergiu.

### 9.3 Filas

Separar logicamente:

- fila de TTS;
- fila de normalizacao;
- fila de render Chromium;
- fila de concat/upload.

Configuracoes iniciais conservadoras:

- TTS: concorrencia 2;
- normalizacao: concorrencia 2;
- Remotion: concorrencia externa 1 ate medir CPU e RAM;
- downloads: concorrencia 3;
- concat: concorrencia 1, sem bloquear download ou TTS.

Somente aumentar renders simultaneos depois de benchmark. O sistema deve aceitar configuracao por variavel de ambiente.

### 9.4 Hashes e invalidacao

Calcular hash para:

- roteiro aprovado;
- texto de cada bloco/capitulo;
- configuracao da voz;
- lista e versao dos assets;
- videoSpec de cada segmento;
- configuracao do render.

Uma etapa pode reutilizar artefato somente quando o hash de entrada for igual. Alterar um capitulo nao pode invalidar capitulos independentes.

## 10. Produto A - Resumo diario de noticias

### 10.1 Entrada

- data da edicao;
- janela de publicacao das noticias;
- 5 a 8 posts publicados;
- ordem editorial;
- titulo e horario de corte;
- voz e velocidade;
- horario desejado de publicacao.

### 10.2 Selecao

O sistema sugere noticias do dia, mas o operador confirma a pauta no MVP.

Regras:

- aceitar somente `Post` publicado;
- excluir posts sem fonte ou URL de origem quando exigida;
- nao repetir o mesmo `Post` na edicao;
- sinalizar titulos ou URLs semelhantes;
- limitar uma edicao a 8 itens no piloto;
- preservar snapshot de titulo, fonte, URL e data.

### 10.3 Roteiro

Saida estruturada obrigatoria:

```json
{
  "titleOptions": ["...", "...", "..."],
  "opening": "...",
  "items": [
    {
      "postId": "...",
      "position": 1,
      "spokenText": "...",
      "screenTitle": "...",
      "category": "...",
      "pexelsQueries": ["...", "..."],
      "riskFlags": []
    }
  ],
  "closing": "...",
  "description": "...",
  "tags": ["..."],
  "estimatedWords": 600
}
```

Regras do roteiro:

- 450 a 750 palavras;
- texto original, sem copiar reportagem;
- fatos limitados aos posts e fontes selecionadas;
- linguagem de atribuicao quando necessaria;
- nenhuma citacao inventada;
- titulo de tela curto, nao uma legenda;
- risco editorial visivel para politica, crime, saude, beneficios, tragedias, financas e clima severo.

### 10.4 Audio

- Preferir um audio continuo para preservar ritmo e identidade da voz.
- Se o TTS nao suportar o tamanho, gerar por noticia e unir os audios antes do plano visual.
- Medir o audio final com `ffprobe`.
- Aceitar entre 180 e 330 segundos no piloto.
- Rejeitar audio fora do limite antes do render.

### 10.5 Assets

- 2 a 3 consultas em ingles por noticia;
- videos de apoio com 4 a 8 segundos;
- evitar repetir o mesmo asset na edicao;
- baixar para storage proprio;
- normalizar antes da timeline;
- registrar origem e licenca;
- marcar visualmente `IMAGEM ILUSTRATIVA` quando a montagem puder ser confundida com registro do fato.

### 10.6 Composicao `DailyNewsLandscape`

Componentes minimos:

- `DailyNewsOpening`;
- `DailyNewsBroll`;
- `DailyNewsLowerThird`;
- `DailyNewsTransition`;
- `DailyNewsSourceLabel`;
- `DailyNewsClosing`.

Regras visuais:

- 1920x1080, 30 fps;
- safe area para TV e celular;
- b-roll em tela cheia como linguagem dominante;
- tarjas por no maximo 5 segundos;
- sem legenda palavra por palavra no MP4;
- troca visual a cada 4 a 8 segundos;
- transicoes curtas e consistentes;
- logo discreto;
- sem animacao que prejudique leitura ou seriedade da noticia.

### 10.7 Admin

Nova rota: `/admin/resumo-noticias`.

Rotas minimas:

- `/admin/resumo-noticias`: listagem principal das edicoes;
- `/admin/resumo-noticias/:id`: tela de detalhes da edicao;
- subareas internas na tela de detalhes para pauta, roteiro, assets, preview e publicacao.

Padrao obrigatorio da listagem:

- tabela paginada;
- seletor `Exibir 10, 20, 50, 100`;
- busca por titulo, data, status ou ID;
- filtros por status, data, publicacao e aprovacao;
- checkbox por linha;
- checkbox no cabecalho para selecionar a pagina atual;
- acoes por linha com botoes visiveis para abrir, editar e executar a proxima acao valida;
- barra de acoes em lote quando houver selecao;
- contador de itens selecionados;
- acoes em lote somente para operacoes seguras e idempotentes no MVP;
- total de itens e pagina atual visiveis no rodape;
- paginacao com primeira, anterior, proxima e ultima pagina.

Acoes em lote permitidas no MVP:

- gerar roteiro;
- gerar audio;
- buscar assets;
- gerar preview;
- exportar selecao;
- atualizar status quando a transicao for valida.

Tela de detalhes obrigatoria:

- cabecalho com status, data da edicao, duracao, aprovacoes e acoes principais;
- abas ou secoes para pauta, roteiro, fontes, assets, preview, publicacao e eventos;
- cards de resumo com contagem de noticias, assets aprovados, duracao medida e URL do YouTube quando existir;
- player ou preview quando disponivel;
- historico de eventos e erros acionaveis;
- navegacao clara de volta para a listagem.

Etapas da tela de detalhes:

1. Edicoes e status.
2. Pauta do dia.
3. Roteiro e fontes.
4. Assets e licencas.
5. Preview e aprovacao.
6. Publicacao e resultado.

### 10.8 APIs

```text
GET    /api/resumo-noticias
POST   /api/resumo-noticias
GET    /api/resumo-noticias/:id
PATCH  /api/resumo-noticias/:id
POST   /api/resumo-noticias/:id/curate
POST   /api/resumo-noticias/:id/script
POST   /api/resumo-noticias/:id/approve-script
POST   /api/resumo-noticias/:id/audio
POST   /api/resumo-noticias/:id/assets
POST   /api/resumo-noticias/:id/preview
POST   /api/resumo-noticias/:id/approve-final
POST   /api/resumo-noticias/:id/render
POST   /api/resumo-noticias/:id/schedule
```

Todas as mutacoes validam o estado atual e retornam `409` para transicao invalida ou job duplicado.

### 10.9 Publicacao

- somente plataforma `YOUTUBE`;
- piloto sempre `PRIVATE` ou `UNLISTED`;
- titulo, descricao, thumbnail e URL das fontes revisados;
- arquivo de legenda pode ser enviado ao YouTube sem aparecer queimado no MP4;
- chave idempotente por `editionId + renderHash`;
- salvar ID e URL do YouTube;
- nenhuma chamada ao agendador do Meta.

## 11. Produto B - Video educacional profissional

### 11.1 Duracao inicial

- configuravel entre 300 e 480 segundos;
- manter suporte posterior para 600 segundos;
- palavras calculadas pela velocidade escolhida;
- duracao final baseada no audio medido.

### 11.2 Planejamento

Separar geracao em:

1. estrategia e capitulos;
2. roteiro falado por capitulo;
3. revisao e aprovacao do roteiro;
4. audio por capitulo;
5. duracao real;
6. plano visual por capitulo;
7. assets;
8. preview;
9. aprovacao final;
10. render e publicacao.

O endpoint `/process` deixa de ser a acao principal. Durante a transicao, deve retornar uma mensagem orientando o uso do workflow ou executar somente etapas explicitamente aprovadas.

### 11.3 Composicao `LongFormEducationLandscape`

Componentes minimos:

- `EducationOpening`;
- `EducationChapterIntro`;
- `EducationBroll`;
- `EducationExplainer`;
- `EducationDiagram`;
- `EducationComparison`;
- `EducationChecklist`;
- `EducationScreenDemo`;
- `EducationProgress`;
- `EducationEndCard`.

Direcao de arte:

- identidade consistente por video;
- uma paleta principal e uma cor de destaque;
- fonte propria carregada no bundle;
- transicoes de capitulo distintas de cortes internos;
- cards sem paragrafos longos;
- b-roll de 3 a 6 segundos;
- demonstracoes reais quando o tema tratar de ferramenta;
- numeros somente quando presentes no roteiro e com fonte;
- end card com CTA aprovado.

### 11.4 Assets por capitulo

- gerar consultas concretas por capitulo;
- permitir uploads do operador;
- priorizar gravacao de tela para tutoriais;
- nao distribuir assets com modulo circular simples;
- bloquear asset duplicado em sequencia;
- armazenar asset normalizado e hash;
- permitir substituir um asset sem replanejar o roteiro.

### 11.5 Preview e edicao parcial

- preview em 1280x720;
- watermark opcional `PREVIEW`;
- regenerar roteiro, audio, assets ou render de um capitulo;
- atualizar hashes dependentes;
- render final somente depois de aprovacao do preview;
- concatenar capitulos normalizados preferencialmente com `-c copy`.

### 11.6 Admin existente

Evoluir `/admin/videos-longos` para mostrar:

- briefing;
- capitulos e cobertura;
- roteiro editavel;
- duracao estimada e medida;
- assets por capitulo;
- preview;
- duas aprovacoes;
- progresso e tempo por etapa;
- partes reutilizadas;
- modo de concat;
- custo quando disponivel;
- fila e URL do YouTube.

## 12. Performance

### 12.1 Metas de engenharia

As metas iniciais devem ser confirmadas pelo benchmark da Fase 0:

- 100% das etapas com `durationMs` registrado;
- concat por `copy` em pelo menos 95% dos videos normalizados;
- zero upload duplicado em retry;
- retomada sem refazer segmentos validos;
- reducao de pelo menos 30% no tempo total contra o baseline para o mesmo projeto;
- preview mais rapido que o render final;
- nenhuma espera de download ocupando o bloqueio de Chromium.

### 12.2 Benchmark obrigatorio

Usar tres fixtures:

- noticia de 3 minutos;
- noticia de 5 minutos;
- educacional de 6 minutos.

Registrar CPU, memoria, tempo por etapa, tamanho, duracao, modo de concat e erros. Testar concorrencia externa 1 e 2 antes de alterar o padrao.

## 13. Seguranca editorial e direitos

- Guardar snapshots das fontes usadas no roteiro.
- Nao usar conteudo integral de terceiros.
- Nao tratar b-roll como registro do acontecimento.
- Exigir revisao reforcada para temas sensiveis.
- Nao expor chaves do Pexels, storage, OpenAI ou YouTube.
- Sanitizar logs e mensagens exibidas no admin.
- Manter disclosure de IA quando exigido pela plataforma.
- Permitir cancelar uma edicao antes da publicacao.

## 14. Testes

### 14.1 Unitarios

- transicoes de estado;
- normalizacao da data da edicao;
- deduplicacao de posts e assets;
- calculo de palavras e duracao;
- hashes e invalidacao;
- validacao de perfil de midia;
- construcao do videoSpec;
- idempotencia de agendamento.

### 14.2 Integracao

- criar edicao e itens;
- aprovar roteiro;
- gerar audio simulado e medir duracao;
- descobrir e normalizar assets simulados;
- renderizar fixture curta;
- concat por copy;
- retomar depois de falha;
- impedir publicacao duplicada.

### 14.3 Render visual

- screenshots em frames conhecidos;
- safe area;
- legibilidade das tarjas;
- ausencia de tela vazia;
- asset fallback;
- audio presente;
- duracao do MP4 dentro da tolerancia de 1 segundo.

### 14.4 Piloto humano

- cinco resumos diarios revisados;
- cinco educacionais de referencia depois da Fase 3;
- checklist de qualidade preenchida;
- registro de tempo manual gasto;
- avaliacao de retencao e feedback antes de automatizar.

## 15. Feature flags

```text
DAILY_NEWS_VIDEO_ENABLED=false
DAILY_NEWS_AUTO_SCHEDULE_ENABLED=false
LONG_FORM_WORKFLOW_V2_ENABLED=false
VIDEO_MEDIA_NORMALIZATION_ENABLED=false
VIDEO_RENDER_MAX_CONCURRENCY=1
VIDEO_TTS_MAX_CONCURRENCY=2
VIDEO_DOWNLOAD_MAX_CONCURRENCY=3
```

Flags novas iniciam desligadas em producao. O piloto pode ser ativado somente para administradores.

## 16. Rollout

### Fase 0 - baseline e seguranca

- telemetria;
- remocao da aprovacao automatica;
- fixtures e benchmark;
- validacao do concat atual.

### Fase 1 - midia e performance

- probe;
- normalizacao;
- filas separadas;
- downloads concorrentes limitados;
- preview 720p;
- hashes e retomada.

### Fase 2 - resumo diario MVP

- modelos e migration;
- APIs e tela;
- roteiro, TTS e assets;
- `DailyNewsLandscape`;
- preview e publicacao privada;
- cinco edicoes piloto.

Nenhuma frente educacional nova entra em implementacao antes da aprovacao do `GATE 2`, salvo correcoes compartilhadas necessarias para viabilizar o resumo diario.

### Fase 3 - educacional V2

- workflow com duas aprovacoes;
- audio antes da timeline;
- composicao exclusiva;
- assets por capitulo;
- preview e edicao parcial;
- cinco videos de referencia.

### Fase 4 - automacao e escala

- agendamento automatico de edicoes aprovadas;
- alertas;
- concorrencia baseada em benchmark;
- dashboard de operacao e desempenho;
- expansao gradual da duracao.

## 17. Criterios de aceite globais

- [ ] Os fluxos de noticia e educacional sao independentes.
- [ ] Nenhum video longo e enviado ao Meta.
- [ ] Nenhum video publica sem aprovacao final.
- [ ] A duracao da timeline usa o audio medido.
- [ ] Todo asset externo possui rastreabilidade.
- [ ] Preview e render final sao artefatos distintos.
- [ ] Retry nao duplica upload nem publicacao.
- [ ] O operador identifica onde o tempo foi gasto.
- [ ] O concat informa `copy` ou `reencode`.
- [ ] Partes validas sao reutilizadas.
- [ ] As telas de noticias seguem o padrao de listagem, lote e detalhes definido na spec.
- [ ] Os pipelines existentes continuam funcionando.
- [ ] TypeScript, build e testes especificos passam.

## 18. Definicao de pronto

Uma fase esta pronta somente quando:

1. migration e rollback foram revisados;
2. endpoints validam autorizacao e estado;
3. logs nao contem segredos;
4. testes da fase passam;
5. interface exibe falha acionavel;
6. documentacao e checklist foram atualizadas;
7. feature flag permite desligar o comportamento;
8. foi executado pelo menos um fluxo completo em ambiente de teste;
9. nao houve regressao em videos curtos, Shopee, noticias ou YouTube;
10. a porta de qualidade da fase foi aprovada.

## 19. Decisoes fixadas

- O resumo diario sera o primeiro produto novo.
- Toda entrega inicial do programa sera direcionada a noticias ate a conclusao do `GATE 2`.
- O piloto tera 3 a 5 minutos.
- O piloto usara Pexels, narracao e graficos leves do Remotion.
- Legenda visual palavra por palavra nao e obrigatoria.
- Um arquivo de legenda para YouTube continua recomendado.
- O educacional sera inicialmente reduzido para 5 a 8 minutos.
- Remotion sera mantido e recebera composicoes proprias.
- A publicacao inicial do resumo sera privada ou nao listada.
- Cinco edicoes serao avaliadas antes da automacao.
- Concorrencia sera aumentada somente depois de benchmark.

## 20. Pendencias de produto antes da Fase 2

- nome exibido para o boletim diario;
- horario de corte das noticias;
- horario desejado de publicacao;
- identidade visual: logo, cores e fonte;
- voz padrao;
- responsavel pela aprovacao editorial;
- categorias de noticia aceitas no piloto;
- playlist do YouTube;
- politica para edicao em dias sem cinco noticias elegiveis.

Essas pendencias nao bloqueiam a Fase 0 nem a Fase 1.
