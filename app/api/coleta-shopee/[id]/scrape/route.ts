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

    // Make request to python worker
    const formData = new FormData();
    formData.append("url", coleta.url);

    const baseUrl = (process.env.WORKER_FASTAPI_BASE_URL || process.env.FASTAPI_URL || "http://127.0.0.1:8000")
      .trim()
      .replace(/\/+$/, "")
      .replace(/\/gerar-video$/, "");
    
    const targetUrl = `${baseUrl}/scraping-shopee`;
    console.log(`[scrape] Calling python worker: ${targetUrl}`);

    const response = await fetch(targetUrl, {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(180000) // 3 min
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Python worker error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Update DB with results
    const updated = await prisma.coletaDadosShoppe.update({
      where: { id: coleta.id },
      data: {
        titulo: data.titulo,
        descricao: data.descricao,
        detalhes: data.detalhes,
        aiPromptVendas: data.aiPromptVendas,
        status: "COMPLETED",
        linksMedia: {
          create: data.linksMedia.map((m: any) => ({
            tipo: m.tipo,
            urlMinio: m.url
          }))
        }
      },
      include: { linksMedia: true }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Scraping error:", error);
    await prisma.coletaDadosShoppe.update({
      where: { id: params.id },
      data: { status: "FAILED", errorMessage: error.message }
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
