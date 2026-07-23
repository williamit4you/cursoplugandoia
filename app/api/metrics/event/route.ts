import { NextRequest, NextResponse } from "next/server";
import { recordContentMetric } from "@/lib/operationsControl";

export const dynamic = "force-dynamic";
const ALLOWED_EVENTS = new Set(["page_view", "article_view", "video_view", "affiliate_click", "lead_created", "sale_attributed"]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const eventType = String(body.eventType || "");
    if (!ALLOWED_EVENTS.has(eventType)) return NextResponse.json({ error: "Evento invalido" }, { status: 400 });
    const metric = await recordContentMetric({ eventType, postId: body.postId || null, socialPostId: body.socialPostId || null, productId: body.productId || null, sessionId: body.sessionId || null, source: body.source || null, medium: body.medium || null, campaign: body.campaign || null, referrer: req.headers.get("referer"), metadata: body.metadata });
    return NextResponse.json({ ok: true, id: metric.id });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Falha ao registrar evento" }, { status: 500 });
  }
}
