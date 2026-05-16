# Modal media worker

This folder contains the Modal-based audio/video worker used by the Shopee pipeline.

## Runtime pieces

- `app.py`: Modal app, ComfyUI bootstrap, public web endpoints and smoke-test helpers
- `infinite_talk_workflow.json`: API-format Infinite Talk workflow used by video generation
- `model_manifest.json`: expected model files mounted from the Modal Volume
- Modal Volume: `shopee-comfy-models`
- Modal Secret: `Minio`

## Required secret

Create a Modal secret named `Minio` with these keys:

```text
MINIO_ENDPOINT
MINIO_ACCESS_KEY
MINIO_SECRET_KEY
MINIO_BUCKET_NAME
MINIO_PUBLIC_URL
```

## Volume layout

The Volume root must contain these folders:

```text
/unet
/vae
/text_encoders
/loras
/clip_vision
/qwen-tts
/custom_nodes_snapshot.tar.gz
```

The app links those folders into the locations ComfyUI expects at runtime.

## Useful commands

```powershell
cd modal_service
modal run app.py
modal run app.py --run-smoke-test
modal run app.py --run-audio-test --voice-ref-url "https://..."
modal run app.py --run-video-test --image-url "https://..." --audio-url "https://..."
modal deploy app.py
```

## Next.js integration

After `modal deploy app.py`, set these environment variables in the Next.js app:

```text
MODAL_AUDIO_ENDPOINT=https://<deployed-audio-endpoint>
MODAL_VIDEO_ENDPOINT=https://<deployed-video-endpoint>
```

The Shopee pipeline now calls Modal directly for:

1. `GENERATE_AUDIO`
2. `GENERATE_COPY_VIDEO`

The returned public MinIO URLs are saved as `audioUrl` and `copyVideoUrl`.

## Validated state

- Voice clone MP3 generation: validated on Modal
- Infinite Talk video generation: validated on Modal
- ComfyUI model mounts: validated
- Snapshot custom nodes from the previous RunPod runtime: validated
