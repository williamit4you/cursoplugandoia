import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateEngagementIdea } from "@/lib/engagement/generateIdea";
import { ENGAGEMENT_TEMPLATES } from "@/lib/engagement/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

function normalize(value: unknown) {
  return String(value || "").trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const coletaId = body?.coletaId ? normalize(body.coletaId) : "";
    const templateType = normalize(body?.templateType);
    const personaName = body?.personaName ? normalize(body.personaName) : undefined;

    if (!templateType) return NextResponse.json({ error: "templateType is required" }, { status: 400 });
    if (!ENGAGEMENT_TEMPLATES.some((t) => t.type === templateType)) {
      return NextResponse.json({ error: "templateType inválido" }, { status: 400 });
    }

    let title = "";
    let description = "";
    let details = "";
    if (coletaId) {
      const coleta = await prisma.coletaDadosShoppe.findUnique({
        where: { id: coletaId },
        select: { titulo: true, descricao: true, detalhes: true, aiPromptVendas: true },
      });
      if (!coleta) return NextResponse.json({ error: "coletaId não encontrado" }, { status: 404 });
      title = String(coleta.titulo || "");
      description = String(coleta.descricao || coleta.aiPromptVendas || "");
      details = String(coleta.detalhes || "");
    }

    const generated = await generateEngagementIdea({
      templateType: templateType as any,
      personaName,
      productTitle: title,
      productDescription: description,
      productDetails: details,
    });

    const created = await prisma.engagementIdea.create({
      data: {
        coletaId: coletaId || null,
        templateType,
        personaName: generated.personaName || null,
        hook: generated.hook,
        script: generated.script,
        onScreenText: generated.onScreenText as any,
        ctaComment: generated.ctaComment || null,
        status: "DRAFT",
      },
    });

    return NextResponse.json({ ok: true, item: created });
  } catch (error: any) {
    console.error("[api/engajamento/ideas/generate POST]", error);
    return NextResponse.json({ error: error?.message || "Falha ao gerar ideia" }, { status: 500 });
  }
}

