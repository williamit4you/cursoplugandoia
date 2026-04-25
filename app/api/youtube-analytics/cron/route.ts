import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Cron endpoint para coleta diária automática.
 * Protegido por CRON_SECRET.
 * Trigger: GET /api/youtube-analytics/cron?secret=XXX
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && secret !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Chamar o endpoint de refresh internamente
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const host = req.headers.get("host") || "localhost:3000";
    const refreshUrl = `${protocol}://${host}/api/youtube-analytics/refresh`;

    const response = await fetch(refreshUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const result = await response.json();
    return NextResponse.json({ trigger: "cron", ...result });
  } catch (error: any) {
    console.error("Cron error:", error);
    return NextResponse.json(
      { error: "Falha no cron de coleta", details: error.message },
      { status: 500 }
    );
  }
}
