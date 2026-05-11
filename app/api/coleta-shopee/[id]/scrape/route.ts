import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PYTHON_API_URL = process.env.WORKER_FASTAPI_BASE_URL || process.env.FASTAPI_URL || "http://localhost:8000";

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

    const response = await fetch(`${PYTHON_API_URL.replace("/gerar-video", "")}/scraping-shopee`, {
      method: "POST",
      body: formData,
      // No timeout or long timeout since playwright might take 30-60s
      signal: AbortSignal.timeout(120000) 
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
