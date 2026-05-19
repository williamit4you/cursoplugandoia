import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scrapeShopeeAndPersistEngagement } from "@/lib/engagement-pipeline/scrape";

function serializeColeta(item: any) {
  return {
    ...item,
    aiPromptVendas: item?.aiPromptEngajamento ?? item?.aiPromptVendas ?? null,
  };
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const coleta = await prisma.coletaDadosShoppe.findFirst({
      where: { id: params.id, pipelineKind: "ENGAGEMENT" as any },
    });

    if (!coleta) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.coletaDadosShoppe.update({
      where: { id: coleta.id },
      data: { status: "SCRAPING" },
    });

    const result = await scrapeShopeeAndPersistEngagement({
      coletaId: coleta.id,
      productUrl: coleta.url,
    });

    return NextResponse.json(serializeColeta(result.updated));
  } catch (error: any) {
    console.error("[engajamento-shopee/scrape] Error:", error);
    await prisma.coletaDadosShoppe
      .update({
        where: { id: params.id },
        data: { status: "FAILED", errorMessage: error.message },
      })
      .catch(() => null);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
