# Spec Driven Development - Texto para Video Manual

## Objetivo

Criar uma nova aba no admin para gerar videos verticais a partir de um texto manual, reaproveitando a pipeline ja existente de foto + voice clone + Infinite Talk via Modal/ComfyUI.

## Resultado esperado

- o operador digita um texto manualmente;
- pode subir uma foto e um audio de referencia opcionais;
- se nao subir nada, a aplicacao usa os mesmos defaults ja configurados no pipeline da Shopee;
- escolhe parametros como idioma, velocidade de fala e preset vertical;
- acompanha status completo com etapas `PENDING`, `PROCESSING`, `COMPLETED` ou `FAILED`;
- recebe o link final do video, audio e legendas;
- pode regenerar audio e video sem recriar toda a estrutura.

## Reaproveitamento obrigatorio

- `resolveCreatorVideoDefaults` para cair nos assets/configuracoes da Shopee quando nao houver upload manual.
- `simpleCreatorVideo` como base do historico de execucoes.
- `modal_service/app.py` como worker real de audio e video via ComfyUI.
- `generateModalAudio` e `generateModalVideo` como cliente HTTP do Next.js.
- `/api/upload` para mandar foto/audio manual ao MinIO antes de disparar a pipeline.
- padrao visual ja existente na aplicacao para loading, mensagens e acompanhamento de execucao.

## Escopo funcional

### 1. Nova experiencia do admin

- manter a pagina `Texto para Video`.
- criar duas abas:
  - `Gerador manual`
  - `Historico`

### 2. Entradas do processo

- texto manual obrigatorio.
- foto opcional.
- audio de referencia opcional.
- idioma:
  - `Portuguese`
  - `English`
- velocidade:
  - devagar
  - normal
  - rapido
- preset de saida:
  - TikTok 9:16
  - Instagram Reel 9:16

### 3. Parametros avancados expostos

Campos observados no workflow atual do ComfyUI/Modal:

- audio:
  - `maxNewTokens`
  - `topP`
  - `topK`
  - `temperature`
  - `repetitionPenalty`
  - `quality`
- video:
  - `width`
  - `height`
  - `fps`
  - `steps`
  - `cfg`
  - `shift`
  - `crf`

## Fluxo tecnico

### Etapa 1. Preparacao

- validar texto.
- subir foto manual ao MinIO se houver.
- subir audio manual ao MinIO se houver.
- resolver defaults da Shopee se nao houver upload.

### Etapa 2. Persistencia inicial

- criar registro em `SimpleCreatorVideo` com:
  - texto
  - foto efetiva
  - audio de referencia efetivo
  - idioma
  - velocidade
  - preset/formato
  - largura/altura/fps
  - timestamps de inicio

### Etapa 3. Geracao de audio

- chamar endpoint Modal de audio.
- passar parametros do voice clone.
- se `speechRate != 1`, ajustar o MP3 final com `ffmpeg atempo`.
- salvar `audioUrl` e `audioPromptId`.

### Etapa 4. Geracao de video

- chamar endpoint Modal de video.
- usar o workflow Infinite Talk exportado em `modal_service/infinite_talk_workflow.json`.
- aplicar largura, altura, fps e sampler settings.
- salvar `videoUrl` e `videoPromptId`.

### Etapa 5. Finalizacao

- gerar VTT aproximado.
- salvar `captionsUrl`.
- marcar `READY`.

## Estados e UX

Estados backend:

- `DRAFT`
- `GENERATING_AUDIO`
- `AUDIO_READY`
- `GENERATING_VIDEO`
- `READY`
- `FAILED`

Estados visuais por etapa:

- `PENDING`
- `PROCESSING`
- `COMPLETED`
- `FAILED`

Cada execucao deve mostrar:

- etapa atual;
- progresso percentual simples;
- tempo decorrido;
- tempo esperado por fase;
- logs textuais da execucao;
- links dos artefatos finais.

## Mudancas de dados

Adicionar ao modelo `SimpleCreatorVideo`:

- `voiceRefUrl`
- `audioLanguage`
- `speechRate`
- `formatPreset`
- `videoWidth`
- `videoHeight`
- `videoFps`
- `audioPromptId`
- `videoPromptId`
- `startedAt`
- `audioStartedAt`
- `audioCompletedAt`
- `videoStartedAt`
- `completedAt`

## Contratos de API

### `GET /api/texto-para-video?view=config`

Retorna:

- defaults herdados da Shopee;
- parametros padrao de audio;
- parametros padrao de video;
- presets de formato;
- parametros observados do ComfyUI.

### `POST /api/texto-para-video`

Recebe:

- texto
- urls opcionais de foto/audio
- idioma
- velocidade
- parametros avancados de audio
- parametros avancados de video

Retorna:

- item criado/atualizado com links finais quando o fluxo termina.

## Ordem recomendada de entrega

1. expandir schema e migration.
2. adaptar cliente Modal e worker Python para aceitar parametros.
3. adaptar rotas Next.js.
4. reconstruir a tela admin com abas, uploads e painel de status.
5. validar historico e regeneracao.
6. rodar geracao do Prisma e build.

## Critérios de aceite

- sem upload manual, o fluxo usa os defaults da Shopee.
- com upload manual, o fluxo usa os arquivos enviados.
- o operador consegue gerar video a partir de texto puro.
- o status mostra etapas completas e tempo estimado.
- o resultado devolve pelo menos o link do MP4 final.
- regressao zero no fluxo existente de `Texto para Video`.

## Riscos conhecidos

- tempos de video podem variar bastante dependendo da fila/GPU.
- o workflow Infinite Talk continua sensivel a dimensoes muito grandes.
- a estimativa de tempo e aproximada, nao contractual.
- ajustes finos extras do ComfyUI podem exigir nova revisao do contrato com a Modal.
