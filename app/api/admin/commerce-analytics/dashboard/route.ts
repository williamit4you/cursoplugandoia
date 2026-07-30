import { NextRequest, NextResponse } from "next/server";
import { SalesPageEventType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  buildCommercePageInventory,
  commercePageTypeLabel,
  inferCommercePageType,
  type CommercePageInventoryItem,
} from "@/lib/commercePageInventory";
import { requireServerSession } from "@/lib/serverAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_RANGE_DAYS = 366;
const MAX_EVENTS = 250_000;

function clean(value: string | null, max = 160) {
  return String(value || "").trim().slice(0, max);
}

function rangeFromRequest(req: NextRequest) {
  const now = new Date();
  const fallbackFrom = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
  const fromValue = clean(req.nextUrl.searchParams.get("from"), 10);
  const toValue = clean(req.nextUrl.searchParams.get("to"), 10);
  let from = /^\d{4}-\d{2}-\d{2}$/.test(fromValue)
    ? new Date(`${fromValue}T00:00:00.000-03:00`)
    : fallbackFrom;
  let to = /^\d{4}-\d{2}-\d{2}$/.test(toValue)
    ? new Date(`${toValue}T23:59:59.999-03:00`)
    : now;

  if (Number.isNaN(from.getTime())) from = fallbackFrom;
  if (Number.isNaN(to.getTime())) to = now;
  if (to < from) [from, to] = [to, from];
  const maximumTo = new Date(from.getTime() + MAX_RANGE_DAYS * 24 * 60 * 60 * 1000);
  if (to > maximumTo) to = maximumTo;
  return { from, to };
}

function saoPauloDay(value: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

function percent(value: number, total: number) {
  return total ? Number(((value / total) * 100).toFixed(2)) : 0;
}

function metadata(value: string | null) {
  try {
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
}

function uniqueCount<T>(values: T[]) {
  return new Set(values.filter(Boolean)).size;
}

function aggregateRows<T extends Record<string, any>>(
  rows: T[],
  keyFor: (row: T) => string,
  labelFor?: (row: T) => string,
) {
  const grouped = new Map<string, any>();
  for (const row of rows) {
    const key = keyFor(row) || "(não informado)";
    const current = grouped.get(key) || {
      key,
      label: labelFor?.(row) || key,
      pageViews: 0,
      clicks: 0,
      leads: 0,
      sessions: new Set<string>(),
      visitors: new Set<string>(),
    };
    if (row.eventType === SalesPageEventType.PAGE_VIEW) current.pageViews += 1;
    if (row.eventType === SalesPageEventType.OUTBOUND_CLICK) current.clicks += 1;
    if (row.eventType === SalesPageEventType.LEAD) current.leads += 1;
    current.sessions.add(row.sessionId);
    if (row.visitorId) current.visitors.add(row.visitorId);
    grouped.set(key, current);
  }
  return Array.from(grouped.values())
    .map((entry) => ({
      ...entry,
      sessions: entry.sessions.size,
      visitors: entry.visitors.size,
      clickRate: percent(entry.clicks, entry.pageViews),
      leadRate: percent(entry.leads, entry.pageViews),
    }))
    .sort((a, b) => b.pageViews - a.pageViews || b.clicks - a.clicks);
}

function pageMatchesFilters(page: CommercePageInventoryItem, req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const pageType = clean(params.get("pageType"), 60);
  const store = clean(params.get("store"), 100);
  const category = clean(params.get("category"), 120);
  const pagePath = clean(params.get("pagePath"), 255);
  const query = clean(params.get("q"), 120).toLocaleLowerCase("pt-BR");
  if (pageType && page.pageType !== pageType) return false;
  if (store && page.storeSlug !== store) return false;
  if (category && page.category !== category) return false;
  if (pagePath && page.path !== pagePath) return false;
  if (query) {
    const haystack = [
      page.title,
      page.path,
      page.storeName,
      page.category,
      page.primaryKeyword,
      ...page.secondaryKeywords,
    ].join(" ").toLocaleLowerCase("pt-BR");
    if (!haystack.includes(query)) return false;
  }
  return true;
}

export async function GET(req: NextRequest) {
  const session = await requireServerSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const range = rangeFromRequest(req);
    const inventory = await buildCommercePageInventory();
    const filteredInventory = inventory.filter((page) => pageMatchesFilters(page, req));
    const hasPageFilter = ["pageType", "store", "category", "pagePath", "q"]
      .some((key) => Boolean(clean(req.nextUrl.searchParams.get(key))));
    const allowedPaths = filteredInventory.map((page) => page.path);
    const includeBots = req.nextUrl.searchParams.get("includeBots") === "true";
    const device = clean(req.nextUrl.searchParams.get("device"), 30);
    const browser = clean(req.nextUrl.searchParams.get("browser"), 80);
    const source = clean(req.nextUrl.searchParams.get("source"), 120);
    const medium = clean(req.nextUrl.searchParams.get("medium"), 120);
    const campaign = clean(req.nextUrl.searchParams.get("campaign"), 160);
    const eventType = clean(req.nextUrl.searchParams.get("eventType"), 60);

    const where: any = {
      pageKey: { startsWith: "commerce:" },
      occurredAt: { gte: range.from, lte: range.to },
      ...(includeBots ? {} : { deviceType: { not: "BOT" } }),
      ...(device ? { deviceType: device } : {}),
      ...(browser ? { browser } : {}),
      ...(medium ? { utmMedium: medium } : {}),
      ...(campaign ? { utmCampaign: campaign } : {}),
      ...(eventType ? { eventType } : {}),
      ...(source ? { OR: [{ utmSource: source }, { source }] } : {}),
      ...(hasPageFilter ? { pagePath: { in: allowedPaths.length ? allowedPaths : ["__none__"] } } : {}),
    };

    let events = await prisma.salesPageEvent.findMany({
      where,
      orderBy: { occurredAt: "asc" },
      take: MAX_EVENTS,
      select: {
        id: true,
        pagePath: true,
        pageTitle: true,
        eventType: true,
        sessionId: true,
        visitorId: true,
        source: true,
        referrer: true,
        deviceType: true,
        browser: true,
        os: true,
        utmSource: true,
        utmMedium: true,
        utmCampaign: true,
        checkoutUrl: true,
        metadataJson: true,
        occurredAt: true,
      },
    });

    const destination = clean(req.nextUrl.searchParams.get("destination"), 160).toLowerCase();
    if (destination) {
      events = events.filter((event) => {
        const info = metadata(event.metadataJson);
        return String(info.destinationHost || event.checkoutUrl || "").toLowerCase().includes(destination);
      });
    }

    const inventoryByPath = new Map(inventory.map((page) => [page.path, page]));
    const enriched = events.map((event) => {
      const page = inventoryByPath.get(event.pagePath);
      const info = metadata(event.metadataJson);
      return {
        ...event,
        metadata: info,
        pageType: page?.pageType || info.pageType || inferCommercePageType(event.pagePath),
        pageTypeLabel: page?.pageTypeLabel || commercePageTypeLabel(info.pageType || inferCommercePageType(event.pagePath)),
        storeSlug: page?.storeSlug || info.storeSlug || null,
        storeName: page?.storeName || null,
        category: page?.category || "Outros",
      };
    });

    const pageViews = enriched.filter((event) => event.eventType === SalesPageEventType.PAGE_VIEW);
    const clicks = enriched.filter((event) => event.eventType === SalesPageEventType.OUTBOUND_CLICK);
    const leads = enriched.filter((event) => event.eventType === SalesPageEventType.LEAD);
    const allTimeClicks = await prisma.salesPageEvent.count({
      where: { pageKey: { startsWith: "commerce:" }, eventType: SalesPageEventType.OUTBOUND_CLICK },
    });

    const byPath = new Map(aggregateRows(enriched, (event) => event.pagePath).map((entry) => [entry.key, entry]));
    const tablePages = (hasPageFilter ? filteredInventory : inventory).map((page) => {
      const metric = byPath.get(page.path);
      return {
        ...page,
        pageViews: metric?.pageViews || 0,
        clicks: metric?.clicks || 0,
        leads: metric?.leads || 0,
        sessions: metric?.sessions || 0,
        visitors: metric?.visitors || 0,
        clickRate: metric?.clickRate || 0,
        leadRate: metric?.leadRate || 0,
      };
    }).sort((a, b) => b.pageViews - a.pageViews || b.clicks - a.clicks || a.title.localeCompare(b.title, "pt-BR"));

    const byDay = new Map<string, { date: string; pageViews: number; clicks: number; leads: number; sessions: Set<string> }>();
    for (const event of enriched) {
      const date = saoPauloDay(event.occurredAt);
      const row = byDay.get(date) || { date, pageViews: 0, clicks: 0, leads: 0, sessions: new Set<string>() };
      if (event.eventType === SalesPageEventType.PAGE_VIEW) row.pageViews += 1;
      if (event.eventType === SalesPageEventType.OUTBOUND_CLICK) row.clicks += 1;
      if (event.eventType === SalesPageEventType.LEAD) row.leads += 1;
      row.sessions.add(event.sessionId);
      byDay.set(date, row);
    }

    const destinationRows = clicks.map((event) => ({
      ...event,
      destination: event.metadata.destinationHost || (() => {
        try { return event.checkoutUrl ? new URL(event.checkoutUrl).hostname : "(não informado)"; }
        catch { return "(não informado)"; }
      })(),
    }));

    const options = {
      pageTypes: Array.from(new Set(inventory.map((page) => page.pageType))).sort().map((value) => ({ value, label: commercePageTypeLabel(value) })),
      stores: Array.from(new Map(inventory.filter((page) => page.storeSlug).map((page) => [page.storeSlug, { value: page.storeSlug, label: page.storeName || page.storeSlug }])).values()),
      categories: Array.from(new Set(inventory.map((page) => page.category))).sort((a, b) => a.localeCompare(b, "pt-BR")),
      devices: Array.from(new Set(enriched.map((event) => event.deviceType))).sort(),
      browsers: Array.from(new Set(enriched.map((event) => event.browser).filter(Boolean))).sort(),
      sources: Array.from(new Set(enriched.map((event) => event.utmSource || event.source).filter(Boolean))).sort(),
      mediums: Array.from(new Set(enriched.map((event) => event.utmMedium).filter(Boolean))).sort(),
      campaigns: Array.from(new Set(enriched.map((event) => event.utmCampaign).filter(Boolean))).sort(),
      destinations: Array.from(new Set(destinationRows.map((event) => event.destination))).sort(),
    };

    return NextResponse.json({
      period: { from: range.from.toISOString(), to: range.to.toISOString(), timezone: "America/Sao_Paulo" },
      truncated: events.length >= MAX_EVENTS,
      summary: {
        publishedPages: inventory.length,
        pagesWithViews: uniqueCount(pageViews.map((event) => event.pagePath)),
        pageViews: pageViews.length,
        sessions: uniqueCount(pageViews.map((event) => event.sessionId)),
        visitors: uniqueCount(pageViews.map((event) => event.visitorId || event.sessionId)),
        totalClicks: clicks.length,
        allTimeClicks,
        leads: leads.length,
        clickRate: percent(clicks.length, pageViews.length),
        leadRate: percent(leads.length, pageViews.length),
      },
      timeseries: Array.from(byDay.values()).map((row) => ({ ...row, sessions: row.sessions.size })).sort((a, b) => a.date.localeCompare(b.date)),
      pages: tablePages,
      byCategory: aggregateRows(enriched, (event) => event.category),
      byPageType: aggregateRows(enriched, (event) => event.pageType, (event) => event.pageTypeLabel),
      byStore: aggregateRows(enriched.filter((event) => event.storeSlug), (event) => event.storeSlug, (event) => event.storeName || event.storeSlug),
      bySource: aggregateRows(enriched, (event) => event.utmSource || event.source || "(direto)"),
      byMedium: aggregateRows(enriched, (event) => event.utmMedium || "(não informado)"),
      byCampaign: aggregateRows(enriched, (event) => event.utmCampaign || "(sem campanha)"),
      byDevice: aggregateRows(enriched, (event) => event.deviceType),
      byBrowser: aggregateRows(enriched, (event) => event.browser || "(não informado)"),
      byDestination: aggregateRows(destinationRows, (event) => event.destination),
      recentEvents: enriched.slice(-100).reverse().map((event) => ({
        id: event.id,
        occurredAt: event.occurredAt,
        eventType: event.eventType,
        pagePath: event.pagePath,
        pageTitle: event.pageTitle,
        source: event.utmSource || event.source,
        campaign: event.utmCampaign,
        device: event.deviceType,
        destination: event.metadata.destinationHost || event.checkoutUrl,
      })),
      options,
    });
  } catch (error: any) {
    console.error("[COMMERCE_ANALYTICS_DASHBOARD]", error);
    return NextResponse.json({ error: error?.message || "Falha ao carregar analytics do Compra Esperta" }, { status: 500 });
  }
}
