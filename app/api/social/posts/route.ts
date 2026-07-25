import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { requireAdminOrCronSecret } from "@/lib/shopee-pipeline/apiAuth";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const dynamic = "force-dynamic";

function parseIntSafe(v: string | null, fallback: number) {
  if (!v) return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeSortBy(v: string | null) {
  const allowed = new Set([
    "createdAt",
    "updatedAt",
    "postedAt",
    "scheduledTo",
    "views",
    "status",
    "platform",
    "postType",
  ]);
  if (!v) return "createdAt";
  return allowed.has(v) ? v : "createdAt";
}

function normalizeSortDir(v: string | null) {
  return v === "asc" ? "asc" : "desc";
}

function parseProjectMetadata(text: string | null | undefined) {
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

const STATUS_GROUPS: Record<string, string[]> = {
  PUBLISHED: ["PUBLISHED", "POSTED"],
  PROCESSING: ["PROCESSING", "PROCESSING_MEDIA", "PUBLISHING", "AWAITING_API"],
  FAILED: ["FAILED", "ERROR", "NEEDS_ATTENTION"],
};

function statusMatches(value: string | null | undefined, expected: string | null | undefined) {
  const status = String(value || "").toUpperCase();
  const filter = String(expected || "").toUpperCase();
  return !filter || filter === "ALL" || (STATUS_GROUPS[filter] || [filter]).includes(status);
}

function dateFor(item: any, field: string) {
  if (field === "scheduled") return item.scheduledTo;
  if (field === "published") return item.postedAt;
  if (field === "created") return item.createdAt;
  return statusMatches(item.status, "PUBLISHED") ? (item.postedAt || item.createdAt) : (item.scheduledTo || item.createdAt);
}

function dateRange(searchParams: URLSearchParams) {
  const period = searchParams.get("period") || "all";
  const now = new Date();
  const toDay = (date: Date) => date.toISOString().slice(0, 10);
  if (period === "today") return { from: toDay(now), to: toDay(now) };
  if (period === "week") {
    const from = new Date(now);
    from.setDate(now.getDate() - 7);
    return { from: toDay(from), to: toDay(now) };
  }
  if (period === "month") {
    const from = new Date(now);
    from.setMonth(now.getMonth() - 1);
    return { from: toDay(from), to: toDay(now) };
  }
  return { from: searchParams.get("dateFrom") || "", to: searchParams.get("dateTo") || "" };
}

function inDateRange(value: Date | null | undefined, range: { from: string; to: string }) {
  if (!range.from && !range.to) return true;
  if (!value) return false;
  const time = new Date(value).getTime();
  // Dates entered in the admin are calendar dates in São Paulo, not UTC dates.
  const start = range.from ? new Date(`${range.from}T00:00:00-03:00`).getTime() : Number.NEGATIVE_INFINITY;
  const end = range.to ? new Date(`${range.to}T23:59:59.999-03:00`).getTime() : Number.POSITIVE_INFINITY;
  return time >= start && time <= end;
}

function detectOrigin(item: any, shopeeSocialPostIds: Set<string>) {
  if (shopeeSocialPostIds.has(item.id)) return "SHOPEE";
  const project = item.codeVideoProject || null;
  const metadata = parseProjectMetadata(project?.metadataJson);
  const log = String(item.log || "").toLowerCase();
  const videoUrl = String(item.videoUrl || "").toLowerCase();

  if (
    item.postId ||
    item.newsVariant ||
    project?.postId ||
    project?.newsVariant ||
    metadata?.newsAutomation ||
    metadata?.postId
  ) {
    return "NEWS";
  }

  if (
    project?.projectType === "PRODUCT_AD" ||
    metadata?.shopee ||
    metadata?.source === "SHOPEE_PIPELINE" ||
    log.includes("shopee") ||
    videoUrl.includes("/shopee/") ||
    videoUrl.includes("shopee/")
  ) {
    return "SHOPEE";
  }

  return "OTHER";
}

// Retorna posts (ou um único post por ?id=xxx)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const post = await prisma.socialPost.findUnique({ where: { id } });
      return NextResponse.json(post || { error: "Not found" });
    }

    const page = Math.max(1, parseIntSafe(searchParams.get("page"), 1));
    const pageSize = Math.min(
      500,
      Math.max(5, parseIntSafe(searchParams.get("pageSize"), 20))
    );

    const sortBy = normalizeSortBy(searchParams.get("sortBy"));
    const sortDir = normalizeSortDir(searchParams.get("sortDir"));

    const status = searchParams.get("status") || undefined;
    const platform = searchParams.get("platform") || undefined;
    const postType = searchParams.get("postType") || undefined;
    const q = (searchParams.get("q") || "").trim();

    const platformStatus = searchParams.get("platformStatus") || "";
    const origin = searchParams.get("origin") || "";
    const account = (searchParams.get("account") || "").trim().toLowerCase();
    const media = searchParams.get("media") || "";
    const errors = searchParams.get("errors") || "";
    const dateField = searchParams.get("dateField") || "relevant";
    const range = dateRange(searchParams);

    const where: any = {};
    if (platform && platform !== "ALL") where.platform = platform;
    if (postType && postType !== "ALL") where.postType = postType;
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { summary: { contains: q, mode: "insensitive" } },
        { postUrl: { contains: q, mode: "insensitive" } },
        { videoUrl: { contains: q, mode: "insensitive" } },
        { log: { contains: q, mode: "insensitive" } },
        { id: { equals: q } },
      ];
    }

    // Filters that depend on inferred origin and lifecycle date must run before
    // pagination. This deliberately trades a small admin-only read for truthful
    // totals instead of silently filtering only the current page.
    const rawItems = await prisma.socialPost.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        include: {
          codeVideoProject: {
            select: {
              id: true,
              projectType: true,
              postId: true,
              newsVariant: true,
              metadataJson: true,
            },
          },
          post: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      });

    const rawIds = rawItems.map((item) => item.id);
    const storyPublications = rawIds.length
      ? await prisma.storyPublication.findMany({
          where: {
            OR: rawIds.map((id) => ({
              responsePayload: {
                path: ["socialPostId"],
                equals: id,
              },
            })),
          },
          select: {
            responsePayload: true,
            storyAd: {
              select: {
                coletaId: true,
              },
            },
          },
        })
      : [];

    const shopeeSocialPostIds = new Set(
      storyPublications
        .map((publication) => String((publication.responsePayload as any)?.socialPostId || "").trim())
        .filter(Boolean)
    );

    const enrichedItems = rawItems.map((item) => ({
      ...item,
      origin: detectOrigin(item, shopeeSocialPostIds),
      thumbnailUrl: item.thumbUrl,
      imageUrl: item.thumbUrl,
    }));

    const matches = (item: any, includeStatus = true) => {
      const itemOrigin = String(item.origin || "OTHER").toUpperCase();
      const textAccount = String(item.accountName || item.integrationAccountName || "").toLowerCase();
      const hasMedia = Boolean(item.videoUrl || item.thumbUrl);
      const hasError = Boolean(item.log || STATUS_GROUPS.FAILED.includes(String(item.status || "").toUpperCase()));
      return (!includeStatus || statusMatches(item.status, status))
        && statusMatches(item.status, platformStatus)
        && (!origin || itemOrigin === origin)
        && (!account || textAccount.includes(account))
        && (!media || (media === "with" ? hasMedia : !hasMedia))
        && (!errors || (errors === "with" ? hasError : !hasError))
        && inDateRange(dateFor(item, dateField), range);
    };

    const contextualItems = enrichedItems.filter((item) => matches(item, false));
    const filteredItems = contextualItems.filter((item) => matches(item, true));
    const sortValue = (item: any) => sortBy === "status"
      ? String(item.status || "")
      : new Date(item[sortBy] || item.createdAt || 0).getTime();
    filteredItems.sort((a, b) => {
      const left = sortValue(a);
      const right = sortValue(b);
      return left > right ? (sortDir === "asc" ? 1 : -1) : left < right ? (sortDir === "asc" ? -1 : 1) : 0;
    });
    const total = filteredItems.length;
    const items = filteredItems.slice((page - 1) * pageSize, page * pageSize);
    const stats = {
      scheduled: contextualItems.filter((item) => statusMatches(item.status, "SCHEDULED")).length,
      queue: contextualItems.filter((item) => ["QUEUED", "DRAFT"].includes(String(item.status || "").toUpperCase())).length,
      processing: contextualItems.filter((item) => statusMatches(item.status, "PROCESSING")).length,
      failed: contextualItems.filter((item) => statusMatches(item.status, "FAILED")).length,
      published: contextualItems.filter((item) => statusMatches(item.status, "PUBLISHED")).length,
    };

    return NextResponse.json({ items, total, page, pageSize, sortBy, sortDir, stats });
  } catch (error) {
    console.error("[api/social/posts GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminOrCronSecret(req);
    const body = await req.json().catch(() => ({}));

    const platform = String(body.platform || "META").trim().toUpperCase();
    const postType = String(body.postType || "REEL").trim().toUpperCase();
    const summary = String(body.summary || "").trim();
    const videoUrl = String(body.videoUrl || "").trim();
    const status = String(body.status || "SCHEDULED").trim().toUpperCase();
    const scheduledTo = body.scheduledTo ? new Date(String(body.scheduledTo)) : null;

    if (!videoUrl) return NextResponse.json({ error: "videoUrl is required" }, { status: 400 });
    if (!summary) return NextResponse.json({ error: "summary is required" }, { status: 400 });

    const created = await prisma.socialPost.create({
      data: {
        platform,
        postType,
        summary,
        videoUrl,
        status,
        scheduledTo,
      },
    });

    return NextResponse.json(created);
  } catch (error: any) {
    const status = error?.message === "Unauthorized" ? 401 : 500;
    console.error("[api/social/posts POST]", error);
    return NextResponse.json({ error: error?.message || "Failed to create social post" }, { status });
  }
}
