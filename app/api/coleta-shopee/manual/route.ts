import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import s3Client from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    
    const url = String(formData.get("url") || "").trim();
    const titulo = String(formData.get("titulo") || "").trim();
    const descricao = String(formData.get("descricao") || "").trim();
    const creatorPersonaId = (formData.get("creatorPersonaId") as string) || null;
    const useAi = String(formData.get("useAi") ?? "true").toLowerCase() !== "false";
    const videoFile = formData.get("video") as File | null;

    if (!url || !titulo || !descricao || !videoFile) {
      return NextResponse.json(
        { error: "Link de afiliado, titulo, descricao e video sao obrigatorios" },
        { status: 400 }
      );
    }

    // Upload do video para o MinIO
    const arrayBuffer = await videoFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const bucket = process.env.MINIO_BUCKET_NAME || "uploads";
    
    const uniqueId = Date.now().toString();
    const fileExtension = videoFile.name.split('.').pop() || "mp4";
    const objectKey = `shopee/manual_${uniqueId}.${fileExtension}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        Body: buffer,
        ContentType: videoFile.type || "video/mp4",
      })
    );

    const publicBase = String(process.env.MINIO_PUBLIC_URL || "").replace(/\/+$/, "");
    const videoUrlMinio = publicBase ? `${publicBase}/${objectKey}` : `${process.env.MINIO_ENDPOINT}/${bucket}/${objectKey}`;

    const existing = await prisma.coletaDadosShoppe.findFirst({
      where: { url, pipelineKind: "SALES" as any },
      include: {
        storyAd: {
          include: {
            publications: {
              select: {
                responsePayload: true,
              },
            },
          },
        },
        bioProduct: {
          select: { id: true },
        },
      },
    });

    const socialPostIds = (existing?.storyAd?.publications || [])
      .map((publication) => String((publication.responsePayload as any)?.socialPostId || "").trim())
      .filter(Boolean);

    const baseData = {
      // `url` remains populated for the legacy unique key. New pipeline decisions
      // use inputMode/sourceUrl and never interpret this affiliate URL as a product URL.
      url,
      sourceUrl: null,
      inputMode: "MANUAL_VIDEO" as any,
      affiliateUrl: url,
      titulo,
      descricao,
      detalhes: null,
      aiPromptVendas: null,
      audioUrl: null,
      copyVideoUrl: null,
      videoFinalUrl: null,
      platformMetadata: Prisma.JsonNull,
      mediaImageUrls: [],
      mediaVideoUrls: [videoUrlMinio],
      status: "COMPLETED",
      pipelineStatus: "GENERATING_COPY" as any,
      pipelineKind: "SALES" as any,
      useAi,
      creatorPersonaId: creatorPersonaId,
      active: true,
      lockedAt: null,
      lockedBy: null,
      nextRunAt: null,
      attemptCount: 0,
      lastError: null,
    };

    const coleta = existing
      ? await prisma.$transaction(async (tx) => {
          if (socialPostIds.length) {
            await tx.socialPost.deleteMany({
              where: { id: { in: socialPostIds } },
            });
          }

          if (existing.storyAd?.id) {
            await tx.storyAd.delete({
              where: { id: existing.storyAd.id },
            });
          }

          if (existing.bioProduct?.id) {
            await tx.bioProduct.delete({
              where: { id: existing.bioProduct.id },
            });
          }

          await tx.shopeePipelineEvent.deleteMany({
            where: { coletaId: existing.id },
          });

          await tx.shopeePipelineStep.deleteMany({
            where: { coletaId: existing.id },
          });

          return tx.coletaDadosShoppe.update({
            where: { id: existing.id },
            data: {
              ...baseData,
              linksMedia: {
                deleteMany: {},
                create: [
                  {
                    tipo: "VIDEO",
                    urlMinio: videoUrlMinio,
                  },
                ],
              },
            },
            include: { linksMedia: true },
          });
        })
      : await prisma.coletaDadosShoppe.create({
          data: {
            ...baseData,
            linksMedia: {
              create: [
                {
                  tipo: "VIDEO",
                  urlMinio: videoUrlMinio,
                },
              ],
            },
          },
          include: { linksMedia: true },
        });

    return NextResponse.json({ success: true, reusedExisting: Boolean(existing), coleta });
  } catch (error: any) {
    console.error("Erro manual upload:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
