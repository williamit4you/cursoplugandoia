import "server-only";

import { prisma } from "@/lib/prisma";

function normalize(value: unknown) {
  return String(value || "").trim();
}

export async function resolveCreatorVideoDefaults(preferredImageUrl?: string | null) {
  const [config, asset] = await Promise.all([
    prisma.shopeePipelineConfig.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.creatorAsset.findFirst({
      where: { active: true, kind: "IMAGE" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const creatorImageUrl =
    normalize(preferredImageUrl) ||
    normalize(config?.userBaseImageUrl) ||
    normalize(asset?.url) ||
    "";

  const voiceRefUrl = normalize(config?.userVoiceRefUrl);

  return {
    creatorImageUrl: creatorImageUrl || null,
    voiceRefUrl: voiceRefUrl || null,
  };
}
