import { S3Client } from "@aws-sdk/client-s3";

/**
 * Em produção no Easypanel, uploads de vídeo via URL pública (HTTPS) falham com
 * 502 Bad Gateway porque o proxy Traefik tem limite de tamanho de corpo.
 *
 * Solução: use MINIO_INTERNAL_ENDPOINT com a URL interna Docker (container-to-container)
 * que bypassa o Traefik e não tem esse limite.
 *
 * Exemplo de config no Easypanel (serviço Next.js):
 *   MINIO_INTERNAL_ENDPOINT=http://<nome-do-servico-minio>:9000
 *   MINIO_ENDPOINT=https://postgresqlpdf-minio.xclkv8.easypanel.host  (continua para links públicos)
 */
const s3Client = new S3Client({
  region: "us-east-1",
  // Prioriza URL interna (sem proxy) se configurada; fallback para URL pública
  endpoint: process.env.MINIO_INTERNAL_ENDPOINT || process.env.MINIO_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || "",
    secretAccessKey: process.env.MINIO_SECRET_KEY || "",
  },
});

export default s3Client;
