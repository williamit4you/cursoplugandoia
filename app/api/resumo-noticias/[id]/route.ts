import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireServerSession } from "@/lib/serverAuth";
import {
  buildEditionItems,
  buildEditionSnapshots,
} from "@/lib/dailyNewsCuration";
import {
  buildEditionTitle,
  normalizeDailyNewsStatus,
  normalizeDuration,
  normalizeIds,
} from "@/lib/dailyNewsEdition";

export const dynamic = "force-dynamic";

const dailyNewsEdition = (prisma as any).dailyNewsEdition;
const dailyNewsEditionItem = (prisma as any).dailyNewsEditionItem;

async function requireAdmin() {
  const session = await requireServerSession();
  const user = session?.user as any;
  if (!session?.user || String(user?.role || "") !== "ADMIN") {
    return null;
  }
  return session;
}

async function readEdition(id: string) {
  return dailyNewsEdition.findUnique({
    where: { id },
    include: {
      codeVideoProject: {
        include: {
          socialPosts: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
          pipelineSteps: {
            orderBy: { createdAt: "desc" },
            take: 20,
          },
          pipelineEvents: {
            orderBy: { createdAt: "desc" },
            take: 20,
          },
        },
      },
      items: {
        orderBy: { position: "asc" },
        include: {
          post: {
            select: {
              id: true,
              slug: true,
              status: true,
              summary: true,
              publishedAt: true,
              coverImage: true,
            },
          },
          assets: {
            orderBy: { createdAt: "asc" },
          },
        },
      },
      assets: {
        where: { editionItemId: null },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function GET(
  _: NextRequest,
  ctx: { params: { id: string } },
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const item = await readEdition(ctx.params.id);
  if (!item) {
    return NextResponse.json({ error: "Nao encontrado." }, { status: 404 });
  }

  return NextResponse.json({ item });
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: { id: string } },
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const existing = await dailyNewsEdition.findUnique({
    where: { id: ctx.params.id },
    include: { items: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Nao encontrado." }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const data: any = {};

  if (body?.status != null) data.status = normalizeDailyNewsStatus(body.status);
  if (body?.title != null) {
    data.title =
      String(body.title || "").trim() || buildEditionTitle(existing.editionDate);
  }
  if (body?.description != null) {
    data.description = String(body.description || "").trim() || null;
  }
  if (body?.scriptText != null) {
    data.scriptText = String(body.scriptText || "").trim() || null;
  }
  if (body?.targetDurationSec != null) {
    data.targetDurationSec = normalizeDuration(body.targetDurationSec);
  }
  if (body?.measuredDurationSec != null) {
    const measured = Number(body.measuredDurationSec);
    data.measuredDurationSec = Number.isFinite(measured) ? measured : null;
  }
  if (body?.previewVideoUrl != null) {
    data.previewVideoUrl = String(body.previewVideoUrl || "").trim() || null;
  }
  if (body?.finalVideoUrl != null) {
    data.finalVideoUrl = String(body.finalVideoUrl || "").trim() || null;
  }
  if (body?.thumbnailUrl != null) {
    data.thumbnailUrl = String(body.thumbnailUrl || "").trim() || null;
  }
  if (body?.captionsUrl != null) {
    data.captionsUrl = String(body.captionsUrl || "").trim() || null;
  }
  if (body?.youtubePostUrl != null) {
    data.youtubePostUrl = String(body.youtubePostUrl || "").trim() || null;
  }
  if (body?.errorMessage != null) {
    data.errorMessage = String(body.errorMessage || "").trim() || null;
  }
  if (body?.scheduledAt != null) {
    data.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
  }
  if (body?.publishedAt != null) {
    data.publishedAt = body.publishedAt ? new Date(body.publishedAt) : null;
  }
  if (body?.sourceSnapshotJson != null) {
    data.sourceSnapshotJson = body.sourceSnapshotJson;
  }
  if (body?.assetPlanJson != null) {
    data.assetPlanJson = body.assetPlanJson;
  }

  const nextPostIds = body?.postIds != null ? normalizeIds(body.postIds, 8) : null;
  if (nextPostIds) {
    const posts = await prisma.post.findMany({
      where: { id: { in: nextPostIds } },
      include: {
        categories: {
          include: { category: true },
          orderBy: { category: { sortOrder: "asc" } },
        },
      },
    });
    if (posts.length !== nextPostIds.length) {
      return NextResponse.json(
        { error: "Uma ou mais noticias selecionadas nao foram encontradas." },
        { status: 400 },
      );
    }

    const postMap = new Map(posts.map((post) => [post.id, post]));
    const orderedPosts = nextPostIds
      .map((id) => postMap.get(id))
      .filter(Boolean) as typeof posts;
    data.sourceSnapshotJson = buildEditionSnapshots(orderedPosts as any);

    await prisma.$transaction([
      dailyNewsEditionItem.deleteMany({
        where: { editionId: existing.id },
      }),
      dailyNewsEdition.update({
        where: { id: existing.id },
        data: {
          ...data,
          items: {
            create: buildEditionItems(orderedPosts as any),
          },
        },
      }),
    ]);

    const item = await readEdition(existing.id);
    return NextResponse.json({ item });
  }

  await dailyNewsEdition.update({
    where: { id: existing.id },
    data,
  });

  const item = await readEdition(existing.id);
  return NextResponse.json({ item });
}
