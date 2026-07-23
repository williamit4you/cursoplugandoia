import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrCronSecret } from "@/lib/shopee-pipeline/apiAuth";
import { registerSocialCronError, runSocialCron } from "@/lib/socialCronRunner";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

function baseUrl(req: NextRequest) {
  const host = req.headers.get("host") || "localhost:3000";
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const protocol = forwardedProto || (host.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export async function GET(req: NextRequest) {
  try {
    await requireAdminOrCronSecret(req);
    const result = await runSocialCron({
      baseUrl: baseUrl(req),
      limit: Number(req.nextUrl.searchParams.get("limit") || 5),
    });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[api/social/cron GET]", error);
    registerSocialCronError(error);
    const status = error?.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json(
      { error: error?.message || "Falha no cron social" },
      { status }
    );
  }
}
