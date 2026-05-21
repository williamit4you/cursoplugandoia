import "server-only";

import { prisma } from "@/lib/prisma";

function normalize(value: unknown) {
  return String(value || "").trim();
}

export async function resolveCreatorVideoDefaults(preferredImageUrl?: string | null, preferredKind?: "ENGAGEMENT" | "SALES") {
  const [engConfig, salesConfig, asset] = await Promise.all([
    prisma.shopeePipelineConfig.findFirst({ where: { pipelineKind: "ENGAGEMENT" } }),
    prisma.shopeePipelineConfig.findFirst({ where: { pipelineKind: "SALES" } }),
    prisma.creatorAsset.findFirst({
      where: { active: true, kind: "IMAGE" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const primaryConfig = preferredKind === "SALES" ? salesConfig : (engConfig || salesConfig);
  const fallbackConfig = preferredKind === "SALES" ? engConfig : salesConfig;

  const creatorImageUrl =
    normalize(preferredImageUrl) ||
    normalize(primaryConfig?.userBaseImageUrl) ||
    normalize(fallbackConfig?.userBaseImageUrl) ||
    normalize(asset?.url) ||
    "";

  const voiceRefUrl =
    normalize(primaryConfig?.userVoiceRefUrl) ||
    normalize(fallbackConfig?.userVoiceRefUrl) ||
    "";

  return {
    creatorImageUrl: creatorImageUrl || null,
    voiceRefUrl: voiceRefUrl || null,
  };
}
