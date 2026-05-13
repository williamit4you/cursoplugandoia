import "server-only";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "@/lib/s3";

export async function uploadBufferToMinio(params: {
  buffer: Buffer;
  key: string;
  contentType: string;
}): Promise<string> {
  const bucketName = process.env.MINIO_BUCKET_NAME || "uploads";
  const publicBase = String(process.env.MINIO_PUBLIC_URL || "").replace(/\/+$/, "");
  if (!publicBase) throw new Error("MINIO_PUBLIC_URL not configured");

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: params.key,
      Body: params.buffer,
      ContentType: params.contentType,
    })
  );

  return `${publicBase}/${params.key}`;
}

