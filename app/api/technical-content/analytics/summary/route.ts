import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasAdminSession } from "@/lib/shopee-pipeline/apiAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    if (!(await hasAdminSession(req))) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    const days = Math.min(365, Math.max(1, Number(req.nextUrl.searchParams.get("days")) || 30));
    const from = new Date(Date.now() - days * 86400000);
    const posts = await prisma.post.findMany({ where: { origin: { startsWith: "TECHNICAL_" } }, select: { id: true, title: true, slug: true, origin: true, status: true, publishedAt: true, views: true } });
    const ids = posts.map((post) => post.id);
    const events = ids.length ? await prisma.contentMetricEvent.findMany({ where: { postId: { in: ids }, occurredAt: { gte: from } }, select: { postId: true, sessionId: true, source: true } }) : [];
    const topics = await prisma.technicalContentTopic.groupBy({ by: ["funnel", "status"], _count: { _all: true } });
    const topPosts = posts.map((post) => ({ ...post, visits: events.filter((event) => event.postId === post.id).length })).sort((a, b) => b.visits - a.visits).slice(0, 30);
    const sources = Array.from(events.reduce((map, event) => { const key = event.source || "Direto / não identificado"; map.set(key, (map.get(key) || 0) + 1); return map; }, new Map<string, number>()), ([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
    return NextResponse.json({ summary: { published: posts.filter((post) => post.status === "PUBLISHED").length, visits: events.length, sessions: new Set(events.map((event) => event.sessionId).filter(Boolean)).size, totalStoredViews: posts.reduce((sum, post) => sum + post.views, 0) }, topics, topPosts, sources, days });
  } catch (error: any) { return NextResponse.json({ error: error?.message || "Falha ao carregar analytics." }, { status: 500 }); }
}
