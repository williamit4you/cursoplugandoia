import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { createInstagramContainer, checkAndPublishInstagramContainer, publishFacebookVideoStory } from "@/lib/metaGraph";

export const dynamic = "force-dynamic";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

/**
 * POST /api/social/publish
 *
 * Fluxo em 2 fases:
 *  - Se o post ainda não tem metaContainerId → Fase 1: cria o container na Meta e retorna.
 *  - Se já tem metaContainerId → Fase 2: checa o status e publica se FINISHED.
 *
 * O frontend chama este endpoint repetidamente a cada 30s até receber { success: true }.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { socialPostId, bypassTimeCheck } = body;

    const socialPost = await prisma.socialPost.findUnique({ where: { id: socialPostId } });
    if (!socialPost) {
      return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
    }

    if (!bypassTimeCheck) {
      if (socialPost.status === "SCHEDULED" && socialPost.scheduledTo) {
        if (socialPost.scheduledTo > new Date()) {
          return NextResponse.json({ error: "Limite de tempo não atingido.", timeLimit: true }, { status: 400 });
        }
      }
    }

    const settings = await prisma.integrationSettings.findUnique({ where: { platform: "META" } });
    if (!settings?.accessToken || !settings?.instagramId || !settings?.pageId) {
      return NextResponse.json({ error: "Configurações Meta ausentes." }, { status: 400 });
    }

    const appendLog = async (msg: string) => {
      const now = `[${new Date().toLocaleTimeString("pt-BR")}]`;
      const current = socialPost.log || "";
      const updated = current ? `${current}\n${now} ${msg}` : `${now} ${msg}`;
      await prisma.socialPost.update({
        where: { id: socialPostId },
        data: { log: updated },
      });
    };

    // ─── FASE 1: Criar container (apenas se ainda não existe) ───────────────
    if (!socialPost.metaContainerId) {
      await appendLog("🚀 Criando container de mídia na Meta...");

      const creationId = await createInstagramContainer(
        socialPost.videoUrl,
        settings.instagramId,
        settings.accessToken
      );

      await prisma.socialPost.update({
        where: { id: socialPostId },
        data: {
          status: "PROCESSING_MEDIA",
          metaContainerId: creationId,
          log: `[${new Date().toLocaleTimeString("pt-BR")}] ✅ Container criado (ID: ${creationId}). Aguardando Meta processar o vídeo...`,
        },
      });

      return NextResponse.json({
        phase: 1,
        status: "PROCESSING_MEDIA",
        creationId,
        message: "Container criado. A Meta está processando o vídeo. Tente publicar novamente em ~1-2 minutos.",
      });
    }

    // ─── FASE 2: Checar status e publicar ───────────────────────────────────
    const { metaContainerId } = socialPost;
    await appendLog(`🔍 Verificando status do container (ID: ${metaContainerId})...`);

    let igId: string | null = null;
    let fbId: string | null = null;
    const errors: string[] = [];

    // Checa e publica no Instagram
    try {
      const result = await checkAndPublishInstagramContainer(
        metaContainerId,
        settings.instagramId,
        settings.accessToken
      );

      if (result.status !== "FINISHED") {
        // Ainda processando — informa a UI para tentar de novo
        await appendLog(`⏳ Status atual: ${result.status}. Continue aguardando...`);
        return NextResponse.json({
          phase: 2,
          status: result.status,
          message: `Meta ainda processando (${result.status}). Tente novamente em 1-2 minutos.`,
          stillProcessing: true,
        });
      }

      igId = result.igPostId || null;
      await appendLog(`✅ Publicado no Instagram! ID: ${igId}`);
    } catch (e: any) {
      errors.push(`IG: ${e.message}`);
      await appendLog(`❌ Erro IG: ${e.message}`);
    }

    // Publica no Facebook (não depende do container IG)
    try {
      await appendLog("🚀 Publicando no Facebook...");
      fbId = await publishFacebookVideoStory(
        socialPost.videoUrl,
        settings.pageId,
        settings.accessToken
      );
      await appendLog(`✅ Publicado no Facebook! ID: ${fbId}`);
    } catch (e: any) {
      errors.push(`FB: ${e.message}`);
      await appendLog(`❌ Erro FB: ${e.message}`);
    }

    // Resultado final
    const finalStatus = errors.length === 0 ? "POSTED" : igId ? "POSTED" : "FAILED";

    await prisma.socialPost.update({
      where: { id: socialPostId },
      data: {
        status: finalStatus,
        postedAt: finalStatus === "POSTED" ? new Date() : undefined,
        metaContainerId: null, // Reset após publicação
      },
    });

    return NextResponse.json({ success: finalStatus === "POSTED", igId, fbId, errors, phase: 2 });
  } catch (error: any) {
    console.error("Publishing error:", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}
