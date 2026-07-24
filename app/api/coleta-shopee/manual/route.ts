import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import s3Client from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    
    const url = formData.get("url") as string;
    const titulo = formData.get("titulo") as string;
    const descricao = formData.get("descricao") as string || "";
    const videoFile = formData.get("video") as File | null;

    if (!url || !titulo || !videoFile) {
      return NextResponse.json(
        { error: "URL, titulo e video sao obrigatorios" },
        { status: 400 }
      );
    }

    // Gerar Script de Vendas via IA (Opcional, falha segura)
    let aiPromptVendas = "";
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (OPENAI_API_KEY) {
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "Voce e um especialista em marketing para TikTok. Crie um roteiro de vendas curto e engajador para o produto."
              },
              {
                role: "user",
                content: `Crie um script curto de TikTok (ate 50 palavras) para vender este produto. Nao use hashtags.\nTitulo: ${titulo}\nDescricao: ${descricao}`
              }
            ]
          })
        });
        if (response.ok) {
          const data = await response.json();
          aiPromptVendas = data.choices?.[0]?.message?.content || "";
        }
      } catch (err) {
        console.error("Falha ao gerar IA Prompt:", err);
      }
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
        url, // Link de afiliado ou link do produto
        affiliateUrl: url,
        titulo,
        descricao,
        aiPromptVendas,
        status: "COMPLETED",
        pipelineStatus: "COPY_READY",
        pipelineKind: "SALES",
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
