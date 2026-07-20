# Spec Driven Development - Texto para Video com Imagens

## Objetivo

Criar uma nova aba no admin, separada da aba atual de `Texto para Video`, para gerar videos em que:

- a pessoa fala o texto;
- imagens e videos de apoio entram ao longo da timeline;
- a troca entre rosto falante e apoio visual pareca natural;
- o resultado funcione bem para YouTube, Instagram e Shorts/Reels.

## Premissas

- nao mexer no fluxo atual de `Texto para Video` que ja funciona.
- criar uma nova aba e uma nova pipeline.
- reaproveitar o maximo do que ja existe:
  - talking head via Modal/ComfyUI;
  - upload MinIO;
  - montagem de cenas via `video-code` + Remotion;
  - busca de assets no Pexels;
  - logs e status por etapas.

## Conclusao da analise

Sim, isso e viavel.

O melhor caminho nao e tentar “ensinar” o ComfyUI a fazer tudo dentro do video falado.

O melhor caminho e usar uma arquitetura em 2 camadas:

1. gerar o audio e o rosto falando exatamente como hoje;
2. montar um video final no Remotion, onde:
   - o rosto falante aparece como trilha principal;
   - imagens e videos entram como b-roll;
   - a IA decide quando cada asset entra, por quanto tempo e com qual intencao.

Essa abordagem e a mais segura porque:

- reaproveita o que ja funciona hoje;
- permite cortes, zooms, overlays e transicoes mais naturais;
- da controle fino para YouTube e Instagram;
- evita quebrar a pipeline atual do rosto falante.

## O que ja existe no sistema e pode ser reaproveitado

### 1. Rosto falando

Ja existe hoje:

- geracao de audio via `generateModalAudio`;
- geracao do video falado via `generateModalVideo`;
- configuracao default de foto/voz herdada da Shopee;
- tela de `Texto para Video` com status e links.

### 2. Motor de cenas com assets

Ja existe hoje:

- pipeline `video-code`;
- geracao de cenas por IA em `app/api/video-code/generate/route.ts`;
- uso de assets enviados pelo usuario;
- busca de videos do Pexels;
- render final em Remotion;
- `RetentionScene` para exibir imagem/video com movimento leve.

### 3. Render final

Ja existe hoje:

- `render-service`;
- bundle/render Remotion;
- audio/transcricao;
- upload final do MP4 para MinIO.

## Nova experiencia proposta

Criar uma nova aba chamada:

- `Texto para Video com Imagens`

### Entradas da nova aba

- texto manual obrigatorio;
- foto do avatar opcional;
- audio de referencia opcional;
- assets opcionais enviados pelo usuario:
  - imagens;
  - videos curtos;
- opcao de complementar com banco de imagens/videos da internet;
- formato:
  - `Instagram / TikTok 9:16`
  - `YouTube 16:9`
- intensidade visual:
  - `Suave`
  - `Equilibrado`
  - `Agressivo`

## Modos de assets

Devem existir 2 caminhos:

### Modo A - Upload manual

O usuario sobe:

- imagens;
- videos;
- ou ambos.

A IA recebe a lista desses assets e decide:

- onde entram;
- por quanto tempo;
- com qual texto/gancho visual;
- se entram em tela cheia, split ou picture-in-picture.

### Modo B - Busca automatica

Se o usuario nao subir assets suficientes, o sistema pode:

- buscar assets no Pexels;
- misturar com os enviados;
- marcar os assets por origem:
  - `UPLOAD`
  - `PEXELS`

## Arquitetura recomendada

### Etapa 1 - Criar o asset plan com IA

Antes de renderizar o video final, a IA deve analisar o texto e gerar um plano de apoio visual.

Saida esperada:

- blocos da fala;
- timestamp de entrada;
- timestamp de saida;
- objetivo da imagem/video naquele ponto;
- asset sugerido;
- tipo de exibicao.

Exemplo conceitual:

```json
{
  "segments": [
    {
      "startSec": 0,
      "endSec": 3.2,
      "spokenText": "voce sabia que...",
      "visualIntent": "gancho",
      "preferredLayout": "TALKING_HEAD_FULL"
    },
    {
      "startSec": 3.2,
      "endSec": 6.8,
      "spokenText": "olha esse resultado",
      "visualIntent": "prova visual",
      "preferredLayout": "BROLL_FULL",
      "assetRef": "asset_2"
    }
  ]
}
```

### Etapa 2 - Gerar o audio

Usar a mesma pipeline atual da aba `Texto para Video`.

### Etapa 3 - Gerar o talking head

Usar a mesma pipeline atual da aba `Texto para Video`.

### Etapa 4 - Montar o video final no Remotion

O Remotion deve compor:

- trilha base: video da pessoa falando;
- camada de b-roll;
- legendas;
- transicoes;
- pequenos movimentos de camera;
- cards ou chamadas curtas quando fizer sentido.

## Layouts que a IA pode escolher

### 1. `TALKING_HEAD_FULL`

- tela inteira com a pessoa falando;
- ideal para abertura, conclusao e trechos emocionais.

### 2. `BROLL_FULL`

- imagem/video ocupa a tela;
- a pessoa some por alguns segundos;
- ideal para demonstracao, prova ou contexto.

### 3. `PIP_BOTTOM_RIGHT`

- asset principal em tela;
- pessoa em picture-in-picture no canto;
- ideal para YouTube e explicacoes com apoio visual.

### 4. `SPLIT_VERTICAL`

- rosto de um lado;
- apoio visual do outro;
- bom para comparacao ou reforco.

### 5. `CUTAWAY_PUNCH`

- corte rapido de apoio visual por 0.8s a 2.5s;
- volta para o rosto;
- ideal para retenção.

## O que precisa ser natural

Para parecer natural, a IA nao deve trocar asset de forma aleatoria.

Regras:

- os primeiros 2 a 4 segundos devem priorizar gancho forte;
- nao trocar imagem a cada frase curta;
- manter cada apoio visual tempo suficiente para ser entendido;
- usar video quando houver demonstracao;
- usar imagem quando for contexto, prova ou reforco;
- evitar sobrecarregar com texto em excesso;
- voltar para o rosto em pontos de credibilidade, opiniao ou CTA.

## Recomendacao de timing

### Instagram / Reels / Shorts

- cortes mais curtos;
- mais energia;
- assets entre 1.2s e 3.5s;
- retorno frequente para o rosto.

### YouTube

- cortes um pouco mais longos;
- mais contexto;
- assets entre 2s e 6s;
- picture-in-picture funciona melhor.

## Novos modelos de dados sugeridos

Criar um modelo novo, separado do `SimpleCreatorVideo`, por exemplo:

- `MixedCreatorVideo`

Campos sugeridos:

- `id`
- `scriptText`
- `creatorImageUrl`
- `voiceRefUrl`
- `audioUrl`
- `talkingHeadVideoUrl`
- `finalVideoUrl`
- `captionsUrl`
- `aspectRatio`
- `status`
- `errorMessage`
- `assetPlanJson`
- `renderSpecJson`
- `sourceMode`
- `useExternalMedia`
- `createdAt`
- `updatedAt`

E tabela filha para assets:

- `MixedCreatorVideoAsset`
  - `id`
  - `mixedCreatorVideoId`
  - `url`
  - `kind`
  - `source`
  - `originalName`
  - `sortOrder`

## Pipeline nova sugerida

Estados:

- `DRAFT`
- `UPLOADING_ASSETS`
- `PLANNING_VISUALS`
- `GENERATING_AUDIO`
- `GENERATING_TALKING_HEAD`
- `COMPOSING_VIDEO`
- `READY`
- `FAILED`

## Etapas de UX

Na nova aba, mostrar:

1. Upload dos assets
2. Planejamento visual por IA
3. Geracao do audio
4. Geracao do rosto falando
5. Composicao final do video
6. Entrega dos links

## Mudancas de frontend

Nova aba dentro de `Texto para Video` ou nova tela dedicada:

- recomendado: nova aba na mesma pagina, com estado totalmente separado.

Blocos:

- texto manual;
- upload de foto e audio do avatar;
- upload multiplo de imagens/videos;
- toggle:
  - `usar apenas uploads`
  - `complementar com banco de imagens`
- seletor de formato;
- seletor de estilo visual;
- botao `Planejar e gerar video`.

## Mudancas de backend

### Nova rota de criacao

- `POST /api/texto-para-video-com-imagens`

Responsavel por:

- criar job;
- salvar metadados;
- iniciar planejamento.

### Nova rota de planejamento

- `POST /api/texto-para-video-com-imagens/[id]/planejar`

Responsavel por:

- quebrar o texto em blocos;
- escolher timing;
- mapear assets;
- montar `assetPlanJson`.

### Nova rota de geracao final

- `POST /api/texto-para-video-com-imagens/[id]/gerar`

Responsavel por:

- gerar audio;
- gerar talking head;
- chamar render-service com spec composta.

## Mudancas no Remotion

Criar uma composicao nova, separada da atual.

Exemplo:

- `TalkingHeadWithBrollPortrait`
- `TalkingHeadWithBrollLandscape`

Criar novos componentes:

- `TalkingHeadBrollScene`
- `PictureInPictureScene`
- `TimelineCutawayScene`

Ou evoluir `RetentionScene` e `VideoFromSpec` para suportar:

- video base do rosto;
- camadas simultaneas;
- transicoes entre layout modes.

## Melhor forma de planejar os assets

O melhor e usar a IA em 2 passos:

### Passo 1

Gerar o script final falado.

### Passo 2

Com o script pronto, pedir para a IA:

- dividir em segmentos;
- classificar cada segmento:
  - gancho;
  - explicacao;
  - prova;
  - contexto;
  - CTA;
- escolher a melhor forma de exibir visualmente.

Isso e melhor do que pedir tudo de uma vez porque:

- o timing fica mais consistente;
- a escolha dos assets melhora;
- fica mais facil depurar.

## Melhor estrategia para chamar atencao

Para esses videos performarem melhor:

- abrir com rosto ou prova visual muito forte;
- alternar rosto e apoio sem esconder demais a narracao;
- usar zoom leve e motion constante;
- colocar textos curtos e agressivos nos momentos certos;
- fazer o CTA reaparecer perto do final;
- evitar cara de slideshow.

## O que eu NAO recomendo

- nao recomendo fazer isso todo dentro do ComfyUI;
- nao recomendo montar tudo como imagem estaticamente;
- nao recomendo misturar esta logica dentro da aba atual;
- nao recomendo deixar a IA escolher assets sem qualquer regra de tempo minimo/maximo.

## Ordem recomendada de implementacao

1. criar schema novo separado;
2. criar nova aba frontend;
3. criar upload multiplo de assets;
4. criar planner de segmentos + timing;
5. reaproveitar audio atual;
6. reaproveitar talking head atual;
7. criar composicao Remotion nova com b-roll;
8. criar etapa final de render;
9. expor logs, status e links.

## MVP recomendado

Primeira versao:

- somente vertical 9:16;
- imagem/video de apoio em tela cheia ou picture-in-picture;
- no maximo 8 a 12 segmentos;
- assets do usuario + Pexels;
- sem edicao manual de timeline no primeiro momento.

## Criterios de aceite

- a aba atual continua intacta;
- a nova aba aceita uploads manuais de imagens e videos;
- a IA consegue planejar quando cada asset entra;
- o resultado final mistura rosto falante com apoio visual;
- o video sai pronto para Instagram/Reels e YouTube;
- o fluxo mostra status detalhado e links finais.
