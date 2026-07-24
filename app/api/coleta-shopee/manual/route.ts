import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

    // Salvar no Banco
    const coleta = await prisma.coletaDadosShoppe.create({
      data: {
        // `url` remains populated for the legacy unique key. New pipeline decisions
        // use inputMode/sourceUrl and never interpret this affiliate URL as a product URL.
        url,
        sourceUrl: null,
        inputMode: "MANUAL_VIDEO",
        affiliateUrl: url,
        titulo,
        descricao,
        aiPromptVendas: null,
        status: "COMPLETED",
        pipelineStatus: "GENERATING_COPY",
        pipelineKind: "SALES",
        creatorPersonaId: creatorPersonaId,
        mediaVideoUrls: [videoUrlMinio],
        linksMedia: {
          create: [
            {
              tipo: "VIDEO",
              urlMinio: videoUrlMinio,
            }
          ]
        }
      },
    });

    return NextResponse.json({ success: true, coleta });
  } catch (error: any) {
    console.error("Erro manual upload:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
