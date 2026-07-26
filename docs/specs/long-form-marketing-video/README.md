# Spec Driven Development — Vídeo Longo de Marketing Digital para YouTube

**Status:** proposta para aprovação de produto, qualidade e custo.  
**Escopo:** nova experiência independente para criar vídeos horizontais de 8–10 minutos sobre marketing digital e publicar somente no canal YouTube já conectado.  
**Fora de escopo:** notícias, múltiplos canais, alteração da automação de vídeos curtos, publicação em Instagram/TikTok e substituição das pipelines existentes.

## 1. Objetivo e decisão de produto

Criar uma nova aba/tela administrativa chamada **Vídeos Longos**. Nela, o operador informa:

- estágio do funil: `TOPO`, `MEIO` ou `FUNDO`;
- tema/título-base;
- de 4 a 10 subtítulos/tópicos que obrigatoriamente serão ensinados;
- público, oferta/CTA e tom opcionais;
- preferência visual e se aceita mídia externa licenciada;
- agendamento opcional para o único canal YouTube conectado.

A IA deve produzir uma aula original: estrutura didática, roteiro falado, plano de cenas Remotion, buscas para b-roll, slides/gráficos/diagramas, título atrativo e honesto, thumbnail, descrição SEO e tags. O resultado deve explicar todos os subtítulos fornecidos, não apenas mencioná-los.

"Clickbait" significa despertar curiosidade de forma verdadeira: título e capa prometem um benefício, erro, método ou descoberta que o vídeo realmente explica. Promessas de resultado financeiro garantido, manipulação, urgência falsa ou metadados enganosos são proibidos.

## 2. Diagnóstico do que existe hoje

O projeto já oferece componentes que podem ser reaproveitados:

| Capacidade | Situação atual | Uso na nova pipeline |
| --- | --- | --- |
| `CodeVideoProject`, status, logs e render-service | instalado | base para job, logs, áudio, artefatos e render |
| Remotion | cenas `Title`, `BulletList`, `Chart`, `Timeline`, `CodeTyping`, `Retention` etc. | reaproveitar e expandir para capítulos longos e layouts 16:9 |
| Pexels | busca de vídeo externo por palavra-chave | b-roll ilustrativo permitido, com crédito e rastreabilidade |
| integração YouTube | upload para o canal autenticado | publicação do vídeo longo após aprovação |
| geração de roteiro/cenas | existe em `app/api/video-code/generate` | não deve ser reaproveitada diretamente: foi pensada para 15–60 s e 4–8 cenas |

O planejamento atual usa `VIDEO_CODE_AI_MODEL` com fallback para `gpt-4o-mini`. Isso explica por que ele é econômico, porém limitado para roteiro longo, coerência entre capítulos e direção de arte. A pipeline nova não deve mudar esse fallback para todos os produtos: terá uma configuração de modelo própria.

## 3. Arquitetura criativa: IA planeja; Remotion entrega

Remotion não é uma IA de vídeo; é o motor determinístico que monta o vídeo a partir de uma especificação. A qualidade vem de uma combinação de:

1. IA mais capaz para roteiro e direção criativa;
2. contrato JSON rígido para a timeline;
3. biblioteca visual melhor — b-roll, cards, gráficos, telas demonstrativas, motion e transições;
4. validação automática e revisão humana da prévia.

Não é recomendado gerar 10 minutos inteiros como vídeo sintético. Além de aumentar muito custo e inconsistência, pode confundir ilustração com demonstração real. Para conteúdo de marketing, o formato de alta qualidade é híbrido:

```text
roteiro original + narração
       ↓
IA cria plano de capítulos e cenas
       ↓
Pexels / uploads / telas e gráficos Remotion / imagens geradas para conceito
       ↓
Remotion monta um único MP4 16:9 com legendas, capítulos e identidade visual
```

Cada vídeo precisa variar de forma real: exemplos, argumento, estrutura, imagens e conclusão devem decorrer do tema, não apenas trocar palavras em um template.

## 4. Modelo de IA recomendado e custo estimado

### Recomendação inicial

| Papel | Modelo proposto | Motivo |
| --- | --- | --- |
| planejamento, roteiro, plano visual e metadados | `gpt-4o-mini` | mantém o modelo, a configuração e o custo já utilizados no projeto; a melhoria de resultado virá do fluxo em etapas, prompts, schema e revisão |
| revisão final opcional de qualidade | não entra no MVP | o operador revisa roteiro, prévia, título e capa; um modelo superior poderá ser avaliado futuramente sem alterar o padrão |
| melhoria futura | modelo configurável, avaliado separadamente | somente após testes comparativos que comprovem ganho real de qualidade e custo aceitável |

A escolha segue a orientação oficial de priorizar a qualidade/precisão primeiro e então reduzir custo comparando um modelo menor contra uma base avaliada. [Guia de seleção de modelos da OpenAI](https://developers.openai.com/api/docs/guides/model-selection). A pipeline deve usar **Structured Outputs**/schema JSON em vez de procurar o primeiro e último caractere `{}` de uma resposta livre; isso reduz falhas na criação de timeline. [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs).

### Controle de custo por vídeo de 10 minutos

Premissa operacional inicial: cerca de 21 mil tokens de entrada e 14 mil de saída, distribuídos entre briefing, roteiro, plano de 40–70 cenas, metadata e checagens. O sistema deve calcular o custo usando a tarifa configurada para `gpt-4o-mini` no ambiente e salvar tokens/custo real de cada chamada; não deve trocar de modelo para estimar ou executar uma geração.

O custo total inclui, além do texto: narração, geração de imagem/capa quando ativada, download de mídia, armazenamento e GPU/render Remotion. A tela deve mostrar a estimativa antes de gerar, aplicar um teto de custo e apresentar o realizado após cada etapa. A tabela oficial de preços continua sendo a referência para uma eventual reavaliação futura: [OpenAI API Pricing](https://developers.openai.com/api/docs/pricing).

**Decisão de MVP:** `gpt-4o-mini` permanece como modelo de criação e não haverá modelo premium nesta primeira versão. Só após cinco vídeos de teste será feita uma comparação opcional de qualidade/custo com outro modelo; nenhuma troca ocorrerá sem aprovação explícita.

## 5. Funil e padrão editorial

| Funil | Objetivo do vídeo | CTA permitido |
| --- | --- | --- |
| Topo | despertar entendimento e resolver uma dúvida ampla | inscrição, vídeo relacionado, material gratuito |
| Meio | comparar métodos, mostrar processo e reduzir objeções | checklist, aula complementar, ferramenta/teste |
| Fundo | ensinar decisão/implementação e apresentar oferta de forma transparente | oferta, demonstração, link, chamada de diagnóstico |

Em todos os estágios:

- ensinar, na mesma ordem ou em uma ordem didaticamente melhor, todos os tópicos fornecidos;
- separar fato, exemplo e opinião;
- não prometer faturamento, resultado garantido, prazo garantido nem burlar plataforma;
- quando citar dados, preço de ferramenta, recurso ou regra de plataforma, exigir fonte enviada pelo operador ou marcar o trecho para revisão;
- usar exemplos hipotéticos identificados como exemplos.

## 6. Fluxo completo

```text
Briefing (título + 4–10 subtítulos + funil)
        ↓
Validação de escopo e termos de risco
        ↓
Estratégia / outline / promessa honesta
        ↓
Roteiro longo, fonte por afirmação e cobertura dos tópicos
        ↓
Plano de cenas e consultas de mídia
        ↓
Busca/licenciamento de assets + geração de gráficos/cards
        ↓
Narração e composição Remotion 16:9
        ↓
Prévia + verificador de qualidade + aprovação humana
        ↓
Título, thumbnail, descrição, tags e capítulos aprovados
        ↓
Upload/agendamento no canal atual do YouTube
```

### 6.1 Contrato de entrada

```json
{
  "funnelStage": "TOPO|MEIO|FUNDO",
  "workingTitle": "...",
  "subtopics": ["...", "..."],
  "audience": "...",
  "objective": "...",
  "offerOrCta": "...",
  "tone": "didatico|direto|energetico",
  "externalMediaPolicy": "PEXELS_AND_UPLOADS|UPLOADS_ONLY",
  "brandPreset": "...",
  "publishMode": "DRAFT|SCHEDULED"
}
```

Validações: título entre 20–100 caracteres; 4–10 tópicos únicos e não vazios; CTA obrigatório para fundo de funil; duração alvo configurável entre 8 e 10 minutos; conteúdo com promessa de ganho, saúde, jurídico ou alegação de plataforma vai para revisão reforçada.

### 6.2 Saída estruturada obrigatória

O modelo deve retornar um objeto validado por schema com:

- `strategy`: público, nível de consciência, promessa, ângulo de curiosidade e CTA;
- `outline`: capítulos, objetivos de aprendizagem e subtópicos cobertos;
- `narrationText`: 1.150–1.450 palavras, em português do Brasil, somente o texto falado;
- `scenes`: 40–70 cenas com timestamps, template/layout, texto curto, asset, intenção e transição;
- `assetQueries`: buscas Pexels em inglês, mais alternativas e razão;
- `youtube`: três títulos, descrição, tags, capítulos, comentário fixado e palavras-chave;
- `thumbnail`: três conceitos, texto de 2–5 palavras, prompt e asset/ilustração permitida;
- `reviewFlags`: afirmações verificáveis, promessas, dados ausentes e trechos que exigem decisão humana.

O backend deve rejeitar resposta que não cumpra o schema, tenha duração fora do alvo, não cubra todos os subtítulos ou tente inserir URL não permitida.

## 7. Timeline e direção de arte do Remotion

### Estrutura temporal-alvo

| Faixa | Conteúdo | Linguagem visual |
| --- | --- | --- |
| 0:00–0:25 | gancho, dor/benefício e promessa | título forte, b-roll curto, ritmo alto |
| 0:25–0:50 | contexto e mapa do que será aprendido | apresentador/narrador + roadmap animado |
| 0:50–8:50 | 4–10 módulos | alternância entre explicação, prova, b-roll, diagrama, gráfico e passo a passo |
| 8:50–9:30 | síntese e próximos passos | checklist visual + recap |
| 9:30–10:00 | CTA alinhado ao funil | endcard, link/ação e vídeo relacionado |

Regras de edição:

- não manter uma tela estática por mais de 6 segundos sem movimento, mudança relevante ou camada visual;
- b-roll/asset externo por 2–6 segundos, usado como apoio e não como decoração aleatória;
- textos de tela curtos, legíveis e complementares à fala;
- gráficos e números só com origem registrada;
- usar capturas de tela enviadas pelo operador para demonstrar ferramentas reais; não gerar UI falsa apresentada como produto real;
- todos os assets externos possuem URL, autor/plataforma, licença e timestamp de uso;
- legenda sincronizada, capítulos, abertura e endcard consistentes com a marca.

### Composição nova

Criar `LongFormMarketingLandscape` em 1920×1080, 30 fps. Componentes novos sugeridos:

- `LongFormChapterIntro`;
- `LongFormBrollScene`;
- `LongFormPresenterPip` (opcional, quando houver vídeo da apresentadora);
- `LongFormExplainerCard`;
- `LongFormDiagramScene`;
- `LongFormScreenDemoFrame`;
- `LongFormProgressBar`;
- `LongFormEndCard`.

Os componentes já existentes devem permanecer intactos. A composição nova deve aceitar um `videoSpec` específico, sem alterar o contrato dos vídeos curtos, notícias ou anúncios de produto.

## 8. Mídia externa e imagens geradas

### Ordem de preferência

1. mídia, gravação de tela e assets enviados pelo operador;
2. vídeos/imagens do Pexels já integrado, com origem salva;
3. gráficos, diagramas, títulos e mockups produzidos no Remotion;
4. imagem gerada para conceito abstrato, com prompt e versão guardados.

Não usar mídia de YouTube, Instagram, TikTok, Google Images ou sites de concorrentes baixada automaticamente. Não usar material de terceiros para sugerir endosso, resultado ou demonstração que não ocorreu.

Para thumbnail, a imagem pode ser gerada ou montada com assets licenciados, mas precisa ter versão editável, texto aplicado pelo sistema e aprovação humana. A capa não deve simular interface, depoimento ou resultado inexistente.

## 9. Metadados: título, thumbnail, descrição e tags

### Títulos

Gerar três variações, classificadas por ângulo: `dor`, `curiosidade`, `método`. O operador escolhe uma. Regras:

- até 100 caracteres;
- deve explicar ou entregar a promessa no vídeo;
- evitar "segredo", "garantido", "fácil" e números sem base;
- se houver ferramenta, versão, preço ou regra atual, manter a data/versão correta ou pedir revisão.

### Thumbnail

Três variações com: conceito, texto curto, imagem permitida, contraste, expressão/objeto quando aplicável e justificativa. A geração só roda após o título ser escolhido. O arquivo final é 1280×720 e fica associado ao vídeo antes do upload.

### Descrição e capítulos

Descrição deve conter: primeira frase com promessa real, resumo, capítulos com timestamps, CTA, links fornecidos pelo operador, aviso aplicável, fontes e três hashtags no máximo. Nunca colocar link de afiliado/oferta que não tenha sido informado e aprovado.

### Tags

Gerar 10–20 termos, não hashtags: tema central, variações de intenção de busca, público, método e ferramenta quando citada. Tags não devem trazer nomes concorrentes, promessas ou assuntos não abordados no vídeo.

## 10. Nova tela administrativa

Rota sugerida: `/admin/videos-longos`.

### Aba 1 — Criar edição

- estágio do funil;
- título-base e subtópicos ordenáveis;
- público, objetivo, CTA e tom;
- uploads (imagens, vídeos, gravações de tela, logos);
- seletor de mídia externa e preset de marca;
- estimativa de custo por etapa e modo `padrão`/`revisão premium`;
- botão **Planejar vídeo** (não publica).

### Aba 2 — Roteiro e plano visual

- outline por capítulo e indicação de cada subtítulo coberto;
- roteiro editável;
- timeline de cenas e assets associados;
- flags de revisão;
- ações: regenerar somente roteiro, somente plano visual ou somente uma cena;
- aprovação explícita para gerar áudio/render final.

### Aba 3 — Embalagem YouTube

- três títulos, thumbnails e descrição/tags/capítulos editáveis;
- player de prévia;
- checklist de política e precisão;
- canal de destino bloqueado e mostrado como o canal YouTube atualmente conectado;
- `Salvar rascunho`, `Gerar prévia`, `Agendar` e `Publicar` (os dois últimos só após aprovação).

### Aba 4 — Biblioteca/histórico

- filtro por funil, status, data e tema;
- custo estimado/real, duração, vídeo, thumbnail, URL YouTube e métricas;
- duplicar briefing; nunca duplicar publicação automaticamente.

## 11. Modelo de dados proposto

```prisma
model LongFormMarketingVideo {
  id                    String   @id @default(cuid())
  funnelStage           String
  workingTitle          String
  subtopicsJson         Json
  audience              String?
  objective             String?
  offerOrCta            String?
  tone                  String   @default("DIDATICO")
  externalMediaPolicy   String   @default("PEXELS_AND_UPLOADS")
  generationModel       String   @default("gpt-4o-mini")
  qualityReviewModel    String?
  status                String   @default("DRAFT")
  strategyJson          Json?
  scriptText            String?
  videoSpecJson         Json?
  titleOptionsJson      Json?
  selectedTitle         String?
  description           String?
  tagsJson              Json?
  chaptersJson          Json?
  thumbnailPlanJson     Json?
  thumbnailUrl          String?
  audioUrl              String?
  previewVideoUrl       String?
  finalVideoUrl         String?
  captionsUrl           String?
  estimatedCostUsd      Decimal? @db.Decimal(10, 4)
  actualCostUsd         Decimal? @db.Decimal(10, 4)
  reviewedAt            DateTime?
  publishedAt           DateTime?
  scheduledAt           DateTime?
  youtubeVideoId        String?
  youtubePostUrl        String?
  errorMessage          String?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  assets                LongFormMarketingAsset[]
  steps                 LongFormMarketingStep[]
}

model LongFormMarketingAsset {
  id, videoId, url, assetType, source, licenseUrl, credit,
  originalName, prompt, startSec, endSec, status, createdAt, updatedAt
}

model LongFormMarketingStep {
  id, videoId, stepName, status, inputTokens, outputTokens, costUsd,
  requestPayload, responsePayload, errorMessage, startedAt, finishedAt
}
```

Estados: `DRAFT → PLANNING → AWAITING_SCRIPT_REVIEW → SCRIPT_APPROVED → GENERATING_ASSETS → GENERATING_AUDIO → RENDERING_PREVIEW → AWAITING_FINAL_REVIEW → RENDERING_FINAL → READY_TO_PUBLISH → SCHEDULED → PUBLISHED`; terminais `REJECTED`, `FAILED`, `CANCELED`.

## 12. APIs e serviços

| Contrato | Responsabilidade |
| --- | --- |
| `POST /api/videos-longos` | criar rascunho com briefing validado |
| `POST /api/videos-longos/:id/plan` | estratégia, outline, roteiro e metadata estruturados |
| `POST /api/videos-longos/:id/assets` | uploads, buscas Pexels, registros de licença e thumbnail plan |
| `POST /api/videos-longos/:id/preview` | áudio + render de prévia de baixa resolução |
| `POST /api/videos-longos/:id/approve` | registrar revisão humana e liberar render final/publicação |
| `POST /api/videos-longos/:id/render` | render final 1080p |
| `POST /api/videos-longos/:id/publish` | criar `SocialPost` YouTube e chamar o uploader existente |
| `GET /api/videos-longos` e `GET /api/videos-longos/:id` | lista, detalhe, timeline, custos e auditoria |

Separar `plan` e `render` é obrigatório: evita pagar por áudio, thumbnail e GPU antes de aprovar roteiro, título e direção visual.

## 13. Checklist de implementação

### Fundação

- [ ] Manter `gpt-4o-mini` e criar configuração `LONG_FORM_MARKETING_MODEL` com esse mesmo valor, isolada dos demais fluxos.
- [ ] Criar migrations, modelos, índices e relações de assets/steps.
- [ ] Criar enum/status normalizados e logging idempotente.
- [ ] Criar limite de custo por vídeo e bloqueio quando a estimativa exceder o teto.

### Planejador com IA

- [ ] Definir JSON Schema para estratégia, roteiro, cenas, assets e metadata.
- [ ] Criar prompts por funil com regras de conteúdo honesto e cobertura de tópicos.
- [ ] Validar 4–10 subtópicos e comprovar cobertura de 100% antes de liberar revisão.
- [ ] Usar Structured Outputs e registrar modelo/tokens/custo por etapa.
- [ ] Testar cinco briefings reais com `gpt-4o-mini`, registrar falhas e avaliar melhoria de prompt/schema antes de considerar qualquer troca de modelo.

### Vídeo e assets

- [ ] Criar composição `LongFormMarketingLandscape` e componentes novos sem regressão nas composições atuais.
- [ ] Implementar busca Pexels por cena, crédito e fallback para card/diagrama.
- [ ] Implementar uploads de telas, imagens e vídeos do operador.
- [ ] Gerar VTT/legendas sincronizadas e capítulos.
- [ ] Criar prévia de baixa resolução e render final de 1920×1080.

### Capa e publicação

- [ ] Implementar planejamento e geração/montagem de três thumbnails 1280×720.
- [ ] Adicionar seleção/manual editável de título, descrição, tags e capítulos.
- [ ] Evoluir upload atual para aceitar vídeo longo, thumbnail, privacidade, agendamento e categoria adequada.
- [ ] Confirmar que a publicação usa somente a integração `YOUTUBE` atual e não altera tokens/canais.
- [ ] Salvar URL/ID do vídeo, artefatos e logs de upload.

### Interface e qualidade

- [ ] Criar rota `/admin/videos-longos` e as quatro abas definidas nesta spec.
- [ ] Exibir estimativa e custo real em dólar antes/depois de cada etapa.
- [ ] Impedir publicação sem aprovação humana, capa, descrição, tags e checklist completos.
- [ ] Criar testes de schema, duração, cobertura de subtópicos, assets sem licença e idempotência de upload.
- [ ] Testar cinco vídeos de referência com revisão humana, medir qualidade, custo e tempo total.

## 14. Critérios de aceite

- [ ] O operador cria vídeo de 8–10 minutos apenas com título e 4–10 subtítulos.
- [ ] Todos os subtítulos aparecem como conteúdo ensinado e verificável na estrutura final.
- [ ] O vídeo é horizontal, 1080p, com narração, legenda, capítulos e mistura de b-roll permitido com cenas Remotion.
- [ ] O planejamento longo usa configuração de IA própria, sem mudar os modelos dos vídeos curtos existentes.
- [ ] Cada asset externo é rastreável por URL, origem/licença e momento da timeline.
- [ ] Existem três opções de título e capa, com aprovação manual da versão final.
- [ ] A descrição, tags e CTA são gerados e editáveis.
- [ ] O custo previsto é mostrado antes da geração e o real fica auditável após ela.
- [ ] A publicação vai somente para o canal YouTube hoje conectado e só depois de revisão humana.
- [ ] Nenhum fluxo existente de notícia, Shorts, produto, Shopee ou vídeo manual sofre regressão.

## 15. Decisões pendentes antes de desenvolver

1. Teto de custo por vídeo (somando IA, voz, imagem, render e armazenamento).
2. Voz/apresentadora padrão ou somente narração para o MVP.
3. Ferramenta de imagem para thumbnails: geração por IA, composição de assets, ou ambos.
4. Identidade visual: cores, fontes, logo, endcard e padrão de CTA.
5. Política para links de afiliado e oferta de fundo de funil.
6. Quem fará a aprovação final e em qual etapa poderá agendar/publicar.
7. Cinco temas de teste para comparar qualidade antes da produção recorrente.
