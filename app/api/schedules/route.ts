import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") || 1));
    const pageSize = Math.min(200, Math.max(10, Number(req.nextUrl.searchParams.get("pageSize") || 50)));
    const status = String(req.nextUrl.searchParams.get("status") || "ALL").trim();
    const platform = String(req.nextUrl.searchParams.get("platform") || "ALL").trim();

    const where: any = { automationTaskId: { not: null } };
    if (status !== "ALL") where.status = status;
    if (platform !== "ALL") where.platform = platform;

    const skip = (page - 1) * pageSize;
    const [total, items] = await Promise.all([
      prisma.socialPost.count({ where }),
      prisma.socialPost.findMany({
        where,
        orderBy: [{ scheduledTo: "asc" }, { createdAt: "desc" }],
        skip,
        take: pageSize,
        select: {
          id: true,
          status: true,
          platform: true,
          postType: true,
          scheduledTo: true,
          postedAt: true,
          summary: true,
          videoUrl: true,
          thumbUrl: true,
          postUrl: true,
          automationTaskId: true,
          automationTaskRunId: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({ items, total, page, pageSize });
  } catch (error: any) {
    console.error("[api/schedules GET]", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch schedules" }, { status: 500 });
  }
}
