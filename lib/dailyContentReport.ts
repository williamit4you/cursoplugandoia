import "server-only";

import { prisma } from "@/lib/prisma";

function dayStart(value = new Date()) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

export async function generateDailyContentReport(targetDate = new Date()) {
  const start = dayStart(targetDate);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const eventTypes = ["page_view", "article_view", "video_view", "affiliate_click", "lead_created", "sale_attributed"];
  const [articles, videos, socialPublished, socialFailed, costs, events, alerts] = await Promise.all([
    prisma.post.count({ where: { createdAt: { gte: start, lt: end } } }),
    prisma.codeVideoProject.count({ where: { createdAt: { gte: start, lt: end } } }),
    prisma.socialPost.count({ where: { status: "POSTED", postedAt: { gte: start, lt: end } } }),
    prisma.socialPost.count({ where: { status: "FAILED", updatedAt: { gte: start, lt: end } } }),
    prisma.costLedger.aggregate({ where: { occurredAt: { gte: start, lt: end } }, _sum: { costUsd: true } }),
    prisma.contentMetricEvent.groupBy({ by: ["eventType"], where: { occurredAt: { gte: start, lt: end } }, _count: { _all: true } }),
    prisma.operationAlert.findMany({ where: { status: { in: ["OPEN", "ACKNOWLEDGED"] } }, orderBy: [{ severity: "desc" }, { lastSeenAt: "desc" }], take: 20 }),
  ]);
  const metrics = Object.fromEntries(eventTypes.map((type) => [type, events.find((event) => event.eventType === type)?._count._all || 0]));
  const payload = { period: { start: start.toISOString(), end: end.toISOString() }, articles, videos, socialPublished, socialFailed, successRate: socialPublished + socialFailed ? socialPublished / (socialPublished + socialFailed) : null, estimatedCostUsd: costs._sum.costUsd || 0, ...metrics };
  return prisma.dailyContentReport.upsert({ where: { reportDate: start }, update: { metricsJson: JSON.stringify(payload), alertsJson: JSON.stringify(alerts) }, create: { reportDate: start, metricsJson: JSON.stringify(payload), alertsJson: JSON.stringify(alerts) } });
}
