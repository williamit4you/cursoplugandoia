import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { searchPexelsMedia, type PexelsAsset } from "@/lib/pexels";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const dynamic = "force-dynamic";

function extractJsonObject(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  const candidate = text.slice(start, end + 1);
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

const ALLOWED_TEMPLATES = new Set([
  "TitleScene",
  "BulletListScene",
  "QuoteScene",
  "TimelineScene",
  "CodeTypingScene",
  "RetentionScene", // Nova cena focada em retenção (mídia de fundo + texto central)
]);

function coerceScenes(scenes: any[], videoDurationSec: number) {
  const safe: any[] = [];
  if (!Array.isArray(scenes)) return safe;

  for (const scene of scenes) {
    const sceneTemplate = String(scene?.sceneTemplate ?? "").trim();
    if (!ALLOWED_TEMPLATES.has(sceneTemplate)) continue;

    const durationSec = Number(scene?.durationSec ?? 0);
    if (!Number.isFinite(durationSec) || durationSec <= 0) continue;

    safe.push({
      id: String(scene?.id ?? crypto.randomUUID()),
      sceneTemplate,
      durationSec,
      props: scene?.props && typeof scene.props === "object" ? scene.props : {},
    });
  }

  const total = safe.reduce((acc, s) => acc + (Number(s.durationSec) || 0), 0);
  if (safe.length === 0) return safe;

  if (total <= 0) return safe;

  const scale = videoDurationSec / total;
  for (const s of safe) {
    s.durationSec = Math.max(1, Math.round(Number(s.durationSec) * scale));
  }

  return safe;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 400 });
  }

  const model = process.env.VIDEO_CODE_AI_MODEL || "gpt-4o-mini";

  try {
    const body = await req.json();
    const projectId = String(body?.projectId ?? "").trim();
    if (!projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });

    const project = await prisma.codeVideoProject.findUnique({ where: { id: projectId } });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.codeVideoProject.update({
      where: { id: projectId },
      data: { status: "GENERATING", errorMessage: null },
    });

    const formatHint =
      project.aspectRatio === "LANDSCAPE_16_9"
        ? "YouTube (16:9, 1920x1080)"
        : "TikTok/Reels (9:16, 1080x1920)";

    const system = [
      "Você é um Especialista em Vídeos Virais e Edição de Retenção (Retention Editing).",
      "Seu objetivo é criar roteiros e planos de cena que prendam a atenção do início ao fim, estilo Alex Hormozi.",
      "Você deve responder APENAS com um JSON válido.",
      "Saída obrigatória:",
      `- title (string), description (string), narrationText (string), scenes (array).`,
      "Cada scene deve ter: sceneTemplate, durationSec, props.",
      `sceneTemplate permitido: ${Array.from(ALLOWED_TEMPLATES).join(", ")}.`,
      "Regras de Retenção:",
      "- Use ganchos visuais e textuais fortes nos primeiros 3 segundos.",
      "- NarrationText em português (pt-BR), tom enérgico e sem pausas desnecessárias.",
      "- CRITICAL: O narrationText deve conter APENAS o texto que será lido. PROIBIDO incluir emojis, descrições de imagens entre colchetes ou parênteses (ex: [foguete], (mão apontando)), ou qualquer instrução de direção de arte.",
      "- Todos os elementos visuais (emojis, arrows, icons) devem ser colocados EXCLUSIVAMENTE no campo props.overlays.",
      "- Adicione overlays e sfx (woosh, pop, ding) nas props para reforçar o conteúdo.",
      "- props.overlays: array de { type: 'emoji'|'icon'|'arrow', value: string, timeSec: number, position: 'top'|'center'|'bottom' }.",
      "- props.sfx: array de { type: 'woosh'|'pop'|'ding'|'success', timeSec: number }.",
      "- Se props.url for fornecido, use-o como fundo da cena (especialmente em RetentionScene).",
    ].join("\n");

    let pexelsAssets = "";
    if (project.useExternalMedia) {
      const assets = await searchPexelsMedia(project.ideaPrompt, 6);
      if (assets.length > 0) {
        pexelsAssets = "\nRECURSOS DISPONÍVEIS (Pexels URLs para usar em props.url):\n" + 
          assets.map((a: PexelsAsset) => `- ${a.url} (Thumbnail: ${a.thumbnail})`).join("\n");
      }
    }

    const user = [
      `IDEIA: ${project.ideaPrompt}`,
      `FORMATO: ${formatHint}`,
      `DURACAO_TOTAL_SEGUNDOS: ${project.videoDurationSec}`,
      pexelsAssets,
      "",
      "Gere um roteiro com 4 a 7 cenas.",
      "Use TitleScene no começo com um gancho forte.",
      "Use RetentionScene para partes explicativas com mídias de fundo se disponíveis.",
      "Capriche nos overlays e SFX para manter a energia alta.",
    ].join("\n");

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.6,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      const msg = data?.error?.message || "OpenAI request failed";
      await prisma.codeVideoProject.update({
        where: { id: projectId },
        data: { status: "FAILED", errorMessage: msg },
      });
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const text = String(data?.choices?.[0]?.message?.content ?? "");
    const parsed = extractJsonObject(text);
    if (!parsed) {
      await prisma.codeVideoProject.update({
        where: { id: projectId },
        data: { status: "FAILED", errorMessage: "Failed to parse JSON from model output" },
      });
      return NextResponse.json({ error: "Failed to parse JSON from model output" }, { status: 500 });
    }

    const title = String(parsed.title ?? "").trim();
    const description = String(parsed.description ?? "").trim();
    const narrationText = String(parsed.narrationText ?? "").trim();
    const scenes = coerceScenes(parsed.scenes ?? [], project.videoDurationSec);

    const videoSpec = {
      version: 1,
      meta: {
        aspectRatio: project.aspectRatio === "LANDSCAPE_16_9" ? "16:9" : "9:16",
        fps: project.fps,
      },
      content: { title, description, narrationText },
      scenes,
    };

    const updated = await prisma.codeVideoProject.update({
      where: { id: projectId },
      data: {
        status: "READY",
        title: title || null,
        description: description || null,
        narrationText: narrationText || null,
        videoSpecJson: JSON.stringify(videoSpec, null, 2),
        errorMessage: null,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to generate" }, { status: 500 });
  }
}

