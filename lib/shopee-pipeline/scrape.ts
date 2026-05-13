import "server-only";

import { prisma } from "@/lib/prisma";

function deriveTitleFromUrl(url: string) {
  try {
    const pathname = new URL(url).pathname;
    const slug = pathname.split("/").filter(Boolean).pop() || "";
    const cleaned = slug.replace(/-i\.\d+\.\d+.*$/i, "").replace(/[-_]+/g, " ").trim();
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

export async function scrapeShopeeAndPersist(params: { coletaId: string; productUrl: string }) {
  const { coletaId, productUrl } = params;

  const renderServiceUrl = (process.env.VIDEO_RENDER_SERVICE_URL || "http://127.0.0.1:3010")
    .trim()
    .replace(/\/+$/, "");

  const targetUrl = `${renderServiceUrl}/shopee/scrape`;

  const response = await fetch(targetUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: productUrl }),
    signal: AbortSignal.timeout(180000),
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

  const titulo = String(data?.titulo || "").trim();
  const descricao = String(data?.descricao || "").trim();
  const detalhes = String(data?.detalhes || "").trim();
  const aiPromptVendas = String(data?.aiPromptVendas || "").trim();

  const tituloNormalizado = titulo && titulo.toLowerCase() !== "shopee__domain" ? titulo : deriveTitleFromUrl(productUrl);
  const descricaoNormalizada = descricao || detalhes || "";
  const detalhesNormalizados = detalhes || descricao || "";

  const imageUrls = linksMedia.filter((m: any) => m.tipo === "IMAGE").map((m: any) => String(m.url).trim()).filter(Boolean);
  const videoUrls = linksMedia.filter((m: any) => m.tipo === "VIDEO").map((m: any) => String(m.url).trim()).filter(Boolean);

  const updated = await prisma.coletaDadosShoppe.update({
    where: { id: coletaId },
    data: {
      titulo: tituloNormalizado,
      descricao: descricaoNormalizada || null,
      detalhes: detalhesNormalizados || null,
      aiPromptVendas: aiPromptVendas || null,
      status: "COMPLETED",
      errorMessage:
        !descricaoNormalizada && !detalhesNormalizados
          ? "Midias salvas. Produto sem descricao detalhada estruturada."
          : !aiPromptVendas
            ? "Midias e texto salvos. Copy de vendas nao retornou nesta tentativa."
            : null,
      linksMedia: {
        deleteMany: {},
        create: linksMedia.map((m: any) => ({
          tipo: m.tipo,
          urlMinio: m.url,
        })),
      },
      mediaImageUrls: imageUrls,
      mediaVideoUrls: videoUrls,
    },
    include: { linksMedia: true },
  });

  return { updated, raw: data, renderServiceUrl, targetUrl };
}

