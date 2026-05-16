# Modal migration for the Shopee media pipeline

## Current state

Today the app already has a solid orchestrator in `lib/shopee-pipeline/orchestrator.ts`.

The RunPod-specific part is concentrated in:

- POD lifecycle management
- ComfyUI base URL discovery
- Uploading inputs to ComfyUI
- Polling `/history/{promptId}`
- Downloading `/view` outputs

Everything after generation already works independently:

- MinIO persistence
- Merge of original product video + generated copy video
- Affiliate link generation
- Bio product creation
- Story scheduling

## Recommended target architecture

Keep the existing Next.js app as the **system of record and orchestrator**.

Add one colocated Python deployment unit, `modal_service/`, responsible for:

- GPU inference
- reading model weights from a Modal Volume
- writing finished MP3/MP4 files directly to MinIO
- returning stable artifact URLs to the Next.js app

Suggested flow:

1. Next.js decides the next pipeline step.
2. Next.js calls the Modal audio endpoint.
3. Modal generates MP3 and uploads it to MinIO.
4. Next.js stores `audioUrl`.
5. Next.js calls the Modal video endpoint.
6. Modal generates MP4 and uploads it to MinIO.
7. Next.js stores `copyVideoUrl`.
8. Existing merge/publish stages continue unchanged.

## Why this is better than the current RunPod shape

- No POD boot state machine.
- No separate watchdog just to turn idle GPU machines off.
- No need for Next.js to poll a fragile ComfyUI instance if the Modal function returns only when the artifact is ready.
- Modal Volumes fit the model-weight use case well.
- The codebase keeps one orchestration brain instead of splitting business logic across services.

## Where RabbitMQ fits

RabbitMQ is optional here, not mandatory.

Use it only if you want one of these:

- several independent consumers reacting to `audio.ready` and `video.ready`
- durable event replay outside the request/response path
- a future multi-worker media platform beyond this pipeline

For the current app, the simpler professional design is:

- database status remains canonical
- Next.js calls Modal
- Modal uploads to MinIO
- Modal returns URL
- Next.js advances the state machine

If later you add RabbitMQ, publish events **after** MinIO upload and DB update, not instead of them.

## Storage model

Use one Modal Volume for model assets:

- `shopee-comfy-models`

Recommended shape:

```text
/models
  /clip_vision
  /loras
  /qwen-tts
  /text_encoders
  /unet
  /vae
```

The exported video workflow reveals these required local files:

- `Wan2_1-InfiniteTalk_Single_Q6_K.gguf`
- `wan2.1-i2v-14b-480p-Q4_K_S.gguf`
- `wan_2.1_vae.safetensors`
- `umt5-xxl-enc-fp8_e4m3fn.safetensors`
- `Wan21_I2V_14B_lightx2v_cfg_step_distill_lora_rank64.safetensors`
- `clip_vision_h.safetensors`

The audio workflow confirms Qwen3-TTS voice cloning, but its API export does not expose exact local weight filenames. Those need to be copied from the current RunPod filesystem or reconstructed from the image build.

## Project placement

Keep the Python worker in this same repository for now.

Reason:

- shared product ownership
- fewer moving parts during migration
- easier CI and contract changes
- one repo is enough while the worker exists only for this app

Split into a separate GitHub repository only if the worker becomes reusable across multiple products or needs an independent release cadence.

## Recommended migration plan

1. Inventory the exact current RunPod model tree and custom nodes.
2. Upload weights to the Modal Volume.
3. Reproduce audio generation first.
4. Reproduce video generation second.
5. Add a provider abstraction in the Next.js app:
   - `RUNPOD`
   - `MODAL`
6. Run A/B test jobs on both providers.
7. Switch production default to Modal.
8. Remove RunPod lifecycle code only after a quiet period.

## Current implementation status

Implemented in `modal_service/app.py`:

- Modal App definition
- model Volume mount at `/models`
- CUDA/Python image base
- ComfyUI installation
- installation of the essential custom nodes identified from RunPod
- runtime inspection helpers
- placeholder HTTP endpoints for audio and video

Not implemented yet:

- actually starting ComfyUI inside the function container
- submitting the exported prompt JSONs
- uploading generated MP3/MP4 outputs to MinIO
- replacing the current RunPod provider in the Next.js orchestrator

Validated on Modal:

- ComfyUI runtime boots on `A100-80GB`
- Qwen3-TTS audio generation completes and uploads MP3 output to MinIO
- InfiniteTalk video generation completes and uploads MP4 output to MinIO
- model Volume wiring works through symlinks into `ComfyUI/models/*`

## GPU choice

Start validation on `A100-80GB` or `H100`.

The video workflow uses a 14B image-to-video model plus supporting models. The exported config already relies on offloading, which is a sign that GPU memory pressure matters. Once the workflow is stable, benchmark downward to `L40S` or `A100-40GB` if quality and latency remain acceptable.

## Cost intuition for 30-second clips

Using the rates you provided:

| GPU | 30 sec of GPU time | 3 min of GPU time |
| --- | ---: | ---: |
| T4 | $0.00492 | $0.02952 |
| L4 | $0.00666 | $0.03996 |
| A10 | $0.00918 | $0.05508 |
| L40S | $0.01626 | $0.09756 |
| A100 80 GB | $0.02082 | $0.12492 |
| H100 | $0.03291 | $0.19746 |

The important variable is not the final video duration; it is the **actual GPU runtime per job**. If one 30-second talking video takes 3 minutes of GPU time on `A100-80GB`, then `$30` buys roughly `240` such jobs before storage and any non-GPU costs. Benchmark one real clip first and use that number.

## Immediate technical next step

Before coding the final worker, capture from the current RunPod environment:

- complete model directory tree
- custom node repositories and pinned commits
- Python package list
- startup commands
- any environment variables

That turns the migration from guesswork into a reproducible build.

## Python dependencies observed on the current RunPod instance

Selected installed versions:

- `torch==2.11.0+cu128`
- `torchaudio==2.11.0+cu128`
- `torchvision==0.26.0+cu128`
- `transformers==4.57.6`
- `accelerate==1.13.0`
- `librosa==0.11.0`
- `opencv-python==4.13.0.92`

Requirements observed from custom nodes:

- `audio-separation-nodes-comfyui`
  - `scipy`
  - `librosa>=0.10.2,<1`
  - `torchaudio>=2.3.0`
  - `numpy`
  - `moviepy`
- `comfy-mtb`
  - `qrcode[pil]`
  - `onnxruntime-gpu`
  - `requirements-parser`
  - `rembg`
  - `imageio_ffmpeg`
  - `rich`
  - `rich_argparse`
  - `matplotlib`
  - `pillow`
  - `cachetools`
- `comfyui-videohelpersuite`
  - `transformers`
  - `opencv-python`
  - `imageio-ffmpeg`
  - `torch`
  - `torchaudio`
- `ComfyUI-Qwen-TTS`
  - `transformers>=4.57.0,<5.0.0`
  - `librosa`
  - `soundfile`
  - `accelerate`
  - `numpy`
  - `einops`
  - `tiktoken`
  - `sentencepiece`
  - `sox`
  - `huggingface_hub`
  - `onnxruntime`
  - `onnxruntime-gpu`
  - `safetensors`
  - `scipy>=1.11.0`

Still needed from RunPod:

- the actual `ComfyUI-WanVideoWrapper/requirements.txt` content

## Custom nodes observed in the current RunPod ComfyUI

Observed directories:

- `audio-separation-nodes-comfyui`
- `Civicomfy`
- `comfy-mtb`
- `comfyui-custom-scripts`
- `ComfyUI-KJNodes`
- `ComfyUI-Manager`
- `ComfyUI-Qwen-TTS`
- `ComfyUI-RunpodDirect`
- `comfyui-videohelpersuite`
- `ComfyUI-WanVideoWrapper`

Required by the provided workflows:

- `ComfyUI-Qwen-TTS`
  - `FB_Qwen3TTSVoiceClone`
- `ComfyUI-WanVideoWrapper`
  - `MultiTalkModelLoader`
  - `WanVideoModelLoader`
  - `WanVideoVAELoader`
  - `WanVideoDecode`
  - `WanVideoTextEncode`
  - `LoadWanVideoT5TextEncoder`
  - `DownloadAndLoadWav2VecModel`
  - `WanVideoLoraSelect`
  - `WanVideoImageToVideoMultiTalk`
  - `WanVideoClipVisionEncode`
  - `MultiTalkWav2VecEmbeds`
  - `WanVideoSampler`
- `audio-separation-nodes-comfyui`
  - `AudioSeparation`
- `ComfyUI-KJNodes`
  - `ImageResizeKJv2`
- `comfy-mtb`
  - `Audio Duration (mtb)`
- `comfyui-custom-scripts`
  - `MathExpression|pysssss`
- `comfyui-videohelpersuite`
  - `VHS_VideoCombine`

Likely optional for these two workflows, unless another hidden dependency appears during import:

- `Civicomfy`
- `ComfyUI-Manager`
- `ComfyUI-RunpodDirect`
- `websocket_image_save.py`

Pinned repositories observed on the current RunPod instance:

- `Civicomfy`
  - `https://github.com/MoonGoblinDev/Civicomfy.git`
  - commit `e0f992abc02b21f74d495fca7ae293e951a6820e`
- `ComfyUI-KJNodes`
  - `https://github.com/kijai/ComfyUI-KJNodes.git`
  - RunPod snapshot reported commit `dd539bc193c3047a52fe8cd9aa602de5d3559508`
  - public upstream no longer accepts that hash during fresh clone, so the initial Modal build uses the current repository head until the working snapshot is archived
- `ComfyUI-Manager`
  - `https://github.com/ltdrdata/ComfyUI-Manager.git`
  - commit `de4fd32ff5ebbb7d0cf3e984fdda87d8bcfd080f`
- `ComfyUI-Qwen-TTS`
  - `https://github.com/flybirdxx/ComfyUI-Qwen-TTS.git`
  - commit `8aecca98e13945a7e1de8c928bf39756757039ef`
- `ComfyUI-RunpodDirect`
  - `https://github.com/MadiatorLabs/ComfyUI-RunpodDirect.git`
  - commit `d6bbf25b5dbde298ea0e18b9c2362981d5293664`

Still missing source/commit provenance:

- `ComfyUI-WanVideoWrapper`
  - `https://github.com/kijai/ComfyUI-WanVideoWrapper`
  - project version `1.4.7`

Source repository inferred from project metadata:

- `audio-separation-nodes-comfyui`
  - `https://github.com/christian-byrne/audio-separation-nodes-comfyui`
- `comfy-mtb`
  - `https://github.com/melMass/comfy_mtb`
- `comfyui-custom-scripts`
  - `https://github.com/pythongosssss/ComfyUI-Custom-Scripts`
- `comfyui-videohelpersuite`
  - `https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite`
