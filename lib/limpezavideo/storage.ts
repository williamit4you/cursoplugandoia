import "server-only";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "@/lib/s3";

function publicBase() {
  const base = String(process.env.MINIO_PUBLIC_URL || "").replace(/\/+$/, "");
  if (!base) throw new Error("MINIO_PUBLIC_URL not configured");
  return base;
}

function bucketName() {
  return process.env.MINIO_BUCKET_NAME || "uploads";
}

export async function uploadLimpezaVideoBuffer(params: {
  buffer: Buffer;
  key: string;
  contentType: string;
}) {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName(),
      Key: params.key,
      Body: params.buffer,
      ContentType: params.contentType,
    })
  );

  return `${publicBase()}/${params.key}`;
}
