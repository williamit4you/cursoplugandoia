import { NextRequest, NextResponse } from "next/server";
import { generateDailyContentReport } from "@/lib/dailyContentReport";
import { querySearchConsole } from "@/lib/searchConsole";
import { requireAdminOrCronSecret } from "@/lib/shopee-pipeline/apiAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdminOrCronSecret(req);
    const date = req.nextUrl.searchParams.get("date");
    const reportDate = date ? new Date(`${date}T12:00:00`) : new Date();
    const report = await generateDailyContentReport(reportDate);
    let searchConsole: unknown = null;
    if (req.nextUrl.searchParams.get("includeSearchConsole") === "1") {
      const startDate = new Date(reportDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const endDate = reportDate.toISOString().slice(0, 10);
      searchConsole = await querySearchConsole({
        startDate,
        endDate,
        dimensions: ["query"],
        rowLimit: Number(req.nextUrl.searchParams.get("searchConsoleRowLimit") || 50),
        searchType: "web",
      });
    }
    return NextResponse.json({
      ok: true,
      report,
      metrics: JSON.parse(report.metricsJson),
      alerts: report.alertsJson ? JSON.parse(report.alertsJson) : [],
      searchConsole,
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Falha ao gerar relatorio diario" }, { status: error?.message === "Unauthorized" ? 401 : 500 });
  }
}
