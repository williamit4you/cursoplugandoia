import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function deriveTitleFromUrl(url: string) {
  try {
    const pathname = new URL(url).pathname;
    const slug = pathname.split("/").filter(Boolean).pop() || "";
    const cleaned = slug
      .replace(/-i\.\d+\.\d+.*$/i, "")
      .replace(/[-_]+/g, " ")
      .trim();

    if (!cleaned) return "Produto Shopee";

    return cleaned
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  } catch {
    return "Produto Shopee";
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const coleta = await prisma.coletaDadosShoppe.findFirst({
      where: { id: params.id, pipelineKind: "SALES" as any }
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

    const linksMedia = Array.isArray(data?.linksMedia)
      ? data.linksMedia.filter((m: any) => m?.url && (m?.tipo === "IMAGE" || m?.tipo === "VIDEO"))
      : [];

    if (linksMedia.length === 0) {
      throw new Error("Scraping nao retornou midias do HTML. Operacao cancelada.");
    }

    await prisma.coletaDadosShoppe.update({
      where: { id: coleta.id },
      data: {
        linksMedia: {
          deleteMany: {},
          create: linksMedia.map((m: any) => ({
            tipo: m.tipo,
            urlMinio: m.url,
          })),
        },
      },
    });

    const titulo = String(data?.titulo || "").trim();
    const descricao = String(data?.descricao || "").trim();
    const detalhes = String(data?.detalhes || "").trim();
    const aiPromptVendas = String(data?.aiPromptVendas || "").trim();

    const tituloNormalizado =
      titulo && titulo.toLowerCase() !== "shopee__domain"
        ? titulo
        : deriveTitleFromUrl(coleta.url);

    const descricaoNormalizada = descricao || detalhes || "";
    const detalhesNormalizados = detalhes || descricao || "";

    const hasAnyUsefulData =
      Boolean(tituloNormalizado || descricaoNormalizada || detalhesNormalizados || aiPromptVendas) ||
      linksMedia.length > 0;

    if (!hasAnyUsefulData) {
      throw new Error("Scraping retornou vazio: sem texto e sem midias.");
    }

    // Salva resultado no banco
    const updated = await prisma.coletaDadosShoppe.update({
      where: { id: coleta.id },
      data: {
        titulo: tituloNormalizado,
        descricao: descricaoNormalizada || null,
        detalhes: detalhesNormalizados || null,
        aiPromptVendas: aiPromptVendas || null,
        status: "COMPLETED",
        errorMessage: !descricaoNormalizada && !detalhesNormalizados
          ? "Midias salvas. Produto sem descricao detalhada estruturada."
          : !aiPromptVendas
            ? "Midias e texto salvos. Copy de vendas nao retornou nesta tentativa."
            : null,
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
