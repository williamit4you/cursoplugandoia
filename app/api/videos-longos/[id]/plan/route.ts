import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LONG_FORM_MODEL, LONG_FORM_PROJECT_TYPE, LONG_FORM_TARGET_DURATION_SEC, createFreeThumbnail, findPexelsAssets, parseLongFormMetadata } from "@/lib/longFormMarketing";
import { logCodeVideoPipelineEvent, upsertCodeVideoPipelineStep } from "@/lib/video-code/logger";

export const dynamic = "force-dynamic";
const TARGET_DURATION_SEC = LONG_FORM_TARGET_DURATION_SEC;
const MIN_NARRATION_WORDS = 1_550;
const MAX_NARRATION_WORDS = 1_700;
function object(text: string) { try { return JSON.parse(text); } catch { const a = text.indexOf("{"); const b = text.lastIndexOf("}"); if (a >= 0 && b > a) try { return JSON.parse(text.slice(a, b + 1)); } catch {} return null; } }
function wordCount(text: string) { return text.trim().split(/\s+/).filter(Boolean).length; }
function cleanNarration(text: string) { return text.replace(/^```(?:text|markdown)?\s*/i, "").replace(/\s*```$/, "").trim(); }
function trimNarration(text: string, maxWords: number) { const words = text.trim().split(/\s+/); if (words.length <= maxWords) return text.trim(); const clipped = words.slice(0, maxWords).join(" "); const lastStop = Math.max(clipped.lastIndexOf("."), clipped.lastIndexOf("!"), clipped.lastIndexOf("?")); return `${lastStop > clipped.length * 0.85 ? clipped.slice(0, lastStop + 1) : clipped}.`; }
function scenes(raw: any[], duration: number, assets: Array<{ url: string }>) { const allowed = new Set(["TitleScene", "BulletListScene", "TimelineScene", "CodeTypingScene", "ChartScene", "BigNumberScene", "CircleHighlightScene", "RetentionScene"]); const input = Array.isArray(raw) ? raw.slice(0, 70) : []; const fallback = [{ sceneTemplate: "TitleScene", props: { title: "Marketing digital sem enrolacao", subtitle: "Aula completa" } }, { sceneTemplate: "BulletListScene", props: { title: "O que voce vai aprender", items: ["Estrategia", "Execucao", "Proximos passos"] } }]; const selected = input.length ? input : fallback; const count = Math.max(40, Math.min(70, selected.length)); const baseSeconds = Math.floor(duration / count); const remainingSeconds = duration - baseSeconds * count;
  return Array.from({ length: count }, (_, index) => { const scene = selected[index % selected.length]; const template = allowed.has(scene?.sceneTemplate) ? scene.sceneTemplate : "BulletListScene"; const media = assets[index % Math.max(assets.length, 1)]?.url; const props = { ...(scene?.props || {}), backgroundColor: index % 2 ? "#111111" : "#080808", textColor: "#ffffff", accentColor: "#dc2626", fontFamily: "Arial Black, Arial" }; const durationSec = baseSeconds + (index < remainingSeconds ? 1 : 0); if (template === "RetentionScene" && media) props.url = media; if (template === "RetentionScene" && !media) return { id: `scene-${index + 1}`, sceneTemplate: "BulletListScene", durationSec, props: { ...props, title: props.title || "Ponto importante", items: Array.isArray(props.items) ? props.items : [props.subtitle || "Aplique este passo"] } }; return { id: `scene-${index + 1}`, sceneTemplate: template, durationSec, props }; }); }

export async function POST(_: NextRequest, ctx: { params: { id: string } }) {
  const project = await prisma.codeVideoProject.findFirst({ where: { id: ctx.params.id, projectType: LONG_FORM_PROJECT_TYPE } });
  if (!project) return NextResponse.json({ error: "Nao encontrado" }, { status: 404 });
  const meta = parseLongFormMetadata(project.metadataJson); if (meta.subtopics?.length < 1) return NextResponse.json({ error: "Briefing sem subtitulos suficientes." }, { status: 400 });
  const key = process.env.OPENAI_API_KEY; if (!key) return NextResponse.json({ error: "OPENAI_API_KEY nao configurada" }, { status: 400 });
  await prisma.codeVideoProject.update({ where: { id: project.id }, data: { status: "GENERATING", errorMessage: null } });
  await upsertCodeVideoPipelineStep({ projectId: project.id, stepName: "LONG_FORM_PLAN", status: "RUNNING", attempt: 1, startedAt: new Date() });
  const system = "Voce e estrategista de marketing digital e diretor de arte para aulas de YouTube em portugues brasileiro. Responda somente JSON valido. Nao gere narrationText: o roteiro falado sera produzido separadamente por blocos. Nao prometa resultados garantidos, renda facil ou burlar plataformas. Gere title, titleOptions, description, tags, chapters, thumbnailConcepts, scenes, pexelsQueries e subtopicCoverage. Para scenes use apenas TitleScene, BulletListScene, TimelineScene, CodeTypingScene, ChartScene, BigNumberScene, CircleHighlightScene ou RetentionScene. props deve ter textos curtos e claros.";
  const user = JSON.stringify({ stage: meta.funnelStage, title: project.ideaPrompt, subtopics: meta.subtopics, audience: meta.audience || "iniciante em marketing digital", objective: meta.objective || "educar", cta: meta.cta || "Inscreva-se para aprender marketing digital sem enrolacao.", targetSeconds: TARGET_DURATION_SEC, required: { titleOptions: 3, thumbnailConcepts: 3, tags: "10-20", scenes: "8-15 cenas-base que serao distribuidas pela timeline", chapters: "4-10", subtopicCoverage: "um item curto para cada subtitulo" } });
  try {
    let data: any = null; let result: any = null; let narrationText = ""; let narrationWords = 0;
    for (let attempt = 1; attempt <= 1; attempt += 1) {
      const retryInstruction = attempt === 1 ? user : `${user}\n\nA tentativa anterior teve apenas ${narrationWords} palavras. Reescreva o JSON completo com um narrationText entre ${MIN_NARRATION_WORDS} e ${MAX_NARRATION_WORDS} palavras; desenvolva cada subtitulo com explicacao, exemplo e aplicacao pratica.`;
      const response = await fetch("https://api.openai.com/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` }, body: JSON.stringify({ model: LONG_FORM_MODEL, temperature: 0.55, max_tokens: 4000, response_format: { type: "json_object" }, messages: [{ role: "system", content: system }, { role: "user", content: retryInstruction }] }) });
      data = await response.json(); if (!response.ok) throw new Error(data?.error?.message || "Falha na OpenAI");
      result = object(String(data?.choices?.[0]?.message?.content || "")); if (!result) throw new Error("A IA nao retornou JSON valido.");
      narrationText = String(result.narrationText || "").trim(); narrationWords = wordCount(narrationText);
      if (narrationWords >= MIN_NARRATION_WORDS && narrationWords <= MAX_NARRATION_WORDS) break;
    }
    // A narracao final e sempre montada por blocos menores. Isso evita depender
    // de uma unica resposta enorme e garante que todos os subtitulos entrem no roteiro.
    narrationWords = 0;
    if (narrationWords < MIN_NARRATION_WORDS || narrationWords > MAX_NARRATION_WORDS) {
      const groupCount = Math.min(10, Math.max(3, Math.ceil(meta.subtopics.length / 5)));
      const chunkSize = Math.ceil(meta.subtopics.length / groupCount);
      const topicGroups = Array.from({ length: groupCount }, (_, index) => meta.subtopics.slice(index * chunkSize, (index + 1) * chunkSize)).filter((group) => group.length > 0);
      const targetWordsPerSection = Math.ceil(1_650 / topicGroups.length);
      const sections = await Promise.all(topicGroups.map(async (group, index) => {
        const sectionPrompt = [
          `Escreva APENAS texto falado em portugues do Brasil para a parte ${index + 1} de ${topicGroups.length} de uma aula longa no YouTube.`,
          `Titulo da aula: ${project.ideaPrompt}.`,
          `Desenvolva estes subtitulos: ${group.join(" | ")}.`,
          `Produza entre ${Math.max(150, targetWordsPerSection - 20)} e ${targetWordsPerSection + 20} palavras nesta parte. Mencione e explique todos os subtitulos recebidos, com exemplo concreto e aplicacao pratica. Nao use listas, cabecalhos, marcacoes, notas de cena ou JSON.`,
          index === 0 ? "Comece com um gancho curto e apresente o que sera aprendido." : "Comece com uma transicao natural da parte anterior.",
          index === topicGroups.length - 1 ? "Finalize com sintese e proximo passo, sem promessas de resultado garantido." : "Termine criando uma ponte natural para a proxima parte.",
        ].join("\n");
        const response = await fetch("https://api.openai.com/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` }, body: JSON.stringify({ model: LONG_FORM_MODEL, temperature: 0.55, max_tokens: Math.min(4200, Math.max(1200, targetWordsPerSection * 2)), messages: [{ role: "system", content: "Voce e um professor didatico e escreve somente o texto exato que sera narrado." }, { role: "user", content: sectionPrompt }] }) });
        const payload = await response.json(); if (!response.ok) throw new Error(payload?.error?.message || `Falha ao gerar parte ${index + 1} do roteiro.`);
        return cleanNarration(String(payload?.choices?.[0]?.message?.content || ""));
      }));
      narrationText = sections.join("\n\n"); narrationWords = wordCount(narrationText);
      if (narrationWords < MIN_NARRATION_WORDS) {
        const missing = Math.min(500, MIN_NARRATION_WORDS - narrationWords + 80);
        const response = await fetch("https://api.openai.com/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` }, body: JSON.stringify({ model: LONG_FORM_MODEL, temperature: 0.5, max_tokens: 1800, messages: [{ role: "system", content: "Escreva somente texto falado, sem titulo, lista, JSON ou rubrica." }, { role: "user", content: `Crie uma secao complementar de aproximadamente ${missing} palavras para a aula ${project.ideaPrompt}. Aprofunde exemplos e aplicacoes praticas destes topicos sem repetir a introducao: ${meta.subtopics.join(" | ")}. Termine com uma conclusao natural.` }] }) });
        const payload = await response.json(); if (!response.ok) throw new Error(payload?.error?.message || "Falha ao complementar o roteiro."); narrationText = `${narrationText}\n\n${cleanNarration(String(payload?.choices?.[0]?.message?.content || ""))}`; narrationWords = wordCount(narrationText);
      }
      if (narrationWords > MAX_NARRATION_WORDS) { narrationText = trimNarration(narrationText, 1675); narrationWords = wordCount(narrationText); }
    }
    if (narrationWords < MIN_NARRATION_WORDS || narrationWords > MAX_NARRATION_WORDS) throw new Error(`Roteiro fora da duracao segura mesmo apos geracao por blocos: ${narrationWords} palavras. Tente novamente.`);
    const queries = Array.isArray(result.pexelsQueries) ? result.pexelsQueries.map(String) : meta.subtopics.slice(0, 6).map((topic) => `digital marketing ${topic}`);
    const assets = await findPexelsAssets(queries, project.useExternalMedia); const visualScenes = scenes(result.scenes, TARGET_DURATION_SEC, assets);
    const generatedTitles = Array.isArray(result.titleOptions) ? result.titleOptions.map(String).filter(Boolean).slice(0, 3) : [];
    const titleOptions = Array.from(new Set([
      ...generatedTitles,
      String(result.title || project.title || project.ideaPrompt),
      `${project.ideaPrompt}: guia completo`,
      `Como entender ${project.ideaPrompt}`,
    ])).filter(Boolean).slice(0, 3);
    const title = titleOptions[0].slice(0, 100);
    const tags = Array.isArray(result.tags) ? result.tags.map(String).filter(Boolean).slice(0, 20) : [];
    const chapters = Array.isArray(result.chapters) ? result.chapters.map((x: any, index: number) => ({ title: String(x.title || `Capitulo ${index + 1}`), startSec: Math.max(0, Number(x.startSec || index * 60)) })).slice(0, 10) : [];
    const description = [String(result.description || ""), "", "Capitulos:", ...chapters.map((c: { title: string; startSec: number }) => `${String(Math.floor(c.startSec / 60)).padStart(2, "0")}:${String(c.startSec % 60).padStart(2, "0")} ${c.title}`), "", "Conteudo educacional sobre marketing digital."].join("\n").slice(0, 4500);
    const generatedCoverage: Array<{ subtopic: string; explanation: string }> = Array.isArray(result.subtopicCoverage) ? result.subtopicCoverage.map((item: any) => ({ subtopic: String(item?.subtopic || "").trim(), explanation: String(item?.explanation || "").trim() })) : [];
    const coverage = meta.subtopics.map((subtopic) => {
      const generated = generatedCoverage.find((item) => item.subtopic.toLocaleLowerCase("pt-BR") === subtopic.toLocaleLowerCase("pt-BR"));
      return {
        subtopic,
        explanation: generated?.explanation || `Este ponto e explicado no roteiro com contexto, exemplo e aplicacao pratica.`,
      };
    });
    const nextMeta: any = { ...meta, titleOptions, selectedTitle: title, youtubeTags: tags, chapters, thumbnailConcepts: Array.isArray(result.thumbnailConcepts) ? result.thumbnailConcepts.slice(0, 3) : [], subtopicCoverage: coverage, assetCredits: assets, planningApproved: false, actualCostUsd: null };
    const thumbnailOptions = await Promise.all(titleOptions.map(async (option: string, index: number) => ({ title: option, url: await createFreeThumbnail(project.id, option.slice(0, 100), nextMeta, `option-${index + 1}`) })));
    nextMeta.thumbnailOptions = thumbnailOptions;
    const thumbUrl = thumbnailOptions[0]?.url || await createFreeThumbnail(project.id, title, nextMeta);
    const updated = await prisma.codeVideoProject.update({ where: { id: project.id }, data: { status: "READY", title, description, narrationText, thumbUrl, metadataJson: JSON.stringify(nextMeta), videoSpecJson: JSON.stringify({ version: 1, meta: { aspectRatio: "16:9", fps: 30, theme: { id: "marketing-red-black", name: "Marketing Red", backgroundColor: "#080808", textColor: "#ffffff", accentColor: "#dc2626", secondaryColor: "#111111", surfaceColor: "#1f1f1f", fontFamily: "Arial Black, Arial" } }, content: { title, description, narrationText }, scenes: visualScenes }) } });
    await upsertCodeVideoPipelineStep({ projectId: project.id, stepName: "LONG_FORM_PLAN", status: "SUCCESS", attempt: 1, finishedAt: new Date(), responsePayload: { model: LONG_FORM_MODEL, narrationWords, scenes: visualScenes.length, assets: assets.length, usage: data?.usage || null } }); await logCodeVideoPipelineEvent({ projectId: project.id, stepName: "LONG_FORM_PLAN", message: `Roteiro longo com ${narrationWords} palavras, ${visualScenes.length} cenas e capa gratuita criado com ${LONG_FORM_MODEL}.` });
    return NextResponse.json(updated);
  } catch (error: any) { const message = error?.message || "Falha no planejamento"; await prisma.codeVideoProject.update({ where: { id: project.id }, data: { status: "FAILED", errorMessage: message } }); await upsertCodeVideoPipelineStep({ projectId: project.id, stepName: "LONG_FORM_PLAN", status: "FAILED", attempt: 1, finishedAt: new Date(), errorMessage: message }); return NextResponse.json({ error: message }, { status: 500 }); }
}
