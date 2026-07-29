import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  LONG_FORM_MAX_SUBTOPICS,
  LONG_FORM_PROJECT_TYPE,
  LONG_FORM_TARGET_DURATION_SEC,
  normalizeSubtopics,
} from "@/lib/longFormMarketing";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await prisma.codeVideoProject.findMany({
    where: { projectType: LONG_FORM_PROJECT_TYPE },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      socialPosts: { orderBy: { scheduledTo: "desc" }, take: 1 },
    },
  });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const title = String(body?.workingTitle || "").trim();
  const subtopics = normalizeSubtopics(body?.subtopics);
  const funnelStage = ["TOPO", "MEIO", "FUNDO"].includes(
    String(body?.funnelStage),
  )
    ? String(body.funnelStage)
    : "TOPO";

  if (title.length < 5) {
    return NextResponse.json(
      { error: "Informe um titulo com pelo menos 5 caracteres." },
      { status: 400 },
    );
  }
  if (subtopics.length < 1) {
    return NextResponse.json(
      {
        error: `Informe pelo menos 1 subtitulo (limite de ${LONG_FORM_MAX_SUBTOPICS}).`,
      },
      { status: 400 },
    );
  }

  const metadata = {
    kind: LONG_FORM_PROJECT_TYPE,
    funnelStage,
    subtopics,
    audience: String(body?.audience || ""),
    objective: String(body?.objective || ""),
    cta: String(body?.cta || ""),
    tone: String(body?.tone || "DIDATICO"),
    externalMediaPolicy:
      body?.externalMediaPolicy === "UPLOADS_ONLY"
        ? "UPLOADS_ONLY"
        : "PEXELS_AND_UPLOADS",
    planningApproved: false,
    finalApproved: false,
  };

  const project = await prisma.codeVideoProject.create({
    data: {
      projectType: LONG_FORM_PROJECT_TYPE,
      ideaPrompt: title,
      title,
      aspectRatio: "LANDSCAPE_16_9",
      videoDurationSec: LONG_FORM_TARGET_DURATION_SEC,
      fps: 30,
      ttsVoice: "pt-BR-AntonioNeural",
      ttsSpeed: "+5%",
      useExternalMedia:
        metadata.externalMediaPolicy === "PEXELS_AND_UPLOADS",
      metadataJson: JSON.stringify(metadata),
      description: "",
      status: "DRAFT",
    },
  });

  return NextResponse.json(project, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.from(
    new Set<string>(
      (Array.isArray(body?.ids) ? body.ids : [])
        .map((id: unknown) => String(id || "").trim())
        .filter((id: string) => Boolean(id)),
    ),
  ).slice(0, 200);

  if (!ids.length) {
    return NextResponse.json(
      { error: "Selecione pelo menos um video." },
      { status: 400 },
    );
  }

  const projects = await prisma.codeVideoProject.findMany({
    where: { id: { in: ids }, projectType: LONG_FORM_PROJECT_TYPE },
    include: { socialPosts: true },
  });
  const posted = projects.filter((project) =>
    project.socialPosts.some((post) => post.status === "POSTED"),
  );
  if (posted.length) {
    return NextResponse.json(
      {
        error: `${posted.length} video(s) ja publicado(s) nao podem ser excluidos.`,
      },
      { status: 409 },
    );
  }

  const projectIds = projects.map((project) => project.id);
  await prisma.$transaction([
    prisma.socialPost.deleteMany({
      where: { codeVideoProjectId: { in: projectIds } },
    }),
    prisma.codeVideoProject.deleteMany({ where: { id: { in: projectIds } } }),
  ]);

  return NextResponse.json({ ok: true, deleted: projectIds.length });
}
