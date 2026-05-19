import "server-only";

import { ENGAGEMENT_TEMPLATES, type EngagementTemplateType } from "@/lib/engagement/templates";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

function safeString(value: unknown) {
  return String(value || "").trim();
}

function clampText(value: string, max: number) {
  const v = safeString(value);
  return v.length > max ? v.slice(0, max) : v;
}

function buildSystemPrompt() {
  return (
    "Você é um roteirista/copywriter sênior para vídeos curtos (TikTok/Reels/Shorts) focados em retenção, comentários e compartilhamentos.\n" +
    "Você NÃO está escrevendo um anúncio direto. A venda é indireta e opcional.\n" +
    "Regras:\n" +
    "- Linguagem natural (PT-BR), ritmo rápido, frases curtas.\n" +
    "- Evite especificações técnicas que soam ruins em áudio (códigos, modelos, mistura de letras+ números, IPxx, 110-220V, apps, etc).\n" +
    "- Não invente funcionalidades, certificações, números ou promessas.\n" +
    "- Foque em cenário de uso real e benefício humano.\n" +
    "- Duração alvo: 30s a 2min.\n" +
    "- Retorne SOMENTE JSON válido no formato solicitado."
  );
}

export async function generateEngagementIdea(params: {
  templateType: EngagementTemplateType;
  personaName?: string;
  productTitle?: string;
  productDescription?: string;
  productDetails?: string;
}) {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

  const template = ENGAGEMENT_TEMPLATES.find((t) => t.type === params.templateType);
  if (!template) throw new Error("Template inválido");

  const personaName = safeString(params.personaName) || template.personaName;
  const title = clampText(params.productTitle || "", 160);
  const description = clampText(params.productDescription || "", 1200);
  const details = clampText(params.productDetails || "", 1200);

  const userPrompt =
    `TEMPLATE: ${template.name}\n` +
    `OBJETIVO: ${template.objective}\n` +
    `PERSONA: ${personaName}\n` +
    `GUIDANCE: ${template.guidance}\n\n` +
    `TÍTULO DO PRODUTO (pode estar sujo): ${title}\n` +
    `DESCRIÇÃO (filtrada): ${description}\n` +
    `DETALHES (filtrados): ${details}\n\n` +
    "Gere um roteiro para locução (voz humana), com humor/curiosidade/autoridade conforme o template.\n" +
    "Saída JSON (campos obrigatórios):\n" +
    '{\n' +
    '  "hook": "1 frase forte (até 90 chars)",\n' +
    '  "script": "roteiro completo para locução",\n' +
    '  "on_screen_text": ["2 a 4 textos curtos para aparecer na tela"],\n' +
    '  "cta_comment": "uma pergunta simples para comentários (pode ser vazio se não fizer sentido)"\n' +
    "}\n";

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.8,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error: ${res.status} - ${err}`);
  }

  const data = await res.json();
  const raw = String(data?.choices?.[0]?.message?.content || "{}").trim();
  const parsed = JSON.parse(raw);

  const hook = clampText(parsed?.hook || "", 140);
  const script = clampText(parsed?.script || "", 8000);
  const onScreenText = Array.isArray(parsed?.on_screen_text) ? parsed.on_screen_text.map((x: any) => clampText(String(x), 80)).filter(Boolean) : [];
  const ctaComment = clampText(parsed?.cta_comment || "", 140);

  if (!hook || !script) throw new Error("IA retornou JSON inválido (hook/script vazio)");

  return { hook, script, onScreenText, ctaComment, personaName, template };
}

