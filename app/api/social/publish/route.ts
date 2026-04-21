import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { publishInstagramStory, publishFacebookVideoStory } from "@/lib/metaGraph"

const connectionString = process.env.DATABASE_URL!
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { socialPostId, bypassTimeCheck } = body;

    const socialPost = await prisma.socialPost.findUnique({
       where: { id: socialPostId }
    });

    if (!socialPost) {
       return NextResponse.json({ error: "Social Post not found" }, { status: 404 });
    }

    if (!bypassTimeCheck) {
      if (socialPost.status === "SCHEDULED" && socialPost.scheduledTo) {
          const now = new Date();
          if (socialPost.scheduledTo > now) {
              return NextResponse.json({ error: "Cannot post yet. Please wait until scheduled time.", timeLimit: true }, { status: 400 });
          }
      }
    }

    const settings = await prisma.integrationSettings.findUnique({
       where: { platform: "META" }
    });

    if (!settings || !settings.accessToken || !settings.instagramId || !settings.pageId) {
        return NextResponse.json({ error: "Meta settings missing. Configure them in the panel." }, { status: 400 });
    }

    let igId = null;
    let fbId = null;
    let errorLog = null;

    try {
        igId = await publishInstagramStory(socialPost.videoUrl, settings.instagramId, settings.accessToken);
    } catch (e: any) {
        errorLog = e.message;
    }

    try {
        fbId = await publishFacebookVideoStory(socialPost.videoUrl, settings.pageId, settings.accessToken);
    } catch (e: any) {
        errorLog += ` | FB Error: ${e.message}`;
    }

    if (errorLog) {
         await prisma.socialPost.update({
             where: { id: socialPostId },
             data: { status: "FAILED", log: errorLog }
         });
         return NextResponse.json({ error: errorLog }, { status: 500 });
    }

    await prisma.socialPost.update({
        where: { id: socialPostId },
        data: { status: "POSTED", postedAt: new Date(), log: "Postado via Meta Graph API" }
    });

    return NextResponse.json({ success: true, igId, fbId });

  } catch (error: any) {
    console.error("Publishing error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
