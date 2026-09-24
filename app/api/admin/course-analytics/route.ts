import { NextRequest, NextResponse } from "next/server";
import { getCourseAnalytics, isCourseAnalyticsPageKey } from "@/lib/courseAnalytics";
import { getRangeFromRequest } from "@/lib/salesAnalyticsServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const requestedPageKey = req.nextUrl.searchParams.get("pageKey");
    if (requestedPageKey && !isCourseAnalyticsPageKey(requestedPageKey)) {
      return NextResponse.json({ error: "Curso inválido para este painel." }, { status: 400 });
    }
    return NextResponse.json(await getCourseAnalytics({ range: getRangeFromRequest(req), pageKey: requestedPageKey }));
  } catch (error: any) {
    console.error("[api/admin/course-analytics GET]", error);
    return NextResponse.json({ error: error?.message || "Falha ao carregar os acessos dos cursos." }, { status: 500 });
  }
}
