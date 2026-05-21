import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getClientIp(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for") || "";
  const ip = forwarded.split(",")[0]?.trim();
  return ip || "127.0.0.1";
}

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function safeJsonParse(text: string | null) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const socialPostId = String(params.id || "").trim();
  if (!socialPostId) {
    return NextResponse.json({ error: "Social post ID is required" }, { status: 400 });
  }

  try {
    // 1. Fetch SocialPost
    const socialPost = await prisma.socialPost.findUnique({
      where: { id: socialPostId },
      include: {
        codeVideoProject: true,
      },
    });

    if (!socialPost) {
      return NextResponse.json({ error: "Social post not found" }, { status: 404 });
    }

    // 2. Register click count and details
    const userAgent = req.headers.get("user-agent")?.slice(0, 240) || null;
    const ip = getClientIp(req);
    const ipHash = sha256(ip);
    const platform = socialPost.platform || "META";
    const referrer = req.headers.get("referer")?.slice(0, 240) || null;

    // Execute in transaction to increment counter and save click log
    await prisma.$transaction([
      prisma.socialPost.update({
        where: { id: socialPostId },
        data: { clicksCount: { increment: 1 } },
      }),
      prisma.socialPostClick.create({
        data: {
          socialPostId,
          platform,
          referrer,
          userAgent,
          ipHash,
        },
      }),
    ]);

    // 3. Resolve destination URL
    let destinationUrl = "";

    // A. Check CodeVideoProject metadata & automation bundle
    if (socialPost.codeVideoProject) {
      const metadata = safeJsonParse(socialPost.codeVideoProject.metadataJson);
      destinationUrl =
        metadata?.productUrl ||
        metadata?.affiliateUrl ||
        metadata?.shopee?.affiliateUrl ||
        metadata?.mercadoLivre?.affiliateUrl ||
        "";

      if (!destinationUrl) {
        const bundle = await prisma.automationAssetBundle.findFirst({
          where: { codeVideoProjectId: socialPost.codeVideoProject.id },
        });
        destinationUrl = bundle?.affiliateUrl || bundle?.productUrl || "";
      }
    }

    // B. Check StoryPublication JSON responsePayload
    if (!destinationUrl) {
      const pub = await prisma.storyPublication.findFirst({
        where: {
          responsePayload: {
            path: ["socialPostId"],
            equals: socialPost.id,
          },
        },
        include: {
          storyAd: {
            include: {
              coleta: true,
            },
          },
        },
      });

      if (pub?.storyAd) {
        destinationUrl = pub.storyAd.affiliateUrl || pub.storyAd.coleta?.affiliateUrl || "";
      }
    }

    // C. Fallback: Parse URL from the post summary text
    if (!destinationUrl && socialPost.summary) {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const matches = socialPost.summary.match(urlRegex);
      if (matches && matches.length > 0) {
        destinationUrl = matches[0];
      }
    }

    // 4. Redirect
    if (destinationUrl) {
      return NextResponse.redirect(new URL(destinationUrl), 302);
    } else {
      // Fallback to local viewer page if no destination affiliate URL was resolved
      const host = req.headers.get("host") || "localhost:3000";
      const protocol = req.headers.get("x-forwarded-proto") || "http";
      const viewerUrl = `${protocol}://${host}/p/${socialPostId}/view`;
      return NextResponse.redirect(new URL(viewerUrl), 302);
    }
  } catch (error: any) {
    console.error("[SHORTLINK_REDIRECT_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
