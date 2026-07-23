import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrCronSecret } from "@/lib/shopee-pipeline/apiAuth";
import { calculateSeoOpportunityScore } from "@/lib/seoGovernance";
import { runSeoAgentPipeline } from "@/lib/seoAgentPipeline";

const ANGLES = [
  { angle: "PAIN", suffix: "qual problema resolve", intent: "informacional" },
  { angle: "PRODUCT", suffix: "vale a pena", intent: "comercial" },
  { angle: "COMPARISON", suffix: "comparativo e alternativas", intent: "comparacao" },
];
function slugify(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdminOrCronSecret(req);
    const product = await prisma.productCatalog.findUnique({ where: { id: params.id }, include: { opportunities: { orderBy: { opportunityScore: "desc" }, take: 1 } } });
    if (!product) return NextResponse.json({ error: "Produto nao encontrado" }, { status: 404 });
    const opportunity = product.opportunities[0];
    if (opportunity) {
      await prisma.seoOpportunity.update({ where: { id: opportunity.id }, data: { opportunityScore: calculateSeoOpportunityScore(opportunity) } });
    }
    const keyword = opportunity?.keyword || product.name;
    const briefs = await Promise.all(ANGLES.map((item) => prisma.seoBrief.upsert({
      where: { productId_angle: { productId: product.id, angle: item.angle } },
      update: { primaryKeyword: keyword, intent: item.intent, title: `${product.name}: ${item.suffix}` },
      create: { productId: product.id, opportunityId: opportunity?.id, angle: item.angle, title: `${product.name}: ${item.suffix}`, slug: `${slugify(product.name)}-${slugify(item.angle)}`, primaryKeyword: keyword, intent: item.intent, outlineJson: JSON.stringify(["Intencao e contexto", "Evidencias e limites", "Como escolher", "Video e produto relacionado"]), internalLinksJson: JSON.stringify([product.productUrl, product.affiliateUrl].filter(Boolean)) },
    })));
    return NextResponse.json({ ok: true, briefs });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Falha ao gerar briefs" }, { status: error?.message === "Unauthorized" ? 401 : 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdminOrCronSecret(req);
    const body = await req.json();
    const result = await runSeoAgentPipeline(String(body.briefId || ""));
    return NextResponse.json({ ok: true, result });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Falha no pipeline de agentes SEO" }, { status: error?.message === "Unauthorized" ? 401 : 500 });
  }
}
