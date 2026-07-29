import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LONG_FORM_PROJECT_TYPE } from "@/lib/longFormMarketing";

export const dynamic = "force-dynamic";

function youtubeId(url: string | null) {
  return String(url || "").match(/[?&]v=([^&#]+)/)?.[1] || null;
}

export async function GET() {
  const socialPosts = await prisma.socialPost.findMany({ where: { platform: "YOUTUBE", codeVideoProject: { projectType: LONG_FORM_PROJECT_TYPE } }, select: { id: true, codeVideoProjectId: true, postedAt: true, postUrl: true, youtubePostUrl: true } });
  const ids = socialPosts.map((post) => youtubeId(post.youtubePostUrl || post.postUrl)).filter(Boolean) as string[];
  const videos = ids.length ? await prisma.ytVideo.findMany({ where: { youtubeVideoId: { in: ids } }, select: { youtubeVideoId: true, views: true, likes: true, comments: true, duration: true } }) : [];
  const byId = new Map(videos.map((video) => [video.youtubeVideoId, video]));
  const items = socialPosts.map((post) => {
    const video = byId.get(youtubeId(post.youtubePostUrl || post.postUrl) || "");
    const days = Math.max(1, Math.ceil((Date.now() - new Date(post.postedAt || Date.now()).getTime()) / 86_400_000));
    const views = Number(video?.views || 0);
    return { projectId: post.codeVideoProjectId, views, likes: video?.likes || 0, comments: video?.comments || 0, viewsPerDay: Math.round(views / days), ctr: null, retention: null, subscribersGained: null, status: video ? "BASIC_AVAILABLE" : "AWAITING_COLLECTION" };
  });
  const measured = items.filter((item) => item.status === "BASIC_AVAILABLE");
  const benchmarkViewsPerDay = measured.length ? Math.round(measured.reduce((sum, item) => sum + item.viewsPerDay, 0) / measured.length) : 0;
  return NextResponse.json({ items, benchmarkViewsPerDay, unavailable: ["CTR", "retencao", "inscritos ganhos"], message: "CTR, retencao e inscritos ganhos exigem permissao YouTube Analytics API adicional." });
}
