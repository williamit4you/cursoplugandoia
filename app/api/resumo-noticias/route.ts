import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  dailyNewsUnavailableResponse,
  getDailyNewsDelegates,
  isDailyNewsSchemaMissing,
} from "@/lib/dailyNewsAvailability";
import { requireServerSession } from "@/lib/serverAuth";
import {
  buildAutoCuratedEditionPosts,
  buildEditionItems,
  buildEditionSnapshots,
  DAILY_NEWS_MIN_ITEMS,
  loadCandidateNewsPosts,
} from "@/lib/dailyNewsCuration";
import {
  buildEditionTitle,
  DAILY_NEWS_DEFAULT_DURATION_SEC,
  DAILY_NEWS_TIMEZONE,
  normalizeDailyNewsStatus,
  normalizeDuration,
  normalizeEditionDate,
  normalizeIds,
  sourceNameFromUrl,
} from "@/lib/dailyNewsEdition";
import { createManualScrapeTestRun } from "@/lib/manualScrapeTest";

export const dynamic = "force-dynamic";

const { dailyNewsEdition } = getDailyNewsDelegates();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requireAdmin() {
  const session = await requireServerSession();
  const user = session?.user as any;
  if (!session?.user || String(user?.role || "") !== "ADMIN") {
    return null;
  }
  return session;
}

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  if (!dailyNewsEdition) {
    return dailyNewsUnavailableResponse();
  }

  const status = String(req.nextUrl.searchParams.get("status") || "")
    .trim()
    .toUpperCase();
  const q = String(req.nextUrl.searchParams.get("q") || "").trim();
  const take = Math.min(
    200,
    Math.max(1, Number(req.nextUrl.searchParams.get("take") || 50)),
  );

  let items: any[] = [];
  try {
    items = await dailyNewsEdition.findMany({
      where: {
        ...(status ? { status: normalizeDailyNewsStatus(status) } : {}),
        ...(q
          ? {
              OR: [
                { id: { contains: q, mode: "insensitive" } },
                { title: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ editionDate: "desc" }, { createdAt: "desc" }],
      take,
      include: {
        codeVideoProject: {
          select: {
            id: true,
            status: true,
            videoUrl: true,
            thumbUrl: true,
            renderProgress: true,
          },
        },
        items: {
          orderBy: { position: "asc" },
          select: {
            id: true,
            postId: true,
            position: true,
            titleSnapshot: true,
            category: true,
          },
        },
        assets: {
          select: { id: true, status: true, assetType: true },
        },
      },
    });
  } catch (error) {
    if (isDailyNewsSchemaMissing(error)) {
      return dailyNewsUnavailableResponse();
    }
    throw error;
  }

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  if (!dailyNewsEdition) {
    return dailyNewsUnavailableResponse();
  }

  const body = await req.json().catch(() => ({}));
  const timezone =
    String(body?.timezone || DAILY_NEWS_TIMEZONE).trim() || DAILY_NEWS_TIMEZONE;
  const editionDate = normalizeEditionDate(body?.editionDate);
  const postIds = normalizeIds(body?.postIds, 8);
  const title = String(body?.title || "").trim();
  const description = String(body?.description || "").trim();
  const targetDurationSec = normalizeDuration(
    body?.targetDurationSec ?? DAILY_NEWS_DEFAULT_DURATION_SEC,
  );
  const autoCollectBeforeCreate = body?.mode === "AUTO_COLLECT_CREATE_TODAY";

  let existing: { id: string } | null = null;
  try {
    existing = await dailyNewsEdition.findUnique({
      where: {
        editionDate_timezone: {
          editionDate,
          timezone,
        },
      },
      select: { id: true },
    });
  } catch (error) {
    if (isDailyNewsSchemaMissing(error)) {
      return dailyNewsUnavailableResponse();
    }
    throw error;
  }
  if (existing) {
    return NextResponse.json(
      { error: "Ja existe uma edicao para esta data e timezone." },
      { status: 409 },
    );
  }

  let triggerRunId: string | null = null;
  let posts;

  if (postIds.length) {
    posts = await prisma.post.findMany({
      where: { id: { in: postIds } },
      include: {
        categories: {
          include: { category: true },
          orderBy: { category: { sortOrder: "asc" } },
        },
      },
    });
  } else if (autoCollectBeforeCreate) {
    const triggerRun = await createManualScrapeTestRun();
    triggerRunId = triggerRun.id;

    const attempts = 8;
    const waitMs = 10000;
    let candidates: any[] = [];
    let curated: any[] = [];

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      if (attempt > 1) {
        await sleep(waitMs);
      }
      candidates = await loadCandidateNewsPosts(editionDate);
      curated = buildAutoCuratedEditionPosts(candidates);
      if (curated.length >= DAILY_NEWS_MIN_ITEMS) {
        break;
      }
    }

    posts = candidates;

    if (curated.length >= DAILY_NEWS_MIN_ITEMS) {
      const sourceSnapshotJson = buildEditionSnapshots(curated as any);

      let item: any;
      try {
        item = await dailyNewsEdition.create({
          data: {
            editionDate,
            timezone,
            title: title || buildEditionTitle(editionDate),
            description:
              description || "Edicao automatica criada apos disparo da coleta das fontes.",
            targetDurationSec,
            sourceSnapshotJson,
            items: {
              create: buildEditionItems(curated as any),
            },
          },
          include: {
            items: {
              orderBy: { position: "asc" },
            },
            assets: true,
            codeVideoProject: true,
          },
        });
      } catch (error) {
        if (isDailyNewsSchemaMissing(error)) {
          return dailyNewsUnavailableResponse(
            "A criacao da edicao foi bloqueada porque a migration do modulo ainda nao foi aplicada.",
          );
        }
        throw error;
      }

      return NextResponse.json(
        {
          item,
          triggerRunId,
          candidateCount: candidates.length,
          selectedCount: curated.length,
        },
        { status: 201 },
      );
    }
  } else {
    posts = await loadCandidateNewsPosts(editionDate);
  }

  if (postIds.length && posts.length !== postIds.length) {
    return NextResponse.json(
      { error: "Uma ou mais noticias selecionadas nao foram encontradas." },
      { status: 400 },
    );
  }

  const orderedPosts = postIds.length
    ? postIds
        .map((id) => posts.find((post) => post.id === id))
        .filter(Boolean)
    : buildAutoCuratedEditionPosts(posts);

  if (orderedPosts.length < DAILY_NEWS_MIN_ITEMS) {
    return NextResponse.json(
      {
        error:
          "Nao ha noticias reais suficientes na base para montar a edicao automatica. Rode a coleta das fontes ou publique mais noticias. Minimo de 5 noticias com sourceUrl.",
        triggerRunId,
        candidateCount: posts.length,
        selectedCount: orderedPosts.length,
        requiredCount: DAILY_NEWS_MIN_ITEMS,
      },
      { status: 409 },
    );
  }

  const sourceSnapshotJson = buildEditionSnapshots(orderedPosts as any);

  let item: any;
  try {
    item = await dailyNewsEdition.create({
      data: {
        editionDate,
        timezone,
        title: title || buildEditionTitle(editionDate),
        description: description || null,
        targetDurationSec,
        sourceSnapshotJson,
        items: {
          create: buildEditionItems(orderedPosts as any),
        },
      },
      include: {
        items: {
          orderBy: { position: "asc" },
        },
        assets: true,
        codeVideoProject: true,
      },
    });
  } catch (error) {
    if (isDailyNewsSchemaMissing(error)) {
      return dailyNewsUnavailableResponse(
        "A criacao da edicao foi bloqueada porque a migration do modulo ainda nao foi aplicada.",
      );
    }
    throw error;
  }

  return NextResponse.json({ item, triggerRunId }, { status: 201 });
}
