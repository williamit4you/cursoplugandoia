# Render Service

Servico Node separado para renderizar videos Remotion fora da `landpage`.

## Endpoint

- `POST /render`
- `GET /health`

## Variaveis esperadas

- `WORKER_FASTAPI_BASE_URL`
- `MINIO_ENDPOINT`
- `MINIO_INTERNAL_ENDPOINT`
- `MINIO_ACCESS_KEY`
- `MINIO_SECRET_KEY`
- `MINIO_BUCKET_NAME`
- `MINIO_PUBLIC_URL`
- `REMOTION_CHROME_BIN`

## Integracao com a landpage

No servico Next, configure:

`VIDEO_RENDER_SERVICE_URL=http://<nome-do-servico-render>:3010`

Sem essa env, a rota `/api/video-code/render` continua usando o fallback local.
