import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireServerSession } from "@/lib/serverAuth";
import {
  ensureUniqueWhatsappPromoSlug,
  isCatalogItemReady,
  normalizeText,
  parsePrice,
  parseCsvObjects,
} from "@/lib/whatsappPromos";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await requireServerSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const batchKey = normalizeText(formData.get("batchKey")) || `batch-${Date.now()}`;
    const sourceType = normalizeText(formData.get("sourceType")) || "CSV_BATCH";
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Envie um arquivo CSV." }, { status: 400 });
    }

    const content = await file.text();
    const rows = parseCsvObjects(content);
    if (!rows.length) return NextResponse.json({ error: "CSV vazio ou invalido." }, { status: 400 });

    const created: string[] = [];
    for (const row of rows) {
      const title =
        normalizeText(row["Title"]) ||
        normalizeText(row["Product Title"]) ||
        normalizeText(row["Offer Name"]) ||
        normalizeText(row["Nome"]);
      const affiliateUrl =
        normalizeText(row["Affiliate Link"]) ||
        normalizeText(row["Offer Link"]) ||
        normalizeText(row["Link Afiliado"]) ||
        normalizeText(row["URL"]);

      if (!title || !affiliateUrl) continue;
      const slug = await ensureUniqueWhatsappPromoSlug(title);
      const category = normalizeText(row["Category"]) || null;
      const currentPrice =
        parsePrice(row["Sale Price"]) ??
        parsePrice(row["Current Price"]) ??
        parsePrice(row["Price"]) ??
        parsePrice(row["Preco Atual"]) ??
        null;
      await prisma.whatsappPromoCatalogItem.create({
        data: {
          title,
          slug,
          affiliateUrl,
          sourceType,
          sourceBatchKey: batchKey,
          sourceOfferName: normalizeText(row["Offer Name"]) || title,
          sourceOfferType: normalizeText(row["Offer Type"]) || null,
          sourceOfferPeriod: normalizeText(row["Offer Period"]) || null,
          sourceUrl: affiliateUrl,
          category,
          imageUrl: normalizeText(row["Image URL"]) || null,
          productUrl: normalizeText(row["Product URL"]) || null,
          description: normalizeText(row["Description"]) || null,
          currentPrice,
          active: true,
          readyForPublish: isCatalogItemReady({ category, affiliateUrl, currentPrice, active: true }),
        },
      });
      created.push(slug);
    }

    return NextResponse.json({ ok: true, batchKey, createdCount: created.length });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Falha ao importar CSV" }, { status: 500 });
  }
}
