import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SECRET = process.env.WORKER_SECRET_KEY || "super-secret-worker-key-123";

const DEFAULT_PROMPT = `Você é um jornalista independente de tecnologia focado em alta conversão SEO.
Seu objetivo é ler um texto raw raspado da internet, e REESCREVÊ-LO por completo com suas palavras,
garantindo que NENHUM plágio seja detectado, mas mantendo 100% da precisão dos fatos noticiados.
Você deve outputar um JSON rigorosamente estruturado com:
- "title": Um título impactante (SEM clickbait exagerado, formato editorial)
- "summary": Um roteiro ENGAJADOR e direto de até {duration_sec} segundos de locução para um vídeo TikTok/Reels/Story baseado na notícia (máx 450 caracteres).
- "content_html": O artigo escrito, formatado com tags HTML semânticas como <p>, <h2>, e <b>. Formato pronto pro TipTap Editor.`;

/** GET — retorna a config atual (cria com defaults se não existir). Usada pelo scraper.py e pela UI. */
export async function GET(req: NextRequest) {
  // Permite acesso do scraper (via secret header) ou do admin autenticado via cookie
  const secret = req.headers.get("x-worker-secret");
  const isWorker = secret === SECRET;
  // Para admin browser requests sem header podemos aceitar também (a auth do admin é via middleware da sessão)
  if (!isWorker) {
    // Tentativa sem autenticação → bloquear (middleware do Next.js protege as rotas /admin/*)
    // mas esta API pode ser chamada de fora, então exigimos o secret
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let config = await prisma.scraperConfig.findFirst();
    if (!config) {
      config = await prisma.scraperConfig.create({
        data: { systemPrompt: DEFAULT_PROMPT },
      });
    }
    return NextResponse.json(config);
  } catch (error) {
    console.error("[api/worker/config GET]", error);
    return NextResponse.json({ error: "Failed to fetch config" }, { status: 500 });
  }
}

/** POST — salva nova config. Usada pela UI do admin. */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-worker-secret");
  if (secret !== SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Busca o único registro existente (ScraperConfig é um singleton por design)
    const existing = await prisma.scraperConfig.findFirst();

    const updateData = {
      intervalHours: body.intervalHours ?? 6,
      scheduledTimes: body.scheduledTimes ?? "[]",
      useScheduledTimes: body.useScheduledTimes ?? false,
      isEnabled: body.isEnabled ?? true,
      maxArticlesPerRun: body.maxArticlesPerRun ?? 3,
      aiModel: body.aiModel ?? "gpt-4o-mini",
      aiTemperature: body.aiTemperature ?? 0.7,
      systemPrompt: body.systemPrompt ?? DEFAULT_PROMPT,
      videoDurationSec: body.videoDurationSec ?? 30,
      videoStyle: body.videoStyle ?? "journalism",
      ttsVoice: body.ttsVoice ?? "pt-BR-AntonioNeural",
      ttsSpeed: body.ttsSpeed ?? "+5%",
      pexelsEnabled: body.pexelsEnabled ?? true,
    };

    const config = existing
      ? await prisma.scraperConfig.update({ where: { id: existing.id }, data: updateData })
      : await prisma.scraperConfig.create({ data: updateData });

    return NextResponse.json(config);
  } catch (error) {
    console.error("[api/worker/config POST]", error);
    return NextResponse.json({ error: "Failed to save config" }, { status: 500 });
  }
}
