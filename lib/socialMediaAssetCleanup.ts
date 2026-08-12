import "server-only";

import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "@/lib/s3";

type DbClient = any;

type SocialPostRecord = {
  id: string;
  platform: string | null;
  status: string | null;
  log: string | null;
  videoUrl: string;
  postId?: string | null;
  codeVideoProjectId?: string | null;
  automationTaskId?: string | null;
  automationTaskRunId?: string | null;
  youtubePostedAt?: Date | null;
  youtubePostUrl?: string | null;
  tiktokPostedAt?: Date | null;
  tiktokPostUrl?: string | null;
};

const PUBLISH_PLATFORMS = new Set(["YOUTUBE", "TIKTOK"]);

function normalizeUrl(value: unknown) {
  return String(value || "").trim();
}

function timestamped(message: string) {
  return `[${new Date().toLocaleTimeString("pt-BR")}] ${message}`;
}

function getManagedMinioObjectKey(fileUrl: string) {
  const candidate = normalizeUrl(fileUrl);
  const publicBase = normalizeUrl(process.env.MINIO_PUBLIC_URL).replace(/\/+$/, "");

  if (!candidate || !publicBase) return null;
  if (!candidate.startsWith(`${publicBase}/`)) return null;

  const key = candidate.slice(publicBase.length + 1).split(/[?#]/, 1)[0];
  return key ? key.replace(/^\/+/, "") : null;
}

function isPublishedForPlatform(post: SocialPostRecord) {
  const platform = String(post.platform || "").toUpperCase();
  if (platform === "YOUTUBE") {
    return Boolean(post.youtubePostedAt || post.youtubePostUrl);
  }
  if (platform === "TIKTOK") {
    return Boolean(post.tiktokPostedAt || post.tiktokPostUrl);
  }
  return Boolean(post.status === "POSTED");
}

function buildGroupWhere(post: SocialPostRecord) {
  const or: Array<Record<string, string>> = [{ id: post.id }];
  const fields = [
    "codeVideoProjectId",
    "postId",
    "automationTaskId",
    "automationTaskRunId",
  ] as const;

  for (const field of fields) {
    const value = String(post[field] || "").trim();
    if (value) or.push({ [field]: value });
  }

  return {
    videoUrl: post.videoUrl,
    OR: or,
  };
}

async function loadCleanupGroup(db: DbClient, socialPostId: string) {
  const anchor = (await db.socialPost.findUnique({
    where: { id: socialPostId },
    select: {
      id: true,
      platform: true,
      status: true,
      log: true,
      videoUrl: true,
      postId: true,
      codeVideoProjectId: true,
      automationTaskId: true,
      automationTaskRunId: true,
      youtubePostedAt: true,
      youtubePostUrl: true,
      tiktokPostedAt: true,
      tiktokPostUrl: true,
    },
  })) as SocialPostRecord | null;

  if (!anchor) return null;

  const siblings = (await db.socialPost.findMany({
    where: buildGroupWhere(anchor),
    select: {
      id: true,
      platform: true,
      status: true,
      log: true,
      videoUrl: true,
      postId: true,
      codeVideoProjectId: true,
      automationTaskId: true,
      automationTaskRunId: true,
      youtubePostedAt: true,
      youtubePostUrl: true,
      tiktokPostedAt: true,
      tiktokPostUrl: true,
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  })) as SocialPostRecord[];

  return { anchor, siblings };
}

async function deleteManagedVideoByUrl(fileUrl: string) {
  const bucketName = process.env.MINIO_BUCKET_NAME || "uploads";
  const key = getManagedMinioObjectKey(fileUrl);

  if (!key) {
    return { deleted: false, skipped: true, reason: "external_or_unmanaged_url" as const, key: null };
  }

  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      }),
    );
    return { deleted: true, skipped: false, reason: null, key };
  } catch (error: any) {
    const name = String(error?.name || error?.Code || "");
    if (name === "NoSuchKey" || name === "NotFound") {
      return { deleted: false, skipped: true, reason: "already_missing" as const, key };
    }
    throw error;
  }
}

async function appendCleanupLogToPosts(db: DbClient, posts: SocialPostRecord[], message: string) {
  await Promise.all(
    posts.map((post) =>
      db.socialPost.update({
        where: { id: post.id },
        data: {
          log: post.log ? `${post.log}\n${timestamped(message)}` : timestamped(message),
        },
      }),
    ),
  );
}

async function nullVideoReferences(db: DbClient, posts: SocialPostRecord[], deletedUrl: string) {
  const socialPostIds = posts.map((post) => post.id);
  const projectIds = Array.from(
    new Set(
      posts
        .map((post) => String(post.codeVideoProjectId || "").trim())
        .filter(Boolean),
    ),
  );

  if (socialPostIds.length > 0) {
    await db.socialPost.updateMany({
      where: { id: { in: socialPostIds } },
      data: { videoUrl: "" },
    });
  }

  if (projectIds.length > 0) {
    await db.codeVideoProject.updateMany({
      where: {
        id: { in: projectIds },
        videoUrl: deletedUrl,
      },
      data: { videoUrl: null },
    });

    await db.dailyNewsEdition.updateMany({
      where: {
        codeVideoProjectId: { in: projectIds },
        finalVideoUrl: deletedUrl,
      },
      data: { finalVideoUrl: null },
    });

    await db.dailyNewsEdition.updateMany({
      where: {
        codeVideoProjectId: { in: projectIds },
        previewVideoUrl: deletedUrl,
      },
      data: { previewVideoUrl: null },
    });
  }
}

async function cleanupSingleGroup(db: DbClient, socialPostId: string) {
  const loaded = await loadCleanupGroup(db, socialPostId);
  if (!loaded) {
    return { cleaned: false, skipped: true, reason: "social_post_not_found" };
  }

  const { anchor, siblings } = loaded;
  const managedKey = getManagedMinioObjectKey(anchor.videoUrl);
  if (!managedKey) {
    return { cleaned: false, skipped: true, reason: "external_or_unmanaged_url", socialPostId: anchor.id };
  }

  const relevantPlatforms = Array.from(
    new Set(
      siblings
        .map((post) => String(post.platform || "").toUpperCase())
        .filter((platform) => PUBLISH_PLATFORMS.has(platform)),
    ),
  );

  const pendingPlatforms = relevantPlatforms.filter((platform) => {
    const platformPosts = siblings.filter(
      (post) => String(post.platform || "").toUpperCase() === platform,
    );
    return !platformPosts.some((post) => isPublishedForPlatform(post));
  });

  if (pendingPlatforms.length > 0) {
    return {
      cleaned: false,
      skipped: true,
      reason: "waiting_other_platforms",
      socialPostId: anchor.id,
      pendingPlatforms,
    };
  }

  const deletion = await deleteManagedVideoByUrl(anchor.videoUrl);
  const cleanupMessage = deletion.deleted
    ? `Midia de video removida do MinIO apos publicacao concluida em ${relevantPlatforms.join(" + ") || "rede social"}.`
    : `Limpeza de midia concluida sem remocao fisica (${deletion.reason || "sem motivo"}). Referencias locais foram baixadas.`;

  await nullVideoReferences(db, siblings, anchor.videoUrl);
  await appendCleanupLogToPosts(db, siblings, cleanupMessage);

  return {
    cleaned: true,
    skipped: false,
    socialPostId: anchor.id,
    deletedFromStorage: deletion.deleted,
    storageKey: deletion.key,
    relevantPlatforms,
  };
}

export async function cleanupPublishedSocialMediaAssets(
  db: DbClient,
  params: { socialPostId?: string; limit?: number } = {},
) {
  if (params.socialPostId) {
    return cleanupSingleGroup(db, params.socialPostId);
  }

  const limit = Math.min(50, Math.max(1, Number(params.limit || 10)));
  const candidates = (await db.socialPost.findMany({
    where: {
      status: "POSTED",
      platform: { in: ["YOUTUBE", "TIKTOK"] },
      videoUrl: { not: "" },
    },
    orderBy: [{ updatedAt: "asc" }, { createdAt: "asc" }],
    take: limit,
    select: { id: true },
  })) as Array<{ id: string }>;

  const seen = new Set<string>();
  const results: any[] = [];

  for (const candidate of candidates) {
    if (seen.has(candidate.id)) continue;
    const result = await cleanupSingleGroup(db, candidate.id);
    results.push(result);
  }

  return {
    scanned: candidates.length,
    cleanedCount: results.filter((item) => item?.cleaned).length,
    results,
  };
}
