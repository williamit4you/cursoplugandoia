import { NextRequest, NextResponse } from "next/server";
import { SalesPageEventType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeSalesEventPayload, upsertSalesSessionFromEvent } from "@/lib/salesAnalyticsServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedEvents = new Set<string>(Object.values(SalesPageEventType));

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const payload = normalizeSalesEventPayload(req, body);

    if (!payload.pageKey || !payload.pagePath || !payload.sessionId || !payload.eventType) {
      return NextResponse.json({ error: "pageKey, pagePath, sessionId and eventType are required" }, { status: 400 });
    }

    if (!allowedEvents.has(payload.eventType)) {
      return NextResponse.json({ error: "invalid eventType" }, { status: 400 });
    }

    const event = await prisma.salesPageEvent.create({
      data: payload,
    });

    await upsertSalesSessionFromEvent({
      pageKey: payload.pageKey,
      pagePath: payload.pagePath,
      sessionId: payload.sessionId,
      referrer: payload.referrer,
      utmSource: payload.utmSource,
      utmMedium: payload.utmMedium,
      utmCampaign: payload.utmCampaign,
      utmTerm: payload.utmTerm,
      utmContent: payload.utmContent,
      fbclid: payload.fbclid,
      deviceType: payload.deviceType,
      userAgent: payload.userAgent,
      visitorId: payload.visitorId,
      eventType: payload.eventType,
      value: payload.value,
    });

    return NextResponse.json({ ok: true, id: event.id });
  } catch (error: any) {
    console.error("[api/sales/events POST]", error);
    return NextResponse.json({ error: error?.message || "Falha ao registrar evento da landing" }, { status: 500 });
  }
}
