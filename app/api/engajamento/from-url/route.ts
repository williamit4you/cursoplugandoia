import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scrapeShopeeAndPersist } from "@/lib/shopee-pipeline/scrape";
import { generateEngagementIdea } from "@/lib/engagement/generateIdea";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 900;

function normalize(value: unknown) {
  return String(value || "").trim();
}

const DEFAULT_TEMPLATE_SEQUENCE = ["INUTIL_ATE_VER", "NAO_COMPRE_SEM_VER", "PERGUNTA_SIMPLES"] as const;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const url = normalize(body?.url);
    const creatorImageUrl = body?.creatorImageUrl ? normalize(body.creatorImageUrl) : "";
    if (!url) return NextResponse.json({ error: "url is required" }, { status: 400 });

    // 1) Create/find coleta for that URL
    const existing = await prisma.coletaDadosShoppe.findUnique({ where: { url }, select: { id: true } }).catch(() => null);
    const coleta =
      existing?.id
        ? await prisma.coletaDadosShoppe.findUnique({ where: { id: existing.id } })
        : await prisma.coletaDadosShoppe.create({ data: { url } });
    if (!coleta) return NextResponse.json({ error: "Falha ao criar/encontrar coleta" }, { status: 500 });

    // 2) Ensure scrape data is present
    const scraped = await scrapeShopeeAndPersist({ coletaId: coleta.id, productUrl: url });
    const updated = scraped.updated;

    // 3) Pick default creator image if none provided
    const resolvedCreatorImageUrl =
      creatorImageUrl ||
      (await prisma.creatorAsset.findFirst({ where: { active: true, kind: "IMAGE" }, orderBy: { createdAt: "desc" } }).then((x) => x?.url || "").catch(() => ""));

    // 4) Generate 3 ideas (variety) and persist
    const ideas = [];
    for (const templateType of DEFAULT_TEMPLATE_SEQUENCE) {
      const generated = await generateEngagementIdea({
        templateType: templateType as any,
        personaName: undefined,
        productTitle: String(updated?.titulo || ""),
        productDescription: String(updated?.descricao || updated?.aiPromptVendas || ""),
        productDetails: String(updated?.detalhes || ""),
      });

      const idea = await prisma.engagementIdea.create({
        data: {
          coletaId: coleta.id,
          templateType,
          personaName: generated.personaName || null,
          hook: generated.hook,
          script: generated.script,
          onScreenText: generated.onScreenText as any,
          ctaComment: generated.ctaComment || null,
          creatorImageUrl: resolvedCreatorImageUrl || null,
          status: "DRAFT",
        },
        include: { coleta: { select: { id: true, titulo: true } } },
      });
      ideas.push(idea);
    }

    return NextResponse.json({
      ok: true,
      coletaId: coleta.id,
      creatorImageUrl: resolvedCreatorImageUrl || null,
      ideas,
    });
  } catch (error: any) {
    console.error("[api/engajamento/from-url POST]", error);
    return NextResponse.json({ error: error?.message || "Falha ao gerar ideias por URL" }, { status: 500 });
  }
}

