import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand, CreateBucketCommand, HeadBucketCommand, PutBucketPolicyCommand } from "@aws-sdk/client-s3";
import s3Client from "@/lib/s3";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo recebido." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExtension = file.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const bucketName = process.env.MINIO_BUCKET_NAME || "uploads";

    // Auto-criação do Bucket caso não exista (Easypanel MinIO)
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    } catch (headErr: any) {
      if (headErr.name === "NotFound" || headErr.$metadata?.httpStatusCode === 404) {
        await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
      } else {
        throw headErr;
      }
    }

    // Tentar cravar a Política de Acesso Público no Bucket para as URLs externas abrirem (sem dar 403 Forbidden Error)
    try {
      const publicPolicy = {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: "*",
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${bucketName}/*`]
          }
        ]
      };
      await s3Client.send(new PutBucketPolicyCommand({
        Bucket: bucketName,
        Policy: JSON.stringify(publicPolicy),
      }));
    } catch (policyErr) {
      console.log("Aviso: Política do Bucket não re-aplicada ou ignorada -", policyErr);
    }

    // Salvar o binário de fato (liberando a ACL individual em public-read fallback)
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
      ACL: 'public-read'
    });

    await s3Client.send(command);

    const publicUrl = `${process.env.MINIO_PUBLIC_URL}/${fileName}`;

    return NextResponse.json({ url: publicUrl });
  } catch (error: any) {
    console.error("Upload error details:", error);
    return NextResponse.json({ error: error?.message || "Falha desconhecida no MinIO" }, { status: 500 });
  }
}
