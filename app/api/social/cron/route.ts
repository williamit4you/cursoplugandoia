import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { requireAdminOrCronSecret } from "@/lib/shopee-pipeline/apiAuth";
import { markSocialCronError, markSocialCronFinished, markSocialCronRunning } from "@/lib/socialCronState";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

function baseUrl(req: NextRequest) {
  const host = req.headers.get("host") || "localhost:3000";
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const protocol = forwardedProto || (host.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

async function callPublisher(req: NextRequest, pathname: string, socialPostId: string) {
  const res = await fetch(`${baseUrl(req)}${pathname}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ socialPostId }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function appendPostLog(id: string, message: string) {
  const post = await prisma.socialPost.findUnique({ where: { id }, select: { log: true } });
  const now = `[${new Date().toLocaleTimeString("pt-BR")}]`;
  const log = post?.log ? `${post.log}\n${now} ${message}` : `${now} ${message}`;
  await prisma.socialPost.update({ where: { id }, data: { log } });
}

export async function GET(req: NextRequest) {
  try {
    await requireAdminOrCronSecret(req);
    const startedAt = new Date();

    const limit = Math.min(10, Math.max(1, Number(req.nextUrl.searchParams.get("limit") || 5)));
    const now = new Date();

    // snapshot: mark running (in-memory) for the UI
    markSocialCronRunning(startedAt);

    const posts = await prisma.socialPost.findMany({
      where: {
        OR: [
          { status: "SCHEDULED", scheduledTo: { lte: now } },
          { status: "PROCESSING_MEDIA" },
        ],
      },
      orderBy: [{ scheduledTo: "asc" }, { createdAt: "asc" }],
      take: limit,
    });

    const tiktokSettings = await prisma.integrationSettings.findUnique({ where: { platform: "TIKTOK" } }).catch(() => null);
    const results: any[] = [];

    for (const post of posts) {
      if (post.platform === "TIKTOK" && !tiktokSettings?.isActive) {
        await prisma.socialPost.update({
          where: { id: post.id },
          data: {
            status: "DRAFT",
            log: post.log
              ? `${post.log}\n[${new Date().toLocaleTimeString("pt-BR")}] TikTok ignorado: integracao inativa.`
              : `[${new Date().toLocaleTimeString("pt-BR")}] TikTok ignorado: integracao inativa.`,
          },
        });
        results.push({ id: post.id, platform: post.platform, skipped: true, reason: "TikTok inativo" });
        continue;
      }

      const pathname =
        post.platform === "YOUTUBE"
          ? "/api/social/publish-youtube"
          : post.platform === "TIKTOK"
            ? "/api/social/publish-tiktok"
            : post.postType === "STORY"
              ? "/api/social/publish-story"
              : "/api/social/publish";

      const result = await callPublisher(req, pathname, post.id);
      results.push({ id: post.id, platform: post.platform, ok: result.ok, status: result.status, data: result.data });

      if (!result.ok && !result.data?.timeLimit) {
        await prisma.socialPost.update({
          where: { id: post.id },
          data: {
            status: "FAILED",
            log: post.log
              ? `${post.log}\n[${new Date().toLocaleTimeString("pt-BR")}] Falha publicador automatico: ${result.data?.error || `HTTP ${result.status}`}`
              : `[${new Date().toLocaleTimeString("pt-BR")}] Falha publicador automatico: ${result.data?.error || `HTTP ${result.status}`}`,
          },
        });
      } else if (result.data?.stillProcessing) {
        await appendPostLog(post.id, "Meta ainda processando; o cron tentara novamente.");
      }
    }

    markSocialCronFinished({ ok: true, checked: posts.length, results, finishedAt: new Date() });
    return NextResponse.json({ checked: posts.length, results, startedAt: startedAt.toISOString() });
  } catch (error: any) {
    console.error("[api/social/cron GET]", error);
    markSocialCronError(error?.message || "Falha no cron social");
    const status = error?.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json(
      { error: error?.message || "Falha no cron social" },
      { status }
    );
  }
}
