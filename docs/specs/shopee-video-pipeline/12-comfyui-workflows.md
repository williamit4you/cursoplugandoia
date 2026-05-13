# ComfyUI - Workflows de Voz e Infinite Talk

## Objetivo

Documentar como o orquestrador deve usar o ComfyUI no RunPod para:

- gerar o audio da copy na voz do usuario;
- gerar o video da copy usando Infinite Talk/MultiTalk;
- consultar status;
- baixar artefatos;
- salvar resultados no MinIO;
- registrar payloads e retornos no pipeline.

## Arquivos analisados

Arquivos fornecidos pelo usuario:

```txt
C:\Users\willi\Downloads\API-VOZ.json
C:\Users\willi\Downloads\WORKFLOW - INFINITE TALK.json
```

## Entendimento geral

O `API-VOZ.json` esta em formato compativel com prompt API do ComfyUI:

- chaves por ID de node;
- `class_type`;
- `inputs`;
- `_meta.title`.

O `WORKFLOW - INFINITE TALK.json` esta em formato visual de workflow:

- contem `nodes`, `links`, posicoes e widgets;
- serve para documentar o grafo;
- nao deve ser assumido como payload direto de `/prompt` ate existir uma exportacao em formato API.

## Fluxo padrao da API ComfyUI

O orquestrador deve tratar ComfyUI como job assincrono.

Fluxo esperado:

```txt
1. Garantir POD online.
2. Subir arquivos de entrada para a pasta input do ComfyUI.
3. Montar prompt JSON com os nomes dos arquivos enviados.
4. POST /prompt.
5. Guardar prompt_id.
6. Consultar /history/{prompt_id} ate concluir ou falhar.
7. Ler outputs gerados.
8. Baixar artefatos via /view ou endpoint equivalente.
9. Subir artefatos finais para MinIO.
10. Registrar request, response, prompt_id, outputs e erros.
```

Endpoints usuais a validar na instancia:

```txt
GET  /system_stats
GET  /queue
POST /prompt
GET  /history/{prompt_id}
GET  /view?filename=...&type=output&subfolder=...
POST /upload/image
```

Observacao:

- O endpoint exato para upload de audio deve ser validado na instancia do RunPod/ComfyUI.
- Alguns setups aceitam arquivos na pasta `input` usando endpoint de upload generico/customizado; outros exigem upload por volume, storage ou endpoint proprio.

## Workflow de voz

Arquivo analisado: `API-VOZ.json`.

Nodes principais:

| Node | Tipo | Funcao |
| --- | --- | --- |
| `24` | `LoadAudio` | Carrega audio de referencia da voz |
| `40` | `FB_Qwen3TTSVoiceClone` | Gera voz clonada com Qwen3-TTS |
| `44` | `SaveAudioMP3` | Salva resultado em MP3 |

Entradas dinamicas que o orquestrador deve preencher:

- node `24.inputs.audio`: nome do arquivo de referencia da voz;
- node `40.inputs.target_text`: copy de vendas gerada pela IA;
- node `40.inputs.seed`: seed gerada/registrada por execucao;
- node `44.inputs.filename_prefix`: prefixo com identificador do item.

Configuracoes observadas:

```txt
model_choice: 1.7B
device: auto
precision: bf16
language: Portuguese
max_new_tokens: 2048
top_p: 0.8
top_k: 20
temperature: 1
repetition_penalty: 1.05
x_vector_only: true
unload_model_after_generate: false
quality: V0
```

Saida esperada:

- arquivo MP3 em output do ComfyUI;
- URL temporaria de download/view;
- audio final salvo no MinIO;
- `audioUrl` salvo na URL/post.

## Workflow Infinite Talk / MultiTalk

Arquivo analisado: `WORKFLOW - INFINITE TALK.json`.

Nodes principais identificados:

| Node | Tipo | Funcao |
| --- | --- | --- |
| `207` | `LoadImage` | Carrega imagem base do usuario |
| `217` | `LoadAudio` | Carrega audio da copy |
| `120` | `MultiTalkModelLoader` | Carrega modelo Infinite Talk |
| `122` | `WanVideoModelLoader` | Carrega modelo Wan video |
| `129` | `WanVideoVAELoader` | Carrega VAE |
| `136` | `LoadWanVideoT5TextEncoder` | Carrega encoder de texto |
| `137` | `DownloadAndLoadWav2VecModel` | Carrega Wav2Vec |
| `170` | `AudioSeparation` | Separa/prepara audio |
| `192` | `WanVideoImageToVideoMultiTalk` | Gera movimento/video a partir de imagem e audio |
| `213` | `WanVideoSampler` | Sampler do video |
| `130` | `WanVideoDecode` | Decode dos frames |
| `131` | `VHS_VideoCombine` | Combina frames em MP4 |

Entradas dinamicas que o orquestrador deve preencher:

- node `207`: imagem base do usuario;
- node `217`: audio MP3/WAV gerado na etapa de voz;
- node `131.filename_prefix`: prefixo unico por item;
- seeds dos nodes geradores/sampler;
- largura/altura/duracao se forem parametrizadas no MVP.

Configuracoes observadas:

```txt
imagem atual: eughibli.png
audio atual: COMFYUI NAO E PRA TODOS finalizado_2_1.wav
modelo multitalk: Wan2_1-InfiniteTalk_Single_Q6_K.gguf
modelo video: wan2.1-i2v-14b-480p-Q4_K_S.gguf
vae: wan_2.1_vae.safetensors
text encoder: umt5-xxl-enc-fp8_e4m3fn.safetensors
clip vision: clip_vision_h.safetensors
fps: 25
formato saida: video/h264-mp4
trim_to_audio: true
```

Atencao:

- Este arquivo esta no formato visual do ComfyUI.
- Antes de automatizar, exportar/salvar o workflow em formato API.
- A spec de implementacao deve versionar uma copia sanitizada do prompt API no repositorio.

## Templates versionados

Na fase de implementacao, criar:

```txt
docs/specs/shopee-video-pipeline/references/comfyui-audio-api-template.json
docs/specs/shopee-video-pipeline/references/comfyui-infinite-talk-api-template.json
```

Ou, se forem usados em runtime:

```txt
lib/shopee-pipeline/comfyui/templates/audio-voiceclone.json
lib/shopee-pipeline/comfyui/templates/infinite-talk-video.json
```

Status:

- OK `audio-voiceclone.json` versionado.
- OK `infinite-talk-video.json` versionado (placeholder aguardando export real do workflow Infinite Talk em formato API).

Regras:

- nao commitar segredos;
- nao commitar caminhos absolutos locais;
- nao depender de arquivos em `Downloads`;
- deixar placeholders claros para texto, audio, imagem, seed e prefixo.

## Contrato do cliente ComfyUI

Criar um cliente dedicado:

```ts
type ComfyPromptResult = {
  promptId: string;
  rawResponse: unknown;
};

type ComfyJobOutput = {
  files: Array<{
    filename: string;
    subfolder?: string;
    type: "input" | "output" | "temp";
    mimeType?: string;
    downloadUrl?: string;
  }>;
  rawHistory: unknown;
};

interface ComfyUiClient {
  isOnline(): Promise<boolean>;
  uploadInput(file: Buffer, filename: string, mimeType: string): Promise<string>;
  submitPrompt(prompt: unknown): Promise<ComfyPromptResult>;
  waitForPrompt(promptId: string, timeoutMs: number): Promise<ComfyJobOutput>;
  downloadOutput(file: ComfyJobOutput["files"][number]): Promise<Buffer>;
}
```

## Integracao com o pipeline

### Step `generateAudio`

Entrada:

- `salesCopy`;
- audio de referencia da voz;
- template `API-VOZ`;
- POD online.

Processo:

- preencher `target_text`;
- preencher audio de referencia;
- enviar `/prompt`;
- aguardar output MP3;
- salvar MP3 no MinIO;
- gravar `audioUrl`;
- registrar prompt e history.

### Step `generateCopyVideo`

Entrada:

- `audioUrl`;
- imagem base do usuario;
- template Infinite Talk API;
- POD online.

Processo:

- baixar audio do MinIO ou disponibilizar no input do ComfyUI;
- disponibilizar imagem no input do ComfyUI;
- preencher template;
- enviar `/prompt`;
- aguardar MP4;
- salvar MP4 no MinIO;
- gravar `copyVideoUrl`;
- registrar prompt e history.

## Logs obrigatorios

Para cada job ComfyUI:

- endpoint usado;
- prompt sanitizado;
- `prompt_id`;
- status da fila;
- inicio/fim;
- duracao total;
- arquivos gerados;
- historico bruto sanitizado;
- erro bruto;
- erro amigavel;
- proxima acao.

## Riscos e decisoes pendentes

- Confirmar endpoint de upload de audio na instancia.
- Exportar Infinite Talk em formato API.
- Confirmar se o output final sempre aparece no node `VHS_VideoCombine`.
- Confirmar timeout maximo aceitavel para video.
- Confirmar se o audio deve ser MP3 ou WAV para Infinite Talk.
- Confirmar local definitivo da imagem base do usuario.
- Confirmar se a instancia ComfyUI tem todos os custom nodes instalados.
