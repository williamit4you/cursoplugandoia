# 🚀 Start Inicial da Aplicação

Este projeto é composto por **3 sistemas principais** que rodam em conjunto para o funcionamento completo da plataforma Plugando IA.

Para que a IA ou um novo desenvolvedor inicie o ambiente completo sem precisar vasculhar os arquivos, basta rodar os comandos abaixo em terminais separados.

## 1. Frontend / Backend Principal (Next.js)
Responsável pelo painel administrativo, banco de dados (Prisma) e endpoints das APIs de automação.
```bash
# Na raiz do projeto (c:\dev\cursoplugandoia)
npm run dev
```

## 2. Render Service (Remotion + Chromium + Scraping Shopee)
Responsável por:
- Renderização dos vídeos com código (Remotion)
- **Scraping de produtos Shopee** via Puppeteer (usa o Chromium instalado neste container)
- Busca Shopee via navegador

> ⚠️ **Este é o único serviço que precisa de Chromium.** Não instale Chrome no Python worker.

```bash
# No diretório render-service
cd render-service
npm start
```

Em Docker/Easypanel, a variável `VIDEO_RENDER_SERVICE_URL` deve apontar para este serviço (porta 3010).

## 3. Worker (Python FastAPI)
Responsável apenas por TTS (Text-to-Speech), geração de vídeo com MoviePy e composição TikTok (PiP).
O Chromium **NÃO é necessário** aqui.

```bash
# No diretório worker
cd worker

# Instale os requisitos (caso não estejam)
pip install -r requirements.txt

# Inicie a API do vídeo (Uvicorn)
uvicorn video:app --host 0.0.0.0 --port 80
```

> [!TIP]
> **Arquitetura do Scraping Shopee:**
> `Next.js API` → `render-service:3010/shopee/scrape` → Puppeteer usa `/usr/bin/chromium-browser` já instalado no Docker do render-service → MinIO + OpenAI
> 
> **Fluxo da Automação de Vídeos:** `Next.js cron` → `engine.ts` → `render-service:3010/render` → Remotion + Worker Python TTS
