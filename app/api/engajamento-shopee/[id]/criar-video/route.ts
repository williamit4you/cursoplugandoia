import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "@/lib/s3";
import http from "http";
import https from "https";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ColetaMedia = {
  id: string;
  tipo: string;
  urlMinio: string;
};

type WorkerHttpResponse = {
  status: number;
  ok: boolean;
  headers: Record<string, string | string[] | undefined>;
  body: Buffer;
};

async function postMultipartWithoutUndici(url: string, formData: FormData): Promise<WorkerHttpResponse> {
  const requestPayload = new Request(url, {
    method: "POST",
    body: formData,
  });

  const body = Buffer.from(await requestPayload.arrayBuffer());
  const contentType = requestPayload.headers.get("content-type") || "multipart/form-data";
  const parsedUrl = new URL(url);
  const transport = parsedUrl.protocol === "https:" ? https : http;

  return await new Promise((resolve, reject) => {
    const req = transport.request(
      {
        protocol: parsedUrl.protocol,
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === "https:" ? 443 : 80),
        path: `${parsedUrl.pathname}${parsedUrl.search}`,
        method: "POST",
        headers: {
          "content-type": contentType,
          "content-length": String(body.length),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        res.on("end", () => {
          resolve({
            status: res.statusCode || 500,
            ok: (res.statusCode || 500) >= 200 && (res.statusCode || 500) < 300,
            headers: res.headers,
            body: Buffer.concat(chunks),
          });
        });
      }
    );

    req.setTimeout(0);
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function processTikTokVideoJob(params: {
  coletaId: string;
  linksMedia: ColetaMedia[];
  reactionBuffer: Buffer;
  reactionName: string;
  reactionType: string;
  pipFraction: string | null;
  pipMargin: string | null;
  pipRadius: string | null;
}) {
  const {
    coletaId,
    linksMedia,
    reactionBuffer,
    reactionName,
    reactionType,
    pipFraction,
    pipMargin,
    pipRadius,
  } = params;

  const workerForm = new FormData();
  workerForm.append("coleta_id", coletaId);
  workerForm.append("media_urls", JSON.stringify(linksMedia));
  const reactionBytes = new Uint8Array(reactionBuffer);
  workerForm.append("reaction_video", new Blob([reactionBytes], { type: reactionType || "video/mp4" }), reactionName);
  workerForm.append("upload_mode", "external");
  if (pipFraction) workerForm.append("pip_fraction", pipFraction);
  if (pipMargin) workerForm.append("pip_margin", pipMargin);
  if (pipRadius) workerForm.append("pip_radius", pipRadius);

  const baseUrl = (process.env.WORKER_FASTAPI_BASE_URL || process.env.FASTAPI_URL || "http://127.0.0.1:8000")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/gerar-video$/, "");

  const targetUrl = `${baseUrl}/gerar-video-tiktok`;
  const startedAt = Date.now();

  console.log("[criar-video][job] start", {
    coletaId,
    targetUrl,
    mediaCount: linksMedia.length,
    reactionName,
    reactionSize: reactionBuffer.length,
    pipFraction,
    pipMargin,
    pipRadius,
  });

  const workerRes = await postMultipartWithoutUndici(targetUrl, workerForm);

  console.log("[criar-video][job] worker response", {
    coletaId,
    status: workerRes.status,
    ok: workerRes.ok,
    elapsedMs: Date.now() - startedAt,
  });

  if (!workerRes.ok) {
    const errText = workerRes.body.toString("utf8");
    throw new Error(`Worker retornou ${workerRes.status}: ${errText}`);
  }

  const responseContentType = String(workerRes.headers["content-type"] || "");
  let videoUrl = "";

  if (/video\/mp4/i.test(responseContentType)) {
    const videoBuffer = workerRes.body;
    const bucketName = process.env.MINIO_BUCKET_NAME || "uploads";
    const minioKey = `shopee/videos-tiktok/tiktok_${coletaId}_${Date.now()}.mp4`;

    console.log("[criar-video][job] uploading via next/minio", {
      coletaId,
      elapsedMs: Date.now() - startedAt,
      bytes: videoBuffer.length,
      bucketName,
      minioKey,
    });

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: minioKey,
        Body: videoBuffer,
        ContentType: "video/mp4",
      })
    );

    const publicBase = String(process.env.MINIO_PUBLIC_URL || "").replace(/\/+$/, "");
    if (!publicBase) throw new Error("MINIO_PUBLIC_URL not configured");
    videoUrl = `${publicBase}/${minioKey}`;
  } else {
    const result = JSON.parse(workerRes.body.toString("utf8") || "{}");
    videoUrl = String(result.videoUrl || "").trim();
    if (!videoUrl) throw new Error("Worker retornou sucesso sem videoUrl.");
  }

  await prisma.coletaDadosShoppe.update({
    where: { id: coletaId },
    data: {
      videoFinalUrl: videoUrl,
      videoStatus: "COMPLETED",
      errorMessage: null,
    },
  });

  console.log("[criar-video][job] success", {
    coletaId,
    elapsedMs: Date.now() - startedAt,
    videoUrl,
  });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  const coleta = await prisma.coletaDadosShoppe.findUnique({
    where: { id },
    include: { linksMedia: true },
  });

  if (!coleta || coleta.pipelineKind !== ("ENGAGEMENT" as any)) {
    return NextResponse.json({ error: "Coleta não encontrada." }, { status: 404 });
  }

  if (!coleta.linksMedia || coleta.linksMedia.length === 0) {
    return NextResponse.json({ error: "Nenhuma mídia coletada. Execute o scraping primeiro." }, { status: 400 });
  }

  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Envie o vídeo de reação via multipart/form-data." }, { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Falha ao ler o formulário." }, { status: 400 });
  }

  const reactionFile = formData.get("reaction_video") as File | null;
  if (!reactionFile) {
    return NextResponse.json({ error: "Campo 'reaction_video' obrigatório." }, { status: 400 });
  }

  const reactionBuffer = Buffer.from(await reactionFile.arrayBuffer());
  const pipFraction = formData.get("pip_fraction");
  const pipMargin = formData.get("pip_margin");
  const pipRadius = formData.get("pip_radius");

  await prisma.coletaDadosShoppe.update({
    where: { id },
    data: {
      videoStatus: "RENDERING",
      errorMessage: null,
    },
  });

  void processTikTokVideoJob({
    coletaId: id,
    linksMedia: coleta.linksMedia,
    reactionBuffer,
    reactionName: reactionFile.name,
    reactionType: reactionFile.type,
    pipFraction: pipFraction ? String(pipFraction) : null,
    pipMargin: pipMargin ? String(pipMargin) : null,
    pipRadius: pipRadius ? String(pipRadius) : null,
  }).catch(async (error: any) => {
    console.error("[criar-video][job] Erro detalhado:", {
      coletaId: id,
      message: error?.message || null,
      stack: error?.stack || null,
      cause: error?.cause
        ? {
            message: error.cause.message || null,
            code: error.cause.code || null,
            name: error.cause.name || null,
          }
        : null,
    });

    await prisma.coletaDadosShoppe
      .update({
        where: { id },
        data: {
          videoStatus: "FAILED",
          errorMessage: error?.message || "Falha ao gerar vídeo.",
        },
      })
      .catch(() => null);
  });

  return NextResponse.json(
    {
      ok: true,
      queued: true,
      coletaId: id,
      videoStatus: "RENDERING",
    },
    { status: 202 }
  );
}
