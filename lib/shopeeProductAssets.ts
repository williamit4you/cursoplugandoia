import { CreateBucketCommand, HeadBucketCommand, PutBucketPolicyCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "@/lib/s3";

export type ShopeePreparedAsset = {
  url: string;
  kind: "IMAGE";
  name: string;
};

function safeKeyPart(value: string) {
  return value.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "produto";
}

function extensionFromContentType(contentType: string) {
  if (/png/i.test(contentType)) return "png";
  if (/webp/i.test(contentType)) return "webp";
  if (/gif/i.test(contentType)) return "gif";
  return "jpg";
}

function looksLikeImageUrl(value: string | null | undefined) {
  const url = String(value || "").trim();
  if (!/^https?:\/\//i.test(url)) return false;
  return /susercontent\.com/i.test(url);
}

async function ensureBucket(bucketName: string) {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
  } catch (headErr: any) {
    if (headErr.name === "NotFound" || headErr.$metadata?.httpStatusCode === 404) {
      await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
    } else {
      throw headErr;
    }
  }

  try {
    await s3Client.send(
      new PutBucketPolicyCommand({
        Bucket: bucketName,
        Policy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: "*",
              Action: ["s3:GetObject"],
              Resource: [`arn:aws:s3:::${bucketName}/*`],
            },
          ],
        }),
      })
    );
  } catch {
    // public bucket policy may already exist or be managed outside the app
  }
}

async function downloadImage(url: string) {
  const res = await fetch(url, {
    headers: {
      accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const contentType = res.headers.get("content-type") || "image/jpeg";
  if (!/^image\//i.test(contentType)) throw new Error(`Conteudo nao e imagem: ${contentType}`);

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length < 512) throw new Error("Imagem vazia ou invalida");
  return { buffer, contentType };
}

export async function prepareShopeeProductAssets(
  product: { id: string; imageUrls?: string[] | null; thumbnailUrl?: string | null },
  limit = 4
): Promise<ShopeePreparedAsset[]> {
  const bucketName = process.env.MINIO_BUCKET_NAME || "uploads";
  const publicBase = process.env.MINIO_PUBLIC_URL;
  const candidates = new Set<string>();

  if (looksLikeImageUrl(product.thumbnailUrl)) candidates.add(String(product.thumbnailUrl));
  for (const image of product.imageUrls || []) {
    if (looksLikeImageUrl(image)) candidates.add(String(image));
    if (candidates.size >= limit) break;
  }

  if (candidates.size === 0) return [];
  if (!publicBase) {
    return Array.from(candidates)
      .slice(0, limit)
      .map((url, index) => ({ url, kind: "IMAGE" as const, name: `${safeKeyPart(product.id)}-${index + 1}` }));
  }

  await ensureBucket(bucketName);

  const assets: ShopeePreparedAsset[] = [];
  let index = 0;
  for (const imageUrl of candidates) {
    if (assets.length >= limit) break;
    try {
      const { buffer, contentType } = await downloadImage(imageUrl);
      index += 1;
      const ext = extensionFromContentType(contentType);
      const key = `shopee-products/${safeKeyPart(product.id)}-${index}.${ext}`;

      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: buffer,
          ContentType: contentType,
          ACL: "public-read",
        })
      );

      assets.push({
        url: `${publicBase.replace(/\/+$/, "")}/${key}`,
        kind: "IMAGE",
        name: `${safeKeyPart(product.id)}-${index}.${ext}`,
      });
    } catch {
      // try next image candidate
    }
  }

  return assets;
}

