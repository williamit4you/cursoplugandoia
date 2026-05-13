import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getClientIp(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for") || "";
  const ip = forwarded.split(",")[0]?.trim();
  return ip || null;
}

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const slug = String(body?.slug || "").trim();
    const source = body?.source ? String(body.source).trim().slice(0, 80) : null;
    if (!slug) return NextResponse.json({ error: "slug is required" }, { status: 400 });

    const product = await prisma.bioProduct.findUnique({ where: { slug }, select: { id: true } });
    if (!product) return NextResponse.json({ error: "not found" }, { status: 404 });

    const userAgent = req.headers.get("user-agent")?.slice(0, 240) || null;
    const ip = getClientIp(req);
    const ipHash = ip ? sha256(ip) : null;

    await prisma.bioClick.create({
      data: {
        bioProductId: product.id,
        source,
        userAgent,
        ipHash,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[api/bio/click POST]", error);
    return NextResponse.json({ error: error?.message || "Falha ao registrar clique" }, { status: 500 });
  }
}

