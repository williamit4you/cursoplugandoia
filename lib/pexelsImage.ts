/**
 * lib/pexelsImage.ts
 *
 * Busca uma imagem relevante no Pexels a partir de um termo de busca,
 * faz o upload para o MinIO e retorna a URL pública.
 */

import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "@/lib/s3";

export async function fetchAndStorePexelsImage(
  query: string,
  bucket: string = process.env.MINIO_BUCKET_NAME || "news-media"
): Promise<string | null> {
  const pexelsKey = process.env.PEXELS_API_KEY;
  if (!pexelsKey) {
    console.warn("[PEXELS] PEXELS_API_KEY não configurada");
    return null;
  }

  try {
    // 1. Buscar imagem no Pexels
    const searchRes = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
      { headers: { Authorization: pexelsKey } }
    );
    const searchData = await searchRes.json();

    const photo = searchData.photos?.[0];
    if (!photo) {
      console.warn(`[PEXELS] Nenhuma imagem encontrada para: "${query}"`);
      return null;
    }

    const imageUrl = photo.src.large2x || photo.src.large || photo.src.original;

    // 2. Baixar a imagem
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error(`Falha ao baixar imagem do Pexels: ${imgRes.status}`);
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer());

    // 3. Upload para MinIO
    const objectKey = `post-covers/${Date.now()}-${photo.id}.jpg`;
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        Body: imgBuffer,
        ContentType: "image/jpeg",
        ACL: "public-read" as any,
      })
    );

    // 4. Montar URL pública
    const publicEndpoint =
      process.env.MINIO_PUBLIC_ENDPOINT ||
      process.env.MINIO_ENDPOINT ||
      "";
    const publicUrl = `${publicEndpoint}/${bucket}/${objectKey}`;

    console.log(`[PEXELS] Imagem salva: ${publicUrl}`);
    return publicUrl;
  } catch (err) {
    console.error("[PEXELS] Erro ao buscar/salvar imagem:", err);
    return null;
  }
}
