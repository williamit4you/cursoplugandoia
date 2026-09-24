import { NextRequest, NextResponse } from "next/server";
import { recordTechnicalPageView } from "@/lib/technicalContentPipeline";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!["hub", "article"].includes(body?.page) || (body?.page === "article" && !body?.postId)) return NextResponse.json({ error: "Evento inválido." }, { status: 400 });
    await recordTechnicalPageView({ postId: body.postId, sessionId: String(body.sessionId || "").slice(0, 120), source: body.utmSource, medium: body.utmMedium, campaign: body.utmCampaign, referrer: req.headers.get("referer") || undefined, page: body.page });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ ok: false }, { status: 202 }); }
}
