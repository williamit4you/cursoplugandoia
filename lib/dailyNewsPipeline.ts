import "server-only";

import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  buildEditionItems,
  buildEditionSnapshots,
  buildAutoCuratedEditionPosts,
  DAILY_NEWS_MAX_ITEMS,
  DAILY_NEWS_MIN_ITEMS,
  loadCandidateNewsPosts,
} from "@/lib/dailyNewsCuration";
import {
  buildEditionTitle,
  DAILY_NEWS_TIMEZONE,
  normalizeEditionDate,
  sourceNameFromUrl,
} from "@/lib/dailyNewsEdition";
import { searchPexelsMedia } from "@/lib/pexels";
import { ensureNewsSocialPostsForProject } from "@/lib/newsSocialQueue";
import { logCodeVideoPipelineEvent, upsertCodeVideoPipelineStep } from "@/lib/video-code/logger";
import { POST as renderVideoCodePost } from "@/app/api/video-code/render/route";

const OPENAI_MODEL =
  process.env.DAILY_NEWS_MODEL ||
  process.env.LONG_FORM_MARKETING_MODEL ||
  "gpt-4o-mini";

type EditionWithItems = any;

function normalize(value: unknown) {
  return String(value || "").trim();
}

function safeJsonParse(text: string | null | undefined) {
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

function makeJsonRequest(baseUrl: string, pathname: string, body: unknown) {
  return new NextRequest(new URL(pathname, baseUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function readRouteResponse(res: Response) {
  const data = await res.json().catch(() => ({}));
  return {
    ok: res.ok,
    status: res.status,
    data,
    error: (data as any)?.error || `HTTP ${res.status}`,
  };
}

function editionDateLabel(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: DAILY_NEWS_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function nowSpDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: DAILY_NEWS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return normalizeEditionDate(parts);
}

function clip(text: string, max: number) {
  const clean = normalize(text).replace(/\s+/g, " ");
  if (clean.length <= max) return clean;
  return `${clean.slice(0, Math.max(0, max - 3)).trim()}...`;
}

async function callOpenAiJson(system: string, user: string) {
  const key = String(process.env.OPENAI_API_KEY || "").trim();
  if (!key) throw new Error("OPENAI_API_KEY nao configurada.");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || "Falha ao consultar OpenAI.");
  }

  const content = String(data?.choices?.[0]?.message?.content || "{}");
  return JSON.parse(content);
}

async function loadEdition(editionId: string) {
  return prisma.dailyNewsEdition.findUnique({
    where: { id: editionId },
    include: {
      codeVideoProject: {
        include: {
          socialPosts: {
            orderBy: [{ postedAt: "desc" }, { createdAt: "desc" }],
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
              title: true,
              summary: true,
              content: true,
              sourceUrl: true,
              coverImage: true,
              publishedAt: true,
            },
          },
          assets: {
            orderBy: [{ createdAt: "asc" }],
          },
        },
      },
      assets: {
        orderBy: [{ createdAt: "asc" }],
      },
    },
  }) as Promise<EditionWithItems | null>;
}

export async function ensureAutomatedEditionForDate(inputDate?: Date) {
  const editionDate = inputDate
    ? normalizeEditionDate(inputDate.toISOString().slice(0, 10))
    : nowSpDate();
  const timezone = DAILY_NEWS_TIMEZONE;

  const existing = await prisma.dailyNewsEdition.findUnique({
    where: {
      editionDate_timezone: {
        editionDate,
        timezone,
      },
    },
    include: {
      items: true,
      codeVideoProject: true,
    },
  });
  if (existing) return existing;

  const candidates = await loadCandidateNewsPosts(editionDate);
  const selected = buildAutoCuratedEditionPosts(candidates).slice(
    0,
    DAILY_NEWS_MAX_ITEMS,
  );
  if (selected.length < DAILY_NEWS_MIN_ITEMS) {
    return null;
  }

  const created = await prisma.dailyNewsEdition.create({
    data: {
      editionDate,
      timezone,
      status: "CURATING",
      title: buildEditionTitle(editionDate),
      description: `Edicao automatica do resumo diario com foco em YouTube horizontal (${editionDateLabel(editionDate)}).`,
      targetDurationSec: 240,
      sourceSnapshotJson: buildEditionSnapshots(selected as any),
      items: {
        create: buildEditionItems(selected as any),
      },
    },
    include: {
      items: true,
      codeVideoProject: true,
    },
  });

  return created;
}

function cleanTextFromHtml(html: string) {
  return String(html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function fallbackItemPlan(item: any) {
  const title = clip(
    item.titleSnapshot || item.post?.title || "Noticia do dia",
    80,
  );
  const summary = clip(
    item.post?.summary || cleanTextFromHtml(item.post?.content || ""),
    240,
  );
  const category = normalize(item.category || "Noticias");
  const sourceName = normalize(
    item.sourceName || sourceNameFromUrl(item.sourceUrl) || "fonte externa",
  );
  return {
    postId: item.postId,
    shortTitle: title,
    narrationText: `${title}. ${summary || `Atualizacao em ${category.toLowerCase()}.`} A noticia foi publicada por ${sourceName}.`,
    pexelsQueries: [
      category || "technology news",
      title.split(":")[0] || title,
    ].filter(Boolean),
  };
}

function allocateDurations(totalSeconds: number, items: any[]) {
  const introSec = 12;
  const outroSec = 10;
  const remaining = Math.max(items.length * 24, totalSeconds - introSec - outroSec);
  const perItem = Math.max(24, Math.floor(remaining / Math.max(1, items.length)));
  return {
    introSec,
    outroSec,
    perItem,
  };
}

async function buildEditionEditorialPlan(edition: EditionWithItems) {
  const itemsForPrompt = edition.items.map((item: any, index: number) => ({
    position: index + 1,
    postId: item.postId,
    title: item.titleSnapshot,
    category: item.category || null,
    sourceName: item.sourceName || sourceNameFromUrl(item.sourceUrl) || null,
    sourceUrl: item.sourceUrl || null,
    summary: clip(item.post?.summary || cleanTextFromHtml(item.post?.content || ""), 420),
    publishedAt: item.publishedAtSnapshot
      ? new Date(item.publishedAtSnapshot).toISOString()
      : null,
  }));

  const totalTarget = Math.max(
    180,
    Math.min(300, Number(edition.targetDurationSec || 240)),
  );
  const system = [
    "Voce e editor-chefe e roteirista de um boletim diario de noticias para YouTube em portugues do Brasil.",
    "Responda somente JSON valido.",
    "Objetivo: criar um video horizontal de 3 a 5 minutos, com narracao natural e SEO forte para YouTube.",
    "A narrativa deve ser clara, profissional, objetiva e sem clickbait barato no corpo do texto.",
    "Campos obrigatorios: editionTitle, editionDescription, youtubeDescription, youtubeTags, introText, outroText, items.",
    "items deve ser uma lista com todos os postId recebidos, sem excluir nenhum.",
    "Cada item deve ter: postId, shortTitle, narrationText, pexelsQueries.",
    "narrationText de cada item deve ser texto falado puro, sem colchetes, sem marcacoes de cena e sem listas.",
    "youtubeTags deve ser um array de 8 a 15 tags curtas em portugues.",
    "youtubeDescription deve terminar com uma secao Fontes: listando titulo e URL das noticias quando houver URL.",
  ].join("\n");

  const user = [
    `DATA DA EDICAO: ${editionDateLabel(new Date(edition.editionDate))}`,
    `TITULO ATUAL: ${edition.title || buildEditionTitle(new Date(edition.editionDate))}`,
    `DURACAO ALVO EM SEGUNDOS: ${totalTarget}`,
    "",
    "Noticias selecionadas para o boletim:",
    JSON.stringify(itemsForPrompt, null, 2),
    "",
    "Regras adicionais:",
    "- Use todas as noticias recebidas.",
    "- Priorize contexto e impacto para o publico geral.",
    "- Se faltar fonte em alguma noticia, nao invente URL.",
    "- As queries Pexels devem ser em ingles e focadas em cenas ilustrativas horizontais.",
    "- O texto total falado deve caber aproximadamente na duracao alvo.",
  ].join("\n");

  try {
    const plan = await callOpenAiJson(system, user);
    const itemMap = new Map(
      (Array.isArray(plan?.items) ? plan.items : []).map((item: any) => [
        String(item?.postId || ""),
        item,
      ]),
    );

    const normalizedItems = edition.items.map((item: any) => {
      const planned: any = itemMap.get(String(item.postId)) || fallbackItemPlan(item);
      return {
        postId: item.postId,
        shortTitle: clip(planned.shortTitle || item.titleSnapshot, 90),
        narrationText:
          normalize(planned.narrationText) || fallbackItemPlan(item).narrationText,
        pexelsQueries: Array.isArray(planned.pexelsQueries)
          ? planned.pexelsQueries
              .map((query: unknown) => clip(String(query || ""), 70))
              .filter(Boolean)
              .slice(0, 3)
          : fallbackItemPlan(item).pexelsQueries,
      };
    });

    return {
      editionTitle: clip(
        String(
          plan?.editionTitle ||
            edition.title ||
            buildEditionTitle(new Date(edition.editionDate)),
        ),
        120,
      ),
      editionDescription: clip(
        String(
          plan?.editionDescription ||
            edition.description ||
            "Resumo diario das principais noticias do dia.",
        ),
        400,
      ),
      youtubeDescription: clip(String(plan?.youtubeDescription || ""), 4500),
      youtubeTags: Array.isArray(plan?.youtubeTags)
        ? plan.youtubeTags
            .map((tag: unknown) => clip(String(tag || ""), 40))
            .filter(Boolean)
            .slice(0, 15)
        : [],
      introText:
        normalize(plan?.introText) ||
        `Estas sao as principais noticias de ${editionDateLabel(new Date(edition.editionDate))}.`,
      outroText:
        normalize(plan?.outroText) ||
        "Se este resumo ajudou voce a se atualizar, acompanhe o canal para receber os proximos boletins.",
      items: normalizedItems,
    };
  } catch {
    return {
      editionTitle:
        edition.title || buildEditionTitle(new Date(edition.editionDate)),
      editionDescription:
        edition.description || "Resumo diario das principais noticias do dia.",
      youtubeDescription: edition.items
        .map(
          (item: any) =>
            `${item.titleSnapshot}${item.sourceUrl ? `\nFonte: ${item.sourceUrl}` : ""}`,
        )
        .join("\n\n"),
      youtubeTags: [
        "noticias",
        "resumo do dia",
        "atualidades",
        "youtube noticias",
      ],
      introText: `Estas sao as principais noticias de ${editionDateLabel(new Date(edition.editionDate))}.`,
      outroText: "Acompanhe o canal para receber os proximos boletins diarios.",
      items: edition.items.map((item: any) => fallbackItemPlan(item)),
    };
  }
}

async function rebuildEditionAssets(edition: EditionWithItems, plan: any) {
  const createdAssets: any[] = [];
  await prisma.dailyNewsAsset.deleteMany({
    where: { editionId: edition.id },
  });

  for (const item of edition.items) {
    const planned = plan.items.find(
      (entry: any) => String(entry.postId) === String(item.postId),
    );
    const queries = Array.isArray(planned?.pexelsQueries)
      ? planned.pexelsQueries.slice(0, 2)
      : [];
    const uniqueUrls = new Set<string>();

    for (const query of queries) {
      const assets = await searchPexelsMedia(
        String(query || "").trim() || "breaking news",
        2,
        "landscape",
      );
      for (const asset of assets) {
        if (!asset?.url || uniqueUrls.has(asset.url)) continue;
        uniqueUrls.add(asset.url);
        const created = await prisma.dailyNewsAsset.create({
          data: {
            editionId: edition.id,
            editionItemId: item.id,
            assetType: "PEXELS_VIDEO",
            source: "PEXELS",
            query: String(query),
            originalUrl: asset.url,
            stableUrl: asset.url,
            credit: asset.thumbnail || null,
            technicalJson: {
              providerId: asset.id,
              thumbnail: asset.thumbnail,
              orientation: "landscape",
            },
            status: "READY",
          },
        });
        createdAssets.push(created);
      }
    }
  }

  return createdAssets;
}

function buildLandscapeVideoSpec(edition: EditionWithItems, plan: any, assets: any[]) {
  const assetByItemId = new Map<string, any[]>();
  for (const asset of assets) {
    const key = String(asset.editionItemId || "");
    if (!assetByItemId.has(key)) assetByItemId.set(key, []);
    assetByItemId.get(key)!.push(asset);
  }

  const timing = allocateDurations(
    Number(edition.targetDurationSec || 240),
    edition.items,
  );
  const scenes: any[] = [];

  scenes.push({
    id: "opening-title",
    sceneTemplate: "TitleScene",
    durationSec: timing.introSec,
    props: {
      title: plan.editionTitle,
      subtitle: `Resumo do dia • ${editionDateLabel(new Date(edition.editionDate))}`,
      backgroundColor: "#0f172a",
      textColor: "#f8fafc",
      accentColor: "#38bdf8",
      fontFamily: "Arial Black, Arial, sans-serif",
    },
  });

  for (const item of edition.items) {
    const planned =
      plan.items.find(
        (entry: any) => String(entry.postId) === String(item.postId),
      ) || fallbackItemPlan(item);
    const itemAssets = assetByItemId.get(String(item.id)) || [];
    const firstAsset = itemAssets[0];
    const secondAsset = itemAssets[1] || firstAsset;
    const sceneDuration = Math.max(24, timing.perItem);
    const bulletDuration = Math.max(8, Math.round(sceneDuration * 0.28));
    const mediaDuration = Math.max(
      7,
      Math.round((sceneDuration - bulletDuration) / 2),
    );
    const sourceLabel = normalize(
      item.sourceName || sourceNameFromUrl(item.sourceUrl) || "Fonte externa",
    );
    const summaryBullet = clip(
      item.post?.summary || cleanTextFromHtml(item.post?.content || ""),
      120,
    );

    if (firstAsset?.stableUrl || firstAsset?.originalUrl) {
      scenes.push({
        id: `item-${item.position}-media-a`,
        sceneTemplate: "RetentionScene",
        durationSec: mediaDuration,
        props: {
          url: firstAsset.stableUrl || firstAsset.originalUrl,
          title: clip(planned.shortTitle || item.titleSnapshot, 54),
          backgroundColor: "#020617",
          textColor: "#ffffff",
          accentColor: "#22c55e",
          fontFamily: "Arial Black, Arial, sans-serif",
        },
      });
    }

    scenes.push({
      id: `item-${item.position}-bullets`,
      sceneTemplate: "BulletListScene",
      durationSec: bulletDuration,
      props: {
        title: clip(planned.shortTitle || item.titleSnapshot, 54),
        items: [
          clip(summaryBullet || item.titleSnapshot, 92),
          clip(`Fonte: ${sourceLabel}`, 92),
          clip(`Categoria: ${normalize(item.category || "Atualidades")}`, 92),
        ],
        backgroundColor: "#111827",
        textColor: "#f9fafb",
        accentColor: "#38bdf8",
        fontFamily: "Arial Black, Arial, sans-serif",
      },
    });

    if (secondAsset?.stableUrl || secondAsset?.originalUrl) {
      scenes.push({
        id: `item-${item.position}-media-b`,
        sceneTemplate: "RetentionScene",
        durationSec: mediaDuration,
        props: {
          url: secondAsset.stableUrl || secondAsset.originalUrl,
          title: clip(sourceLabel, 54),
          backgroundColor: "#082f49",
          textColor: "#ecfeff",
          accentColor: "#67e8f9",
          fontFamily: "Arial Black, Arial, sans-serif",
        },
      });
    }
  }

  scenes.push({
    id: "closing-title",
    sceneTemplate: "TitleScene",
    durationSec: timing.outroSec,
    props: {
      title: "Volte amanha para o novo resumo",
      subtitle: "Noticias atualizadas todos os dias no canal",
      backgroundColor: "#172554",
      textColor: "#eff6ff",
      accentColor: "#60a5fa",
      fontFamily: "Arial Black, Arial, sans-serif",
    },
  });

  const narrationParts = [
    plan.introText,
    ...plan.items.map((item: any) => item.narrationText),
    plan.outroText,
  ].filter(Boolean);

  return {
    narrationText: narrationParts.join("\n\n"),
    videoSpec: {
      version: 1,
      meta: {
        aspectRatio: "16:9",
        fps: 30,
        theme: {
          id: "daily-news-blue",
          name: "Daily News Blue",
          backgroundColor: "#0f172a",
          textColor: "#f8fafc",
          accentColor: "#38bdf8",
          secondaryColor: "#172554",
          surfaceColor: "#1e293b",
          fontFamily: "Arial Black, Arial, sans-serif",
        },
      },
      content: {
        title: plan.editionTitle,
        description: plan.editionDescription,
        narrationText: narrationParts.join("\n\n"),
      },
      scenes,
    },
  };
}

async function createOrUpdateEditionProject(
  edition: EditionWithItems,
  plan: any,
  assets: any[],
) {
  const { narrationText, videoSpec } = buildLandscapeVideoSpec(
    edition,
    plan,
    assets,
  );
  const firstAsset = assets.find((asset) => asset.stableUrl || asset.originalUrl);
  const metadata = {
    dailyNews: {
      editionId: edition.id,
      editionDate: new Date(edition.editionDate).toISOString(),
      timezone: edition.timezone,
      youtubeDescription: plan.youtubeDescription,
      youtubeTags: plan.youtubeTags,
      sourcePostIds: edition.items.map((item: any) => item.postId),
    },
    newsVariant: "BROLL",
    newsAutomation: {
      enabled: true,
      autoScheduleSocial: true,
      platforms: ["YOUTUBE"],
      source: "daily_news_edition",
    },
  };

  const baseData: any = {
    status: "READY",
    projectType: "LONG_FORM_MARKETING",
    ideaPrompt: plan.editionTitle,
    aspectRatio: "LANDSCAPE_16_9",
    videoDurationSec: Math.max(
      180,
      Math.min(300, Number(edition.targetDurationSec || 240)),
    ),
    fps: 30,
    ttsVoice: "pt-BR-AntonioNeural",
    ttsSpeed: "+5%",
    useExternalMedia: true,
    title: plan.editionTitle,
    description: plan.editionDescription,
    narrationText,
    thumbUrl: firstAsset?.technicalJson?.thumbnail || edition.thumbnailUrl || null,
    metadataJson: JSON.stringify(metadata),
    videoSpecJson: JSON.stringify(videoSpec),
    errorMessage: null,
  };

  if (edition.codeVideoProjectId) {
    return prisma.codeVideoProject.update({
      where: { id: edition.codeVideoProjectId },
      data: {
        ...baseData,
        videoUrl: null,
        captionsUrl: null,
        audioUrl: null,
        renderProgress: 0,
      },
    });
  }

  const created = await prisma.codeVideoProject.create({
    data: baseData,
  });

  await prisma.dailyNewsEdition.update({
    where: { id: edition.id },
    data: { codeVideoProjectId: created.id },
  });

  return created;
}

export async function syncDailyNewsEditionState(editionId: string) {
  const edition = await loadEdition(editionId);
  if (!edition) return null;

  const project = edition.codeVideoProject;
  const socialPosts = project?.socialPosts || [];
  const youtubePosted = socialPosts.find(
    (post: any) => post.platform === "YOUTUBE" && post.youtubePostUrl,
  );
  const youtubeScheduled = socialPosts.find(
    (post: any) => post.platform === "YOUTUBE",
  );
  const metadata = safeJsonParse(project?.metadataJson);
  const actualDurationSec = Number(metadata?.actualDurationSec || 0);

  let status = edition.status;
  if (youtubePosted?.youtubePostUrl) status = "PUBLISHED";
  else if (
    youtubeScheduled?.status === "SCHEDULED" ||
    youtubeScheduled?.status === "POSTED"
  )
    status = "SCHEDULED";
  else if (project?.videoUrl) status = "QA";
  else if (project?.status === "RENDERING") status = "RENDERING";
  else if (edition.scriptText) status = "PLANNING_VISUALS";

  const updated = await prisma.dailyNewsEdition.update({
    where: { id: editionId },
    data: {
      status,
      title: edition.title || project?.title || null,
      description: edition.description || project?.description || null,
      finalVideoUrl: project?.videoUrl || edition.finalVideoUrl || null,
      previewVideoUrl: edition.previewVideoUrl || project?.videoUrl || null,
      captionsUrl: project?.captionsUrl || edition.captionsUrl || null,
      thumbnailUrl: project?.thumbUrl || edition.thumbnailUrl || null,
      measuredDurationSec:
        Number.isFinite(actualDurationSec) && actualDurationSec > 0
          ? actualDurationSec
          : edition.measuredDurationSec,
      scheduledAt: youtubeScheduled?.scheduledTo || edition.scheduledAt,
      publishedAt: youtubePosted?.youtubePostedAt || edition.publishedAt,
      youtubePostUrl: youtubePosted?.youtubePostUrl || edition.youtubePostUrl || null,
      errorMessage: project?.errorMessage || edition.errorMessage || null,
    },
  });

  return updated;
}

export async function prepareDailyNewsEdition(editionId: string) {
  const edition = await loadEdition(editionId);
  if (!edition) throw new Error("Edicao nao encontrada.");
  if (edition.items.length < DAILY_NEWS_MIN_ITEMS) {
    throw new Error("A edicao precisa de pelo menos 5 noticias para gerar o video.");
  }

  await prisma.dailyNewsEdition.update({
    where: { id: edition.id },
    data: {
      status: "SCRIPTING",
      errorMessage: null,
    },
  });

  const plan = await buildEditionEditorialPlan(edition);

  await prisma.dailyNewsEdition.update({
    where: { id: edition.id },
    data: {
      title: plan.editionTitle,
      description: plan.editionDescription,
      scriptText: [
        plan.introText,
        ...plan.items.map((item: any) => item.narrationText),
        plan.outroText,
      ].join("\n\n"),
      assetPlanJson: {
        youtubeDescription: plan.youtubeDescription,
        youtubeTags: plan.youtubeTags,
        items: plan.items,
      },
      status: "PLANNING_VISUALS",
    },
  });

  for (const item of edition.items) {
    const planned = plan.items.find(
      (entry: any) => String(entry.postId) === String(item.postId),
    );
    await prisma.dailyNewsEditionItem.update({
      where: { id: item.id },
      data: {
        narrationText: planned?.narrationText || null,
        targetDurationSec: Math.max(
          24,
          Math.floor(
            Number(edition.targetDurationSec || 240) /
              Math.max(1, edition.items.length),
          ),
        ),
      },
    });
  }

  const freshEdition = await loadEdition(editionId);
  const assets = await rebuildEditionAssets(freshEdition, plan);
  const project = await createOrUpdateEditionProject(freshEdition, plan, assets);

  await logCodeVideoPipelineEvent({
    projectId: project.id,
    stepName: "DAILY_NEWS_PREP",
    message:
      "Projeto do resumo diario preparado automaticamente com roteiro, assets e videoSpec.",
    metadata: { editionId, items: freshEdition.items.length, assets: assets.length },
  }).catch(() => null);

  await upsertCodeVideoPipelineStep({
    projectId: project.id,
    stepName: "DAILY_NEWS_PREP",
    status: "SUCCESS",
    attempt: 1,
    startedAt: new Date(),
    finishedAt: new Date(),
    responsePayload: {
      editionId,
      itemCount: freshEdition.items.length,
      assetCount: assets.length,
    },
  }).catch(() => null);

  return loadEdition(editionId);
}

export async function renderDailyNewsEdition(editionId: string, baseUrl: string) {
  const edition = await loadEdition(editionId);
  if (!edition?.codeVideoProjectId) {
    throw new Error("Projeto de video ainda nao foi preparado.");
  }

  await prisma.dailyNewsEdition.update({
    where: { id: edition.id },
    data: { status: "RENDERING", errorMessage: null },
  });

  const renderReq = makeJsonRequest(baseUrl, "/api/video-code/render", {
    projectId: edition.codeVideoProjectId,
  });
  const renderResult = await readRouteResponse(await renderVideoCodePost(renderReq));
  if (!renderResult.ok) {
    await prisma.dailyNewsEdition.update({
      where: { id: edition.id },
      data: {
        status: "FAILED",
        errorMessage: renderResult.error || "Falha ao renderizar resumo diario.",
      },
    });
    throw new Error(renderResult.error || "Falha ao renderizar resumo diario.");
  }

  await syncDailyNewsEditionState(editionId);
  const refreshed = await loadEdition(editionId);

  if (refreshed?.codeVideoProject) {
    await ensureNewsSocialPostsForProject({
      id: refreshed.codeVideoProject.id,
      title: refreshed.codeVideoProject.title,
      description: refreshed.codeVideoProject.description,
      metadataJson: refreshed.codeVideoProject.metadataJson,
      videoUrl: refreshed.codeVideoProject.videoUrl,
    }).catch(() => null);
  }

  return loadEdition(editionId);
}

export async function runDailyNewsEditionPipeline(params: {
  editionId: string;
  baseUrl: string;
}) {
  const prepared = await prepareDailyNewsEdition(params.editionId);
  if (!prepared) throw new Error("Falha ao preparar a edicao.");
  await renderDailyNewsEdition(params.editionId, params.baseUrl);
  return syncDailyNewsEditionState(params.editionId);
}

export async function runTodayDailyNewsAutomation(baseUrl: string) {
  const edition = await ensureAutomatedEditionForDate();
  if (!edition) {
    return {
      ok: true,
      skipped: true,
      reason: "insufficient_news_today",
    };
  }

  const syncedBefore = await syncDailyNewsEditionState(edition.id);
  if (syncedBefore?.youtubePostUrl) {
    return {
      ok: true,
      skipped: true,
      reason: "already_published",
      editionId: edition.id,
      youtubePostUrl: syncedBefore.youtubePostUrl,
    };
  }

  const current = await loadEdition(edition.id);
  if (current?.finalVideoUrl && current?.codeVideoProjectId) {
    return {
      ok: true,
      skipped: true,
      reason: "already_rendered_waiting_publish",
      editionId: current.id,
      codeVideoProjectId: current.codeVideoProjectId,
    };
  }

  const result = await runDailyNewsEditionPipeline({
    editionId: edition.id,
    baseUrl,
  });

  return {
    ok: true,
    editionId: result?.id,
    codeVideoProjectId: result?.codeVideoProjectId || null,
    status: result?.status,
    finalVideoUrl: result?.finalVideoUrl || null,
  };
}
