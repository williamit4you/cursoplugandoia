import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const target = new URL("/tiktokOr1XAV0HPZgE5HkdXMczFRvFZmbjTjgg.txt", req.url);
  return NextResponse.redirect(target, 307);
}

