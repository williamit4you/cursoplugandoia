import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { publishInstagramStory, publishFacebookVideoStory } from "@/lib/metaGraph";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { socialPostId, bypassTimeCheck } = body;

    const socialPost = await prisma.socialPost.findUnique({
      where: { id: socialPostId },
    });

    if (!socialPost) {
      return NextResponse.json({ error: "Social Post não encontrado" }, { status: 404 });
    }

    if (!bypassTimeCheck) {
      if (socialPost.status === "SCHEDULED" && socialPost.scheduledTo) {
        const now = new Date();
        if (socialPost.scheduledTo > now) {
          return NextResponse.json(
            { error: "Limite de tempo não atingido.", timeLimit: true },
            { status: 400 }
          );
        }
      }
    }

    const settings = await prisma.integrationSettings.findUnique({
      where: { platform: "META" },
    });

    if (!settings?.accessToken || !settings?.instagramId || !settings?.pageId) {
      return NextResponse.json(
        { error: "Configurações Meta ausentes. Configure no painel de integrações." },
        { status: 400 }
      );
    }

    // Função que persiste cada log no banco para a UI consumir via polling
    const logs: string[] = [];
    const appendLog = async (msg: string) => {
      const entry = `[${new Date().toLocaleTimeString("pt-BR")}] ${msg}`;
      logs.push(entry);
      await prisma.socialPost.update({
        where: { id: socialPostId },
        data: { status: "PUBLISHING", log: logs.join("\n") },
      });
    };

    let igId: string | null = null;
    let fbId: string | null = null;
    const errors: string[] = [];

    // Publicar no Instagram com polling + retry
    try {
      await appendLog("🚀 Iniciando publicação no Instagram...");
      igId = await publishInstagramStory(
        socialPost.videoUrl,
        settings.instagramId,
        settings.accessToken,
        appendLog
      );
    } catch (e: any) {
      errors.push(`IG: ${e.message}`);
      await appendLog(`❌ Erro IG: ${e.message}`);
    }

    // Publicar no Facebook
    try {
      await appendLog("🚀 Publicando no Facebook...");
      fbId = await publishFacebookVideoStory(
        socialPost.videoUrl,
        settings.pageId,
        settings.accessToken
      );
      await appendLog(`✅ Facebook publicado! ID: ${fbId}`);
    } catch (e: any) {
      errors.push(`FB: ${e.message}`);
      await appendLog(`❌ Erro FB: ${e.message}`);
    }

    const finalStatus = errors.length === 0 ? "POSTED" : "FAILED";

    await prisma.socialPost.update({
      where: { id: socialPostId },
      data: {
        status: finalStatus,
        postedAt: finalStatus === "POSTED" ? new Date() : undefined,
        log: logs.join("\n"),
      },
    });

    return NextResponse.json({
      success: finalStatus === "POSTED",
      igId,
      fbId,
      errors,
    });
  } catch (error: any) {
    console.error("Publishing error:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
