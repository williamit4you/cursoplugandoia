import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalize(value: unknown, maxLength = 255) {
  const normalized = String(value || "").trim();
  return normalized ? normalized.slice(0, maxLength) : null;
}

export async function GET() {
  try {
    const items = await prisma.salesPageConfig.findMany({
      orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
    });

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("[api/admin/sales-analytics/configs GET]", error);
    return NextResponse.json({ error: error?.message || "Falha ao carregar configs de sales pages" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const pageKey = normalize(body?.pageKey, 120);
    const pagePath = normalize(body?.pagePath, 255);
    const title = normalize(body?.title, 255);
    const metaPixelId = normalize(body?.metaPixelId, 64);

    if (!pageKey || !pagePath || !title) {
      return NextResponse.json({ error: "pageKey, pagePath e title são obrigatórios" }, { status: 400 });
    }

    const item = await prisma.salesPageConfig.upsert({
      where: { pageKey },
      create: {
        pageKey,
        pagePath,
        title,
        metaPixelId,
        isActive: body?.isActive !== false,
        trackPageView: body?.trackPageView !== false,
        trackViewContent: body?.trackViewContent !== false,
        trackCheckout: body?.trackCheckout !== false,
        trackLead: body?.trackLead !== false,
        trackPurchase: body?.trackPurchase !== false,
        notes: normalize(body?.notes, 1000),
      },
      update: {
        pagePath,
        title,
        metaPixelId,
        isActive: body?.isActive !== false,
        trackPageView: body?.trackPageView !== false,
        trackViewContent: body?.trackViewContent !== false,
        trackCheckout: body?.trackCheckout !== false,
        trackLead: body?.trackLead !== false,
        trackPurchase: body?.trackPurchase !== false,
        notes: normalize(body?.notes, 1000),
      },
    });

    return NextResponse.json({ ok: true, item });
  } catch (error: any) {
    console.error("[api/admin/sales-analytics/configs POST]", error);
    return NextResponse.json({ error: error?.message || "Falha ao salvar config de sales page" }, { status: 500 });
  }
}
