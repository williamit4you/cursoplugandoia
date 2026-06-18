import "server-only";

import { prisma } from "@/lib/prisma";

const RECENT_WINDOW_MS = 60 * 60 * 1000;
const DEFAULT_SPACING_HOURS = 3;

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function now() {
  return new Date();
}

export async function computeNextSocialQueueTime(params: {
  platform: string;
  desiredAt?: Date | null;
  spacingHours?: number;
}) {
  const platform = String(params.platform || "").trim().toUpperCase();
  const desiredAt = params.desiredAt ? new Date(params.desiredAt) : now();
  const spacingHours = Number.isFinite(params.spacingHours) ? Number(params.spacingHours) : DEFAULT_SPACING_HOURS;
  const recentThreshold = new Date(now().getTime() - RECENT_WINDOW_MS);

  const [latestScheduled, latestPosted] = await Promise.all([
    prisma.socialPost.findFirst({
      where: {
        platform,
        status: { in: ["SCHEDULED", "PUBLISHING", "POSTED"] },
        scheduledTo: { not: null },
      },
      orderBy: { scheduledTo: "desc" },
      select: { scheduledTo: true },
    }),
    prisma.socialPost.findFirst({
      where: {
        platform,
        status: "POSTED",
        postedAt: { not: null },
      },
      orderBy: { postedAt: "desc" },
      select: { postedAt: true },
    }),
  ]);

  if (latestScheduled?.scheduledTo && latestScheduled.scheduledTo >= recentThreshold) {
    return addHours(latestScheduled.scheduledTo, spacingHours);
  }

  if (latestPosted?.postedAt && latestPosted.postedAt >= recentThreshold) {
    return addHours(latestPosted.postedAt, spacingHours);
  }

  return desiredAt;
}
