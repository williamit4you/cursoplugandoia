import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(value: unknown, max: number) {
  return String(value || "").trim().slice(0, max) || null;
}

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const slug = String(params.slug || "").trim();
  if (!slug) return NextResponse.redirect(new URL("/ofertas", req.url), 302);

  const store = await prisma.affiliateStore.findFirst({
    where: { slug, status: "ACTIVE" },
    select: { id: true, affiliateUrl: true },
  });

  if (!store) {
    return NextResponse.redirect(new URL("/ofertas?aviso=loja-indisponivel", req.url), 302);
  }

  const ip = clean(req.headers.get("x-forwarded-for")?.split(",")[0], 100);
  await prisma.affiliateStoreClick
    .create({
      data: {
        storeId: store.id,
        source: clean(req.nextUrl.searchParams.get("source"), 80),
        medium: clean(req.nextUrl.searchParams.get("medium"), 80),
        campaign: clean(req.nextUrl.searchParams.get("campaign"), 120),
        referrer: clean(req.headers.get("referer"), 240),
        userAgent: clean(req.headers.get("user-agent"), 240),
        ipHash: ip ? crypto.createHash("sha256").update(ip).digest("hex") : null,
      },
    })
    .catch((error) => console.error("[AFFILIATE_STORE_CLICK]", error));

  try {
    return NextResponse.redirect(new URL(store.affiliateUrl), 302);
  } catch {
    return NextResponse.redirect(new URL("/ofertas?aviso=link-indisponivel", req.url), 302);
  }
}
