import "server-only";

import { prisma } from "@/lib/prisma";

function dayStart(value = new Date()) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

export async function generateDailyContentReport(targetDate = new Date()) {
  const retentionDays = Math.max(30, Number(process.env.METRICS_RETENTION_DAYS || 730));
  await prisma.contentMetricEvent.deleteMany({ where: { occurredAt: { lt: new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000) } } });
  const start = dayStart(targetDate);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const eventTypes = ["page_view", "article_view", "video_view", "affiliate_click", "lead_created", "sale_attributed"];
  const [articles, videos, socialPublished, socialFailed, costs, events, alerts, videosWithoutPublication, articlesWithoutVisits] = await Promise.all([
    prisma.post.count({ where: { createdAt: { gte: start, lt: end } } }),
    prisma.codeVideoProject.count({ where: { createdAt: { gte: start, lt: end } } }),
    prisma.socialPost.count({ where: { status: "POSTED", postedAt: { gte: start, lt: end } } }),
    prisma.socialPost.count({ where: { status: "FAILED", updatedAt: { gte: start, lt: end } } }),
    prisma.costLedger.aggregate({ where: { occurredAt: { gte: start, lt: end } }, _sum: { costUsd: true } }),
    prisma.contentMetricEvent.groupBy({ by: ["eventType"], where: { occurredAt: { gte: start, lt: end } }, _count: { _all: true } }),
    prisma.operationAlert.findMany({ where: { status: { in: ["OPEN", "ACKNOWLEDGED"] } }, orderBy: [{ severity: "desc" }, { lastSeenAt: "desc" }], take: 20 }),
    prisma.codeVideoProject.count({ where: { status: "DONE", videoUrl: { not: null }, socialPosts: { none: { status: "POSTED" } } } }),
    prisma.post.count({ where: { status: "PUBLISHED", views: 0, createdAt: { lte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
  ]);
  const metrics = Object.fromEntries(eventTypes.map((type) => [type, events.find((event) => event.eventType === type)?._count._all || 0]));
  const clusterWindows = await Promise.all([7, 14, 28].map(async (days) => ({
    days,
    products: await prisma.contentMetricEvent.groupBy({ by: ["productId", "eventType"], where: { productId: { not: null }, occurredAt: { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) } }, _count: { _all: true } }),
  })));
  const observed = { articles, videos, socialPublished, socialFailed, waste: { videosWithoutPublication, articlesWithoutVisits }, ...metrics };
  const estimated = { successRate: socialPublished + socialFailed ? socialPublished / (socialPublished + socialFailed) : null, costUsd: costs._sum.costUsd || 0 };
  const payload = { period: { start: start.toISOString(), end: end.toISOString() }, observed, estimated, seoClusters: clusterWindows, privacy: { retentionDays, respectsDoNotTrack: true } };
  return prisma.dailyContentReport.upsert({ where: { reportDate: start }, update: { metricsJson: JSON.stringify(payload), alertsJson: JSON.stringify(alerts) }, create: { reportDate: start, metricsJson: JSON.stringify(payload), alertsJson: JSON.stringify(alerts) } });
}
