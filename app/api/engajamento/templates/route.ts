import { NextResponse } from "next/server";
import { ENGAGEMENT_TEMPLATES } from "@/lib/engagement/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ templates: ENGAGEMENT_TEMPLATES });
}

