import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 900;

async function isAdminSession(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return false;
  const token = await getToken({ req, secret }).catch(() => null);
  return Boolean(token);
}

function baseUrl(req: NextRequest) {
  const host = req.headers.get("host") || "localhost:3000";
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const protocol = forwardedProto || (host.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

function now() {
  return new Date();
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function publicationPath(platform: "TIKTOK" | "YOUTUBE" | "INSTAGRAM") {
  if (platform === "TIKTOK") return "/api/social/publish-tiktok";
  if (platform === "YOUTUBE") return "/api/social/publish-youtube";
  // Instagram: publicar como REEL (usa o fluxo padrão /api/social/publish)
  return "/api/social/publish";
}

function socialPlatform(platform: "TIKTOK" | "YOUTUBE" | "INSTAGRAM") {
  if (platform === "INSTAGRAM") return "META";
  return platform;
}

function postType(platform: "TIKTOK" | "YOUTUBE" | "INSTAGRAM") {
  // Instagram no pipeline vai como REEL (não Story 24h)
  return "REEL";
}

function buildSummary(ad: { title: string; description: string; affiliateUrl?: string | null }) {
  const parts: string[] = [];
  const title = (ad.title || "").trim();
  const description = (ad.description || "").trim();
  if (title) parts.push(title);
  if (description) parts.push(description);
  const affiliateUrl = (ad.affiliateUrl || "").trim();
  if (affiliateUrl) parts.push(`Produto com desconto (link de afiliado): ${affiliateUrl}`);
  return parts.join("\n\n").slice(0, 1800);
}

async function callPublisher(req: NextRequest, pathname: string, socialPostId: string) {
  const res = await fetch(`${baseUrl(req)}${pathname}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ socialPostId }),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

function readSocialPostId(payload: any): string | null {
  try {
    const id = payload?.socialPostId;
    return id ? String(id) : null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const secret = req.nextUrl.searchParams.get("secret");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && secret !== cronSecret) {
      const okSession = await isAdminSession(req);
      if (!okSession) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const limit = Math.min(10, Math.max(1, Number(req.nextUrl.searchParams.get("limit") || 5)));
    const current = now();

    const due = await prisma.storyAd.findMany({
      where: { status: "SCHEDULED" as any, scheduledAt: { lte: current }, coleta: { pipelineKind: "SALES" as any } },
      orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
      take: limit,
      include: { publications: true, coleta: { select: { id: true } } },
    });

    const results: any[] = [];

    for (const ad of due) {
      const adResults: any[] = [];

      for (const pub of ad.publications) {
        const platform = pub.platform as any as "TIKTOK" | "YOUTUBE" | "INSTAGRAM";
        const eligible =
          pub.status === ("PENDING" as any) ||
          (pub.status === ("RETRY_SCHEDULED" as any) && (!pub.nextRetryAt || pub.nextRetryAt <= current)) ||
          (pub.status === ("PUBLISHING" as any) && (!pub.nextRetryAt || pub.nextRetryAt <= current));

        if (!eligible) continue;

        const attemptCount = Number(pub.attemptCount || 0);
        const maxAttempts = 3;

        try {
          const existingSocialPostId = readSocialPostId(pub.responsePayload);
          const socialPost =
            existingSocialPostId
              ? await prisma.socialPost.findUnique({ where: { id: existingSocialPostId } })
              : null;

          const ensured = socialPost
            ? socialPost
            : await prisma.socialPost.create({
                data: {
                  summary: buildSummary(ad),
                  videoUrl: ad.videoUrl,
                  status: "SCHEDULED",
                  scheduledTo: ad.scheduledAt || current,
                  platform: socialPlatform(platform),
                  postType: postType(platform),
                },
              });

          if (!existingSocialPostId) {
            await prisma.storyPublication.update({
              where: { id: pub.id },
              data: {
                responsePayload: { socialPostId: ensured.id },
              },
            });
          }

          await prisma.storyPublication.update({
            where: { id: pub.id },
            data: { status: "PUBLISHING" as any, nextRetryAt: addMinutes(current, 2) },
          });

          const publisher = publicationPath(platform);
          const call = await callPublisher(req, publisher, ensured.id);

          const refreshed = await prisma.socialPost.findUnique({ where: { id: ensured.id } });
          const posted = refreshed?.status === "POSTED";
          const stillProcessing = Boolean(call.data?.stillProcessing);

          if (posted) {
            await prisma.storyPublication.update({
              where: { id: pub.id },
              data: {
                status: "PUBLISHED" as any,
                publishedUrl:
                  refreshed?.postUrl ||
                  refreshed?.youtubePostUrl ||
                  refreshed?.tiktokPostUrl ||
                  refreshed?.metaReelPostUrl ||
                  refreshed?.metaStoryPostUrl ||
                  null,
                responsePayload: { socialPostId: ensured.id, publisher: call.data || null },
                nextRetryAt: null,
                errorMessage: null,
              },
            });
            adResults.push({ publicationId: pub.id, platform, ok: true, posted: true });
            continue;
          }

          if (call.ok && stillProcessing) {
            await prisma.storyPublication.update({
              where: { id: pub.id },
              data: {
                status: "PUBLISHING" as any,
                nextRetryAt: addMinutes(current, 2),
                responsePayload: { socialPostId: ensured.id, publisher: call.data || null },
                errorMessage: null,
              },
            });
            adResults.push({ publicationId: pub.id, platform, ok: true, stillProcessing: true });
            continue;
          }

          if (!call.ok) {
            const next = attemptCount + 1 >= maxAttempts ? null : addMinutes(current, 30);
            await prisma.storyPublication.update({
              where: { id: pub.id },
              data: {
                status: (attemptCount + 1 >= maxAttempts ? "FAILED" : "RETRY_SCHEDULED") as any,
                attemptCount: attemptCount + 1,
                nextRetryAt: next,
                errorMessage: String(call.data?.error || `HTTP ${call.status}`),
                responsePayload: { socialPostId: ensured.id, publisher: call.data || null },
              },
            });
            adResults.push({ publicationId: pub.id, platform, ok: false, status: call.status, error: call.data?.error || null });
            continue;
          }

          // Caso raro: ok do publisher, mas SocialPost ainda nao ficou POSTED e nao sinalizou processamento.
          await prisma.storyPublication.update({
            where: { id: pub.id },
            data: { status: "PUBLISHING" as any, nextRetryAt: addMinutes(current, 2), responsePayload: { socialPostId: ensured.id, publisher: call.data || null } },
          });
          adResults.push({ publicationId: pub.id, platform, ok: true, pending: true });
        } catch (error: any) {
          const message = error?.message || "Falha ao publicar";
          const next = attemptCount + 1 >= maxAttempts ? null : addMinutes(current, 30);
          await prisma.storyPublication.update({
            where: { id: pub.id },
            data: {
              status: (attemptCount + 1 >= maxAttempts ? "FAILED" : "RETRY_SCHEDULED") as any,
              attemptCount: attemptCount + 1,
              nextRetryAt: next,
              errorMessage: message,
            },
          });
          adResults.push({ publicationId: pub.id, platform, ok: false, error: message });
        }
      }

      const updatedAd = await prisma.storyAd.findUnique({ where: { id: ad.id }, include: { publications: true } });
      const pubs = updatedAd?.publications || [];
      const allPublished = pubs.length > 0 && pubs.every((p) => p.status === ("PUBLISHED" as any));
      const anyFailed = pubs.some((p) => p.status === ("FAILED" as any));
      const anyPublishing = pubs.some((p) => p.status === ("PUBLISHING" as any) || p.status === ("RETRY_SCHEDULED" as any));

      await prisma.storyAd.update({
        where: { id: ad.id },
        data: {
          status: allPublished ? ("PUBLISHED" as any) : anyFailed && !anyPublishing ? ("FAILED" as any) : ("SCHEDULED" as any),
        },
      });

      if (allPublished) {
        await prisma.coletaDadosShoppe.update({
          where: { id: ad.coletaId },
          data: { pipelineStatus: "PUBLISHED" as any, nextRunAt: null, lastError: null },
        }).catch(() => null);
      }

      results.push({ storyAdId: ad.id, coletaId: ad.coletaId, processed: adResults.length, results: adResults });
    }

    return NextResponse.json({ ok: true, checked: due.length, results });
  } catch (error: any) {
    console.error("[api/shopee-pipeline/publisher-runner GET]", error);
    return NextResponse.json({ error: error?.message || "Falha no publisher-runner" }, { status: 500 });
  }
}
