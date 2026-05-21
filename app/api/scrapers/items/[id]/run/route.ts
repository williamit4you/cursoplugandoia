import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function callProjectAction(req: NextRequest, pathname: string, projectId: string) {
  const url = new URL(pathname, req.url);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data, error: data?.error || `HTTP ${res.status}` };
}

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const id = ctx.params.id;

    // 1. Try to find the pick in Shopee Affiliates
    let isShopee = true;
    let pick: any = await prisma.shopeeAffiliatePick.findUnique({
      where: { id },
    });

    if (!pick) {
      // 2. Try to find in Mercado Livre Affiliates
      pick = await prisma.mercadoLivreAffiliatePick.findUnique({
        where: { id },
      });
      isShopee = false;
    }

    if (!pick) {
      return NextResponse.json({ error: "Scraped item not found" }, { status: 404 });
    }

    let projectId = pick.codeVideoProjectId;

    // 3. If there is no associated project, create one first
    if (!projectId) {
      const priceFormatted = pick.price != null
        ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: pick.currencyId || "BRL" }).format(pick.price)
        : "Preço não informado";

      const ideaPrompt = [
        `Crie uma propaganda curta e vendedora para o produto "${pick.title}".`,
        `Produto: ${pick.permalink}`,
        `Link que deve ir na descrição: ${pick.affiliateUrl || pick.permalink}`,
        `Preço atual: ${priceFormatted}`,
        "A descrição precisa convidar o usuário a clicar no link da descrição do vídeo.",
        "Use benefício, praticidade e oportunidade."
      ].join("\n");

      const assets = pick.thumbnailUrl ? [{ url: pick.thumbnailUrl, kind: "IMAGE" as const }] : [];
      const metadata = {
        productName: pick.title,
        productDescription: "",
        productTechnicalDetails: `Preço atual: ${priceFormatted}\nLink original: ${pick.permalink}\nLink afiliado: ${pick.affiliateUrl || pick.permalink}`,
        productUseCases: "",
        targetAudience: "",
        productUrl: pick.affiliateUrl || pick.permalink,
        ctaText: "Confira o produto pelo link na descrição do vídeo.",
        youtubeTags: "",
        primaryBgColor: isShopee ? "#ee4d2d" : "#fff159",
        primaryTextColor: isShopee ? "#ffffff" : "#333333",
        assets,
        [isShopee ? "shopee" : "mercadoLivre"]: {
          itemId: isShopee ? pick.shopeeItemId : pick.mercadoLivreItemId,
          permalink: pick.permalink,
          affiliateUrl: pick.affiliateUrl || pick.permalink,
          scheduledTo: new Date().toISOString(),
          platforms: ["YOUTUBE", "INSTAGRAM", "TIKTOK"],
          autoScheduleSocial: true,
        }
      };

      const project = await prisma.codeVideoProject.create({
        data: {
          projectType: "PRODUCT_AD",
          ideaPrompt,
          aspectRatio: "PORTRAIT_9_16",
          videoDurationSec: 30,
          ttsVoice: "pt-BR-AntonioNeural",
          ttsSpeed: "+5%",
          useExternalMedia: true,
          title: pick.title,
          description: "",
          metadataJson: JSON.stringify(metadata),
        }
      });

      projectId = project.id;

      if (isShopee) {
        await prisma.shopeeAffiliatePick.update({
          where: { id },
          data: {
            codeVideoProjectId: projectId,
            status: "PROJECT_CREATED",
          },
        });
      } else {
        await prisma.mercadoLivreAffiliatePick.update({
          where: { id },
          data: {
            codeVideoProjectId: projectId,
            status: "PROJECT_CREATED",
          },
        });
      }
    }

    // 4. Update status to generating
    if (isShopee) {
      await prisma.shopeeAffiliatePick.update({
        where: { id },
        data: { status: "GENERATING" },
      });
    } else {
      await prisma.mercadoLivreAffiliatePick.update({
        where: { id },
        data: { status: "GENERATING" },
      });
    }

    // 5. Trigger generate script
    const genResult = await callProjectAction(req, "/api/video-code/generate", projectId);
    if (!genResult.ok) {
      const errMsg = genResult.error || "Failed to generate script";
      if (isShopee) {
        await prisma.shopeeAffiliatePick.update({
          where: { id },
          data: { status: "FAILED", errorMessage: errMsg },
        });
      } else {
        await prisma.mercadoLivreAffiliatePick.update({
          where: { id },
          data: { status: "FAILED", errorMessage: errMsg },
        });
      }
      return NextResponse.json({ error: errMsg }, { status: 500 });
    }

    // 6. Update status to rendering
    if (isShopee) {
      await prisma.shopeeAffiliatePick.update({
        where: { id },
        data: { status: "RENDERING" },
      });
    } else {
      await prisma.mercadoLivreAffiliatePick.update({
        where: { id },
        data: { status: "RENDERING" },
      });
    }

    // 7. Trigger render video
    const renderResult = await callProjectAction(req, "/api/video-code/render", projectId);
    if (!renderResult.ok) {
      const errMsg = renderResult.error || "Failed to render video";
      if (isShopee) {
        await prisma.shopeeAffiliatePick.update({
          where: { id },
          data: { status: "FAILED", errorMessage: errMsg },
        });
      } else {
        await prisma.mercadoLivreAffiliatePick.update({
          where: { id },
          data: { status: "FAILED", errorMessage: errMsg },
        });
      }
      return NextResponse.json({ error: errMsg }, { status: 500 });
    }

    // 8. Update status to completed
    if (isShopee) {
      await prisma.shopeeAffiliatePick.update({
        where: { id },
        data: {
          status: "COMPLETED",
          videoFinalUrl: renderResult.data.videoUrl || null,
          errorMessage: null
        },
      });
    } else {
      await prisma.mercadoLivreAffiliatePick.update({
        where: { id },
        data: {
          status: "COMPLETED",
          videoFinalUrl: renderResult.data.videoUrl || null,
          errorMessage: null
        },
      });
    }

    return NextResponse.json({
      success: true,
      projectId,
      videoUrl: renderResult.data.videoUrl,
    });
  } catch (error: any) {
    console.error("[api/scrapers/items/[id]/run POST]", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
