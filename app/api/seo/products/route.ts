import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrCronSecret } from "@/lib/shopee-pipeline/apiAuth";

export const dynamic = "force-dynamic";
function slugify(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }

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
