import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrCronSecret } from "@/lib/shopee-pipeline/apiAuth";
import { calculateSeoOpportunityScore } from "@/lib/seoGovernance";

export const dynamic = "force-dynamic";
function slugify(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
function normalizeCollectedAt(value: unknown) {
  const parsed = value ? new Date(String(value)) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export async function GET(req: NextRequest) {
  await requireAdminOrCronSecret(req);
  const products = await prisma.productCatalog.findMany({ include: { _count: { select: { opportunities: true, briefs: true } } }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ ok: true, products });
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminOrCronSecret(req);
    const body = await req.json();
    const name = String(body.name || "").trim();
    if (!name) return NextResponse.json({ error: "Nome do produto e obrigatorio" }, { status: 400 });
    const product = await prisma.productCatalog.create({ data: { name, slug: slugify(body.slug || name), description: body.description || null, productUrl: body.productUrl || null, affiliateUrl: body.affiliateUrl || null, imageUrl: body.imageUrl || null, price: body.price == null ? null : Number(body.price), category: body.category || null, externalRef: body.externalRef || null } });
    return NextResponse.json({ ok: true, product });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Falha ao criar produto" }, { status: error?.message === "Unauthorized" ? 401 : 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdminOrCronSecret(req);
    const body = await req.json();
    const productId = String(body.productId || "");
    const terms = Array.isArray(body.terms) ? body.terms : [];
    if (!productId || !terms.length) return NextResponse.json({ error: "productId e terms sao obrigatorios" }, { status: 400 });
    const opportunities = await Promise.all(terms.map((term: any) => {
      const values = { demandScore: Number(term.demandScore || 0), trendScore: Number(term.trendScore || 0), competitionScore: Number(term.competitionScore || 0), relevanceScore: Number(term.relevanceScore || 0), conversionScore: Number(term.conversionScore || 0) };
      const collectedAt = normalizeCollectedAt(term.collectedAt || body.collectedAt);
      return prisma.seoOpportunity.create({
        data: {
          productId,
          keyword: String(term.keyword || "").trim(),
          region: String(term.region || body.region || "BR"),
          source: String(term.source || body.source || "MANUAL"),
          intent: term.intent || null,
          cluster: term.cluster || null,
          ...values,
          opportunityScore: calculateSeoOpportunityScore(values),
          collectedAt,
          rawDataJson: JSON.stringify({
            collectedAt: collectedAt.toISOString(),
            source: String(term.source || body.source || "MANUAL"),
            sourceUrl: term.sourceUrl || null,
            providerPayload: term.rawData || null,
          }),
        },
      });
    }));
    return NextResponse.json({ ok: true, opportunities });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Falha ao coletar termos" }, { status: error?.message === "Unauthorized" ? 401 : 500 });
  }
}
