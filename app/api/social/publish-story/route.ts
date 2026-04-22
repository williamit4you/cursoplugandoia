import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import {
  createInstagramStoryContainer,
  checkAndPublishInstagramContainer,
  publishFacebookStory24h,
} from "@/lib/metaGraph";

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
  try {
    const { socialPostId } = await req.json();

    const socialPost = await prisma.socialPost.findUnique({ where: { id: socialPostId } });
    if (!socialPost) {
      return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
    }

    const settings = await prisma.integrationSettings.findUnique({ where: { platform: "META" } });
    if (!settings?.accessToken || !settings?.instagramId || !settings?.pageId) {
      return NextResponse.json({ error: "Configurações Meta ausentes." }, { status: 400 });
    }

    const appendLog = async (msg: string) => {
      const now = `[${new Date().toLocaleTimeString("pt-BR")}]`;
      const current = await prisma.socialPost.findUnique({
        where: { id: socialPostId },
        select: { log: true },
      });
      const updated = current?.log ? `${current.log}\n${now} ${msg}` : `${now} ${msg}`;
      await prisma.socialPost.update({ where: { id: socialPostId }, data: { log: updated } });
    };

    // ─── FASE 1: Criar container Story ───────────────────────────────────────
    if (!socialPost.metaContainerId) {
      await appendLog("📸 Criando container de Story 24h na Meta...");

      const creationId = await createInstagramStoryContainer(
        socialPost.videoUrl,
        settings.instagramId,
        settings.accessToken
      );

      await prisma.socialPost.update({
        where: { id: socialPostId },
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
      const result = await checkAndPublishInstagramContainer(
        metaContainerId,
        settings.instagramId,
        settings.accessToken
      );

      if (result.status !== "FINISHED") {
        await appendLog(`⏳ Status: ${result.status}. Continue aguardando...`);
        return NextResponse.json({
          phase: 2,
          status: result.status,
          stillProcessing: true,
          message: `Meta ainda processando (${result.status}).`,
        });
      }

      igId = result.igPostId || null;
      await appendLog(`✅ Story publicado no Instagram! ID: ${igId}`);
    } catch (e: any) {
      errors.push(`IG Story: ${e.message}`);
      await appendLog(`❌ Erro IG Story: ${e.message}`);
    }

    // Facebook
    try {
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
      where: { id: socialPostId },
      data: {
        status: finalStatus,
        postedAt: finalStatus === "POSTED" ? new Date() : undefined,
        metaContainerId: null,
      },
    });

    return NextResponse.json({ success: finalStatus === "POSTED", igId, fbId, errors, phase: 2 });
  } catch (error: any) {
    console.error("Story publishing error:", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}
