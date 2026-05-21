import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scrapeShopeeAndPersist } from "@/lib/shopee-pipeline/scrape";
import { generateEngagementIdea } from "@/lib/engagement/generateIdea";
import { resolveCreatorVideoDefaults } from "@/lib/creator-video/defaults";
import { generateModalAudio, generateModalVideo } from "@/lib/shopee-pipeline/modalClient";
import { generateApproxVtt } from "@/lib/captions/vtt";
import { uploadBufferToMinio } from "@/lib/shopee-pipeline/minioUpload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 900;

function normalize(value: unknown) {
  return String(value || "").trim();
}

const DEFAULT_TEMPLATE_SEQUENCE = ["INUTIL_ATE_VER", "NAO_COMPRE_SEM_VER", "PERGUNTA_SIMPLES"] as const;

function now() {
  return new Date();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const url = normalize(body?.url);
    const creatorImageUrl = body?.creatorImageUrl ? normalize(body.creatorImageUrl) : "";
    const autoRender = body?.autoRender === false ? false : true;
    if (!url) return NextResponse.json({ error: "url is required" }, { status: 400 });

    const defaults = await resolveCreatorVideoDefaults(creatorImageUrl || null);
    if (!defaults.creatorImageUrl) {
      return NextResponse.json(
        { error: "Configure uma imagem padrão em userBaseImageUrl ou adicione uma imagem ativa em creator-assets." },
        { status: 400 }
      );
    }
    if (autoRender && !defaults.voiceRefUrl) {
      return NextResponse.json({ error: "Config faltando: userVoiceRefUrl" }, { status: 400 });
    }
    const resolvedCreatorImageUrl = String(defaults.creatorImageUrl || "");
    const voiceRefUrl = String(defaults.voiceRefUrl || "");

    // 1) Create/find coleta for that URL
    const existing = await prisma.coletaDadosShoppe.findFirst({
      where: { url, pipelineKind: "ENGAGEMENT" },
      select: { id: true },
    }).catch(() => null);
    const coleta =
      existing?.id
        ? await prisma.coletaDadosShoppe.findUnique({ where: { id: existing.id } })
        : await prisma.coletaDadosShoppe.create({ data: { url, pipelineKind: "ENGAGEMENT" } });
    if (!coleta) return NextResponse.json({ error: "Falha ao criar/encontrar coleta" }, { status: 500 });

    // 2) Ensure scrape data is present
    const scraped = await scrapeShopeeAndPersist({ coletaId: coleta.id, productUrl: url });
    const updated = scraped.updated;

    // 3) Pick default creator image if none provided
    // 4) Generate 3 ideas (variety) and persist
    const ideas: any[] = [];
    for (const templateType of DEFAULT_TEMPLATE_SEQUENCE) {
      const generated = await generateEngagementIdea({
        templateType: templateType as any,
        personaName: undefined,
        productTitle: String(updated?.titulo || ""),
        productDescription: String(updated?.descricao || updated?.aiPromptVendas || ""),
        productDetails: String(updated?.detalhes || ""),
      });

      const idea = await prisma.engagementIdea.create({
        data: {
          coletaId: coleta.id,
          templateType,
          personaName: generated.personaName || null,
          hook: generated.hook,
          script: generated.script,
          onScreenText: generated.onScreenText as any,
          ctaComment: generated.ctaComment || null,
          creatorImageUrl: resolvedCreatorImageUrl || null,
          status: "DRAFT",
        },
        include: { coleta: { select: { id: true, titulo: true } } },
      });
      ideas.push(idea);
    }

    let primaryIdeaId: string | null = null;
    let autoRenderError: string | null = null;

    if (autoRender && ideas[0] && voiceRefUrl) {
      primaryIdeaId = ideas[0].id;

      try {
        await prisma.engagementIdea.update({
          where: { id: ideas[0].id },
          data: {
            status: "GENERATING_AUDIO",
            errorMessage: null,
            creatorImageUrl: resolvedCreatorImageUrl,
            updatedAt: now(),
          },
        });

        const audioSeed = Math.floor(Math.random() * 1_000_000_000);
        const generatedAudio = await generateModalAudio({
          voiceRefUrl,
          targetText: String(ideas[0].script || ""),
          seed: audioSeed,
        });

        await prisma.engagementIdea.update({
          where: { id: ideas[0].id },
          data: {
            audioUrl: generatedAudio.audio_url,
            status: "GENERATING_VIDEO",
            errorMessage: null,
            updatedAt: now(),
          },
        });

        const videoSeed = Math.floor(Math.random() * 1_000_000_000);
        const generatedVideo = await generateModalVideo({
          imageUrl: resolvedCreatorImageUrl,
          audioUrl: generatedAudio.audio_url,
          seed: videoSeed,
        });

        const vtt = generateApproxVtt({ text: String(ideas[0].script || "") });
        const captionsUrl = await uploadBufferToMinio({
          buffer: Buffer.from(vtt, "utf8"),
          key: `engagement/${ideas[0].id}.vtt`,
          contentType: "text/vtt; charset=utf-8",
        }).catch(() => null);

        ideas[0] = await prisma.engagementIdea.update({
          where: { id: ideas[0].id },
          data: {
            audioUrl: generatedAudio.audio_url,
            videoUrl: generatedVideo.video_url,
            captionsUrl: captionsUrl || null,
            status: "READY",
            errorMessage: null,
            updatedAt: now(),
          },
          include: { coleta: { select: { id: true, titulo: true } } },
        });
      } catch (error: any) {
        autoRenderError = error?.message || "Falha ao renderizar a ideia principal";
        ideas[0] = await prisma.engagementIdea.update({
          where: { id: ideas[0].id },
          data: {
            status: "FAILED",
            errorMessage: autoRenderError,
            updatedAt: now(),
          },
          include: { coleta: { select: { id: true, titulo: true } } },
        });
      }
    }

    return NextResponse.json({
      ok: true,
      coletaId: coleta.id,
      creatorImageUrl: resolvedCreatorImageUrl || null,
      primaryIdeaId,
      autoRender,
      autoRenderError,
      ideas,
    });
  } catch (error: any) {
    console.error("[api/engajamento/from-url POST]", error);
    return NextResponse.json({ error: error?.message || "Falha ao gerar ideias por URL" }, { status: 500 });
  }
}
