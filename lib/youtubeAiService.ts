// ═══════════════════════════════════════════════════════════════
// YouTube AI Analyst — Service Layer
// Usa OpenAI gpt-4o-mini para gerar insights automáticos
// ═══════════════════════════════════════════════════════════════

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface AiReportResult {
  summary: string;
  insights: any;
  recommendations: any;
  rawResponse: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
}

const SYSTEM_PROMPT = `Você é um Analista Sênior de YouTube especializado em growth hacking e estratégia de conteúdo para canais brasileiros.

REGRAS:
- Use dados concretos fornecidos, não generalize
- Cite números específicos do canal
- Compare com médias do nicho quando disponível
- Dê sugestões acionáveis e específicas, não genéricas
- Escreva em português brasileiro
- Tom profissional mas acessível
- Sempre responda em JSON válido`;

export async function generateChannelReport(channelData: {
  name: string;
  category: string;
  subscribers: string;
  totalViews: string;
  totalVideos: number;
  viewsShorts: string;
  viewsLongs: string;
  weeklyGrowth: number;
  monthlyGrowth: number;
  uploadsThisWeek: number;
  uploadsThisMonth: number;
  livesPerMonth: number;
  lastVideoAt: string | null;
  recentVideos: Array<{
    title: string;
    videoType: string;
    views: string;
    likes: number;
    publishedAt: string;
  }>;
  nicheAvgViews?: number;
  nicheAvgSubs?: number;
}): Promise<AiReportResult> {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY não configurada");
  }

  const videosTable = channelData.recentVideos
    .map(
      (v) =>
        `- "${v.title}" | ${v.videoType} | ${v.views} views | ${v.likes} likes | ${v.publishedAt}`
    )
    .join("\n");

  const userPrompt = `Analise este canal do YouTube:

CANAL: ${channelData.name}
NICHO: ${channelData.category}
INSCRITOS: ${channelData.subscribers}
VIEWS TOTAIS: ${channelData.totalViews}
VÍDEOS: ${channelData.totalVideos}

MÉTRICAS RECENTES:
- Views Shorts: ${channelData.viewsShorts}
- Views Longos: ${channelData.viewsLongs}
- Crescimento semanal: ${channelData.weeklyGrowth}%
- Crescimento mensal: ${channelData.monthlyGrowth}%
- Uploads/semana: ${channelData.uploadsThisWeek}
- Uploads/mês: ${channelData.uploadsThisMonth}
- Lives/mês: ${channelData.livesPerMonth}
- Último vídeo: ${channelData.lastVideoAt || "N/A"}

ÚLTIMOS VÍDEOS:
${videosTable}

Gere um relatório JSON com esta estrutura EXATA:
{
  "summary": "Resumo executivo em 2-3 frases sobre o estado do canal",
  "diagnosis": "Análise detalhada do crescimento ou queda (3-4 frases)",
  "contentPattern": "Padrão de conteúdo identificado",
  "bestDays": ["seg", "qua"],
  "bestHours": [14, 18],
  "shortsVsLongs": "Análise comparativa entre formatos",
  "livesImpact": "Impacto das lives no crescimento",
  "improvements": ["Sugestão concreta 1", "Sugestão concreta 2", "..."],
  "contentIdeas": ["Ideia de conteúdo 1", "Ideia 2", "..."],
  "viralTitles": ["Título viral 1", "Título viral 2", "..."],
  "videoPrompts": ["Prompt para IA gerar vídeo 1", "..."],
  "viralThemes": ["Tema trending 1", "Tema 2", "..."],
  "missedOpportunities": ["Oportunidade perdida 1", "..."]
}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];
  const rawContent = choice?.message?.content || "{}";
  const usage = data.usage || {};

  // Custo gpt-4o-mini: $0.15/1M input, $0.60/1M output
  const promptTokens = usage.prompt_tokens || 0;
  const completionTokens = usage.completion_tokens || 0;
  const costUsd =
    (promptTokens * 0.00000015) + (completionTokens * 0.0000006);

  let parsed: any;
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    parsed = {
      summary: rawContent,
      diagnosis: "",
      improvements: [],
      contentIdeas: [],
      viralTitles: [],
    };
  }

  return {
    summary: parsed.summary || "",
    insights: JSON.stringify(parsed),
    recommendations: JSON.stringify({
      improvements: parsed.improvements || [],
      contentIdeas: parsed.contentIdeas || [],
      viralTitles: parsed.viralTitles || [],
      videoPrompts: parsed.videoPrompts || [],
      viralThemes: parsed.viralThemes || [],
      missedOpportunities: parsed.missedOpportunities || [],
    }),
    rawResponse: rawContent,
    model: "gpt-4o-mini",
    promptTokens,
    completionTokens,
    costUsd: parseFloat(costUsd.toFixed(6)),
  };
}
