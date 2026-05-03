import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const projects = await prisma.codeVideoProject.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        projectType: true,
        ideaPrompt: true,
        aspectRatio: true,
        videoDurationSec: true,
        title: true,
        promptPreview: true,
        metadataJson: true,
        createdAt: true,
        updatedAt: true,
        videoUrl: true,
        thumbUrl: true,
      },
    });

    return NextResponse.json(projects);
  } catch {
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ideaPrompt = String(body?.ideaPrompt ?? "").trim();
    const aspectRatio = String(body?.aspectRatio ?? "PORTRAIT_9_16").trim();
    const videoDurationSec = Number(body?.videoDurationSec ?? 30);
    const ttsVoice = String(body?.ttsVoice ?? "pt-BR-AntonioNeural").trim();
    const ttsSpeed = String(body?.ttsSpeed ?? "+5%").trim();
    const projectType = String(body?.projectType ?? "GENERIC").trim();
    const title = body?.title != null ? String(body.title).trim() : null;
    const description = body?.description != null ? String(body.description).trim() : null;
    const metadataJson =
      body?.metadataJson == null
        ? "{}"
        : typeof body.metadataJson === "string"
          ? body.metadataJson
          : JSON.stringify(body.metadataJson);

    if (!ideaPrompt) {
      return NextResponse.json({ error: "ideaPrompt is required" }, { status: 400 });
    }

    if (!Number.isFinite(videoDurationSec) || videoDurationSec <= 0) {
      return NextResponse.json({ error: "videoDurationSec must be > 0" }, { status: 400 });
    }

    if (aspectRatio !== "PORTRAIT_9_16" && aspectRatio !== "LANDSCAPE_16_9") {
      return NextResponse.json({ error: "Invalid aspectRatio" }, { status: 400 });
    }

    if (projectType !== "GENERIC" && projectType !== "PRODUCT_AD") {
      return NextResponse.json({ error: "Invalid projectType" }, { status: 400 });
    }

    const project = await prisma.codeVideoProject.create({
      data: {
        projectType,
        ideaPrompt,
        aspectRatio: aspectRatio as any,
        videoDurationSec,
        ttsVoice,
        ttsSpeed,
        useExternalMedia: Boolean(body?.useExternalMedia ?? false),
        title,
        description,
        metadataJson,
      },
    });

    return NextResponse.json(project);
  } catch {
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
