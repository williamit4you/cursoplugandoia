import { SalesPageEventType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const COURSE_ANALYTICS_PAGES = [
  { pageKey: "cursos", path: "/cursos", title: "Vitrine de cursos" },
  { pageKey: "curso-arquitetura-software", path: "/curso-arquitetura-software", title: "Arquitetura de Software" },
  { pageKey: "curso-rabbitmq", path: "/curso-rabbitmq", title: "RabbitMQ com .NET" },
  { pageKey: "curso-saas", path: "/curso-saas", title: "SaaS com IA" },
] as const;

const COURSE_BY_KEY = new Map(COURSE_ANALYTICS_PAGES.map((course) => [course.pageKey, course]));

type Range = { from: Date; to: Date };

function percent(value: number, total: number) {
  return total ? Number(((value / total) * 100).toFixed(2)) : 0;
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function eventName(metadataJson: string | null) {
  if (!metadataJson) return null;
  try {
    const metadata = JSON.parse(metadataJson);
    return typeof metadata?.eventName === "string" ? metadata.eventName.slice(0, 120) : null;
  } catch {
    return null;
  }
}

type Counter = {
  pageViews: number;
  viewContents: number;
  initiateCheckouts: number;
  outboundClicks: number;
  leads: number;
  purchases: number;
  revenue: number;
  sessions: Set<string>;
  lastEventAt: Date | null;
};

function createCounter(): Counter {
  return {
    pageViews: 0, viewContents: 0, initiateCheckouts: 0, outboundClicks: 0,
    leads: 0, purchases: 0, revenue: 0, sessions: new Set(), lastEventAt: null,
  };
}

function addEvent(counter: Counter, event: { eventType: SalesPageEventType; sessionId: string; value: unknown; occurredAt: Date }) {
  counter.sessions.add(event.sessionId);
  if (!counter.lastEventAt || event.occurredAt > counter.lastEventAt) counter.lastEventAt = event.occurredAt;
  if (event.eventType === SalesPageEventType.PAGE_VIEW) counter.pageViews += 1;
  if (event.eventType === SalesPageEventType.VIEW_CONTENT) counter.viewContents += 1;
  if (event.eventType === SalesPageEventType.INITIATE_CHECKOUT) counter.initiateCheckouts += 1;
  if (event.eventType === SalesPageEventType.OUTBOUND_CLICK) counter.outboundClicks += 1;
  if (event.eventType === SalesPageEventType.LEAD) counter.leads += 1;
  if (event.eventType === SalesPageEventType.PURCHASE) {
    counter.purchases += 1;
    counter.revenue += Number(event.value || 0);
  }
}

function serializeCounter(counter: Counter) {
  return {
    pageViews: counter.pageViews,
    uniqueSessions: counter.sessions.size,
    viewContents: counter.viewContents,
    initiateCheckouts: counter.initiateCheckouts,
    outboundClicks: counter.outboundClicks,
    leads: counter.leads,
    purchases: counter.purchases,
    revenue: Number(counter.revenue.toFixed(2)),
    checkoutCtr: percent(counter.initiateCheckouts, counter.pageViews),
    lastEventAt: counter.lastEventAt?.toISOString() || null,
  };
}

export function isCourseAnalyticsPageKey(value: string | null) {
  return !!value && COURSE_BY_KEY.has(value);
}

export async function getCourseAnalytics({ range, pageKey }: { range: Range; pageKey?: string | null }) {
  const pageKeys = pageKey && isCourseAnalyticsPageKey(pageKey)
    ? [pageKey]
    : COURSE_ANALYTICS_PAGES.map((course) => course.pageKey);

  const events = await prisma.salesPageEvent.findMany({
    where: { pageKey: { in: pageKeys }, occurredAt: { gte: range.from, lte: range.to } },
    orderBy: { occurredAt: "asc" },
    select: {
      id: true, pageKey: true, pagePath: true, eventType: true, sessionId: true, occurredAt: true,
      utmSource: true, utmMedium: true, utmCampaign: true, utmTerm: true, utmContent: true,
      referrer: true, deviceType: true, browser: true, os: true, country: true, region: true, city: true,
      value: true, currency: true, checkoutUrl: true, metadataJson: true,
    },
  });

  const total = createCounter();
  const perCourse = new Map<string, Counter>();
  const byDay = new Map<string, Counter & { date: string }>();
  const sources = new Map<string, Counter & { source: string; medium: string; campaign: string; referrer: string }>();
  const devices = new Map<string, number>();
  const browsers = new Map<string, number>();
  const systems = new Map<string, number>();
  const locations = new Map<string, number>();
  const engagement = new Map<string, number>();

  for (const event of events) {
    addEvent(total, event);
    const courseCounter = perCourse.get(event.pageKey) || createCounter();
    addEvent(courseCounter, event);
    perCourse.set(event.pageKey, courseCounter);

    const day = dateKey(event.occurredAt);
    const dayCounter = byDay.get(day) || Object.assign(createCounter(), { date: day });
    addEvent(dayCounter, event);
    byDay.set(day, dayCounter);

    const source = event.utmSource || "Direto / não identificado";
    const medium = event.utmMedium || "-";
    const campaign = event.utmCampaign || "-";
    const referrer = event.referrer || "-";
    const sourceKey = [source, medium, campaign, referrer].join("|");
    const sourceCounter = sources.get(sourceKey) || Object.assign(createCounter(), { source, medium, campaign, referrer });
    addEvent(sourceCounter, event);
    sources.set(sourceKey, sourceCounter);

    if (event.eventType === SalesPageEventType.PAGE_VIEW) {
      const addDimension = (map: Map<string, number>, value: string | null) => map.set(value || "Não identificado", (map.get(value || "Não identificado") || 0) + 1);
      addDimension(devices, event.deviceType);
      addDimension(browsers, event.browser);
      addDimension(systems, event.os);
      const location = [event.city, event.region, event.country].filter(Boolean).join(", ");
      if (location) locations.set(location, (locations.get(location) || 0) + 1);
    }

    if (event.eventType === SalesPageEventType.OUTBOUND_CLICK) {
      const name = eventName(event.metadataJson);
      if (name) engagement.set(name, (engagement.get(name) || 0) + 1);
    }
  }

  return {
    range: { from: range.from.toISOString(), to: range.to.toISOString() },
    courses: COURSE_ANALYTICS_PAGES.filter((course) => pageKeys.includes(course.pageKey)).map((course) => ({
      ...course,
      ...serializeCounter(perCourse.get(course.pageKey) || createCounter()),
    })),
    summary: serializeCounter(total),
    timeseries: Array.from(byDay.values()).map((item) => ({ date: item.date, ...serializeCounter(item) })),
    sources: Array.from(sources.values())
      .map((item) => ({ source: item.source, medium: item.medium, campaign: item.campaign, referrer: item.referrer, ...serializeCounter(item) }))
      .sort((a, b) => b.initiateCheckouts - a.initiateCheckouts || b.pageViews - a.pageViews).slice(0, 30),
    devices: Array.from(devices, ([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count),
    browsers: Array.from(browsers, ([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count),
    systems: Array.from(systems, ([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count),
    locations: Array.from(locations, ([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count).slice(0, 20),
    engagement: Array.from(engagement, ([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count).slice(0, 20),
    recentEvents: events.slice(-100).reverse().map((event) => ({
      id: event.id, course: COURSE_BY_KEY.get(event.pageKey)?.title || event.pageKey, pagePath: event.pagePath,
      eventType: event.eventType, eventName: eventName(event.metadataJson), occurredAt: event.occurredAt.toISOString(),
      sessionIdShort: event.sessionId.slice(0, 8), source: event.utmSource || "-", campaign: event.utmCampaign || "-",
      device: event.deviceType, browser: event.browser || "-", os: event.os || "-", value: event.value ? Number(event.value) : null,
    })),
  };
}
