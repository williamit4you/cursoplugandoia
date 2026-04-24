import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const SECRET = process.env.WORKER_SECRET_KEY || "super-secret-worker-key-123";

const DEFAULT_SCHEDULED_TIMES = "[]";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-worker-secret");
  if (secret !== SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let cfg = await prisma.videoQuestionConfig.findFirst();
    if (!cfg) {
      cfg = await prisma.videoQuestionConfig.create({
        data: {
          scheduledTimes: DEFAULT_SCHEDULED_TIMES,
        },
      });
    }
    return NextResponse.json(cfg);
  } catch (error) {
    console.error("[api/video-questions/config GET]", error);
    return NextResponse.json({ error: "Failed to fetch config" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-worker-secret");
  if (secret !== SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const existing = await prisma.videoQuestionConfig.findFirst();

    const updateData = {
      isEnabled: body.isEnabled ?? true,
      intervalMinutes: body.intervalMinutes ?? 60,
      scheduledTimes: body.scheduledTimes ?? DEFAULT_SCHEDULED_TIMES,
      useScheduledTimes: body.useScheduledTimes ?? false,
      maxQuestionsPerRun: body.maxQuestionsPerRun ?? 3,
      defaultAspectRatio: body.defaultAspectRatio ?? "PORTRAIT_9_16",
      videoDurationSec: body.videoDurationSec ?? 30,
      fps: body.fps ?? 30,
      ttsVoice: body.ttsVoice ?? "pt-BR-AntonioNeural",
      ttsSpeed: body.ttsSpeed ?? "+5%",
      autoEnqueueMetaStory: body.autoEnqueueMetaStory ?? false,
      autoEnqueueMetaReels: body.autoEnqueueMetaReels ?? false,
      autoEnqueueTikTok: body.autoEnqueueTikTok ?? false,
      autoEnqueueLinkedIn: body.autoEnqueueLinkedIn ?? false,
      autoEnqueueYouTube: body.autoEnqueueYouTube ?? false,
      useExternalMedia: body.useExternalMedia ?? false,
    };

    const cfg = existing
      ? await prisma.videoQuestionConfig.update({ where: { id: existing.id }, data: updateData })
      : await prisma.videoQuestionConfig.create({ data: updateData });

    return NextResponse.json(cfg);
  } catch (error) {
    console.error("[api/video-questions/config POST]", error);
    return NextResponse.json({ error: "Failed to save config" }, { status: 500 });
  }
}

