import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { createInstagramContainer, checkAndPublishInstagramContainer, publishFacebookVideoStory } from "@/lib/metaGraph";

export const dynamic = "force-dynamic";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function scheduleMetaRetry(socialPostId: string, reason: string) {
  const current = await prisma.socialPost.findUnique({ where: { id: socialPostId }, select: { log: true } });
  const retries = (current?.log || "").match(/Nova tentativa Meta em 30 minutos/g)?.length || 0;
  const prefix = current?.log ? `${current.log}\n` : "";
  const entry = `[${new Date().toLocaleTimeString("pt-BR")}]`;
  if (retries >= 2) {
    await prisma.socialPost.update({ where: { id: socialPostId }, data: { status: "FAILED", metaContainerId: null, log: `${prefix}${entry} Falha Meta após 3 tentativas: ${reason}` } });
    return { failed: true };
  }
  const retryAt = new Date(Date.now() + 30 * 60_000);
  await prisma.socialPost.update({ where: { id: socialPostId }, data: { status: "SCHEDULED", scheduledTo: retryAt, metaContainerId: null, log: `${prefix}${entry} Nova tentativa Meta em 30 minutos: ${reason}` } });
  return { failed: false, retryAt };
}

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
  let targetSocialPostId: string | undefined = undefined;
  try {
    const body = await req.json();
    const { socialPostId, bypassTimeCheck } = body;
    targetSocialPostId = socialPostId;

    let socialPost = await prisma.socialPost.findUnique({ where: { id: socialPostId } });
    if (!socialPost) {
      return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
    }

    // Resolvendo post irmão se houver incompatibilidade de plataforma
    if (socialPost.platform !== "META" || socialPost.postType !== "REEL") {
      const sister = await prisma.socialPost.findFirst({
        where: {
          postId: socialPost.postId,
          codeVideoProjectId: socialPost.codeVideoProjectId,
          automationTaskId: socialPost.automationTaskId,
          automationTaskRunId: socialPost.automationTaskRunId,
          platform: "META",
          postType: "REEL",
        },
      });
      if (sister) {
        socialPost = sister;
        targetSocialPostId = sister.id;
      }
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
      const current = await prisma.socialPost.findUnique({ where: { id: targetSocialPostId }, select: { log: true } });
      const previous = current?.log || "";
      const updated = previous ? `${previous}\n${now} ${msg}` : `${now} ${msg}`;
      await prisma.socialPost.update({
        where: { id: targetSocialPostId },
        data: { log: updated },
      });
    };

    // ─── FASE 1: Criar container (apenas se ainda não existe) ───────────────
    if (!socialPost.metaContainerId) {
      await appendLog("🚀 Criando container de mídia na Meta...");

      const creationId = await createInstagramContainer(
        socialPost.videoUrl,
        settings.instagramId,
        settings.accessToken,
        socialPost.summary
      );

      await prisma.socialPost.update({
        where: { id: targetSocialPostId },
        data: {
          status: "PROCESSING_MEDIA",
          metaContainerId: creationId,
          log: `${socialPost.log || ""}${socialPost.log ? "\n" : ""}[${new Date().toLocaleTimeString("pt-BR")}] Container criado (ID: ${creationId}). Aguardando Meta processar o vídeo...`,
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
        const current = await prisma.socialPost.findUnique({ where: { id: targetSocialPostId }, select: { log: true } });
        const checks = ((current?.log || "").match(/Verificando status do container/g) || []).length;
        if (checks >= 10) {
          const retry = await scheduleMetaRetry(targetSocialPostId, `Container ${metaContainerId} não finalizou após ${checks} consultas.`);
          return NextResponse.json({ success: false, retryScheduled: !retry.failed, failed: retry.failed, retryAt: retry.retryAt?.toISOString?.() || null }, { status: 202 });
        }
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
      const retry = await scheduleMetaRetry(targetSocialPostId, e.message || "Falha ao consultar/publicar container");
      return NextResponse.json({ success: false, retryScheduled: !retry.failed, failed: retry.failed, retryAt: retry.retryAt?.toISOString?.() || null, error: e.message }, { status: retry.failed ? 500 : 202 });
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
      where: { id: targetSocialPostId },
      data: {
        status: finalStatus,
        postedAt: finalStatus === "POSTED" ? new Date() : undefined,
        metaReelPostedAt: finalStatus === "POSTED" ? new Date() : undefined,
        metaReelPostUrl: igId ? `https://www.instagram.com/reels/${igId}` : undefined,
        metaContainerId: null, // Reset após publicação
      },
    });

    return NextResponse.json({ success: finalStatus === "POSTED", igId, fbId, errors, phase: 2 });
  } catch (error: any) {
    console.error("Publishing error:", error);
    const errorMessage = error.message || "Erro interno";
    const logEntry = `[${new Date().toLocaleTimeString("pt-BR")}] ❌ Falha crítica de publicação: ${errorMessage}`;

    if (targetSocialPostId) {
      try {
        const retry = await scheduleMetaRetry(targetSocialPostId, errorMessage);
        return NextResponse.json({ success: false, retryScheduled: !retry.failed, failed: retry.failed, retryAt: retry.retryAt?.toISOString?.() || null, error: errorMessage }, { status: retry.failed ? 500 : 202 });
      } catch (dbErr) {
        console.error("Failed to update SocialPost status to FAILED:", dbErr);
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
