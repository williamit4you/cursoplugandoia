import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import {
  checkInstagramContainerStatus,
  createInstagramContainer,
  publishFacebookVideoStory,
  publishInstagramContainer,
} from "@/lib/metaGraph";
import {
  appendSocialPostLog,
  markSingleAttempt,
  reservePublicationIdentity,
} from "@/lib/socialPublicationGuard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

export async function POST(req: NextRequest) {
  let targetId: string | undefined;
  try {
    const { socialPostId, bypassTimeCheck } = await req.json();
    targetId = String(socialPostId || "");
    let post = await prisma.socialPost.findUnique({ where: { id: targetId } });
    if (!post) return NextResponse.json({ error: "Post nao encontrado" }, { status: 404 });

    if (post.platform !== "META" || post.postType !== "REEL") {
      const sister = await prisma.socialPost.findFirst({
        where: {
          postId: post.postId,
          codeVideoProjectId: post.codeVideoProjectId,
          automationTaskId: post.automationTaskId,
          automationTaskRunId: post.automationTaskRunId,
          platform: "META",
          postType: "REEL",
        },
      });
      if (!sister) {
        return NextResponse.json({ error: "Publicacao META/REEL correspondente nao encontrada." }, { status: 400 });
      }
      post = sister;
      targetId = sister.id;
    }

    if (post.metaReelPostedAt) {
      await appendSocialPostLog(prisma, targetId, "IGNORADO_IDEMPOTENCIA: Reel ja publicado anteriormente.");
      return NextResponse.json({ success: true, skipped: true, reason: "already_posted" });
    }
    if (!bypassTimeCheck && post.status === "SCHEDULED" && post.scheduledTo && post.scheduledTo > new Date()) {
      return NextResponse.json({ error: "Limite de tempo nao atingido.", timeLimit: true }, { status: 400 });
    }

    const identity = await reservePublicationIdentity(prisma, post);
    if (!identity.allowed) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "duplicate_video",
        originalSocialPostId: identity.original?.id || null,
      });
    }

    const settings = await prisma.integrationSettings.findUnique({ where: { platform: "META" } });
    if (!settings?.accessToken || !settings.instagramId || !settings.pageId) {
      return NextResponse.json({ error: "Configuracoes Meta ausentes." }, { status: 400 });
    }

    if (!post.metaContainerId) {
      const claimed = await markSingleAttempt(prisma, {
        id: targetId,
        attemptField: "metaContainerAttemptedAt",
        message: "META_CONTAINER_ATTEMPT: criacao do container reservada uma unica vez.",
      });
      if (!claimed) {
        return NextResponse.json({
          success: false,
          stillProcessing: true,
          reason: "container_attempt_already_started",
          message: "A criacao do container ja foi iniciada; nenhuma segunda criacao sera feita.",
        });
      }
      const creationId = await createInstagramContainer(
        post.videoUrl,
        settings.instagramId,
        settings.accessToken,
        post.summary
      );
      await prisma.socialPost.update({
        where: { id: targetId },
        data: { status: "PROCESSING_MEDIA", metaContainerId: creationId },
      });
      await appendSocialPostLog(prisma, targetId, `META_CONTAINER_CREATED: ${creationId}.`);
      return NextResponse.json({ phase: 1, status: "PROCESSING_MEDIA", creationId, stillProcessing: true });
    }

    const containerStatus = await checkInstagramContainerStatus(post.metaContainerId, settings.accessToken);
    await appendSocialPostLog(prisma, targetId, `META_CONTAINER_STATUS: ${post.metaContainerId} = ${containerStatus}.`);
    if (containerStatus !== "FINISHED") {
      await prisma.socialPost.update({ where: { id: targetId }, data: { status: "PROCESSING_MEDIA" } });
      return NextResponse.json({ phase: 2, status: containerStatus, stillProcessing: true });
    }

    const igClaimed = await markSingleAttempt(prisma, {
      id: targetId,
      attemptField: "metaInstagramPublishAttemptedAt",
      postedField: "metaReelPostedAt",
      message: `META_INSTAGRAM_PUBLISH_ATTEMPT: container ${post.metaContainerId}; chamada final unica.`,
    });
    if (!igClaimed) {
      const current = await prisma.socialPost.findUnique({ where: { id: targetId } });
      if (current?.metaReelPostedAt) {
        return NextResponse.json({ success: true, skipped: true, reason: "already_posted" });
      }
      await prisma.socialPost.update({ where: { id: targetId }, data: { status: "FAILED" } });
      await appendSocialPostLog(
        prisma,
        targetId,
        "BLOQUEADO_RESULTADO_INCERTO: a Meta ja recebeu a chamada final; revisao manual necessaria, sem reenviar."
      );
      return NextResponse.json({ success: false, skipped: true, reason: "publish_already_attempted" });
    }

    const igId = await publishInstagramContainer(post.metaContainerId, settings.instagramId, settings.accessToken);
    const postedAt = new Date();
    await prisma.socialPost.update({
      where: { id: targetId },
      data: {
        status: "PUBLISHING",
        postedAt,
        metaReelPostedAt: postedAt,
        metaReelPostUrl: `https://www.instagram.com/reels/${igId}`,
      },
    });
    await appendSocialPostLog(prisma, targetId, `META_INSTAGRAM_POSTED: ${igId}.`);

    let fbId: string | null = null;
    let facebookError: string | null = null;
    const fbClaimed = await markSingleAttempt(prisma, {
      id: targetId,
      attemptField: "metaFacebookPublishAttemptedAt",
      message: "META_FACEBOOK_PUBLISH_ATTEMPT: chamada final unica.",
    });
    if (fbClaimed) {
      try {
        fbId = await publishFacebookVideoStory(post.videoUrl, settings.pageId, settings.accessToken);
        await appendSocialPostLog(prisma, targetId, `META_FACEBOOK_POSTED: ${fbId}.`);
      } catch (error: any) {
        facebookError = error?.message || "Falha no Facebook";
        await appendSocialPostLog(
          prisma,
          targetId,
          `META_FACEBOOK_RESULTADO_INCERTO: ${facebookError}. Nao sera reenviado automaticamente.`
        );
      }
    }

    await prisma.socialPost.update({ where: { id: targetId }, data: { status: "POSTED" } });
    return NextResponse.json({ success: true, igId, fbId, facebookError, phase: 2 });
  } catch (error: any) {
    const message = error?.message || "Erro interno";
    console.error("Publishing error:", error);
    if (targetId) {
      await prisma.socialPost.update({ where: { id: targetId }, data: { status: "FAILED" } }).catch(() => null);
      await appendSocialPostLog(
        prisma,
        targetId,
        `PUBLISH_ERROR: ${message}. Marcadores preservados para impedir duplicacao.`
      ).catch(() => null);
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
