import "server-only";
import { prisma } from "@/lib/prisma";
import { TechnicalFunnel, technicalContentTopics } from "@/lib/technicalContentTopics";
import { recordContentMetric, recordProviderFailure, recordProviderSuccess } from "@/lib/operationsControl";

const funnelMeta: Record<TechnicalFunnel, { label: string; courseUrl: string; courseName: string }> = {
  TOP: { label: "Topo de funil", courseUrl: "/cursos", courseName: "catálogo de cursos" },
  MIDDLE: { label: "Meio de funil", courseUrl: "/cursos", courseName: "catálogo de cursos" },
  BOTTOM: { label: "Fundo de funil", courseUrl: "/cursos", courseName: "catálogo de cursos" },
};

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90);
}

function brazilDay(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(date);
}

function brazilHour(date = new Date()) {
  return Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", hour: "2-digit", hour12: false }).format(date));
}

function words(value: string) { return value.trim().split(/\s+/).filter(Boolean).length; }

/**
 * Makes the technical-content program ready on a fresh database.  The topic
 * catalog lives in source control, so relying on a manually run seed left the
 * generation button with an empty queue after deployment.
 */
async function ensureTechnicalContentTopics() {
  const storedTopics = await prisma.technicalContentTopic.findMany({
    select: { funnel: true, keyword: true },
  });
  const storedKeys = new Set(storedTopics.map((topic) => `${topic.funnel}:${topic.keyword}`));
  const missingTopics = technicalContentTopics.filter((topic) => !storedKeys.has(`${topic.funnel}:${topic.keyword}`));

  if (missingTopics.length) {
    // The unique database constraint makes simultaneous cron/manual requests safe.
    await prisma.technicalContentTopic.createMany({ data: missingTopics, skipDuplicates: true });
  }
}

async function generateArticle(input: { title: string; keyword: string; funnel: TechnicalFunnel; minWords: number; model: string }) {
  const key = String(process.env.OPENAI_API_KEY || "").trim();
  if (!key) throw new Error("OPENAI_API_KEY não configurada para a automação de artigos técnicos.");
  const meta = funnelMeta[input.funnel];
  const prompt = `Você é um educador técnico brasileiro e redator responsável da Plugando IA. Escreva um artigo original, didático e people-first em português brasileiro. Tema: ${input.title}. Palavra-chave principal: ${input.keyword}. Etapa: ${meta.label}.

Entregue JSON válido com title, summary, metaDescription e markdown. O markdown deve ter pelo menos ${input.minWords} palavras, uma resposta clara já no início, H2/H3 úteis, exemplos concretos, limitações quando existirem, checklist prático e FAQ de 3 perguntas. Não invente estatísticas, salários, datas, funcionalidades ou fontes. Não prometa emprego, renda ou resultado. Não use linguagem de venda agressiva. Inclua apenas uma chamada final natural para ${meta.courseName}, com link interno ${meta.courseUrl}?utm_source=artigos_tecnicos&utm_medium=organic&utm_campaign=${input.funnel.toLowerCase()}.
O conteúdo deve resolver a dúvida de alguém, não ser feito para manipular rankings.`;
  let lastQualityError = "O artigo gerado não atingiu o padrão mínimo de qualidade.";

  for (let attempt = 1; attempt <= 3; attempt++) {
    const retryInstruction = attempt === 1
      ? ""
      : `\nA tentativa anterior não foi aceita por estar curta ou incompleta. Produza agora um markdown completo com pelo menos ${input.minWords + 150} palavras. Antes de responder, confira a contagem aproximada de palavras e mantenha todos os campos do JSON preenchidos.`;
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: input.model, temperature: 0.45, max_tokens: 7000, response_format: { type: "json_object" }, messages: [{ role: "system", content: "Responda somente JSON válido." }, { role: "user", content: `${prompt}${retryInstruction}` }] }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.error?.message || "Falha ao gerar artigo com IA.");

    try {
      const parsed = JSON.parse(payload?.choices?.[0]?.message?.content || "{}");
      const markdown = String(parsed.markdown || "");
      if (!parsed.title || !parsed.summary || !parsed.metaDescription || words(markdown) < input.minWords) {
        lastQualityError = "O artigo gerado não atingiu o padrão mínimo de qualidade.";
        continue;
      }
      return { title: String(parsed.title).slice(0, 180), summary: String(parsed.summary).slice(0, 500), metaDescription: String(parsed.metaDescription).slice(0, 160), markdown };
    } catch {
      lastQualityError = "A IA retornou um JSON de artigo inválido.";
    }
  }

  throw new Error(lastQualityError);
}

export async function runTechnicalContentFunnel(funnel: TechnicalFunnel, options: { force?: boolean } = {}) {
  const config = await prisma.technicalContentConfig.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } });
  await ensureTechnicalContentTopics();
  if (!config.enabled && !options.force) return { skipped: true, reason: "automation_disabled" };
  const field = funnel === "TOP" ? "lastTopRunAt" : funnel === "MIDDLE" ? "lastMiddleRunAt" : "lastBottomRunAt";
  const targetHour = funnel === "TOP" ? config.topHour : funnel === "MIDDLE" ? config.middleHour : config.bottomHour;
  if (!options.force && brazilHour() < targetHour) return { skipped: true, reason: `scheduled_for_${String(targetHour).padStart(2, "0")}:00` };
  const lastRun = config[field];
  if (!options.force && lastRun && brazilDay(lastRun) === brazilDay()) return { skipped: true, reason: "already_ran_today" };
  const topic = await prisma.technicalContentTopic.findFirst({ where: { funnel, status: "QUEUED" }, orderBy: [{ priority: "asc" }, { createdAt: "asc" }] });
  if (!topic) return { skipped: true, reason: "no_queued_topics" };
  const claimed = await prisma.technicalContentTopic.updateMany({ where: { id: topic.id, status: "QUEUED" }, data: { status: "GENERATING", scheduledAt: new Date() } });
  if (!claimed.count) return { skipped: true, reason: "topic_claimed_by_another_run" };
  try {
    const article = await generateArticle({ title: topic.title, keyword: topic.keyword, funnel, minWords: config.minWords, model: config.model });
    const slugBase = slugify(article.title);
    const slug = `${slugBase}-${topic.id.slice(-6)}`;
    const post = await prisma.post.create({ data: { title: article.title, slug, summary: article.summary, content: article.markdown, status: config.autoPublish ? "PUBLISHED" : "DRAFT", publishedAt: config.autoPublish ? new Date() : null, seoTitle: article.title, metaDescription: article.metaDescription, origin: `TECHNICAL_${funnel}` } });
    await prisma.technicalContentTopic.update({ where: { id: topic.id }, data: { status: config.autoPublish ? "PUBLISHED" : "GENERATED", postId: post.id, publishedAt: config.autoPublish ? new Date() : null, lastError: null } });
    await prisma.technicalContentConfig.update({ where: { id: "default" }, data: { [field]: new Date() } });
    await recordProviderSuccess("OPENAI_TECHNICAL_CONTENT");
    return { ok: true, topic: topic.keyword, postId: post.id, slug };
  } catch (error: any) {
    const message = error?.message || "Falha desconhecida ao gerar artigo.";
    await prisma.technicalContentTopic.update({ where: { id: topic.id }, data: { status: "QUEUED", lastError: message } });
    await recordProviderFailure("OPENAI_TECHNICAL_CONTENT", message);
    throw error;
  }
}

export async function recordTechnicalPageView(input: { postId?: string; sessionId?: string; source?: string; medium?: string; campaign?: string; referrer?: string; page: "hub" | "article" }) {
  return recordContentMetric({ eventType: input.page === "hub" ? "page_view" : "article_view", postId: input.postId || null, sessionId: input.sessionId || null, source: input.source || null, medium: input.medium || null, campaign: input.campaign || null, referrer: input.referrer || null, metadata: { section: "technical_content", page: input.page } });
}
