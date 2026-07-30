import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import {
  createInstagramStoryContainer,
  checkInstagramContainerStatus,
  publishInstagramContainer,
  publishFacebookStory24h,
} from "@/lib/metaGraph";
import {
  appendSocialPostLog,
  markSingleAttempt,
  reservePublicationIdentity,
} from "@/lib/socialPublicationGuard";

export const dynamic = "force-dynamic";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

/**
 * POST /api/social/publish-story
 *
 * Publica como Story de 24h (media_type: STORIES) no Instagram e Facebook.
 * Segue o mesmo fluxo de 2 fases do publish/route.ts:
 *  - Fase 1: cria container Story → retorna
 *  - Fase 2: checa status e publica se FINISHED
 */
export async function POST(req: NextRequest) {
  let targetSocialPostId: string | undefined = undefined;
  try {
    const { socialPostId } = await req.json();
    targetSocialPostId = socialPostId;

    let socialPost = await prisma.socialPost.findUnique({ where: { id: socialPostId } });
    if (!socialPost) {
      return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
    }

    // Resolvendo post irmão se houver incompatibilidade de plataforma ou tipo de postagem
    if (socialPost.platform !== "META" || socialPost.postType !== "STORY") {
      const sister = await prisma.socialPost.findFirst({
        where: {
          postId: socialPost.postId,
          codeVideoProjectId: socialPost.codeVideoProjectId,
          automationTaskId: socialPost.automationTaskId,
          automationTaskRunId: socialPost.automationTaskRunId,
          platform: "META",
          postType: "STORY",
        },
      });
      if (sister) {
        socialPost = sister;
        targetSocialPostId = sister.id;
      }
    }

    if (socialPost.metaStoryPostedAt) {
      await appendSocialPostLog(prisma, targetSocialPostId!, "IGNORADO_IDEMPOTENCIA: Story ja publicado anteriormente.");
      return NextResponse.json({ success: true, skipped: true, reason: "already_posted" });
    }
    const identity = await reservePublicationIdentity(prisma, socialPost);
    if (!identity.allowed) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "duplicate_video",
        originalSocialPostId: identity.original?.id || null,
      });
    }

    const settings = await prisma.integrationSettings.findUnique({ where: { platform: "META" } });
    if (!settings?.accessToken || !settings?.instagramId || !settings?.pageId) {
      return NextResponse.json({ error: "Configurações Meta ausentes." }, { status: 400 });
    }

    const appendLog = async (msg: string) => {
      const now = `[${new Date().toLocaleTimeString("pt-BR")}]`;
      const current = await prisma.socialPost.findUnique({
        where: { id: targetSocialPostId },
        select: { log: true },
      });
      const updated = current?.log ? `${current.log}\n${now} ${msg}` : `${now} ${msg}`;
      await prisma.socialPost.update({ where: { id: targetSocialPostId }, data: { log: updated } });
    };

    // ─── FASE 1: Criar container Story ───────────────────────────────────────
    if (!socialPost.metaContainerId) {
      const claimed = await markSingleAttempt(prisma, {
        id: targetSocialPostId!,
        attemptField: "metaContainerAttemptedAt",
        message: "META_STORY_CONTAINER_ATTEMPT: criacao reservada uma unica vez.",
      });
      if (!claimed) {
        return NextResponse.json({
          success: false,
          stillProcessing: true,
          reason: "container_attempt_already_started",
        });
      }
      await appendLog("📸 Criando container de Story 24h na Meta...");

      const creationId = await createInstagramStoryContainer(
        socialPost.videoUrl,
        settings.instagramId,
        settings.accessToken
      );

      await prisma.socialPost.update({
        where: { id: targetSocialPostId },
        data: {
          status: "PROCESSING_MEDIA",
          metaContainerId: creationId,
          postType: "STORY",
          log: `[${new Date().toLocaleTimeString("pt-BR")}] ✅ Container Story criado (ID: ${creationId}). Aguardando Meta processar...`,
        },
      });

      return NextResponse.json({
        phase: 1,
        status: "PROCESSING_MEDIA",
        creationId,
        message: "Container Story criado. Tente publicar novamente em ~1-2 minutos.",
      });
    }

    // ─── FASE 2: Checar status e publicar ────────────────────────────────────
    const { metaContainerId } = socialPost;
    await appendLog(`🔍 Verificando status do container Story (ID: ${metaContainerId})...`);

    let igId: string | null = null;
    let fbId: string | null = null;
    const errors: string[] = [];

    // Instagram
    try {
      const containerStatus = await checkInstagramContainerStatus(metaContainerId, settings.accessToken);

      if (containerStatus !== "FINISHED") {
        await appendLog(`⏳ Status: ${containerStatus}. Continue aguardando...`);
        return NextResponse.json({
          phase: 2,
          status: containerStatus,
          stillProcessing: true,
          message: `Meta ainda processando (${containerStatus}).`,
        });
      }

      const igClaimed = await markSingleAttempt(prisma, {
        id: targetSocialPostId!,
        attemptField: "metaInstagramPublishAttemptedAt",
        postedField: "metaStoryPostedAt",
        message: `META_INSTAGRAM_STORY_PUBLISH_ATTEMPT: container ${metaContainerId}; chamada final unica.`,
      });
      if (!igClaimed) {
        const current = await prisma.socialPost.findUnique({ where: { id: targetSocialPostId! } });
        if (current?.metaStoryPostedAt) {
          return NextResponse.json({ success: true, skipped: true, reason: "already_posted" });
        }
        await prisma.socialPost.update({ where: { id: targetSocialPostId! }, data: { status: "FAILED" } });
        return NextResponse.json({ success: false, skipped: true, reason: "publish_already_attempted" });
      }
      igId = await publishInstagramContainer(metaContainerId, settings.instagramId, settings.accessToken);
      const instagramPostedAt = new Date();
      await prisma.socialPost.update({
        where: { id: targetSocialPostId! },
        data: {
          postedAt: instagramPostedAt,
          metaStoryPostedAt: instagramPostedAt,
          metaStoryPostUrl: `https://www.instagram.com/stories/${igId}`,
        },
      });
      await appendLog(`✅ Story publicado no Instagram! ID: ${igId}`);
    } catch (e: any) {
      errors.push(`IG Story: ${e.message}`);
      await appendLog(`❌ Erro IG Story: ${e.message}`);
    }

    // Facebook
    try {
      const fbClaimed = await markSingleAttempt(prisma, {
        id: targetSocialPostId!,
        attemptField: "metaFacebookPublishAttemptedAt",
        message: "META_FACEBOOK_STORY_PUBLISH_ATTEMPT: chamada final unica.",
      });
      if (!fbClaimed) throw new Error("Envio ao Facebook ja foi tentado; bloqueado para evitar duplicacao.");
      await appendLog("📸 Publicando Story no Facebook...");
      fbId = await publishFacebookStory24h(
        socialPost.videoUrl,
        settings.pageId,
        settings.accessToken
      );
      await appendLog(`✅ Story publicado no Facebook! ID: ${fbId}`);
    } catch (e: any) {
      errors.push(`FB Story: ${e.message}`);
      await appendLog(`❌ Erro FB Story: ${e.message}`);
    }

    const finalStatus = errors.length === 0 || igId ? "POSTED" : "FAILED";

    await prisma.socialPost.update({
      where: { id: targetSocialPostId },
      data: {
        status: finalStatus,
        postedAt: finalStatus === "POSTED" ? new Date() : undefined,
        metaStoryPostedAt: finalStatus === "POSTED" ? new Date() : undefined,
        metaStoryPostUrl: igId ? `https://www.instagram.com/stories/${igId}` : undefined,
        metaContainerId,
      },
    });

    return NextResponse.json({ success: finalStatus === "POSTED", igId, fbId, errors, phase: 2 });
  } catch (error: any) {
    console.error("Story publishing error:", error);
    const errorMessage = error.message || "Erro interno";
    const logEntry = `[${new Date().toLocaleTimeString("pt-BR")}] ❌ Falha crítica de story: ${errorMessage}`;

    if (targetSocialPostId) {
      try {
        const currentPost = await prisma.socialPost.findUnique({ where: { id: targetSocialPostId } });
        await prisma.socialPost.update({
          where: { id: targetSocialPostId },
          data: {
            status: "FAILED",
            log: currentPost?.log ? `${currentPost.log}\n${logEntry}` : logEntry,
          },
        });
      } catch (dbErr) {
        console.error("Failed to update SocialPost status to FAILED:", dbErr);
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
