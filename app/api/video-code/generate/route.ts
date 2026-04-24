import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

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
      "Você é um roteirista e motion designer.",
      "Você deve responder APENAS com um JSON válido (sem markdown, sem comentários).",
      "Saída obrigatória:",
      `- title (string), description (string), narrationText (string), scenes (array).`,
      "Cada scene deve ter: sceneTemplate, durationSec, props.",
      `sceneTemplate permitido: ${Array.from(ALLOWED_TEMPLATES).join(", ")}.`,
      "Regras:",
      "- narrationText em português (pt-BR), natural para narração.",
      "- O vídeo precisa ser didático, objetivo e engajador.",
      "- A soma aproximada das cenas deve bater com a duração total.",
    ].join("\n");

    const user = [
      `IDEIA: ${project.ideaPrompt}`,
      `FORMATO: ${formatHint}`,
      `DURACAO_TOTAL_SEGUNDOS: ${project.videoDurationSec}`,
      "",
      "Gere um roteiro com 4 a 7 cenas.",
      "Use TitleScene no começo e um fechamento curto no final.",
      "Se fizer sentido, use CodeTypingScene com um comando curto (ex.: SQL, npm, bash).",
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

