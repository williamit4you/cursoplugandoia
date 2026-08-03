import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";
import s3Client from "@/lib/s3";
import { requireAdminOrCronSecret } from "@/lib/shopee-pipeline/apiAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function normalize(value: unknown) {
  return String(value || "").trim();
}

function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function sanitizeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-");
}

export async function GET(req: NextRequest) {
  try {
    await requireAdminOrCronSecret(req);
    const q = normalize(req.nextUrl.searchParams.get("q"));
    const active = normalize(req.nextUrl.searchParams.get("active") || "true").toLowerCase();

    const where: any = {};
    if (active === "true") where.active = true;
    if (active === "false") where.active = false;
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
      ];
    }

    const [products, totalClicks, clicks7d, clicks30d] = await Promise.all([
      prisma.bioProduct.findMany({
        where,
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        take: 500,
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          imageUrl: true,
          videoUrl: true,
          affiliateUrl: true,
          active: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.bioClick.groupBy({
        by: ["bioProductId"],
        _count: { _all: true },
      }),
      prisma.bioClick.groupBy({
        by: ["bioProductId"],
        where: { createdAt: { gte: daysAgo(7) } },
        _count: { _all: true },
      }),
      prisma.bioClick.groupBy({
        by: ["bioProductId"],
        where: { createdAt: { gte: daysAgo(30) } },
        _count: { _all: true },
      }),
    ]);

    const totalById = new Map(totalClicks.map((row) => [row.bioProductId, row._count._all]));
    const c7ById = new Map(clicks7d.map((row) => [row.bioProductId, row._count._all]));
    const c30ById = new Map(clicks30d.map((row) => [row.bioProductId, row._count._all]));

    const items = products.map((p) => ({
      ...p,
      clicksTotal: totalById.get(p.id) || 0,
      clicks7d: c7ById.get(p.id) || 0,
      clicks30d: c30ById.get(p.id) || 0,
    }));

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("[api/bio/admin/analytics GET]", error);
    return NextResponse.json({ error: error?.message || "Falha ao carregar analytics da bio" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdminOrCronSecret(req);
    const id = normalize(req.nextUrl.searchParams.get("id"));
    if (!id) {
      return NextResponse.json({ error: "ID do produto nao informado." }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const imageUrl = body?.imageUrl == null ? undefined : normalize(body.imageUrl) || null;

    const item = await prisma.bioProduct.update({
      where: { id },
      data: { ...(imageUrl !== undefined ? { imageUrl } : {}) },
      select: {
        id: true,
        imageUrl: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ item });
  } catch (error: any) {
    console.error("[api/bio/admin/analytics PATCH]", error);
    return NextResponse.json({ error: error?.message || "Falha ao atualizar produto da bio" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminOrCronSecret(req);
    const id = normalize(req.nextUrl.searchParams.get("id"));
    if (!id) {
      return NextResponse.json({ error: "ID do produto nao informado." }, { status: 400 });
    }

    const formData = await req.formData();
    const image = formData.get("image") as File | null;
    if (!image) {
      return NextResponse.json({ error: "Envie uma imagem." }, { status: 400 });
    }
    if (!String(image.type || "").startsWith("image/")) {
      return NextResponse.json({ error: "O arquivo enviado precisa ser uma imagem." }, { status: 400 });
    }

    const existing = await prisma.bioProduct.findUnique({
      where: { id },
      select: { id: true, slug: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Produto da bio nao encontrado." }, { status: 404 });
    }

    const bucket = process.env.MINIO_BUCKET_NAME || "uploads";
    const ext = sanitizeSegment(image.name.split(".").pop() || "jpg");
    const objectKey = `bio-products/${sanitizeSegment(existing.slug)}_${Date.now()}.${ext}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        Body: Buffer.from(await image.arrayBuffer()),
        ContentType: image.type || "image/jpeg",
      }),
    );

    const publicBase = normalize(process.env.MINIO_PUBLIC_URL).replace(/\/+$/, "");
    const endpoint = normalize(process.env.MINIO_ENDPOINT).replace(/\/+$/, "");
    const imageUrl = publicBase ? `${publicBase}/${objectKey}` : `${endpoint}/${bucket}/${objectKey}`;

    const item = await prisma.bioProduct.update({
      where: { id: existing.id },
      data: { imageUrl },
      select: {
        id: true,
        imageUrl: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ item });
  } catch (error: any) {
    console.error("[api/bio/admin/analytics POST]", error);
    return NextResponse.json({ error: error?.message || "Falha ao enviar imagem do produto" }, { status: 500 });
  }
}
