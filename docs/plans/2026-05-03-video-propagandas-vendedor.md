# Planejamento - Aba Propagandas / Video Vendedor (2026-05-03)

## Objetivo
- Criar uma nova aba administrativa chamada `Propagandas` para gerar videos de venda de produtos.
- Reaproveitar a infraestrutura ja existente de `video-code`, TTS, Remotion, upload e fila social.
- Permitir upload de varias imagens e videos do produto, alem do uso opcional de midias externas da plataforma de busca.
- Criar um agente de IA focado em venda para gerar roteiro, narracao, CTA e estrutura visual.
- Separar a criacao em 2 etapas:
  - etapa 1: gerar e revisar prompt/narracao/estrutura JSON
  - etapa 2: gerar audio, montar e renderizar o video final
- Permitir ajuste manual de cores principais de fundo e cor predominante do texto antes do render.

---

## Reaproveitamento da Base Atual

### O que ja existe e deve ser reutilizado
- `CodeVideoProject` ja guarda:
  - `ideaPrompt`
  - `title`
  - `description`
  - `narrationText`
  - `videoSpecJson`
  - `ttsVoice`
  - `ttsSpeed`
  - `videoUrl`
- `POST /api/video-code/generate` ja gera roteiro, cenas e `videoSpecJson` com IA.
- `POST /api/video-code/render` ja gera narracao, transcricao, render MP4 e upload.
- `POST /api/upload` ja e a base natural para subir imagens e videos do produto.
- `admin/video-code` ja possui:
  - listagem
  - detalhe
  - edicao do roteiro
  - visualizacao do JSON
  - renderizacao

### Decisao recomendada
- Nao criar uma stack paralela de video.
- Criar a aba `Propagandas` como especializacao do fluxo `video-code`, com metadados e UX proprios para venda de produto.

---

## Fluxo do Usuario

### Lista
- Nova rota: `admin/propagandas`
- Exibir tabela/lista com:
  - data de criacao
  - status
  - nome do produto
  - tipo/formato do video
  - duracao
  - tem video final ou nao
  - acoes para abrir
- Botao lateral/menu: `Criar propaganda`

### Criacao
- Nova rota: `admin/propagandas/new`
- Campos principais:
  - nome do produto
  - descricao do produto
  - descricao tecnica / materiais / especificacoes
  - onde pode ser usado
  - publico-alvo
  - faixa de preco opcional
  - link do produto
  - frase obrigatoria de CTA
  - voz da narracao
  - duracao do video
  - formato do video
  - cor principal de fundo
  - cor principal do texto
  - permitir uso de midia externa
- Upload multiplo de imagens e videos do produto.

### Etapa 1 - Gerar roteiro vendedor
- Ao clicar em `Gerar propaganda`, o sistema deve:
  - montar o prompt comercial
  - enviar contexto do produto + midias disponiveis
  - retornar:
    - titulo
    - descricao curta do video
    - narracao completa
    - CTA
    - anchors mentais de venda
    - estrutura de cenas
    - `videoSpecJson`
- A tela deve mostrar:
  - prompt enviado
  - texto da narracao
  - resumo comercial
  - JSON bruto/esqueleto do video

### Etapa 2 - Criar video
- Depois da revisao manual, o usuario clica em `Criar video`.
- O sistema:
  - gera a narracao
  - monta as cenas com imagens/videos do produto
  - aplica legenda
  - renderiza MP4
  - salva o video final

### Consulta de propaganda pronta
- Nova rota: `admin/propagandas/[id]`
- Deve permitir:
  - abrir o video
  - revisar narracao
  - revisar JSON
  - editar titulo/descricao/cores
  - reexecutar geracao
  - renderizar novamente

---

## Regras de Negocio do Agente de IA

### Papel do agente
- O agente deve agir como um vendedor especialista em videos de conversao para produtos fisicos e bens de consumo.
- O foco nao e apenas descrever; e converter interesse em clique e compra.

### Instrucoes obrigatorias do agente
- Explicar o produto com riqueza de detalhes.
- Destacar:
  - material
  - acabamento
  - componentes
  - diferenciais
  - aplicacoes de uso
  - ambiente ideal
  - beneficios praticos
  - beneficios emocionais
- Inserir CTA recorrente informando que:
  - o link do produto com desconto especial esta na descricao do video
- Aplicar anchors mentais de venda, por exemplo:
  - urgencia moderada
  - oportunidade
  - praticidade
  - conforto
  - economia
  - prova de valor
  - comparacao implita com alternativas fracas
- Evitar promessas falsas, claims juridicamente arriscadas e garantias absolutas.

### Saida esperada do agente
- `title`
- `description`
- `narrationText`
- `salesAngles`
- `ctaText`
- `visualGuidance`
- `suggestedPalette`
- `scenes`

---

## Modelagem Recomendada

### Opcao recomendada
- Evoluir `CodeVideoProject` para suportar um tipo de projeto.

### Campos novos sugeridos em `CodeVideoProject`
- [ ] `projectType String @default("GENERIC")`
- [ ] `sourceMode String?`
- [ ] `productName String?`
- [ ] `productShortDescription String?`
- [ ] `productTechnicalDetails String?`
- [ ] `productUseCases String?`
- [ ] `targetAudience String?`
- [ ] `productUrl String?`
- [ ] `ctaText String?`
- [ ] `brandVoice String?`
- [ ] `primaryBgColor String?`
- [ ] `primaryTextColor String?`
- [ ] `promptPreview String?`
- [ ] `aiStrategyJson String?`

### Midias do produto
- Recomendado criar tabela dedicada, por exemplo `CodeVideoAsset`:
  - [ ] `id`
  - [ ] `codeVideoProjectId`
  - [ ] `kind` (`IMAGE` | `VIDEO`)
  - [ ] `origin` (`UPLOAD` | `PEXELS` | `PLATFORM`)
  - [ ] `url`
  - [ ] `thumbnailUrl`
  - [ ] `mimeType`
  - [ ] `sortOrder`
  - [ ] `selected`
  - [ ] `metadataJson`

### Beneficio dessa abordagem
- Mantemos um unico motor de render.
- A UX pode ser especializada sem duplicar pipeline.
- Futuramente poderemos ter outros tipos:
  - `PRODUCT_AD`
  - `SHORT_NEWS`
  - `QUESTION_VIDEO`

---

## Epic 1 - Nova Aba Propagandas no Admin

### Tasks
- [ ] Adicionar item de menu `Propagandas` no layout admin.
- [ ] Criar rota `app/(admin)/admin/propagandas/page.tsx`.
- [ ] Criar rota `app/(admin)/admin/propagandas/new/page.tsx`.
- [ ] Criar rota `app/(admin)/admin/propagandas/[id]/page.tsx`.
- [ ] Garantir navegacao lateral com botao `Criar propaganda`.

### Aceite
- [ ] O usuario consegue entrar na aba `Propagandas`.
- [ ] O usuario consegue abrir lista, criar nova propaganda e consultar uma existente.

---

## Epic 2 - Modelagem de Produto e Midias

### Backend e banco
- [ ] Adicionar `projectType` e campos comerciais em `prisma/schema.prisma`.
- [ ] Criar tabela de ativos/midias vinculadas ao projeto.
- [ ] Gerar migracao Prisma.
- [ ] Atualizar selects e serializers das rotas de projeto.

### API
- [ ] Atualizar `POST /api/video-code/projects` para aceitar payload de propaganda.
- [ ] Atualizar `PATCH /api/video-code/projects/[id]` para salvar metadados do produto.
- [ ] Criar endpoint para listar assets de um projeto.
- [ ] Criar endpoint para anexar/remover/reordenar assets.

### Aceite
- [ ] Cada propaganda salva nome do produto, descricao detalhada, CTA, cores e seus assets.

---

## Epic 3 - Tela Criar Propaganda

### UI
- [ ] Montar formulario de criacao com foco em venda.
- [ ] Permitir upload multiplo de imagem e video.
- [ ] Exibir preview dos arquivos enviados.
- [ ] Permitir reorder manual dos assets.
- [ ] Permitir marcar assets principais para o video.
- [ ] Permitir escolher:
  - formato
  - duracao
  - voz
  - velocidade
  - cor de fundo
  - cor de texto
  - usar midia externa

### UX recomendada
- [ ] Separar a tela em blocos:
  - produto
  - especificacoes tecnicas
  - assets
  - configuracoes do video
  - estrategia comercial

### Aceite
- [ ] O usuario consegue criar uma propaganda sem editar JSON manualmente.

---

## Epic 4 - Agente de IA Vendedor

### Objetivo
- Criar um prompt/agente especializado em propaganda de produto com foco em conversao.

### Tasks
- [ ] Criar variante de prompt em `app/api/video-code/generate/route.ts` para `projectType = PRODUCT_AD`.
- [ ] Injetar contexto estruturado do produto no prompt.
- [ ] Injetar lista de assets enviados no prompt.
- [ ] Injetar links/urls de assets externos quando disponiveis.
- [ ] Pedir ao modelo:
  - roteiro de venda
  - CTA recorrente
  - texto de narracao sem marcacoes indevidas
  - cenas orientadas a mostrar produto
  - paleta sugerida
  - justificativa curta da estrategia comercial
- [ ] Salvar `promptPreview` no banco para exibicao na UI.
- [ ] Salvar `aiStrategyJson` com anchors mentais, angulos de venda e paleta sugerida.

### Aceite
- [ ] O roteiro gerado parece anuncio comercial e nao video generico.
- [ ] A narracao cita o link com desconto especial na descricao do video.

---

## Epic 5 - Geracao em 2 Etapas

### Etapa 1 - Pre-visualizacao inteligente
- [ ] Exibir o prompt enviado para a IA.
- [ ] Exibir `narrationText` em campo editavel.
- [ ] Exibir `description`/resumo em campo editavel.
- [ ] Exibir `aiStrategyJson` em painel tecnico.
- [ ] Exibir `videoSpecJson` formatado.

### Etapa 2 - Render final
- [ ] Manter reaproveitamento de `POST /api/video-code/render`.
- [ ] Garantir que o render use assets do projeto em vez de apenas material externo.
- [ ] Validar sincronizacao entre duracao narrada e duracao visual.
- [ ] Exibir progresso e erros do render na tela.

### Aceite
- [ ] O usuario revisa antes de gastar tempo no render.
- [ ] O botao `Criar video` so aparece apos a etapa 1 estar pronta.

---

## Epic 6 - Adaptacao do VideoSpec para Propaganda

### Objetivo
- Garantir que o JSON montado favoreca vitrine de produto, beneficios e CTA.

### Tasks
- [ ] Definir cenas base para anuncios:
  - `HookScene`
  - `ProductShowcaseScene`
  - `BenefitScene`
  - `FeatureListScene`
  - `LifestyleScene`
  - `OfferScene`
  - `ClosingCtaScene`
- [ ] Se for melhor para acelerar, mapear essas necessidades inicialmente para templates ja existentes:
  - `TitleScene`
  - `RetentionScene`
  - `BulletListScene`
  - `BigNumberScene`
  - `QuoteScene`
- [ ] Permitir priorizar imagens e videos enviados pelo usuario nas cenas.
- [ ] Reservar blocos de legenda e CTA de fechamento.
- [ ] Garantir repeticao controlada do CTA em pontos estrategicos.

### Aceite
- [ ] O video mostra produto, beneficios e fechamento comercial de forma clara.

---

## Epic 7 - Controle de Paleta e Identidade Visual

### Objetivo
- Permitir que a IA sugira as melhores cores, mas o usuario tenha controle final.

### Tasks
- [ ] Adicionar campos `primaryBgColor` e `primaryTextColor` no projeto.
- [ ] Permitir que a IA retorne `suggestedPalette`.
- [ ] Preencher a UI com sugestao automatica.
- [ ] Permitir editar manualmente antes do render.
- [ ] Aplicar cores selecionadas ao `videoSpecJson`.
- [ ] Criar fallback automatico de contraste para manter legibilidade.

### Aceite
- [ ] O usuario consegue forcar a identidade visual desejada.
- [ ] A IA nao quebra legibilidade ao sugerir paletas agressivas.

---

## Epic 8 - Lista, Filtros e Consulta de Propagandas

### Tasks
- [ ] Criar listagem dedicada para `projectType = PRODUCT_AD`.
- [ ] Exibir colunas:
  - criado em
  - status
  - produto
  - duracao
  - formato
  - video pronto
- [ ] Adicionar filtros por:
  - status
  - formato
  - com video / sem video
  - busca por nome do produto
- [ ] Permitir abrir detalhe para revisar propaganda criada.

### Aceite
- [ ] O usuario encontra rapidamente anuncios criados e seu status.

---

## Epic 9 - Integracao com Assets Externos e Plataforma de Busca

### Objetivo
- Usar primeiro os assets do usuario e complementar com material externo quando fizer sentido.

### Tasks
- [ ] Definir prioridade de uso:
  - upload do usuario
  - assets escolhidos da plataforma
  - busca externa
- [ ] Criar estrategia para nao depender apenas de Pexels quando houver assets proprios.
- [ ] Permitir selecionar quais assets externos entram na propaganda.
- [ ] Registrar origem de cada asset utilizado no projeto.

### Aceite
- [ ] O video utiliza preferencialmente o material do proprio produto.

---

## Epic 10 - Publicacao e Reuso Comercial

### Possivel extensao desta fase ou seguinte
- [ ] Adicionar acao de enfileirar propaganda pronta para:
  - Meta Reel
  - Meta Story
  - YouTube Shorts
  - LinkedIn
- [ ] Preencher `summary` da fila social com CTA comercial.
- [ ] Gerar descricao social coerente com o link do produto.

### Aceite
- [ ] Uma propaganda pronta pode seguir para distribuicao sem retrabalho.

---

## Ordem Recomendada de Implementacao
1. Epic 2 - Modelagem de produto e midias
2. Epic 1 - Nova aba Propagandas no admin
3. Epic 3 - Tela Criar Propaganda
4. Epic 4 - Agente de IA vendedor
5. Epic 5 - Geracao em 2 etapas
6. Epic 7 - Controle de paleta
7. Epic 8 - Lista e consulta
8. Epic 9 - Integracao com assets externos
9. Epic 6 - Refino do VideoSpec comercial
10. Epic 10 - Publicacao social

---

## MVP Recomendado

### Escopo minimo para colocar no ar rapido
- [ ] Nova aba `Propagandas`
- [ ] Criacao de projeto com:
  - nome do produto
  - descricao
  - link
  - CTA
  - upload de imagens
  - cor de fundo
  - cor do texto
- [ ] Agente de IA `PRODUCT_AD`
- [ ] Etapa 1 com preview de narracao e `videoSpecJson`
- [ ] Etapa 2 com render final
- [ ] Lista de propagandas criadas

### Itens que podem ficar para fase 2
- [ ] Upload de videos alem de imagens
- [ ] reorder avancado de assets
- [ ] score automatico de conversao do roteiro
- [ ] biblioteca de templates comerciais
- [ ] publicacao direta multi-plataforma

---

## Riscos e Pontos de Atencao
- [ ] Se a modelagem continuar totalmente generica, a UX da propaganda pode ficar confusa.
- [ ] Sem tabela de assets, o sistema pode perder controle de prioridade e ordem das imagens.
- [ ] O prompt comercial precisa equilibrar persuasao com compliance.
- [ ] O render atual precisa ser verificado para uso consistente de varios assets locais no mesmo projeto.
- [ ] Se o CTA for inserido em excesso, a narracao pode ficar artificial.

---

## Checklist Executivo
- [ ] Criar nova aba `Propagandas`
- [ ] Reutilizar `CodeVideoProject` com `projectType = PRODUCT_AD`
- [ ] Criar modelagem de assets do produto
- [ ] Criar formulario com upload multiplo e dados comerciais
- [ ] Criar agente de IA vendedor com CTA recorrente
- [ ] Exibir prompt, narracao e JSON antes do render
- [ ] Permitir escolher/editar cores principais
- [ ] Criar lista de propagandas geradas
- [ ] Permitir abrir, revisar e rerenderizar propaganda pronta
