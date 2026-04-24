import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const SECRET = process.env.WORKER_SECRET_KEY || "super-secret-worker-key-123";
// O frontend usa NEXT_PUBLIC_WORKER_SECRET no page.tsx. Vamos aceitar as duas variaveis
const FRONTEND_SECRET = process.env.NEXT_PUBLIC_WORKER_SECRET || "super-secret-worker-key-123";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-worker-secret");
  if (secret !== SECRET && secret !== FRONTEND_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cfg = await prisma.videoQuestionConfig.findFirst();
    if (!cfg || !cfg.isEnabled) {
      return NextResponse.json({ message: "Config is disabled or not found." });
    }

    // Try to claim ONE question
    const candidate = await prisma.videoQuestion.findFirst({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
    });

    if (!candidate) {
      return NextResponse.json({ message: "No pending questions." });
    }

    const updated = await prisma.videoQuestion.update({
      where: { id: candidate.id },
      data: { status: "PROCESSING", startedAt: new Date(), errorMessage: null },
    });

    // Start background processing
    processQuestionBackground(updated.id, cfg).catch(err => {
      console.error("[process-next-question] Background error:", err);
    });

    return NextResponse.json({ success: true, message: `Started processing question ${updated.id}` });
  } catch (error: any) {
    console.error("[api/worker/process-next-question POST]", error);
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}

async function processQuestionBackground(questionId: string, cfg: any) {
  try {
    const question = await prisma.videoQuestion.findUnique({ where: { id: questionId } });
    if (!question) return;

    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const host = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_SITE_URL || "localhost:3000";
    const baseUrl = `${protocol}://${host}`;

    // 1. Create Project
    let res = await fetch(`${baseUrl}/api/video-code/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ideaPrompt: question.questionText,
        useExternalMedia: question.useExternalMedia,
        aspectRatio: cfg.defaultAspectRatio || "PORTRAIT_9_16",
        videoDurationSec: cfg.videoDurationSec || 30,
        ttsVoice: cfg.ttsVoice || "pt-BR-AntonioNeural",
        ttsSpeed: cfg.ttsSpeed || "+5%",
      }),
    });
    if (!res.ok) throw new Error("Failed to create project");
    const project = await res.json();

    await prisma.videoQuestion.update({
      where: { id: questionId },
      data: { codeVideoProjectId: project.id },
    });

    // 2. Generate Spec
    res = await fetch(`${baseUrl}/api/video-code/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: project.id }),
    });
    if (!res.ok) throw new Error("Failed to generate AI spec");

    // 3. Render MP4
    res = await fetch(`${baseUrl}/api/video-code/render`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: project.id }),
    });
    if (!res.ok) throw new Error("Failed to render MP4");

    // 4. Update status to DONE
    await prisma.videoQuestion.update({
      where: { id: questionId },
      data: { status: "DONE", completedAt: new Date() },
    });

    // 5. Enqueue if configured
    if (cfg.autoEnqueueMetaStory) {
      await enqueueSocial(baseUrl, questionId, "META", "STORY");
    }
    if (cfg.autoEnqueueMetaReels) {
      await enqueueSocial(baseUrl, questionId, "META", "REEL");
    }
    if (cfg.autoEnqueueTikTok) {
      await enqueueSocial(baseUrl, questionId, "TIKTOK", "REEL");
    }
    if (cfg.autoEnqueueLinkedIn) {
      await enqueueSocial(baseUrl, questionId, "LINKEDIN", "REEL");
    }
  } catch (error: any) {
    console.error(`[processQuestionBackground] Failed for question ${questionId}:`, error);
    await prisma.videoQuestion.update({
      where: { id: questionId },
      data: { status: "FAILED", errorMessage: error?.message || "Unknown error" },
    });
  }
}

async function enqueueSocial(baseUrl: string, questionId: string, platform: string, postType: string) {
  try {
    const res = await fetch(`${baseUrl}/api/video-questions/${questionId}/enqueue-social`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-worker-secret": FRONTEND_SECRET,
      },
      body: JSON.stringify({ platform, postType }),
    });
    if (!res.ok) {
      console.error(`[enqueueSocial] Failed for ${platform} ${postType}`, await res.text());
    }
  } catch (err) {
    console.error(`[enqueueSocial] Error calling endpoint`, err);
  }
}
