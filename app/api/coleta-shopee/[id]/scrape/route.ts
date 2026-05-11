import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const coleta = await prisma.coletaDadosShoppe.findUnique({
      where: { id: params.id }
    });

    if (!coleta) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.coletaDadosShoppe.update({
      where: { id: coleta.id },
      data: { status: "SCRAPING" }
    });

    // ✅ Usa o render-service (Node.js) que já tem Chromium instalado via Docker.
    // O worker Python usava Playwright que precisava baixar o Chrome separadamente.
    const renderServiceUrl = (process.env.VIDEO_RENDER_SERVICE_URL || "http://127.0.0.1:3010")
      .trim()
      .replace(/\/+$/, "");

    const targetUrl = `${renderServiceUrl}/shopee/scrape`;
    console.log(`[scrape] Calling render-service (has Chromium): ${targetUrl}`);

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: coleta.url }),
      signal: AbortSignal.timeout(180000), // 3 min — Puppeteer pode demorar
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Render-service error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Salva resultado no banco
    const updated = await prisma.coletaDadosShoppe.update({
      where: { id: coleta.id },
      data: {
        titulo: data.titulo,
        descricao: data.descricao,
        detalhes: data.detalhes,
        aiPromptVendas: data.aiPromptVendas,
        status: "COMPLETED",
        linksMedia: {
          create: (data.linksMedia || []).map((m: any) => ({
            tipo: m.tipo,
            urlMinio: m.url,
          })),
        },
      },
      include: { linksMedia: true },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[scrape] Error:", error);
    await prisma.coletaDadosShoppe.update({
      where: { id: params.id },
      data: { status: "FAILED", errorMessage: error.message },
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
