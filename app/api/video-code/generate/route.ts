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

type ProductAdMetadata = {
  productName?: string;
  productDescription?: string;
  productTechnicalDetails?: string;
  productUseCases?: string;
  targetAudience?: string;
  productUrl?: string;
  ctaText?: string;
  primaryBgColor?: string;
  primaryTextColor?: string;
  assets?: Array<{
    url: string;
    kind?: "IMAGE" | "VIDEO";
    name?: string;
  }>;
};

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

function safeParseMetadata(text: string | null | undefined): ProductAdMetadata {
  if (!text) return {};
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

const ALLOWED_TEMPLATES = new Set([
  "TitleScene",
  "BulletListScene",
  "QuoteScene",
  "TimelineScene",
  "CodeTypingScene",
  "RetentionScene",
  "ChartScene",
  "BigNumberScene",
  "CircleHighlightScene",
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

function normalizeHexColor(input: string | undefined | null) {
  const value = String(input ?? "").trim();
  if (!/^#([0-9a-fA-F]{6})$/.test(value)) return null;
  return value;
}

function buildTheme(projectId: string, metadata: ProductAdMetadata) {
  const baseTheme = pickTheme(projectId);
  const backgroundColor = normalizeHexColor(metadata.primaryBgColor) || baseTheme.backgroundColor;
  const textColor = normalizeHexColor(metadata.primaryTextColor) || baseTheme.textColor;
  return {
    ...baseTheme,
    backgroundColor,
    textColor,
  };
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
  if (safe.length === 0 || total <= 0) return safe;

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

    const metadata = safeParseMetadata(project.metadataJson);
    const isProductAd = project.projectType === "PRODUCT_AD";

    await prisma.codeVideoProject.update({
      where: { id: projectId },
      data: { status: "GENERATING", errorMessage: null },
    });

    const formatHint =
      project.aspectRatio === "LANDSCAPE_16_9"
        ? "YouTube (16:9, 1920x1080)"
        : "TikTok/Reels (9:16, 1080x1920)";

    const system = [
      isProductAd
        ? "Você é um copywriter e diretor criativo especialista em vídeos curtos de propaganda para vender produtos."
        : "Você é um especialista em vídeos virais e edição de retenção.",
      isProductAd
        ? "Seu objetivo é criar um vídeo vendedor, claro, persuasivo e visualmente forte, com foco em conversão."
        : "Seu objetivo é criar roteiros e planos de cena que prendam a atenção do início ao fim.",
      "Você deve responder APENAS com um JSON válido.",
      isProductAd
        ? "Saída obrigatória: title, description, narrationText, ctaText, scenes."
        : "Saída obrigatória: title, description, narrationText, scenes.",
      "Cada scene deve ter: sceneTemplate, durationSec, props.",
      `sceneTemplate permitido: ${Array.from(ALLOWED_TEMPLATES).join(", ")}.`,
      `A narração deve preencher aproximadamente ${project.videoDurationSec} segundos, com cerca de ${Math.round(project.videoDurationSec * 2.5)} palavras.`,
      "Use ganchos visuais e textuais fortes nos primeiros 3 segundos.",
      "NarrationText em português (pt-BR), tom energético e natural.",
      "O narrationText deve conter APENAS o texto que será lido.",
      "Nunca invente URLs falsas. Se não houver URL válida, deixe props.url vazio.",
      "Mantenha contraste forte entre fundo e texto.",
      "Use TitleScene no início e RetentionScene quando houver mídia real.",
      ...(isProductAd
        ? [
            "O vídeo deve agir como propaganda comercial de produto físico.",
            "Destaque materiais, acabamento, diferenciais, contexto de uso e benefício real ao cliente.",
            "Reforce em pontos estratégicos que o link do produto com desconto especial está na descrição do vídeo.",
            "Use gatilhos mentais com moderação: oportunidade, praticidade, conforto, economia e desejo.",
            "Quando houver assets do usuário, priorize-os nas scenes do tipo RetentionScene.",
          ]
        : []),
    ].join("\n");

    let pexelsAssets = "";
    if (project.useExternalMedia) {
      const query = isProductAd
        ? metadata.productName || project.title || project.ideaPrompt
        : project.ideaPrompt;
      const assets = await searchPexelsMedia(query, 6);
      if (assets.length > 0) {
        pexelsAssets =
          "\nRECURSOS EXTERNOS DISPONÍVEIS (usar em props.url quando útil):\n" +
          assets.map((a: PexelsAsset) => `- ${a.url} (Thumbnail: ${a.thumbnail})`).join("\n");
      }
    }

    const uploadedAssets = Array.isArray(metadata.assets) ? metadata.assets : [];
    const uploadedAssetsText =
      uploadedAssets.length > 0
        ? "\nASSETS ENVIADOS PELO USUÁRIO (priorize estes em props.url):\n" +
          uploadedAssets
            .map((asset, index) => `- ${index + 1}. ${asset.kind || "IMAGE"} | ${asset.url}`)
            .join("\n")
        : "";

    const user = isProductAd
      ? [
          "TIPO_DE_PROJETO: PRODUCT_AD",
          `PRODUTO: ${metadata.productName || project.title || "Produto sem nome"}`,
          `DESCRICAO_COMERCIAL: ${metadata.productDescription || project.description || ""}`,
          `DETALHES_TECNICOS: ${metadata.productTechnicalDetails || ""}`,
          `USOS_RECOMENDADOS: ${metadata.productUseCases || ""}`,
          `PUBLICO_ALVO: ${metadata.targetAudience || ""}`,
          `LINK_DO_PRODUTO: ${metadata.productUrl || ""}`,
          `CTA_PREFERENCIAL: ${metadata.ctaText || "O link do produto com desconto especial está na descrição do vídeo."}`,
          `FORMATO: ${formatHint}`,
          `DURACAO_TOTAL_SEGUNDOS: ${project.videoDurationSec}`,
          `CORES_PREFERIDAS: fundo=${metadata.primaryBgColor || "auto"} | texto=${metadata.primaryTextColor || "auto"}`,
          uploadedAssetsText,
          pexelsAssets,
          "",
          "Gere um roteiro de propaganda com 4 a 8 cenas curtas.",
          "Comece com um gancho de venda, mostre benefícios, contexto de uso e feche com CTA forte.",
          "Inclua pelo menos 2 scenes do tipo RetentionScene se houver assets disponíveis.",
          "O resultado deve parecer um vendedor profissional apresentando o produto.",
        ].join("\n")
      : [
          `IDEIA / TEMA: ${project.ideaPrompt}`,
          `FORMATO: ${formatHint}`,
          `DURACAO_TOTAL_SEGUNDOS: ${project.videoDurationSec}`,
          uploadedAssetsText,
          pexelsAssets,
          "",
          "Gere um roteiro dinâmico com 4 a 8 cenas curtas.",
          "Use ferramentas visuais como BigNumberScene, ChartScene e CircleHighlightScene quando fizer sentido.",
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
    const theme = buildTheme(project.id, metadata);
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
        title: title || project.title || null,
        description: description || null,
        narrationText: narrationText || null,
        promptPreview: user,
        metadataJson: JSON.stringify({
          ...metadata,
          ctaText: String(parsed.ctaText ?? metadata.ctaText ?? "").trim() || metadata.ctaText,
        }),
        videoSpecJson: JSON.stringify(videoSpec, null, 2),
        errorMessage: null,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to generate" }, { status: 500 });
  }
}
