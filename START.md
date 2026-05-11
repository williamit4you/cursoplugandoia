# 🚀 Start Inicial da Aplicação

Este projeto é composto por **3 sistemas principais** que rodam em conjunto para o funcionamento completo da plataforma Plugando IA.

Para que a IA ou um novo desenvolvedor inicie o ambiente completo sem precisar vasculhar os arquivos, basta rodar os comandos abaixo em terminais separados.

## 1. Frontend / Backend Principal (Next.js)
Responsável pelo painel administrativo, banco de dados (Prisma) e endpoints das APIs de automação.
```bash
# Na raiz do projeto (c:\dev\cursoplugandoia)
npm run dev
```

## 2. Render Service (Remotion)
Responsável por processar a renderização dos vídeos com código (Remotion) e exportar os arquivos `.mp4`.
```bash
# No diretório render-service
cd render-service
npm start
```

## 3. Worker (Python FastAPI + Daemons)
Responsável pela infraestrutura de TTS (Text-to-Speech), scrapers antigos de notícias, FastAPI para renderização legado de vídeo.
```bash
# No diretório worker
cd worker

# Instale os requisitos (caso não estejam)
pip install -r requirements.txt
playwright install chromium

# Inicie a API do vídeo (Uvicorn)
uvicorn video:app --host 0.0.0.0 --port 80

# (Em outro terminal) Inicie os daemons se necessário
python scraper.py
python questions_daemon.py
```

> [!TIP]
> **Fluxo da Automação de Tarefas:** Quando o Next.js executa a cron (`api/automation/cron`), a Engine de Tarefas (`lib/tasks/engine.ts`) dita o fluxo. O Render Service Node.js serve como motor principal de vídeos curtos atualmente.
