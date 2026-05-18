import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  // Use a relative redirect to avoid origin/host mismatches behind proxies.
  return new NextResponse(null, {
    status: 307,
    headers: { Location: "/tiktokOr1XAV0HPZgE5HkdXMczFRvFZmbjTjgg.txt" },
  });
}
