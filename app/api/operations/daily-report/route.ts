import { NextRequest, NextResponse } from "next/server";
import { generateDailyContentReport } from "@/lib/dailyContentReport";
import { requireAdminOrCronSecret } from "@/lib/shopee-pipeline/apiAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdminOrCronSecret(req);
    const date = req.nextUrl.searchParams.get("date");
    const report = await generateDailyContentReport(date ? new Date(`${date}T12:00:00`) : new Date());
    return NextResponse.json({ ok: true, report, metrics: JSON.parse(report.metricsJson), alerts: report.alertsJson ? JSON.parse(report.alertsJson) : [] });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Falha ao gerar relatorio diario" }, { status: error?.message === "Unauthorized" ? 401 : 500 });
  }
}
