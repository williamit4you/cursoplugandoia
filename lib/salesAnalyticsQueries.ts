import { SalesPageEventType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Range = {
  from: Date;
  to: Date;
};

type BaseArgs = {
  pageKey: string;
  range: Range;
};

function percent(value: number, total: number) {
  if (!total) return 0;
  return Number(((value / total) * 100).toFixed(2));
}

function formatDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function getSalesAnalyticsSummary({ pageKey, range }: BaseArgs) {
  const [events, sessions, revenue, recent] = await Promise.all([
    prisma.salesPageEvent.groupBy({
      by: ["eventType"],
      where: {
        pageKey,
        occurredAt: {
          gte: range.from,
          lte: range.to,
        },
      },
      _count: { _all: true },
    }),
    prisma.salesPageSession.aggregate({
      where: {
        pageKey,
        firstSeenAt: {
          gte: range.from,
          lte: range.to,
        },
      },
      _count: { _all: true },
    }),
    prisma.salesPageEvent.aggregate({
      where: {
        pageKey,
        eventType: SalesPageEventType.PURCHASE,
        occurredAt: {
          gte: range.from,
          lte: range.to,
        },
      },
      _sum: { value: true },
    }),
    prisma.salesPageEvent.findFirst({
      where: {
        pageKey,
        occurredAt: {
          gte: range.from,
          lte: range.to,
        },
      },
      orderBy: { occurredAt: "desc" },
      select: { occurredAt: true },
    }),
  ]);

  const counts = new Map(events.map((event) => [event.eventType, event._count._all]));
  const pageViews = counts.get(SalesPageEventType.PAGE_VIEW) || 0;
  const viewContents = counts.get(SalesPageEventType.VIEW_CONTENT) || 0;
  const initiateCheckouts = counts.get(SalesPageEventType.INITIATE_CHECKOUT) || 0;
  const leads = counts.get(SalesPageEventType.LEAD) || 0;
  const purchases = counts.get(SalesPageEventType.PURCHASE) || 0;

  return {
    pageViews,
    uniqueVisitors: sessions._count._all,
    viewContents,
    initiateCheckouts,
    leads,
    purchases,
    revenue: Number(revenue._sum.value || 0),
    checkoutCtr: percent(initiateCheckouts, pageViews),
    viewToCheckoutRate: percent(initiateCheckouts, viewContents),
    purchaseRate: percent(purchases, initiateCheckouts),
    lastEventAt: recent?.occurredAt?.toISOString() || null,
  };
}

export async function getSalesAnalyticsFunnel({ pageKey, range }: BaseArgs) {
  const summary = await getSalesAnalyticsSummary({ pageKey, range });

  return [
    {
      step: "PAGE_VIEW",
      count: summary.pageViews,
      rateFromPrevious: 100,
    },
    {
      step: "VIEW_CONTENT",
      count: summary.viewContents,
      rateFromPrevious: percent(summary.viewContents, summary.pageViews),
    },
    {
      step: "INITIATE_CHECKOUT",
      count: summary.initiateCheckouts,
      rateFromPrevious: percent(summary.initiateCheckouts, summary.viewContents),
    },
    {
      step: "PURCHASE",
      count: summary.purchases,
      rateFromPrevious: percent(summary.purchases, summary.initiateCheckouts),
    },
  ];
}

export async function getSalesAnalyticsSources({ pageKey, range }: BaseArgs) {
  const events = await prisma.salesPageEvent.findMany({
    where: {
      pageKey,
      occurredAt: {
        gte: range.from,
        lte: range.to,
      },
    },
    select: {
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
      referrer: true,
      eventType: true,
      sessionId: true,
    },
  });

  const bySource = new Map<
    string,
    {
      utmSource: string | null;
      utmMedium: string | null;
      utmCampaign: string | null;
      referrer: string | null;
      pageViews: number;
      initiateCheckouts: number;
      uniqueVisitors: Set<string>;
    }
  >();

  for (const event of events) {
    const key = [
      event.utmSource || "",
      event.utmMedium || "",
      event.utmCampaign || "",
      event.referrer || "",
    ].join("|");

    const current = bySource.get(key) || {
      utmSource: event.utmSource,
      utmMedium: event.utmMedium,
      utmCampaign: event.utmCampaign,
      referrer: event.referrer,
      pageViews: 0,
      initiateCheckouts: 0,
      uniqueVisitors: new Set<string>(),
    };

    current.uniqueVisitors.add(event.sessionId);
    if (event.eventType === SalesPageEventType.PAGE_VIEW) current.pageViews += 1;
    if (event.eventType === SalesPageEventType.INITIATE_CHECKOUT) current.initiateCheckouts += 1;

    bySource.set(key, current);
  }

  return Array.from(bySource.values())
    .map((item) => ({
      utmSource: item.utmSource || "(direto)",
      utmMedium: item.utmMedium || "-",
      utmCampaign: item.utmCampaign || "-",
      referrer: item.referrer || "-",
      pageViews: item.pageViews,
      initiateCheckouts: item.initiateCheckouts,
      uniqueVisitors: item.uniqueVisitors.size,
      checkoutCtr: percent(item.initiateCheckouts, item.pageViews),
    }))
    .sort((a, b) => b.initiateCheckouts - a.initiateCheckouts || b.pageViews - a.pageViews)
    .slice(0, 50);
}

export async function getSalesAnalyticsTimeseries({ pageKey, range }: BaseArgs) {
  const events = await prisma.salesPageEvent.findMany({
    where: {
      pageKey,
      occurredAt: {
        gte: range.from,
        lte: range.to,
      },
    },
    select: {
      eventType: true,
      occurredAt: true,
      value: true,
    },
    orderBy: { occurredAt: "asc" },
  });

  const byDay = new Map<
    string,
    {
      date: string;
      pageViews: number;
      viewContents: number;
      initiateCheckouts: number;
      purchases: number;
      revenue: number;
    }
  >();

  for (const event of events) {
    const day = formatDay(event.occurredAt);
    const current = byDay.get(day) || {
      date: day,
      pageViews: 0,
      viewContents: 0,
      initiateCheckouts: 0,
      purchases: 0,
      revenue: 0,
    };

    if (event.eventType === SalesPageEventType.PAGE_VIEW) current.pageViews += 1;
    if (event.eventType === SalesPageEventType.VIEW_CONTENT) current.viewContents += 1;
    if (event.eventType === SalesPageEventType.INITIATE_CHECKOUT) current.initiateCheckouts += 1;
    if (event.eventType === SalesPageEventType.PURCHASE) {
      current.purchases += 1;
      current.revenue += Number(event.value || 0);
    }

    byDay.set(day, current);
  }

  return Array.from(byDay.values());
}

export async function getSalesAnalyticsRecentEvents({ pageKey, range }: BaseArgs) {
  const events = await prisma.salesPageEvent.findMany({
    where: {
      pageKey,
      occurredAt: {
        gte: range.from,
        lte: range.to,
      },
    },
    orderBy: { occurredAt: "desc" },
    take: 100,
    select: {
      id: true,
      eventType: true,
      occurredAt: true,
      sessionId: true,
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
      referrer: true,
      deviceType: true,
      browser: true,
      value: true,
      currency: true,
      checkoutUrl: true,
    },
  });

  return events.map((event) => ({
    ...event,
    sessionIdShort: event.sessionId.slice(0, 8),
  }));
}
