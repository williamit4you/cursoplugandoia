import "server-only";

import { prisma } from "@/lib/prisma";
import { generateEngagementPipelineCopy } from "@/lib/engagement/generatePipelineCopy";

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

export async function scrapeShopeeAndPersistEngagement(params: { coletaId: string; productUrl: string }) {
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
    ? data.linksMedia.filter((item: any) => item?.url && (item?.tipo === "IMAGE" || item?.tipo === "VIDEO"))
    : [];

  if (linksMedia.length === 0) {
    throw new Error("Scraping nao retornou midias do HTML. Operacao cancelada.");
  }

  const titulo = String(data?.titulo || "").trim();
  const descricao = String(data?.descricao || "").trim();
  const detalhes = String(data?.detalhes || "").trim();

  const tituloNormalizado = titulo && titulo.toLowerCase() !== "shopee__domain" ? titulo : deriveTitleFromUrl(productUrl);
  const descricaoNormalizada = descricao || detalhes || "";
  const detalhesNormalizados = detalhes || descricao || "";

  const generated = await generateEngagementPipelineCopy({
    productTitle: tituloNormalizado,
    productDescription: descricaoNormalizada,
    productDetails: detalhesNormalizados,
  });

  const imageUrls = linksMedia.filter((item: any) => item.tipo === "IMAGE").map((item: any) => String(item.url).trim()).filter(Boolean);
  const videoUrls = linksMedia.filter((item: any) => item.tipo === "VIDEO").map((item: any) => String(item.url).trim()).filter(Boolean);

  const updated = await prisma.coletaDadosShoppe.update({
    where: { id: coletaId },
    data: {
      titulo: tituloNormalizado,
      descricao: descricaoNormalizada || null,
      detalhes: detalhesNormalizados || null,
      aiPromptEngajamento: generated.script || null,
      status: "COMPLETED",
      errorMessage: generated.script ? null : "Midias e texto salvos. A ideia de engajamento nao retornou nesta tentativa.",
      linksMedia: {
        deleteMany: {},
        create: linksMedia.map((item: any) => ({
          tipo: item.tipo,
          urlMinio: item.url,
        })),
      },
      mediaImageUrls: imageUrls,
      mediaVideoUrls: videoUrls,
    },
    include: { linksMedia: true },
  });

  return { updated, raw: data, renderServiceUrl, targetUrl, generated };
}
