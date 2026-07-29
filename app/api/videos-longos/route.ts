import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LONG_FORM_MAX_SUBTOPICS, LONG_FORM_PROJECT_TYPE, LONG_FORM_TARGET_DURATION_SEC, normalizeSubtopics } from "@/lib/longFormMarketing";
export const dynamic = "force-dynamic";
export async function GET() { const items = await prisma.codeVideoProject.findMany({ where: { projectType: LONG_FORM_PROJECT_TYPE }, orderBy: { createdAt: "desc" }, take: 100, include: { socialPosts: { orderBy: { scheduledTo: "desc" }, take: 1 } } }); return NextResponse.json({ items }); }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const title = String(body?.workingTitle || "").trim();
  const subtopics = normalizeSubtopics(body?.subtopics);
  const funnelStage = ["TOPO", "MEIO", "FUNDO"].includes(String(body?.funnelStage)) ? String(body.funnelStage) : "TOPO";
  if (title.length < 10) return NextResponse.json({ error: "Informe um titulo com pelo menos 10 caracteres." }, { status: 400 });
  if (subtopics.length < 4) return NextResponse.json({ error: `Informe de 4 a ${LONG_FORM_MAX_SUBTOPICS} subtitulos.` }, { status: 400 });
  const maxCostUsd = Math.max(0.01, Number(process.env.LONG_FORM_MARKETING_MAX_COST_USD || "2"));
  const estimatedCostUsd = 0.25;
  if (estimatedCostUsd > maxCostUsd) return NextResponse.json({ error: `Estimativa de US$ ${estimatedCostUsd.toFixed(2)} excede o teto configurado de US$ ${maxCostUsd.toFixed(2)}.` }, { status: 400 });
  const metadata = { kind: "LONG_FORM_MARKETING", funnelStage, subtopics, audience: String(body?.audience || ""), objective: String(body?.objective || ""), cta: String(body?.cta || ""), tone: String(body?.tone || "DIDATICO"), externalMediaPolicy: body?.externalMediaPolicy === "UPLOADS_ONLY" ? "UPLOADS_ONLY" : "PEXELS_AND_UPLOADS", estimatedCostUsd, maxCostUsd, planningApproved: false, finalApproved: false };
  const project = await prisma.codeVideoProject.create({ data: { projectType: LONG_FORM_PROJECT_TYPE, ideaPrompt: title, title, aspectRatio: "LANDSCAPE_16_9", videoDurationSec: LONG_FORM_TARGET_DURATION_SEC, fps: 30, ttsVoice: "pt-BR-AntonioNeural", ttsSpeed: "+5%", useExternalMedia: metadata.externalMediaPolicy === "PEXELS_AND_UPLOADS", metadataJson: JSON.stringify(metadata), description: "", status: "DRAFT" } });
  return NextResponse.json(project, { status: 201 });
}
