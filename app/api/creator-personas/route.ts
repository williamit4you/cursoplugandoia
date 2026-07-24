import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import s3Client from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

export async function GET() {
  try {
    const personas = await prisma.creatorPersona.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(personas);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const imageFile = formData.get("image") as File | null;
    const voiceFile = formData.get("voice") as File | null;

    if (!name || !imageFile) {
      return NextResponse.json({ error: "Nome e Imagem são obrigatórios" }, { status: 400 });
    }

    const bucket = process.env.MINIO_BUCKET_NAME || "uploads";
    const publicBase = String(process.env.MINIO_PUBLIC_URL || "").replace(/\/+$/, "");

    // Upload image
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const imageExt = imageFile.name.split('.').pop() || "jpg";
    const imageKey = `personas/img_${Date.now()}.${imageExt}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: imageKey,
        Body: imageBuffer,
        ContentType: imageFile.type || "image/jpeg",
      })
    );

    const imageUrl = publicBase ? `${publicBase}/${imageKey}` : `${process.env.MINIO_ENDPOINT}/${bucket}/${imageKey}`;

    let voiceRefUrl = null;
    if (voiceFile) {
      const voiceBuffer = Buffer.from(await voiceFile.arrayBuffer());
      const voiceExt = voiceFile.name.split('.').pop() || "mp3";
      const voiceKey = `personas/voice_${Date.now()}.${voiceExt}`;

      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: voiceKey,
          Body: voiceBuffer,
          ContentType: voiceFile.type || "audio/mpeg",
        })
      );

      voiceRefUrl = publicBase ? `${publicBase}/${voiceKey}` : `${process.env.MINIO_ENDPOINT}/${bucket}/${voiceKey}`;
    }

    const persona = await prisma.creatorPersona.create({
      data: {
        name,
        imageUrl,
        voiceRefUrl,
        active: true,
      },
    });

    return NextResponse.json(persona);
  } catch (error: any) {
    console.error("Upload Persona Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
