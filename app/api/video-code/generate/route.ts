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
  "RetentionScene", // Background media + center text
  "ChartScene", // Bar chart for stats/growth
  "BigNumberScene", // Huge numbers/percentages
  "CircleHighlightScene", // Connected concepts
]);

const VISUAL_THEMES = [
  {
    id: "sunburst",
    name: "Sunburst",
    backgroundColor: "#facc15",
    textColor: "#111827",
    accentColor: "#ea580c",
    secondaryColor: "#1d4ed8",
    surfaceColor: "#fff7cc",
    fontFamily: "Impact, Arial Black, sans-serif",
  },
  {
    id: "ocean",
    name: "Ocean Pulse",
    backgroundColor: "#1d4ed8",
    textColor: "#f8fafc",
    accentColor: "#22d3ee",
    secondaryColor: "#0f172a",
    surfaceColor: "#1e3a8a",
    fontFamily: "Trebuchet MS, Verdana, sans-serif",
  },
  {
    id: "mint",
    name: "Mint Charge",
    backgroundColor: "#10b981",
    textColor: "#052e16",
    accentColor: "#ecfeff",
    secondaryColor: "#0f766e",
    surfaceColor: "#d1fae5",
    fontFamily: "Franklin Gothic Medium, Arial, sans-serif",
  },
  {
    id: "crimson",
    name: "Crimson Rush",
    backgroundColor: "#b91c1c",
    textColor: "#fff7ed",
    accentColor: "#fbbf24",
    secondaryColor: "#7f1d1d",
    surfaceColor: "#ef4444",
    fontFamily: "Arial Black, Arial, sans-serif",
  },
  {
    id: "midnight",
    name: "Midnight Grid",
    backgroundColor: "#111827",
    textColor: "#f9fafb",
    accentColor: "#a78bfa",
    secondaryColor: "#374151",
    surfaceColor: "#1f2937",
    fontFamily: "Segoe UI, Arial, sans-serif",
  },
];

function hashString(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pickTheme(projectId: string) {
  return VISUAL_THEMES[hashString(projectId) % VISUAL_THEMES.length];
}

function decorateScenesWithTheme(scenes: any[], theme: (typeof VISUAL_THEMES)[number]) {
  return scenes.map((scene, index) => {
    const isAlt = index % 2 === 1;
    const backgroundColor = isAlt ? theme.secondaryColor : theme.backgroundColor;
    const textColor = backgroundColor === theme.backgroundColor ? theme.textColor : "#f9fafb";
    const accentColor = isAlt ? theme.accentColor : theme.surfaceColor;
    const props = {
      fontFamily: theme.fontFamily,
      ...scene.props,
    };

    switch (scene.sceneTemplate) {
      case "TitleScene":
      case "RetentionScene":
        props.backgroundColor = props.backgroundColor || backgroundColor;
        props.textColor = props.textColor || textColor;
        props.accentColor = props.accentColor || accentColor;
        break;
      case "BigNumberScene":
        props.backgroundColor = props.backgroundColor || backgroundColor;
        props.textColor = props.textColor || textColor;
        props.highlightColor = props.highlightColor || theme.accentColor;
        break;
      case "ChartScene":
        props.backgroundColor = props.backgroundColor || backgroundColor;
        props.textColor = props.textColor || textColor;
        props.chartColor = props.chartColor || theme.accentColor;
        break;
      case "CircleHighlightScene":
        props.backgroundColor = props.backgroundColor || backgroundColor;
        props.textColor = props.textColor || textColor;
        props.circleColor = props.circleColor || theme.accentColor;
        break;
      case "BulletListScene":
      case "QuoteScene":
      case "TimelineScene":
      case "CodeTypingScene":
        props.backgroundColor = props.backgroundColor || backgroundColor;
        props.textColor = props.textColor || textColor;
        props.accentColor = props.accentColor || theme.accentColor;
        break;
      default:
        break;
    }

    return { ...scene, props };
  });
}

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
      "Regras de Retenção e Visual:",
      `- A narração deve ter tamanho suficiente para preencher os ${project.videoDurationSec} segundos de vídeo (aproximadamente 2.5 palavras por segundo). Portanto, gere em torno de ${Math.round(project.videoDurationSec * 2.5)} palavras no narrationText.`,
      "- Use ganchos visuais e textuais fortes nos primeiros 3 segundos.",
      "- NarrationText em português (pt-BR), tom enérgico e sem pausas desnecessárias.",
      "- CRITICAL: O narrationText deve conter APENAS o texto que será lido. PROIBIDO incluir emojis, descrições de imagens entre colchetes ou parênteses.",
      "- NUNCA invente URLs falsas. Se não houver URL válida do Pexels, deixe props.url vazio.",
      "- Adicione overlays e sfx (woosh, pop, ding, success) nas props para reforçar o conteúdo.",
      "- props.overlays: array de { type: 'emoji'|'icon'|'arrow'|'woosh'|'pop'|'ding'|'success', value: string, timeSec: number, position: 'top'|'center'|'bottom' }.",
      "- IMPORTANTE CORES: Pare de usar fundos brancos, pretos chatos ou cinzas. Você DEVE ESCOLHER cores de fundo hiper-contrastantes e vibrantes baseadas no tema (ex: Amarelo Neon #FFEB3B, Azul Cobalto #2962FF, Verde Dinheiro #00E676, Vermelho Choque #D50000).",
      "- IMPORTANTE CORES: O texto deve ter contraste perfeito. Se fundo for neon/claro, texto DEVE ser #000000. Se fundo for escuro, texto DEVE ser #FFFFFF.",
      "- CENAS OBRIGATÓRIAS: Escolha as cenas conforme o contexto da frase.",
      "  * Falando de porcentagens, dinheiro ou dias? Use 'BigNumberScene' (number, subtitle).",
      "  * Falando de crescimento, vendas ou estatísticas? Use 'ChartScene' (title, dataPoints).",
      "  * Explicando pilares ou conceitos? Use 'CircleHighlightScene' (centerText, surroundingTexts).",
      "  * Imagens reais de fundo necessárias? Use 'RetentionScene' (title, url).",
      "  * Início do vídeo? Use 'TitleScene'.",
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
      `IDEIA / PERGUNTA: ${project.ideaPrompt}`,
      `FORMATO: ${formatHint}`,
      `DURACAO_TOTAL_SEGUNDOS: ${project.videoDurationSec}`,
      pexelsAssets,
      "",
      "Gere um roteiro dinâmico com 4 a 8 cenas curtas (2 a 5 segundos cada).",
      "Variação é rei: NUNCA repita a mesma cor de fundo 3 vezes seguidas. Alterne as cores (ex: Amarelo Neon -> Preto -> Azul).",
      "Use as novas ferramentas (BigNumberScene, ChartScene, CircleHighlightScene) se o tema encaixar.",
      "Mantenha o vídeo ultra profissional e dinâmico.",
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
    const theme = pickTheme(project.id);
    const scenes = decorateScenesWithTheme(
      coerceScenes(parsed.scenes ?? [], project.videoDurationSec),
      theme
    );

    const videoSpec = {
      version: 1,
      meta: {
        aspectRatio: project.aspectRatio === "LANDSCAPE_16_9" ? "16:9" : "9:16",
        fps: project.fps,
        theme,
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
